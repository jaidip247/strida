<script>
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { CalendarIcon, ArrowLeft, Flame, Trash2 } from '@lucide/svelte';
	import { CalendarDate, parseDate } from '@internationalized/date';
	import { createClient } from '$lib/supabase/client';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	const supabase = createClient();
	const habitId = $page.data.habitId;

	let loading = $state(true);
	let saving = $state(false);
	let deleting = $state(false);
	let error = $state('');
	let success = $state(false);
	let deleteDialogOpen = $state(false);

	let habit = $state({ title: '', description: '' });
	let tracking = $state({ start_date: '', duration_days: 21 });
	let calendarDate = $state(null);
	let popoverOpen = $state(false);
	let user = $state(null);

	// Analytics state
	let completions = $state([]);
	let analyticsLoading = $state(true);
	let streakStats = $state({ current_streak: 0, best_streak: 0, last_completed_date: null });
	let pauseStart = $state(/** @type {string | null} */ (null));
	let pauseEnd = $state(/** @type {string | null} */ (null));
	let pauseBusy = $state(false);

	function getLocalDateString(date = new Date()) {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function calculateEndDate(startDateStr, durationDays) {
		const start = new Date(`${startDateStr}T00:00:00`);
		const days = Math.max(Number(durationDays || 1), 1);
		const end = new Date(start);
		end.setDate(end.getDate() + days - 1);
		return getLocalDateString(end);
	}

	function formatDate(date) {
		if (!date) return '';
		const month = date.month.toString().padStart(2, '0');
		const day = date.day.toString().padStart(2, '0');
		return `${date.year}-${month}-${day}`;
	}

	$effect(() => {
		if (calendarDate) {
			tracking.start_date = formatDate(calendarDate);
			popoverOpen = false;
		}
	});

	const endDate = $derived(calculateEndDate(tracking.start_date, tracking.duration_days));

	const pauseActive = $derived.by(() => {
		if (!pauseStart || !pauseEnd) return false;
		const t = getLocalDateString();
		return pauseStart <= t && t <= pauseEnd;
	});

	// --- Analytics computations ---
	const today = $derived(getLocalDateString());

	function addDaysLocalDateStr(isoStr, deltaDays) {
		const [y, m, d] = isoStr.split('-').map(Number);
		const dt = new Date(y, m - 1, d);
		dt.setDate(dt.getDate() + deltaDays);
		return getLocalDateString(dt);
	}

	const completionRate = $derived.by(() => {
		if (!tracking.start_date) return 0;
		const start = tracking.start_date;
		const end = endDate;
		const todayStr = today;
		const effectiveEnd = end < todayStr ? end : todayStr;
		if (effectiveEnd < start) return 0;

		const startD = new Date(start + 'T00:00:00Z');
		const endD = new Date(effectiveEnd + 'T00:00:00Z');
		const totalDays = Math.floor((endD.getTime() - startD.getTime()) / (24 * 60 * 60 * 1000)) + 1;
		if (totalDays <= 0) return 0;

		const completedCount = completions.filter((c) => c.completed).length;
		return Math.round((completedCount / totalDays) * 100);
	});

	const bestDay = $derived.by(() => {
		const dayCounts = [0, 0, 0, 0, 0, 0, 0];
		const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		for (const c of completions) {
			if (!c.completed) continue;
			const d = new Date(c.completion_date?.slice(0, 10) + 'T00:00:00Z');
			dayCounts[d.getUTCDay()]++;
		}
		const maxCount = Math.max(...dayCounts);
		if (maxCount === 0) return 'N/A';
		return dayNames[dayCounts.indexOf(maxCount)];
	});

	const weeklyTrend = $derived.by(() => {
		if (!tracking.start_date || completions.length === 0) return [];
		const weeks = new Map();
		for (const c of completions) {
			if (!c.completed) continue;
			const d = new Date(c.completion_date?.slice(0, 10) + 'T00:00:00Z');
			const weekStart = new Date(d);
			weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
			const key = `${weekStart.getUTCFullYear()}-${String(weekStart.getUTCMonth() + 1).padStart(2, '0')}-${String(weekStart.getUTCDate()).padStart(2, '0')}`;
			weeks.set(key, (weeks.get(key) || 0) + 1);
		}
		return Array.from(weeks.entries())
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([week, count]) => ({ week, count }));
	});

	const maxWeeklyTrendCount = $derived.by(() => {
		if (weeklyTrend.length === 0) return 0;
		return Math.max(...weeklyTrend.map((w) => w.count));
	});

	onMount(async () => {
		const {
			data: { user: authUser },
			error: authError
		} = await supabase.auth.getUser();

		if (authError || !authUser) {
			error = 'Not authenticated. Please log in.';
			loading = false;
			return;
		}
		user = authUser;

		const { data: habitData, error: habitError } = await supabase
			.from('Habit')
			.select('*')
			.eq('id', habitId)
			.eq('user_id', authUser.id)
			.single();

		if (habitError || !habitData) {
			error = 'Habit not found.';
			loading = false;
			return;
		}

		habit = { title: habitData.title || '', description: habitData.description || '' };
		tracking = {
			start_date: habitData.start_date?.slice(0, 10) || getLocalDateString(),
			duration_days: habitData.duration_days || 21
		};

		streakStats = {
			current_streak: habitData.current_streak ?? 0,
			best_streak: habitData.best_streak ?? 0,
			last_completed_date: habitData.last_completed_date
				? habitData.last_completed_date.slice(0, 10)
				: null
		};

		pauseStart = habitData.pause_start ? habitData.pause_start.slice(0, 10) : null;
		pauseEnd = habitData.pause_end ? habitData.pause_end.slice(0, 10) : null;

		try {
			calendarDate = parseDate(tracking.start_date);
		} catch {
			const t = new Date();
			calendarDate = new CalendarDate(t.getFullYear(), t.getMonth() + 1, t.getDate());
		}

		loading = false;

		// Load completions for analytics
		const { data: compData } = await supabase
			.from('HabitCompletion')
			.select('completion_date, completed, skipped')
			.eq('habit_id', habitId);

		completions = compData || [];
		analyticsLoading = false;
	});

	async function handleSubmit(e) {
		e.preventDefault();
		saving = true;
		error = '';
		success = false;

		if (!user) {
			error = 'Not authenticated';
			saving = false;
			return;
		}

		if (!habit.title.trim()) {
			error = 'Title is required';
			saving = false;
			return;
		}

		const durationDays = Math.max(Number(tracking.duration_days || 1), 1);
		const startDateToSave = tracking.start_date || getLocalDateString();

		if (!/^\d{4}-\d{2}-\d{2}$/.test(startDateToSave)) {
			error = 'Start date is invalid';
			saving = false;
			return;
		}

		try {
			const { error: updateError } = await supabase
				.from('Habit')
				.update({
					title: habit.title.trim(),
					description: habit.description.trim() || null,
					start_date: startDateToSave,
					duration_days: durationDays,
					end_date: calculateEndDate(startDateToSave, durationDays),
					updated_at: new Date().toISOString()
				})
				.eq('id', habitId)
				.eq('user_id', user.id);

			if (updateError) throw updateError;

			const { data: streakRow } = await supabase
				.from('Habit')
				.select('current_streak, best_streak, last_completed_date')
				.eq('id', habitId)
				.eq('user_id', user.id)
				.single();

			if (streakRow) {
				streakStats = {
					current_streak: streakRow.current_streak ?? 0,
					best_streak: streakRow.best_streak ?? 0,
					last_completed_date: streakRow.last_completed_date
						? streakRow.last_completed_date.slice(0, 10)
						: null
				};
			}

			success = true;
			toast.success('Habit updated successfully');
			setTimeout(() => {
				success = false;
			}, 3000);
		} catch (e) {
			error = e.message || 'Failed to update habit';
		} finally {
			saving = false;
		}
	}

	async function applyPause(days) {
		if (!user) return;
		pauseBusy = true;
		try {
			const start = getLocalDateString();
			const end = addDaysLocalDateStr(start, days - 1);
			const { error } = await supabase
				.from('Habit')
				.update({
					pause_start: start,
					pause_end: end,
					updated_at: new Date().toISOString()
				})
				.eq('id', habitId)
				.eq('user_id', user.id);
			if (error) throw error;
			pauseStart = start;
			pauseEnd = end;
			const { data: streakRow } = await supabase
				.from('Habit')
				.select('current_streak, best_streak, last_completed_date')
				.eq('id', habitId)
				.single();
			if (streakRow) {
				streakStats = {
					current_streak: streakRow.current_streak ?? 0,
					best_streak: streakRow.best_streak ?? 0,
					last_completed_date: streakRow.last_completed_date
						? streakRow.last_completed_date.slice(0, 10)
						: null
				};
			}
			toast.success(`Paused until ${end}`);
		} catch (e) {
			toast.error(e?.message || 'Could not pause');
		} finally {
			pauseBusy = false;
		}
	}

	async function resumeHabit() {
		if (!user) return;
		pauseBusy = true;
		try {
			const { error } = await supabase
				.from('Habit')
				.update({
					pause_start: null,
					pause_end: null,
					updated_at: new Date().toISOString()
				})
				.eq('id', habitId)
				.eq('user_id', user.id);
			if (error) throw error;
			pauseStart = null;
			pauseEnd = null;
			const { data: streakRow } = await supabase
				.from('Habit')
				.select('current_streak, best_streak, last_completed_date')
				.eq('id', habitId)
				.single();
			if (streakRow) {
				streakStats = {
					current_streak: streakRow.current_streak ?? 0,
					best_streak: streakRow.best_streak ?? 0,
					last_completed_date: streakRow.last_completed_date
						? streakRow.last_completed_date.slice(0, 10)
						: null
				};
			}
			toast.success('Habit resumed');
		} catch (e) {
			toast.error(e?.message || 'Could not resume');
		} finally {
			pauseBusy = false;
		}
	}

	async function handleDelete() {
		deleting = true;
		error = '';

		try {
			const { error: deleteError } = await supabase
				.from('Habit')
				.delete()
				.eq('id', habitId)
				.eq('user_id', user.id);

			if (deleteError) throw deleteError;

			toast.success('Habit deleted');
			goto('/app');
		} catch (e) {
			error = e.message || 'Failed to delete habit';
			deleting = false;
			deleteDialogOpen = false;
		}
	}
</script>

<div class="page-shell">
	<div class="page-container">
		<div class="page-header">
			<div>
				<a href="/app" class="back-link">
					<ArrowLeft class="h-4 w-4" />
					<span>Back</span>
				</a>
				<p class="eyebrow">Habit detail</p>
				<h1>{loading ? 'Loading...' : habit.title || 'Habit'}</h1>
			</div>
		</div>

		<div class="page-content">
			{#if loading}
				<div class="loading-state"><p>Loading...</p></div>
			{:else if error && error.includes('Not authenticated')}
				<Card.Root class="surface-card mb-4 border-0 shadow-none">
					<Card.Content class="pt-6">
						<div class="error-banner">{error}</div>
						<Button onclick={() => goto(`/login?next=/app/habit/${habitId}`)} disabled={false}>Go to Login</Button>
					</Card.Content>
				</Card.Root>
			{:else if error && error.includes('not found')}
				<Card.Root class="surface-card border-0 shadow-none">
					<Card.Content class="pt-6">
						<div class="error-banner">{error}</div>
						<Button onclick={() => goto('/app')} variant="outline" disabled={false}>Back to Dashboard</Button>
					</Card.Content>
				</Card.Root>
			{:else}
				<!-- Analytics Section -->
				<Card.Root class="surface-card border-0 shadow-none analytics-card">
					<Card.Header>
						<Card.Title>Analytics</Card.Title>
						<Card.Description>Performance overview for this habit</Card.Description>
					</Card.Header>
					<Card.Content>
						{#if analyticsLoading}
							<p class="text-sm text-muted-foreground">Loading analytics...</p>
						{:else}
							<div class="stats-grid">
								<div class="stat-card">
									<span class="stat-label">Current streak</span>
									<span class="stat-value metric streak-stat">
										<Flame class="h-4 w-4" aria-hidden="true" />
										{streakStats.current_streak}d
									</span>
								</div>
								<div class="stat-card">
									<span class="stat-label">Best streak</span>
									<span class="stat-value metric">{streakStats.best_streak}d</span>
								</div>
								<div class="stat-card">
									<span class="stat-label">Completion rate</span>
									<span class="stat-value metric">{completionRate}%</span>
								</div>
								<div class="stat-card">
									<span class="stat-label">Best day</span>
									<span class="stat-value metric">{bestDay}</span>
								</div>
							</div>

							{#if weeklyTrend.length > 0}
								<div class="trend-section">
									<h4 class="trend-title">Weekly completions</h4>
									<div class="trend-bars">
										{#each weeklyTrend as week}
											<div class="trend-bar-group" title="{week.week}: {week.count} completed">
												<div
													class="trend-bar"
													style="height: {maxWeeklyTrendCount > 0 ? (week.count / maxWeeklyTrendCount) * 100 : 0}%"
												></div>
												<span class="trend-label">{week.week.slice(5)}</span>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						{/if}
					</Card.Content>
				</Card.Root>

				<Card.Root class="surface-card border-0 shadow-none mb-4">
					<Card.Header>
						<Card.Title>Pause</Card.Title>
						<Card.Description>
							Hide this habit from Today while paused. Paused days don’t count as missed for streaks.
						</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-3">
						{#if pauseActive}
							<p class="text-sm text-muted-foreground">
								Paused through <strong class="text-foreground">{pauseEnd}</strong>.
							</p>
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={pauseBusy}
								onclick={() => resumeHabit()}
							>
								{pauseBusy ? '…' : 'Resume now'}
							</Button>
						{:else}
							<p class="text-sm text-muted-foreground">Quick pause (inclusive dates).</p>
							<div class="flex flex-wrap gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={pauseBusy}
									onclick={() => applyPause(3)}
								>
									3 days
								</Button>
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={pauseBusy}
									onclick={() => applyPause(7)}
								>
									7 days
								</Button>
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={pauseBusy}
									onclick={() => applyPause(14)}
								>
									14 days
								</Button>
							</div>
						{/if}
					</Card.Content>
				</Card.Root>

				<!-- Edit Form -->
				<Card.Root class="surface-card border-0 shadow-none">
					<Card.Header>
						<Card.Title>Edit Habit</Card.Title>
						<Card.Description>Update the details of this habit.</Card.Description>
					</Card.Header>
					<Card.Content>
						{#if success}
							<div class="success-banner">Habit updated successfully!</div>
						{/if}
						{#if error}
							<div class="error-banner">{error}</div>
						{/if}

						<form onsubmit={handleSubmit}>
							<div class="flex flex-col gap-6">
								<div class="grid gap-2">
									<Label for="title">Title *</Label>
									<Input
										id="title"
										type="text"
										placeholder="e.g., Drink 8 glasses of water"
										bind:value={habit.title}
										disabled={saving}
										required
									/>
								</div>

								<div class="grid gap-2">
									<Label for="description">Description</Label>
									<Textarea
										id="description"
										placeholder="Optional: Add more details about this habit..."
										bind:value={habit.description}
										disabled={saving}
										class="min-h-[100px]"
									/>
								</div>

								<Separator class="my-4" />
								<div class="pt-4">
									<h3 class="text-sm font-semibold mb-4">Tracking Window</h3>

									<div class="grid gap-2 mb-4">
										<Label for="start_date">Start Date</Label>
										<Popover.Root bind:open={popoverOpen}>
											<Popover.Trigger
												class="inline-flex h-9 w-full items-center justify-start rounded-md border border-input bg-transparent px-3 py-2 text-sm font-medium shadow-xs ring-offset-background placeholder:text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
												disabled={saving}
											>
												<CalendarIcon class="mr-2 h-4 w-4" />
												{#if calendarDate}
													{calendarDate.month.toString().padStart(2, '0')}/{calendarDate.day
														.toString()
														.padStart(2, '0')}/{calendarDate.year}
												{:else}
													<span class="text-muted-foreground">Pick a date</span>
												{/if}
											</Popover.Trigger>
											<Popover.Content class="w-auto p-0" align="start">
												<Calendar bind:value={calendarDate} />
											</Popover.Content>
										</Popover.Root>
									</div>

									<div class="grid gap-2">
										<Label for="duration">Duration (days)</Label>
										<Input
											id="duration"
											type="number"
											min="1"
											step="1"
											bind:value={tracking.duration_days}
											disabled={saving}
										/>
										<p class="text-xs text-muted-foreground">
											End date will be <span class="font-medium">{endDate}</span> ({tracking.duration_days} days total).
										</p>
									</div>
								</div>

								<div class="flex gap-2">
									<Button type="submit" disabled={saving}>
										{saving ? 'Saving...' : 'Save Changes'}
									</Button>
									<Button type="button" variant="ghost" disabled={saving} onclick={() => goto('/app')}>
										Cancel
									</Button>
								</div>
							</div>
						</form>
					</Card.Content>
				</Card.Root>

				<!-- Danger Zone -->
				<Card.Root class="surface-card border-0 shadow-none danger-card">
					<Card.Header>
						<Card.Title>Danger Zone</Card.Title>
						<Card.Description>This action is irreversible. All completion data will be lost.</Card.Description>
					</Card.Header>
					<Card.Content>
						<Dialog.Root bind:open={deleteDialogOpen}>
							<Dialog.Trigger>
								{#snippet child({ props })}
									<Button {...props} variant="destructive" disabled={deleting}>
										<Trash2 class="mr-2 h-4 w-4" />
										Delete Habit
									</Button>
								{/snippet}
							</Dialog.Trigger>
							<Dialog.Content>
								<Dialog.Header>
									<Dialog.Title>Delete "{habit.title}"?</Dialog.Title>
									<Dialog.Description>
										This will permanently delete this habit and all its completion history. This cannot be undone.
									</Dialog.Description>
								</Dialog.Header>
								<Dialog.Footer>
									<Button variant="outline" onclick={() => (deleteDialogOpen = false)} disabled={deleting}>
										Cancel
									</Button>
									<Button variant="destructive" onclick={handleDelete} disabled={deleting}>
										{deleting ? 'Deleting...' : 'Yes, Delete'}
									</Button>
								</Dialog.Footer>
							</Dialog.Content>
						</Dialog.Root>
					</Card.Content>
				</Card.Root>
			{/if}
		</div>
	</div>
</div>

<style>
	.page-shell {
		display: block;
	}

	.page-container {
		padding: 2rem;
		max-width: 800px;
		margin: 0;
	}

	.page-header {
		margin-bottom: 1.4rem;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.82rem;
		color: var(--ink-soft);
		text-decoration: none;
		margin-bottom: 0.6rem;
		transition: color 120ms ease;
	}

	.back-link:hover {
		color: var(--ink);
	}

	.eyebrow {
		font-size: 0.72rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink-soft);
		margin-bottom: 0.35rem;
	}

	.page-header h1 {
		font-size: 1.6rem;
		font-weight: 640;
		letter-spacing: -0.02em;
	}

	.page-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		color: var(--ink-soft);
	}

	.loading-state {
		text-align: center;
		padding: 2rem;
	}

	.error-banner {
		margin-bottom: 1rem;
		padding: 0.75rem;
		font-size: 0.875rem;
		color: oklch(0.577 0.245 27.325);
		background: oklch(0.577 0.245 27.325 / 0.08);
		border: 1px solid oklch(0.577 0.245 27.325 / 0.2);
		border-radius: 0.5rem;
	}

	.success-banner {
		margin-bottom: 1rem;
		padding: 0.75rem;
		font-size: 0.875rem;
		color: oklch(0.5 0.2 145);
		background: oklch(0.5 0.2 145 / 0.08);
		border: 1px solid oklch(0.5 0.2 145 / 0.2);
		border-radius: 0.5rem;
	}

	/* Analytics */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.6rem;
	}

	.stat-card {
		border: 1px solid var(--line-strong);
		border-radius: 0.6rem;
		padding: 0.65rem 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		background: var(--paper);
	}

	.stat-label {
		font-size: 0.7rem;
		color: var(--ink-soft);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.stat-value {
		font-size: 1.2rem;
		font-weight: 700;
		color: var(--ink);
	}

	.streak-stat {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	.trend-section {
		margin-top: 1rem;
	}

	.trend-title {
		font-size: 0.78rem;
		color: var(--ink-soft);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: 0.5rem;
	}

	.trend-bars {
		display: flex;
		align-items: flex-end;
		gap: 0.35rem;
		height: 80px;
		padding-top: 0.25rem;
	}

	.trend-bar-group {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
		height: 100%;
		justify-content: flex-end;
	}

	.trend-bar {
		width: 100%;
		max-width: 32px;
		min-height: 4px;
		background: var(--pop);
		border-radius: 3px 3px 0 0;
		transition: height 200ms ease;
	}

	.trend-label {
		font-size: 0.6rem;
		color: var(--ink-soft);
		white-space: nowrap;
	}

	.danger-card {
		border-color: oklch(0.577 0.245 27.325 / 0.25);
	}

	@media (max-width: 768px) {
		.page-container {
			padding: 1rem;
		}

		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
