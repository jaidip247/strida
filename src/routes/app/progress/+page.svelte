<script>
	import { ChevronDown } from "@lucide/svelte";
	import { createClient } from "$lib/supabase/client";
	import { onMount } from "svelte";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Tabs from "$lib/components/ui/tabs/index.js";

	const supabase = createClient();

	let loading = $state(true);
	let error = $state("");
	let activeTab = $state("ongoing");
	let habits = $state([]);
	let completionByHabit = $state({});

	function getLocalDateString(date = new Date()) {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	}

	function normalizeDateOnly(value) {
		if (!value) return null;
		if (typeof value === "string") return value.slice(0, 10);
		return null;
	}

	function addDaysToDateString(dateStr, daysToAdd) {
		const [year, month, day] = dateStr.split("-").map(Number);
		const date = new Date(Date.UTC(year, month - 1, day));
		date.setUTCDate(date.getUTCDate() + daysToAdd);
		const y = date.getUTCFullYear();
		const m = String(date.getUTCMonth() + 1).padStart(2, "0");
		const d = String(date.getUTCDate()).padStart(2, "0");
		return `${y}-${m}-${d}`;
	}

	function getHabitStartDate(habit) {
		return normalizeDateOnly(habit?.start_date || habit?.Schedule?.progress?.start_date);
	}

	function getHabitEndDate(habit) {
		const end = normalizeDateOnly(habit?.end_date);
		if (end) return end;

		const start = getHabitStartDate(habit);
		if (!start) return null;
		const durationDays = Math.max(Number(habit?.duration_days || habit?.Schedule?.duration || 1), 1);
		return addDaysToDateString(start, durationDays - 1);
	}

	function getHabitDurationDays(habit) {
		const start = getHabitStartDate(habit);
		const end = getHabitEndDate(habit);
		if (!start || !end) return 0;

		const startUtc = new Date(`${start}T00:00:00Z`);
		const endUtc = new Date(`${end}T00:00:00Z`);
		const diffMs = endUtc.getTime() - startUtc.getTime();
		const days = Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1;
		return Math.max(days, 0);
	}

	function getHabitStatus(habit, today) {
		const start = getHabitStartDate(habit);
		const end = getHabitEndDate(habit);
		if (!start || !end) return "upcoming";

		if (today < start) return "upcoming";
		if (today > end) return "completed";
		return "ongoing";
	}

	function buildDateRange(startDate, endDate) {
		if (!startDate || !endDate || startDate > endDate) return [];
		const days = [];
		let cursor = startDate;
		while (cursor <= endDate) {
			days.push(cursor);
			cursor = addDaysToDateString(cursor, 1);
		}
		return days;
	}

	async function loadProgress() {
		loading = true;
		error = "";

		try {
			const {
				data: { user },
				error: authError
			} = await supabase.auth.getUser();

			if (authError || !user) {
				error = "Not authenticated";
				loading = false;
				return;
			}

			// Prefer habit-centric schema first.
			const { data: habitRows, error: habitError } = await supabase
				.from("Habit")
				.select("*")
				.eq("user_id", user.id);

			let loadedHabits = [];

			if (!habitError) {
				loadedHabits = habitRows || [];
			} else {
				// Legacy fallback: User -> Schedule -> Habit.
				const { data: schedulesData, error: schedulesError } = await supabase
					.from("Schedule")
					.select("*")
					.eq("user_id", user.id);

				if (schedulesError) {
					throw new Error(habitError.message || schedulesError.message || "Failed to load habits");
				}

				const scheduleIds = (schedulesData || []).map((s) => s.id);
				if (scheduleIds.length > 0) {
					const { data: legacyHabits, error: legacyHabitsError } = await supabase
						.from("Habit")
						.select("*")
						.in("schedule_id", scheduleIds);

					if (legacyHabitsError) {
						throw new Error(legacyHabitsError.message || "Failed to load habits");
					}

					loadedHabits = (legacyHabits || []).map((habit) => ({
						...habit,
						Schedule: schedulesData.find((s) => s.id === habit.schedule_id)
					}));
				}
			}

			habits = loadedHabits;

			const habitIds = loadedHabits.map((h) => h.id);
			if (habitIds.length === 0) {
				completionByHabit = {};
				loading = false;
				return;
			}

			const { data: completionRows, error: completionError } = await supabase
				.from("HabitCompletion")
				.select("habit_id, completion_date, completed")
				.in("habit_id", habitIds);

			if (completionError) {
				throw new Error(completionError.message || "Failed to load completions");
			}

			const completionMap = {};
			for (const row of completionRows || []) {
				if (!completionMap[row.habit_id]) completionMap[row.habit_id] = {};
				const dateKey = normalizeDateOnly(row.completion_date);
				if (dateKey) {
					completionMap[row.habit_id][dateKey] = Boolean(row.completed);
				}
			}
			completionByHabit = completionMap;
		} catch (e) {
			error = e?.message || "Failed to load progress";
		} finally {
			loading = false;
		}
	}

	const today = $derived(getLocalDateString());
	const upcomingHabits = $derived(habits.filter((h) => getHabitStatus(h, today) === "upcoming"));
	const ongoingHabits = $derived(habits.filter((h) => getHabitStatus(h, today) === "ongoing"));
	const completedHabits = $derived(habits.filter((h) => getHabitStatus(h, today) === "completed"));

	function getCompletedCount(habit) {
		const map = completionByHabit[habit.id] || {};
		return Object.values(map).filter(Boolean).length;
	}

	function getCompletionRate(habit) {
		const total = getHabitDurationDays(habit);
		if (total <= 0) return 0;
		return Math.round((getCompletedCount(habit) / total) * 100);
	}

	function formatDateShort(dateStr) {
		if (!dateStr) return "-";
		const [year, month, day] = dateStr.split("-").map(Number);
		const date = new Date(Date.UTC(year, month - 1, day));
		return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
	}

	function formatWeekdayShort(dateStr) {
		const [year, month, day] = dateStr.split("-").map(Number);
		const date = new Date(Date.UTC(year, month - 1, day));
		return date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
	}

	onMount(() => {
		loadProgress();
	});
</script>

<div class="page-shell">
	<div class="page-container">
		<div class="page-header">
			<div>
				<p class="eyebrow">History</p>
				<h1>Progress</h1>
			</div>
		</div>

		<div class="page-content">
		{#if loading}
			<div class="loading-state">
				<p>Loading progress...</p>
			</div>
		{:else if error}
			<Card.Root class="surface-card border-0 shadow-none">
				<Card.Content class="pt-6">
					<div class="text-red-600 text-sm">{error}</div>
				</Card.Content>
			</Card.Root>
		{:else}
			<Tabs.Root bind:value={activeTab} class="w-full">
				<Tabs.List class="w-full grid grid-cols-3">
					<Tabs.Trigger value="upcoming">Upcoming ({upcomingHabits.length})</Tabs.Trigger>
					<Tabs.Trigger value="ongoing">Ongoing ({ongoingHabits.length})</Tabs.Trigger>
					<Tabs.Trigger value="completed">Completed ({completedHabits.length})</Tabs.Trigger>
				</Tabs.List>

				<Tabs.Content value="upcoming" class="mt-4">
					{#if upcomingHabits.length === 0}
						<Card.Root class="surface-card border-0 shadow-none"><Card.Content class="pt-6 text-sm text-muted-foreground">No upcoming habits.</Card.Content></Card.Root>
					{:else}
						<div class="habit-list">
							{#each upcomingHabits as habit}
								<details class="habit-item">
									<summary>
										<div class="habit-header-main">
											<div class="habit-title">{habit.title}</div>
											<div class="habit-meta">{formatDateShort(getHabitStartDate(habit))} - {formatDateShort(getHabitEndDate(habit))}</div>
										</div>
										<ChevronDown class="chevron-icon" />
									</summary>
									<div class="habit-details">
										<div class="stats-row">
											<div class="stat-pill">
												<span class="stat-label">Duration</span>
												<span class="stat-value">{getHabitDurationDays(habit)} days</span>
											</div>
											<div class="stat-pill">
												<span class="stat-label">Completion</span>
												<span class="stat-value">{getCompletedCount(habit)} / {getHabitDurationDays(habit)} ({getCompletionRate(habit)}%)</span>
											</div>
										</div>
										<div class="progress-bar" aria-label="completion progress">
											<div class="progress-fill" style={`width: ${getCompletionRate(habit)}%`}></div>
										</div>
										<div class="days-grid heatmap">
											{#each buildDateRange(getHabitStartDate(habit), getHabitEndDate(habit)) as day}
												{@const done = Boolean(completionByHabit[habit.id]?.[day])}
												{@const isPastOrToday = day <= today}
												<div
													class={`day-cell ${done ? 'done' : isPastOrToday ? 'missed' : 'future'}`}
													title={`${day}: ${done ? 'completed' : isPastOrToday ? 'not completed' : 'upcoming'}`}
												>
													<span class="day-number">{day.slice(8, 10)}</span>
													<span class="day-week">{formatWeekdayShort(day)}</span>
												</div>
											{/each}
										</div>
										<div class="legend">
											<span><i class="legend-dot done"></i> Completed</span>
											<span><i class="legend-dot missed"></i> Missed</span>
											<span><i class="legend-dot future"></i> Upcoming</span>
										</div>
									</div>
								</details>
							{/each}
						</div>
					{/if}
				</Tabs.Content>

				<Tabs.Content value="ongoing" class="mt-4">
					{#if ongoingHabits.length === 0}
						<Card.Root class="surface-card border-0 shadow-none"><Card.Content class="pt-6 text-sm text-muted-foreground">No ongoing habits.</Card.Content></Card.Root>
					{:else}
						<div class="habit-list">
							{#each ongoingHabits as habit}
								<details class="habit-item">
									<summary>
										<div class="habit-header-main">
											<div class="habit-title">{habit.title}</div>
											<div class="habit-meta">{formatDateShort(getHabitStartDate(habit))} - {formatDateShort(getHabitEndDate(habit))}</div>
										</div>
										<ChevronDown class="chevron-icon" />
									</summary>
									<div class="habit-details">
										<div class="stats-row">
											<div class="stat-pill">
												<span class="stat-label">Duration</span>
												<span class="stat-value">{getHabitDurationDays(habit)} days</span>
											</div>
											<div class="stat-pill">
												<span class="stat-label">Completion</span>
												<span class="stat-value">{getCompletedCount(habit)} / {getHabitDurationDays(habit)} ({getCompletionRate(habit)}%)</span>
											</div>
										</div>
										<div class="progress-bar" aria-label="completion progress">
											<div class="progress-fill" style={`width: ${getCompletionRate(habit)}%`}></div>
										</div>
										<div class="days-grid heatmap">
											{#each buildDateRange(getHabitStartDate(habit), getHabitEndDate(habit)) as day}
												{@const done = Boolean(completionByHabit[habit.id]?.[day])}
												{@const isPastOrToday = day <= today}
												<div
													class={`day-cell ${done ? 'done' : isPastOrToday ? 'missed' : 'future'}`}
													title={`${day}: ${done ? 'completed' : isPastOrToday ? 'not completed' : 'upcoming'}`}
												>
													<span class="day-number">{day.slice(8, 10)}</span>
													<span class="day-week">{formatWeekdayShort(day)}</span>
												</div>
											{/each}
										</div>
										<div class="legend">
											<span><i class="legend-dot done"></i> Completed</span>
											<span><i class="legend-dot missed"></i> Missed</span>
											<span><i class="legend-dot future"></i> Upcoming</span>
										</div>
									</div>
								</details>
							{/each}
						</div>
					{/if}
				</Tabs.Content>

				<Tabs.Content value="completed" class="mt-4">
					{#if completedHabits.length === 0}
						<Card.Root class="surface-card border-0 shadow-none"><Card.Content class="pt-6 text-sm text-muted-foreground">No completed habits.</Card.Content></Card.Root>
					{:else}
						<div class="habit-list">
							{#each completedHabits as habit}
								<details class="habit-item">
									<summary>
										<div class="habit-header-main">
											<div class="habit-title">{habit.title}</div>
											<div class="habit-meta">{formatDateShort(getHabitStartDate(habit))} - {formatDateShort(getHabitEndDate(habit))}</div>
										</div>
										<ChevronDown class="chevron-icon" />
									</summary>
									<div class="habit-details">
										<div class="stats-row">
											<div class="stat-pill">
												<span class="stat-label">Duration</span>
												<span class="stat-value">{getHabitDurationDays(habit)} days</span>
											</div>
											<div class="stat-pill">
												<span class="stat-label">Completion</span>
												<span class="stat-value">{getCompletedCount(habit)} / {getHabitDurationDays(habit)} ({getCompletionRate(habit)}%)</span>
											</div>
										</div>
										<div class="progress-bar" aria-label="completion progress">
											<div class="progress-fill" style={`width: ${getCompletionRate(habit)}%`}></div>
										</div>
										<div class="days-grid heatmap">
											{#each buildDateRange(getHabitStartDate(habit), getHabitEndDate(habit)) as day}
												{@const done = Boolean(completionByHabit[habit.id]?.[day])}
												{@const isPastOrToday = day <= today}
												<div
													class={`day-cell ${done ? 'done' : isPastOrToday ? 'missed' : 'future'}`}
													title={`${day}: ${done ? 'completed' : isPastOrToday ? 'not completed' : 'upcoming'}`}
												>
													<span class="day-number">{day.slice(8, 10)}</span>
													<span class="day-week">{formatWeekdayShort(day)}</span>
												</div>
											{/each}
										</div>
										<div class="legend">
											<span><i class="legend-dot done"></i> Completed</span>
											<span><i class="legend-dot missed"></i> Missed</span>
											<span><i class="legend-dot future"></i> Upcoming</span>
										</div>
									</div>
								</details>
							{/each}
						</div>
					{/if}
				</Tabs.Content>
			</Tabs.Root>
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
		max-width: 900px;
		margin: 0;
	}

	.page-header {
		display: flex;
		align-items: center;
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

	.loading-state {
		text-align: center;
		padding: 2rem;
	}

	.habit-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.habit-item {
		border: 1px solid var(--line-strong);
		border-radius: 0.75rem;
		background: var(--paper-elevated);
	}

	.habit-item summary {
		list-style: none;
		cursor: pointer;
		padding: 0.9rem 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
	}

	.habit-item summary::-webkit-details-marker {
		display: none;
	}

	.habit-header-main {
		display: flex;
		flex-direction: column;
		gap: 0.18rem;
	}

	.habit-title {
		font-weight: 600;
	}

	.habit-meta {
		font-size: 0.8rem;
		color: var(--ink-soft);
	}

	.chevron-icon {
		width: 1rem;
		height: 1rem;
		color: var(--ink-soft);
		flex-shrink: 0;
		transition: transform 180ms ease;
	}

	.habit-item[open] .chevron-icon {
		transform: rotate(180deg);
	}

	.habit-details {
		border-top: 1px solid var(--line);
		padding: 0.9rem 1rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		background: var(--paper);
	}

	.stats-row {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.5rem;
	}

	.stat-pill {
		border: 1px solid var(--line);
		background: white;
		border-radius: 0.6rem;
		padding: 0.45rem 0.6rem;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.stat-label {
		font-size: 0.72rem;
		color: var(--ink-soft);
	}

	.stat-value {
		font-size: 0.86rem;
		font-weight: 600;
		color: var(--ink);
	}

	.progress-bar {
		width: 100%;
		height: 0.5rem;
		border-radius: 999px;
		background: var(--line);
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: var(--ink);
		border-radius: inherit;
		transition: width 220ms ease;
	}

	.days-grid {
		margin-top: 0.25rem;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
		gap: 0.45rem;
	}

	.day-cell {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 0.05rem;
		border-radius: 0.55rem;
		padding: 0.4rem 0.25rem;
		border: 1px solid var(--line);
		background: #f9f9f7;
	}

	.day-cell.done {
		background: #efefec;
		border-color: var(--line-strong);
		color: var(--ink);
	}

	.day-cell.missed {
		background: #f5f5f3;
		border-color: var(--line);
		color: var(--ink-soft);
	}

	.day-cell.future {
		background: #fcfcfa;
		border-color: var(--line);
		color: var(--ink-soft);
	}

	.day-number {
		font-size: 0.85rem;
		font-weight: 700;
		line-height: 1;
	}

	.day-week {
		font-size: 0.64rem;
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		font-size: 0.72rem;
		color: var(--ink-soft);
	}

	.legend span {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}

	.legend-dot {
		width: 0.65rem;
		height: 0.65rem;
		border-radius: 999px;
		display: inline-block;
		border: 1px solid transparent;
	}

	.legend-dot.done {
		background: #242424;
	}

	.legend-dot.missed {
		background: #8c8c8c;
	}

	.legend-dot.future {
		background: #d2d2d2;
	}

	@media (max-width: 768px) {
		.page-container {
			padding: 1rem;
		}
	}

	@media (max-width: 640px) {
		.days-grid {
			grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
		}
	}
</style>
