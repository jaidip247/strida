<script>
	import { CheckCircle2, Flame, Pencil } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { createClient } from '$lib/supabase/client';
	import { onMount } from 'svelte';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { toast } from 'svelte-sonner';
	import HabitPagination from '$lib/components/HabitPagination.svelte';
	import { getHabitPageSlice, getPageRange } from '$lib/utils/pagination.js';
	import { appSettings } from '$lib/stores/app-settings.js';
	import { get } from 'svelte/store';

	const supabase = createClient();

	/** @type {'server' | 'legacy' | null} */
	let habitLoadMode = $state(null);
	let loading = $state(true);
	let serverHabits = $state([]);
	let totalTodayCount = $state(0);
	let legacyHabitsAll = $state([]);
	let todayPage = $state(0);
	/** @type {Record<string, { completed: boolean; skipped: boolean }>} */
	let completionState = $state({});
	let loadError = $state('');
	/** Max current_streak among all habits scheduled for today (not only current page). */
	let maxStreakToday = $state(0);

	let serverLoadSeq = 0;

	function getLocalDateString(date = new Date()) {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	let todayStr = $state(getLocalDateString());

	function normalizeDateOnly(value) {
		if (!value) return null;
		if (typeof value === 'string') return value.slice(0, 10);
		return null;
	}

	function addDaysToDateString(dateStr, daysToAdd) {
		const [year, month, day] = dateStr.split('-').map(Number);
		const date = new Date(Date.UTC(year, month - 1, day));
		date.setUTCDate(date.getUTCDate() + daysToAdd);
		const y = date.getUTCFullYear();
		const m = String(date.getUTCMonth() + 1).padStart(2, '0');
		const d = String(date.getUTCDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	}

	function isDateInHabitWindow(dateStr, habit) {
		const checkDate = normalizeDateOnly(dateStr);
		const start = normalizeDateOnly(habit?.start_date || habit?.Schedule?.progress?.start_date);
		if (!checkDate || !start) return false;

		let end = normalizeDateOnly(habit?.end_date);
		if (!end) {
			const durationDays = Math.max(
				Number(habit?.duration_days || habit?.Schedule?.duration || 1),
				1
			);
			end = addDaysToDateString(start, durationDays - 1);
		}

		return checkDate >= start && checkDate <= end;
	}

	function isHabitPausedOnDay(habit, dateStr) {
		const start = normalizeDateOnly(habit?.pause_start);
		const end = normalizeDateOnly(habit?.pause_end);
		if (!start || !end) return false;
		const d = normalizeDateOnly(dateStr);
		return d != null && d >= start && d <= end;
	}

	function getHabitsForDate(dateStr) {
		return legacyHabitsAll.filter(
			(habit) => isDateInHabitWindow(dateStr, habit) && !isHabitPausedOnDay(habit, dateStr)
		);
	}

	const habitsPageSize = $derived($appSettings.habitsPerPage);

	const legacyTodayHabits = $derived.by(() => getHabitsForDate(todayStr));
	const legacyTodaySlice = $derived(
		getHabitPageSlice(legacyTodayHabits, todayPage, habitsPageSize)
	);

	const displayedHabits = $derived(
		habitLoadMode === 'server'
			? serverHabits
			: habitLoadMode === 'legacy'
				? legacyTodaySlice.items
				: []
	);

	const totalForToday = $derived(
		habitLoadMode === 'server'
			? totalTodayCount
			: habitLoadMode === 'legacy'
				? legacyTodayHabits.length
				: 0
	);

	const completedTodayCount = $derived(
		Object.values(completionState).filter((v) => v?.completed === true).length
	);

	async function refreshMaxStreakToday() {
		const {
			data: { user },
			error: authError
		} = await supabase.auth.getUser();
		if (authError || !user) return;

		const { data, error } = await supabase
			.from('Habit')
			.select('*')
			.eq('user_id', user.id)
			.lte('start_date', todayStr)
			.gte('end_date', todayStr);

		if (error) {
			console.error('Error loading streak aggregate:', error);
			return;
		}

		const rows = (data || []).filter((r) => !isHabitPausedOnDay(r, todayStr));
		maxStreakToday = rows.length ? Math.max(...rows.map((r) => r.current_streak ?? 0)) : 0;
	}

	async function refreshStreakFieldsForHabit(habitId) {
		const { data, error } = await supabase
			.from('Habit')
			.select('current_streak, best_streak, last_completed_date')
			.eq('id', habitId)
			.single();

		if (error || !data) {
			console.error('Error refreshing streak fields:', error);
			return;
		}

		if (habitLoadMode === 'server') {
			serverHabits = serverHabits.map((h) => (h.id === habitId ? { ...h, ...data } : h));
		} else {
			legacyHabitsAll = legacyHabitsAll.map((h) => (h.id === habitId ? { ...h, ...data } : h));
		}

		await refreshMaxStreakToday();
	}

	async function loadLegacyHabits() {
		const {
			data: { user },
			error: authError
		} = await supabase.auth.getUser();
		if (authError || !user) {
			loadError = 'Not authenticated';
			return;
		}

		const { data: habitsData, error: habitsError } = await supabase
			.from('Habit')
			.select('*')
			.eq('user_id', user.id);

		if (!habitsError) {
			legacyHabitsAll = habitsData || [];
			todayPage = 0;
			await loadTodayCompletions();
			await refreshMaxStreakToday();
			return;
		}

		const { data: schedulesData, error: schedulesError } = await supabase
			.from('Schedule')
			.select('*')
			.eq('user_id', user.id);

		if (schedulesError) {
			console.error('Error loading habits (new):', habitsError);
			console.error('Error loading schedules (legacy):', schedulesError);
			loadError = `Unable to load habits: ${habitsError.message || schedulesError.message}`;
			return;
		}

		const scheduleIds = (schedulesData || []).map((s) => s.id);
		if (scheduleIds.length === 0) {
			legacyHabitsAll = [];
			todayPage = 0;
		} else {
			const { data: legacyHabits, error: legacyHabitsError } = await supabase
				.from('Habit')
				.select('*')
				.in('schedule_id', scheduleIds);

			if (legacyHabitsError) {
				console.error('Error loading habits (legacy):', legacyHabitsError);
				loadError = `Unable to load habits: ${legacyHabitsError.message}`;
				return;
			}

			legacyHabitsAll = (legacyHabits || []).map((habit) => ({
				...habit,
				Schedule: schedulesData.find((s) => s.id === habit.schedule_id)
			}));
			todayPage = 0;
		}

		await loadTodayCompletions();
		await refreshMaxStreakToday();
	}

	async function loadServerTodayPage(requestedPage, pageSize) {
		const seq = ++serverLoadSeq;
		loading = true;
		loadError = '';
		try {
			const {
				data: { user },
				error: authError
			} = await supabase.auth.getUser();
			if (authError || !user) {
				loadError = 'Not authenticated';
				return;
			}

			const { data: windowRows, error: windowError } = await supabase
				.from('Habit')
				.select('*')
				.eq('user_id', user.id)
				.lte('start_date', todayStr)
				.gte('end_date', todayStr)
				.order('title', { ascending: true })
				.order('id', { ascending: true });

			if (windowError) throw windowError;
			if (seq !== serverLoadSeq) return;

			const activeToday = (windowRows || []).filter((h) => !isHabitPausedOnDay(h, todayStr));
			const total = activeToday.length;
			const totalPages = Math.max(1, Math.ceil(total / pageSize));
			const safePage = Math.min(Math.max(0, requestedPage), totalPages - 1);

			if (safePage !== requestedPage) {
				todayPage = safePage;
				return;
			}

			const { from, to } = getPageRange(safePage, pageSize);
			serverHabits = activeToday.slice(from, to + 1);
			totalTodayCount = total;
			await loadTodayCompletions();
			await refreshMaxStreakToday();
		} catch (error) {
			if (seq !== serverLoadSeq) return;
			console.error('Error loading data:', error);
			loadError = error?.message || 'Failed to load habits';
		} finally {
			if (seq === serverLoadSeq) loading = false;
		}
	}

	$effect(() => {
		if (habitLoadMode !== 'server') return;
		const page = todayPage;
		const pageSize = habitsPageSize;
		void loadServerTodayPage(page, pageSize);
	});

	async function loadTodayCompletions() {
		const { data, error } = await supabase
			.from('HabitCompletion')
			.select('habit_id, completed, skipped')
			.eq('completion_date', todayStr);

		if (error) {
			console.error('Error loading completions:', error);
			return;
		}

		const map = {};
		for (const c of data || []) {
			map[c.habit_id] = { completed: !!c.completed, skipped: !!c.skipped };
		}
		completionState = map;
	}

	async function toggleHabitCompletion(habitId, checked) {
		if (checked === true && get(appSettings).confirmBeforeComplete) {
			const ok =
				typeof window !== 'undefined' && window.confirm('Mark this habit complete for today?');
			if (!ok) return;
		}
		try {
			const { data: existing, error: fetchError } = await supabase
				.from('HabitCompletion')
				.select('id')
				.eq('habit_id', habitId)
				.eq('completion_date', todayStr)
				.single();

			if (fetchError && fetchError.code !== 'PGRST116') {
				console.error('Error fetching completion:', fetchError);
				return;
			}

			const completed = checked === true;
			const skipped = false;

			if (existing) {
				const { error } = await supabase
					.from('HabitCompletion')
					.update({
						completed,
						skipped,
						updated_at: new Date().toISOString()
					})
					.eq('id', existing.id);

				if (error) {
					console.error('Error updating completion:', error);
					return;
				}
			} else {
				const { error } = await supabase.from('HabitCompletion').insert({
					habit_id: habitId,
					completion_date: todayStr,
					completed,
					skipped,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				});

				if (error) {
					console.error('Error inserting completion:', error);
					return;
				}
			}

			completionState[habitId] = { completed, skipped };
			completionState = { ...completionState };

			await refreshStreakFieldsForHabit(habitId);
		} catch (error) {
			console.error('Error toggling habit completion:', error);
			toast.error('Failed to update completion');
		}
	}

	async function toggleSkipForToday(habitId) {
		try {
			const { data: existing, error: fetchError } = await supabase
				.from('HabitCompletion')
				.select('id')
				.eq('habit_id', habitId)
				.eq('completion_date', todayStr)
				.single();

			if (fetchError && fetchError.code !== 'PGRST116') {
				console.error('Error fetching completion:', fetchError);
				return;
			}

			const completed = false;
			const skipped = true;

			if (existing) {
				const { error } = await supabase
					.from('HabitCompletion')
					.update({
						completed,
						skipped,
						updated_at: new Date().toISOString()
					})
					.eq('id', existing.id);
				if (error) {
					console.error('Error updating skip:', error);
					toast.error('Could not update skip');
					return;
				}
			} else {
				const { error } = await supabase.from('HabitCompletion').insert({
					habit_id: habitId,
					completion_date: todayStr,
					completed,
					skipped,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				});
				if (error) {
					console.error('Error inserting skip:', error);
					toast.error('Could not save skip');
					return;
				}
			}

			completionState[habitId] = { completed, skipped };
			completionState = { ...completionState };
			await refreshStreakFieldsForHabit(habitId);
			toast.success('Skipped for today (streak preserved)');
		} catch (e) {
			console.error(e);
			toast.error('Failed to skip');
		}
	}

	onMount(async () => {
		loading = true;
		loadError = '';
		const {
			data: { user },
			error: authError
		} = await supabase.auth.getUser();
		if (authError || !user) {
			loadError = 'Not authenticated';
			loading = false;
			return;
		}

		const { error: probeError } = await supabase
			.from('Habit')
			.select('id')
			.eq('user_id', user.id)
			.limit(1);

		if (!probeError) {
			habitLoadMode = 'server';
		} else {
			habitLoadMode = 'legacy';
			await loadLegacyHabits();
			loading = false;
		}
	});
</script>

<div class="page-shell" class:page-shell--compact={$appSettings.compactLists}>
	<div class="page-container">
		<div class="page-header">
			<div>
				<p class="eyebrow">Daily ledger</p>
				<h1>Today's Habits</h1>
			</div>
			<div class="page-header-metrics">
				<div class="metric stat">{completedTodayCount}/{totalForToday || 0}</div>
				{#if totalForToday > 0 && maxStreakToday > 0}
					<div class="streak-chip" title="Highest active streak among today&apos;s habits">
						<Flame class="h-4 w-4" aria-hidden="true" />
						<span>{maxStreakToday}</span>
					</div>
				{/if}
			</div>
		</div>

		<div class="page-content">
			{#if loading}
				<div class="loading-state">
					<p>Loading...</p>
				</div>
			{:else if loadError}
				<Card.Root class="surface-card border-0 shadow-none">
					<Card.Content class="pt-6">
						<div class="text-destructive text-sm">{loadError}</div>
					</Card.Content>
				</Card.Root>
			{:else if totalForToday === 0}
				<Card.Root class="surface-card border-0 shadow-none">
					<Card.Content class="pt-6">
						<div class="text-center py-8 text-muted-foreground">
							<p>No habits scheduled for today.</p>
							<p class="text-sm mt-2">Create a new habit to get started!</p>
						</div>
					</Card.Content>
				</Card.Root>
			{:else}
				<Card.Root class="surface-card border-0 shadow-none">
					<Card.Header>
						<Card.Title>Today&apos;s checklist</Card.Title>
						<Card.Description>
							{totalForToday}
							{totalForToday === 1 ? 'habit' : 'habits'} to track today
						</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="space-y-3">
							{#each displayedHabits as habit (habit.id)}
								<div class="habit-row">
									<Checkbox
										id="habit-{habit.id}"
										checked={completionState[habit.id]?.completed === true}
										disabled={completionState[habit.id]?.skipped === true}
										onCheckedChange={(checked) => toggleHabitCompletion(habit.id, checked === true)}
									/>
									<label for="habit-{habit.id}" class="flex-1 cursor-pointer">
										<div class="font-medium">{habit.title}</div>
										{#if habit.description}
											<div class="text-sm text-muted-foreground mt-1">{habit.description}</div>
										{/if}
									</label>
									{#if completionState[habit.id]?.skipped}
										<span class="skip-badge">Skipped</span>
									{:else if habit.current_streak != null && habit.current_streak > 0}
										<span class="streak-badge" title="Best streak: {habit.best_streak ?? 0} days">
											<Flame class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
											{habit.current_streak}
										</span>
									{/if}
									{#if completionState[habit.id]?.completed}
										<CheckCircle2 class="h-5 w-5 ink-settle" />
									{/if}
									{#if !completionState[habit.id]?.completed && !completionState[habit.id]?.skipped}
										<Button
											type="button"
											variant="ghost"
											size="sm"
											class="shrink-0 h-8 px-2 text-xs"
											onclick={() => toggleSkipForToday(habit.id)}
										>
											Skip
										</Button>
									{/if}
									<a href="/app/habit/{habit.id}" class="habit-edit-link" title="Edit habit">
										<Pencil class="h-4 w-4" />
									</a>
								</div>
							{/each}
						</div>
						<HabitPagination
							bind:page={todayPage}
							totalItems={totalForToday}
							pageSize={habitsPageSize}
						/>
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
		display: flex;
		align-items: end;
		justify-content: space-between;
		margin-bottom: 1.4rem;
	}

	.page-header-metrics {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: flex-end;
	}

	.streak-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--ink);
		border: 1px solid var(--line-strong);
		padding: 0.3rem 0.55rem;
		border-radius: 8px;
	}

	.streak-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		flex-shrink: 0;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--ink-soft);
		padding: 0.15rem 0.4rem;
		border-radius: 6px;
		border: 1px solid var(--line);
		background: var(--paper-elevated);
	}

	.skip-badge {
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--ink-soft);
		padding: 0.15rem 0.45rem;
		border-radius: 6px;
		border: 1px dashed var(--line-strong);
		flex-shrink: 0;
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

	.stat {
		font-size: 1rem;
		color: var(--ink-soft);
		border: 1px solid var(--line-strong);
		padding: 0.3rem 0.55rem;
		border-radius: 8px;
	}

	.page-content {
		color: var(--ink-soft);
	}

	.loading-state {
		text-align: center;
		padding: 2rem;
	}

	.habit-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.7rem 0.75rem;
		border-radius: 10px;
		border: 1px solid var(--line);
		background: var(--paper-elevated);
		transition: border-color 120ms ease;
	}

	.habit-row:hover {
		border-color: var(--line-strong);
	}

	.page-shell--compact .habit-row {
		padding: 0.45rem 0.55rem;
		gap: 0.5rem;
	}

	.habit-edit-link {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.3rem;
		border-radius: 6px;
		color: var(--ink-soft);
		transition:
			color 120ms ease,
			background 120ms ease;
		flex-shrink: 0;
	}

	.habit-edit-link:hover {
		color: var(--ink);
		background: var(--line);
	}

	@media (max-width: 768px) {
		.page-container {
			padding: 1rem;
		}
	}
</style>
