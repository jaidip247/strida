/**
 * Pure streak math (mirrors public.refresh_habit_streak in 011_habit_streak_columns.sql).
 * @param {string[]} completedDatesSorted Unique YYYY-MM-DD strings, sorted ascending, within the habit window
 * @param {string} startDate YYYY-MM-DD
 * @param {string} endDate YYYY-MM-DD
 * @param {string} todayStr YYYY-MM-DD (caller's "today", typically local)
 * @returns {{ currentStreak: number, bestStreak: number, lastCompletedDate: string | null }}
 */
export function computeStreakStats(completedDatesSorted, startDate, endDate, todayStr) {
	const arr = completedDatesSorted.filter((d) => d >= startDate && d <= endDate);
	if (arr.length === 0) {
		return { currentStreak: 0, bestStreak: 0, lastCompletedDate: null };
	}

	const last = arr[arr.length - 1];

	let best = 1;
	let run = 1;
	for (let i = 1; i < arr.length; i++) {
		const prev = arr[i - 1];
		const cur = arr[i];
		const dayDiff = calendarDayDiff(cur, prev);
		if (dayDiff === 1) {
			run++;
			if (run > best) best = run;
		} else {
			run = 1;
		}
	}

	let runLen = 0;
	let c = last;
	while (c >= startDate && c <= endDate) {
		if (!arr.includes(c)) break;
		runLen++;
		c = addCalendarDays(c, -1);
	}

	let currentStreak = 0;
	if (last > todayStr) {
		currentStreak = 0;
	} else if (calendarDayDiff(todayStr, last) >= 2) {
		currentStreak = 0;
	} else {
		currentStreak = runLen;
	}

	return {
		currentStreak,
		bestStreak: best,
		lastCompletedDate: last
	};
}

/** @param {string} a @param {string} b @returns {number} a - b in whole days */
function calendarDayDiff(a, b) {
	const da = parseYmd(a);
	const db = parseYmd(b);
	return Math.round((da - db) / 86400000);
}

function parseYmd(iso) {
	const [y, m, d] = iso.split('-').map(Number);
	return Date.UTC(y, m - 1, d);
}

/** @param {string} iso @param {number} deltaDays */
function addCalendarDays(iso, deltaDays) {
	const [y, m, d] = iso.split('-').map(Number);
	const dt = new Date(Date.UTC(y, m - 1, d));
	dt.setUTCDate(dt.getUTCDate() + deltaDays);
	const yy = dt.getUTCFullYear();
	const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
	const dd = String(dt.getUTCDate()).padStart(2, '0');
	return `${yy}-${mm}-${dd}`;
}
