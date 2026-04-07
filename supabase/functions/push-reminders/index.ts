/**
 * Supabase Edge Function: push-reminders
 *
 * Sends daily push notifications to users who have incomplete habits for today.
 * Triggered by a cron schedule (e.g., every day at 08:00 UTC).
 *
 * Required secrets (set via `supabase secrets set`):
 *   VAPID_PRIVATE_KEY  - VAPID private key for Web Push
 *   VAPID_PUBLIC_KEY   - VAPID public key
 *   VAPID_SUBJECT      - mailto: or https: URI identifying the sender
 *   FCM_SERVER_KEY     - Firebase Cloud Messaging server key (for Android)
 *
 * Invoke manually for testing:
 *   curl -i --request POST 'https://<project>.supabase.co/functions/v1/push-reminders' \
 *     --header 'Authorization: Bearer <service_role_key>'
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (_req) => {
	try {
		const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

		const todayStr = new Date().toISOString().slice(0, 10);

		// Find users with active habits that have no completion for today
		const { data: habits, error: habitsError } = await supabase
			.from('Habit')
			.select('user_id, title')
			.lte('start_date', todayStr)
			.gte('end_date', todayStr);

		if (habitsError) {
			return new Response(JSON.stringify({ error: habitsError.message }), { status: 500 });
		}

		if (!habits || habits.length === 0) {
			return new Response(JSON.stringify({ message: 'No active habits today', sent: 0 }));
		}

		// Find which of these have completions already
		const habitUserIds = [...new Set(habits.map((h) => h.user_id))];

		const { data: completions } = await supabase
			.from('HabitCompletion')
			.select('habit_id, completed')
			.eq('completion_date', todayStr)
			.eq('completed', true);

		const completedHabitIds = new Set((completions || []).map((c) => c.habit_id));

		// Group incomplete habits by user
		const userIncomplete: Record<string, string[]> = {};
		for (const h of habits) {
			if (completedHabitIds.has(h.id)) continue;
			if (!userIncomplete[h.user_id]) userIncomplete[h.user_id] = [];
			userIncomplete[h.user_id].push(h.title);
		}

		const userIdsToNotify = Object.keys(userIncomplete);
		if (userIdsToNotify.length === 0) {
			return new Response(JSON.stringify({ message: 'All habits completed', sent: 0 }));
		}

		// Fetch push subscriptions for these users
		const { data: subscriptions, error: subError } = await supabase
			.from('PushSubscription')
			.select('*')
			.in('user_id', userIdsToNotify);

		if (subError || !subscriptions || subscriptions.length === 0) {
			return new Response(JSON.stringify({ message: 'No subscriptions to notify', sent: 0 }));
		}

		let sentCount = 0;

		for (const sub of subscriptions) {
			const titles = userIncomplete[sub.user_id] || [];
			const count = titles.length;
			if (count === 0) continue;

			const payload = JSON.stringify({
				title: `${count} habit${count > 1 ? 's' : ''} waiting`,
				body: titles.slice(0, 3).join(', ') + (count > 3 ? ` +${count - 3} more` : ''),
				url: '/app',
				tag: 'strida-daily-reminder'
			});

			if (sub.platform === 'web') {
				// Web Push via fetch to the subscription endpoint
				// Full Web Push protocol requires signing with VAPID keys.
				// In production use a library like web-push. For now we structure
				// the call so it can be swapped in.
				try {
					const resp = await fetch(sub.endpoint, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: payload
					});
					if (resp.ok) sentCount++;
				} catch {
					// Subscription may be expired; clean up
					await supabase.from('PushSubscription').delete().eq('id', sub.id);
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
							notification: {
								title: `${count} habit${count > 1 ? 's' : ''} waiting`,
								body: titles.slice(0, 3).join(', ') + (count > 3 ? ` +${count - 3} more` : '')
							},
							data: { url: '/app' }
						})
					});
					if (resp.ok) sentCount++;
				} catch {
					// token invalid
				}
			}
		}

		return new Response(
			JSON.stringify({ message: 'Reminders sent', sent: sentCount }),
			{ headers: { 'Content-Type': 'application/json' } }
		);
	} catch (err) {
		return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
	}
});
