/**
 * Build a portable export of the signed-in user's Strida data.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 */
export async function buildUserExportPayload(supabase, userId) {
	const { data: profile, error: profileError } = await supabase
		.from('User')
		.select('*')
		.eq('id', userId)
		.maybeSingle();

	if (profileError) throw profileError;

	const { data: habits, error: habitsError } = await supabase
		.from('Habit')
		.select('*')
		.eq('user_id', userId)
		.order('created_at', { ascending: true });

	if (habitsError) throw habitsError;

	const habitIds = (habits || []).map((h) => h.id);
	let habitCompletions = [];

	if (habitIds.length > 0) {
		const { data: comp, error: compError } = await supabase
			.from('HabitCompletion')
			.select('*')
			.in('habit_id', habitIds)
			.order('completion_date', { ascending: true });

		if (compError) throw compError;
		habitCompletions = comp || [];
	}

	let habitLogs = [];
	let habitStatsRows = [];

	const { data: logs, error: logsError } = await supabase
		.from('habit_logs')
		.select('*')
		.eq('user_id', userId)
		.order('created_at', { ascending: false })
		.limit(5000);

	if (logsError && !String(logsError.message || '').includes('does not exist')) {
		throw logsError;
	}
	habitLogs = logs || [];

	const { data: stats, error: statsError } = await supabase
		.from('habit_stats')
		.select('*')
		.eq('user_id', userId);

	if (statsError && !String(statsError.message || '').includes('does not exist')) {
		throw statsError;
	}
	habitStatsRows = stats || [];

	return {
		exportFormatVersion: 1,
		exportedAt: new Date().toISOString(),
		profile: profile || null,
		habits: habits || [],
		habitCompletions,
		habitLogs,
		habitStats: habitStatsRows
	};
}

/**
 * @param {string} filename
 * @param {unknown} obj
 */
export function downloadJsonFile(filename, obj) {
	const json = JSON.stringify(obj, null, 2);
	const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.rel = 'noopener';
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}

/**
 * @param {Awaited<ReturnType<typeof buildUserExportPayload>>} payload
 * @returns {Promise<Blob>}
 */
export async function buildUserExportPdfBlob(payload) {
	const { jsPDF } = await import('jspdf');
	const doc = new jsPDF({ unit: 'pt', format: 'a4' });
	const margin = 48;
	let y = margin;
	const lineH = 14;
	const pageH = doc.internal.pageSize.getHeight();
	const maxW = doc.internal.pageSize.getWidth() - margin * 2;

	function addLine(text, size = 10) {
		const lines = doc.splitTextToSize(String(text), maxW);
		for (const line of lines) {
			if (y + lineH > pageH - margin) {
				doc.addPage();
				y = margin;
			}
			doc.setFontSize(size);
			doc.text(line, margin, y);
			y += lineH;
		}
	}

	doc.setFontSize(16);
	doc.text('Strida data export', margin, y);
	y += lineH * 1.5;

	doc.setFontSize(9);
	addLine(`Exported: ${payload.exportedAt}`);
	addLine(`Habits: ${(payload.habits || []).length} | Completion rows: ${(payload.habitCompletions || []).length}`);
	y += lineH * 0.5;

	const p = payload.profile;
	if (p) {
		doc.setFontSize(12);
		addLine('Profile', 12);
		doc.setFontSize(10);
		addLine(`Name: ${p.name || '—'}`);
		addLine(`Email: ${p.email || '—'}`);
		if (p.bio) addLine(`Bio: ${p.bio}`);
		if (p.timezone) addLine(`Timezone: ${p.timezone}`);
		if (p.country) addLine(`Country: ${p.country}`);
		y += lineH * 0.5;
	}

	doc.setFontSize(12);
	addLine('Habits', 12);
	doc.setFontSize(10);
	for (const h of payload.habits || []) {
		addLine(`• ${h.title || '(untitled)'} — ${h.start_date} → ${h.end_date} (${h.duration_days}d)`);
		if (h.description) addLine(`  ${h.description}`);
	}

	y += lineH * 0.5;
	doc.setFontSize(12);
	addLine('Completions (summary)', 12);
	doc.setFontSize(9);
	const byHabit = new Map();
	for (const c of payload.habitCompletions || []) {
		const n = byHabit.get(c.habit_id) || { done: 0, total: 0 };
		n.total += 1;
		if (c.completed) n.done += 1;
		byHabit.set(c.habit_id, n);
	}
	const habitTitle = (id) => (payload.habits || []).find((h) => h.id === id)?.title || id;
	for (const [hid, { done, total }] of byHabit) {
		addLine(`${habitTitle(hid)}: ${done} / ${total} days marked done`);
	}

	return doc.output('blob');
}

/**
 * @param {string} filename
 * @param {Blob} blob
 */
export function downloadBlob(filename, blob) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.rel = 'noopener';
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}
