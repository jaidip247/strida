/**
 * Supabase Edge Function: push-reminders
 * Daily habit digest (morning), end-of-day pending list, streak warning, typical-time nudge (web + Android FCM legacy).
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.6';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

/** Local hour (0–23) for the once-daily “habits to track today” digest. */
const MORNING_DIGEST_HOUR = 9;

function localDateInTimeZone(timeZone: string, d = new Date()): string {
	try {
		const parts = new Intl.DateTimeFormat('en-CA', {
			timeZone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		}).formatToParts(d);
		const y = parts.find((p) => p.type === 'year')?.value;
		const m = parts.find((p) => p.type === 'month')?.value;
		const day = parts.find((p) => p.type === 'day')?.value;
		if (y && m && day) return `${y}-${m}-${day}`;
	} catch {
		/* fall through */
	}
	return d.toISOString().slice(0, 10);
}

function localHourInTimeZone(timeZone: string, d = new Date()): number {
	try {
		const h = new Intl.DateTimeFormat('en-GB', {
			timeZone,
			hour: 'numeric',
			hour12: false
		}).formatToParts(d);
		const hour = h.find((p) => p.type === 'hour')?.value;
		if (hour != null) return Number.parseInt(hour, 10);
	} catch {
		/* fall through */
	}
	return d.getUTCHours();
}

function isPausedOnDay(
	row: { pause_start: string | null; pause_end: string | null },
	todayStr: string
): boolean {
	if (!row.pause_start || !row.pause_end) return false;
	return row.pause_start <= todayStr && todayStr <= row.pause_end;
}

function notPausedFilter(todayStr: string): string {
	return `pause_start.is.null,pause_end.lt.${todayStr},pause_start.gt.${todayStr}`;
}

function formatHabitList(titles: string[], max = 5): string {
	const slice = titles.slice(0, max);
	const extra = titles.length > max ? ` +${titles.length - max} more` : '';
	return slice.join(', ') + extra;
}

function webPushErrorStatus(e: unknown): number | undefined {
	if (e && typeof e === 'object' && 'statusCode' in e) {
		const c = (e as { statusCode: unknown }).statusCode;
		if (typeof c === 'number') return c;
	}
	return undefined;
}

Deno.serve(async (_req) => {
	try {
		const vapidSubject = Deno.env.get('VAPID_SUBJECT');
		const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY');
		const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY');
		if (vapidSubject && vapidPublic && vapidPrivate) {
			webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
		}

		const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

		const { data: subscriptions, error: subError } = await supabase.from('PushSubscription').select('*');

		if (subError || !subscriptions?.length) {
			return new Response(JSON.stringify({ message: 'No subscriptions', sent: 0 }), {
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const userIds = [...new Set(subscriptions.map((s) => s.user_id).filter(Boolean))] as string[];
		const { data: users } = await supabase
			.from('User')
			.select('id, timezone, reminder_hour_local')
			.in('id', userIds);

		const userMap = new Map((users || []).map((u) => [u.id, u]));

		let sentCount = 0;

		for (const userId of userIds) {
			const u = userMap.get(userId);
			const tz = (u?.timezone && String(u.timezone).trim()) || 'UTC';
			const todayStr = localDateInTimeZone(tz);
			const hour = localHourInTimeZone(tz);
			const reminderHour = u?.reminder_hour_local ?? 20;

			const { data: habits, error: habitsError } = await supabase
				.from('Habit')
				.select('id, user_id, title, current_streak, pause_start, pause_end')
				.eq('user_id', userId)
				.lte('start_date', todayStr)
				.gte('end_date', todayStr)
				.or(notPausedFilter(todayStr));

			if (habitsError || !habits?.length) continue;

			const active = habits.filter((h) => !isPausedOnDay(h, todayStr));
			if (!active.length) continue;

			const habitIds = active.map((h) => h.id);
			const { data: compRows } = await supabase
				.from('HabitCompletion')
				.select('habit_id, completed, skipped')
				.eq('completion_date', todayStr)
				.in('habit_id', habitIds);

			const incomplete = active.filter((h) => {
				const r = compRows?.find((c) => c.habit_id === h.id);
				if (r?.completed) return false;
				if (r?.skipped) return false;
				return true;
			});

			const { data: statsRows } = await supabase
				.from('habit_stats')
				.select('habit_id, typical_completion_hour')
				.in('habit_id', habitIds);

			const streakSorted = [...incomplete].sort((a, b) => b.current_streak - a.current_streak);
			const topStreak = streakSorted[0];

			const typicalMatch = incomplete.find((h) => {
				const s = statsRows?.find((r) => r.habit_id === h.id);
				const th = s?.typical_completion_hour;
				if (th == null) return false;
				return Math.abs(th - hour) <= 1;
			});

			const activeTitles = active.map((h) => h.title);
			const incompleteTitles = incomplete.map((h) => h.title);

			const isMorningDigest = hour === MORNING_DIGEST_HOUR && reminderHour !== MORNING_DIGEST_HOUR;
			const isEodSlot = hour === reminderHour;
			const skipTypicalSlot = hour === MORNING_DIGEST_HOUR || hour === reminderHour;

			let title = '';
			let body = '';
			let tag = 'strida-smart-reminder';

			if (hour === MORNING_DIGEST_HOUR && reminderHour === MORNING_DIGEST_HOUR) {
				if (incomplete.length) {
					title = `${incomplete.length} habit${incomplete.length > 1 ? 's' : ''} still pending`;
					body = formatHabitList(incompleteTitles);
					tag = 'strida-eod-pending';
				} else {
					title = 'Your habits today';
					body =
						activeTitles.length === 1
							? `Track “${activeTitles[0]}” today.`
							: `${activeTitles.length} habits to track: ${formatHabitList(activeTitles)}.`;
					tag = 'strida-daily-habits';
				}
			} else if (isMorningDigest) {
				title = 'Your habits today';
				body =
					activeTitles.length === 1
						? `Track “${activeTitles[0]}” today.`
						: `${activeTitles.length} habits to track: ${formatHabitList(activeTitles)}.`;
				tag = 'strida-daily-habits';
			} else if (isEodSlot && incomplete.length) {
				title = `${incomplete.length} habit${incomplete.length > 1 ? 's' : ''} still pending today`;
				body = formatHabitList(incompleteTitles, 8);
				tag = 'strida-eod-pending';
			} else if (
				topStreak &&
				topStreak.current_streak >= 3 &&
				hour >= 18 &&
				hour < reminderHour &&
				incomplete.some((h) => h.id === topStreak.id)
			) {
				title = 'Streak at risk';
				body = `You're about to lose your ${topStreak.current_streak}-day streak on "${topStreak.title}".`;
				tag = 'strida-streak-warning';
			} else if (typicalMatch && !skipTypicalSlot) {
				title = 'Habit nudge';
				body = `You often check in around this time — "${typicalMatch.title}" is still open.`;
				tag = 'strida-time-nudge';
			} else {
				continue;
			}

			if (!title) continue;

			const userSubs = subscriptions.filter((s) => s.user_id === userId);
			for (const sub of userSubs) {
				const payload = JSON.stringify({
					title,
					body,
					url: '/app',
					tag
				});

				if (sub.platform === 'web') {
					if (!vapidSubject || !vapidPublic || !vapidPrivate) {
						console.warn('push-reminders: VAPID keys missing; skipping web push');
						continue;
					}
					try {
						const subscription = {
							endpoint: sub.endpoint,
							keys: {
								p256dh: sub.keys_p256dh,
								auth: sub.keys_auth
							}
						};
						await webpush.sendNotification(subscription, payload, { TTL: 86_400 });
						sentCount++;
					} catch (e) {
						console.error('web push failed', e);
						if (webPushErrorStatus(e) === 410) {
							await supabase.from('PushSubscription').delete().eq('id', sub.id);
						}
					}
				} else if (sub.platform === 'android') {
					const fcmKey = Deno.env.get('FCM_SERVER_KEY');
					if (!fcmKey) continue;

					try {
						const resp = await fetch('https://fcm.googleapis.com/fcm/send', {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								Authorization: `key=${fcmKey}`
							},
							body: JSON.stringify({
								to: sub.endpoint,
								notification: { title, body },
								data: { url: '/app' }
							})
						});
						if (resp.ok) sentCount++;
					} catch {
						// token invalid
					}
				}
			}
		}

		return new Response(JSON.stringify({ message: 'Reminders sent', sent: sentCount }), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (err) {
		return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
	}
});
