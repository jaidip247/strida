<script>
	import { Calendar as CalendarIcon, CheckCircle2 } from "@lucide/svelte";
	import { createClient } from "$lib/supabase/client";
	import { onMount } from "svelte";
	import { Checkbox } from "$lib/components/ui/checkbox/index.js";
	import * as Card from "$lib/components/ui/card/index.js";

	const supabase = createClient();

	let loading = $state(true);
	let habits = $state([]);
	let completions = $state({});
	let loadError = $state('');
	function getLocalDateString(date = new Date()) {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

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

	let todayStr = $state(getLocalDateString());

	// Check if a date falls within a habit tracking window (inclusive).
	function isDateInHabitWindow(dateStr, habit) {
		const checkDate = normalizeDateOnly(dateStr);
		const start = normalizeDateOnly(habit?.start_date || habit?.Schedule?.progress?.start_date);
		if (!checkDate || !start) return false;

		let end = normalizeDateOnly(habit?.end_date);
		if (!end) {
			const durationDays = Math.max(Number(habit?.duration_days || habit?.Schedule?.duration || 1), 1);
			end = addDaysToDateString(start, durationDays - 1);
		}

		// Date-only strings in YYYY-MM-DD are lexicographically comparable.
		return checkDate >= start && checkDate <= end;
	}

	// Get habits for a specific date
	function getHabitsForDate(dateStr) {
		return habits.filter((habit) => isDateInHabitWindow(dateStr, habit));
	}

	// Load habits and completions
	async function loadData() {
		loading = true;
		loadError = '';
		try {
			// Get current user
			const { data: { user }, error: authError } = await supabase.auth.getUser();
			if (authError || !user) {
				loadError = 'Not authenticated';
				loading = false;
				return;
			}

			// Prefer new habit-centric schema.
			const { data: habitsData, error: habitsError } = await supabase
				.from('Habit')
				.select('*')
				.eq('user_id', user.id);

			if (!habitsError) {
				habits = habitsData || [];
			} else {
				// Fallback for legacy schema (User -> Schedule -> Habit) when migration is partial.
				const { data: schedulesData, error: schedulesError } = await supabase
					.from('Schedule')
					.select('*')
					.eq('user_id', user.id);

				if (schedulesError) {
					console.error('Error loading habits (new):', habitsError);
					console.error('Error loading schedules (legacy):', schedulesError);
					loadError = `Unable to load habits: ${habitsError.message || schedulesError.message}`;
					loading = false;
					return;
				}

				const scheduleIds = (schedulesData || []).map((s) => s.id);
				if (scheduleIds.length === 0) {
					habits = [];
				} else {
					const { data: legacyHabits, error: legacyHabitsError } = await supabase
						.from('Habit')
						.select('*')
						.in('schedule_id', scheduleIds);

					if (legacyHabitsError) {
						console.error('Error loading habits (legacy):', legacyHabitsError);
						loadError = `Unable to load habits: ${legacyHabitsError.message}`;
						loading = false;
						return;
					}

					habits = (legacyHabits || []).map((habit) => ({
						...habit,
						Schedule: schedulesData.find((s) => s.id === habit.schedule_id)
					}));
				}
			}

			// Load today's completions
			await loadTodayCompletions();
		} catch (error) {
			console.error('Error loading data:', error);
			loadError = error?.message || 'Failed to load habits';
		} finally {
			loading = false;
		}
	}

	async function loadTodayCompletions() {
		const dateHabits = getHabitsForDate(todayStr);
		const habitIds = dateHabits.map(h => h.id);

		if (habitIds.length === 0) {
			completions = {};
			return;
		}

		const { data, error } = await supabase
			.from('HabitCompletion')
			.select('*')
			.in('habit_id', habitIds)
			.eq('completion_date', todayStr);

		if (error) {
			console.error('Error loading completions:', error);
			return;
		}

		const completionsMap = {};
		data.forEach(c => {
			completionsMap[c.habit_id] = c.completed;
		});
		completions = completionsMap;
	}

	async function toggleHabitCompletion(habitId, checked) {
		try {
			// First, try to get existing completion
			const { data: existing, error: fetchError } = await supabase
				.from('HabitCompletion')
				.select('id')
				.eq('habit_id', habitId)
				.eq('completion_date', todayStr)
				.single();

			if (fetchError && fetchError.code !== 'PGRST116') {
				// Error other than "not found"
				console.error('Error fetching completion:', fetchError);
				return;
			}

			if (existing) {
				// Update existing record
				const { error } = await supabase
					.from('HabitCompletion')
					.update({
						completed: checked,
						updated_at: new Date().toISOString()
					})
					.eq('id', existing.id);

				if (error) {
					console.error('Error updating completion:', error);
					return;
				}
			} else {
				// Insert new record
				const { error } = await supabase
					.from('HabitCompletion')
					.insert({
						habit_id: habitId,
						completion_date: todayStr,
						completed: checked,
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString()
					});

				if (error) {
					console.error('Error inserting completion:', error);
					return;
				}
			}

			// Update local state
			completions[habitId] = checked;
			completions = { ...completions };
		} catch (error) {
			console.error('Error toggling habit completion:', error);
		}
	}

	// Get today's habits
	const todayHabits = $derived.by(() => getHabitsForDate(todayStr));

	onMount(() => {
		loadData();
	});
</script>

<div class="page-shell">
	<div class="page-container">
		<div class="page-header">
			<div>
				<p class="eyebrow">Daily ledger</p>
				<h1>Today's Habits</h1>
			</div>
			<div class="metric stat">{Object.values(completions).filter(Boolean).length}/{todayHabits.length || 0}</div>
		</div>
		
		<div class="page-content">
		{#if loading}
			<div class="loading-state">
				<p>Loading...</p>
			</div>
		{:else if loadError}
			<Card.Root class="surface-card border-0 shadow-none">
				<Card.Content class="pt-6">
					<div class="text-red-600 text-sm">{loadError}</div>
				</Card.Content>
			</Card.Root>
		{:else if todayHabits.length === 0}
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
						{todayHabits.length} {todayHabits.length === 1 ? 'habit' : 'habits'} to track today
					</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="space-y-3">
						{#each todayHabits as habit}
							<div class="habit-row">
								<Checkbox
									id="habit-{habit.id}"
									checked={completions[habit.id] || false}
									onCheckedChange={(checked) => toggleHabitCompletion(habit.id, checked)}
								/>
								<label for="habit-{habit.id}" class="flex-1 cursor-pointer">
									<div class="font-medium">{habit.title}</div>
									{#if habit.description}
										<div class="text-sm text-muted-foreground mt-1">{habit.description}</div>
									{/if}
								</label>
								{#if completions[habit.id]}
									<CheckCircle2 class="h-5 w-5 text-black ink-settle" />
								{/if}
							</div>
						{/each}
					</div>
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
		background: white;
		transition: border-color 120ms ease;
	}

	.habit-row:hover {
		border-color: var(--line-strong);
	}

	@media (max-width: 768px) {
		.page-container {
			padding: 1rem;
		}
	}
</style>
