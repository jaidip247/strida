<script>
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { CalendarIcon } from '@lucide/svelte';
	import { CalendarDate, parseDate } from '@internationalized/date';
	import * as Card from '$lib/components/ui/card/index.js';
	import { createClient } from '$lib/supabase/client';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { FREE_DURATION_DAYS, FREE_HABIT_LIMIT } from '$lib/constants/plan.js';

	let { data } = $props();

	const supabase = createClient();

	let loading = $state(false);
	let saving = $state(false);
	let error = $state('');
	let success = $state(false);
	
	let habit = $state({
		title: '',
		description: ''
	});

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

	let tracking = $state({
		start_date: getLocalDateString(),
		duration_days: FREE_DURATION_DAYS
	});

	const atHabitLimit = $derived(
		data.plan === 'free' && (data.habitCount ?? 0) >= FREE_HABIT_LIMIT
	);
	const isFreePlan = $derived(data.plan === 'free');

	let calendarDate = $state(null);
	let popoverOpen = $state(false);

	// Format calendar date for display
	function formatDate(date) {
		if (!date) return '';
		const month = date.month.toString().padStart(2, '0');
		const day = date.day.toString().padStart(2, '0');
		return `${date.year}-${month}-${day}`;
	}

	// Update start_date string when calendar date changes
	$effect(() => {
		if (calendarDate) {
			tracking.start_date = formatDate(calendarDate);
			// Close the popover when a date is selected
			popoverOpen = false;
		}
	});

	const endDate = $derived(calculateEndDate(tracking.start_date, tracking.duration_days));

	let user = $state(null);

	onMount(async () => {
		// Get current user to ensure authenticated
		const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
		
		if (authError || !authUser) {
			error = 'Not authenticated. Please log in.';
			loading = false;
			return;
		}

		user = authUser;
		loading = false;

		// Initialize calendar date from start_date string
		if (tracking.start_date) {
			try {
				calendarDate = parseDate(tracking.start_date);
			} catch (e) {
				const today = new Date();
				calendarDate = new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
			}
		} else {
			const today = new Date();
			calendarDate = new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
		}
	});

	async function handleSubmit(e) {
		e.preventDefault();
		console.log('Form submitted', { user, habit, tracking });
		saving = true;
		error = '';
		success = false;

		if (!user) {
			error = 'Not authenticated';
			saving = false;
			console.error('No user found');
			return;
		}

		if (!habit.title.trim()) {
			error = 'Title is required';
			saving = false;
			console.error('Title is missing');
			return;
		}

		const durationDays = isFreePlan
			? FREE_DURATION_DAYS
			: Math.max(Number(tracking.duration_days || 1), 1);
		const startDateToSave = tracking.start_date || getLocalDateString();

		if (!/^\d{4}-\d{2}-\d{2}$/.test(startDateToSave)) {
			error = 'Start date is invalid';
			saving = false;
			return;
		}

		if (isFreePlan && atHabitLimit) {
			error = `Free accounts can have up to ${FREE_HABIT_LIMIT} habits. Upgrade to Pro for unlimited habits.`;
			saving = false;
			return;
		}

		console.log('Attempting to create habit...');
		try {
			// Ensure User record exists in User table (required for foreign key)
			// Supabase Auth creates auth.users, but we need a record in User table
			const { data: _existingUser, error: userCheckError } = await supabase
				.from('User')
				.select('id')
				.eq('id', user.id)
				.single();

			if (userCheckError && userCheckError.code === 'PGRST116') {
				// User record doesn't exist, create it
				console.log('User record not found, creating User record...');
				const meta = user.user_metadata || {};
				const strOrNull = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
				const { error: createUserError } = await supabase
					.from('User')
					.insert({
						id: user.id,
						email: user.email || '',
						name: meta.name || meta.full_name || '',
						bio: strOrNull(meta.bio),
						timezone: strOrNull(meta.timezone),
						country: strOrNull(meta.country),
						status: 'ACTIVE',
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString()
					});

				if (createUserError) {
					throw new Error(`Failed to create user record: ${createUserError.message}`);
				}
			} else if (userCheckError) {
				throw new Error(`Failed to check user record: ${userCheckError.message}`);
			}

			// Insert habit directly; schedule is now modeled on Habit fields.
			const { data: _habitData, error: habitError } = await supabase
				.from('Habit')
				.insert({
					user_id: user.id,
					title: habit.title.trim(),
					description: habit.description.trim() || null,
					start_date: startDateToSave,
					duration_days: durationDays,
					end_date: calculateEndDate(startDateToSave, durationDays),
					checked: false,
					updated_at: new Date().toISOString()
				})
				.select()
				.single();

			if (habitError) {
				console.error('Error creating habit:', habitError);
				throw habitError;
			}

			success = true;
			toast.success('Habit created successfully');

			setTimeout(() => {
				goto('/app');
			}, 1500);
		} catch (e) {
			const msg = e?.message || String(e);
			if (msg.includes('row-level security') || msg.includes('42501')) {
				error =
					'Could not create this habit (free tier limit or duration rules). Upgrade to Pro or adjust your habits.';
			} else {
				error = msg || 'Failed to create habit';
			}
			console.error('Error creating habit:', e);
			console.error('Error details:', {
				message: e.message,
				code: e.code,
				details: e.details,
				hint: e.hint
			});
		} finally {
			saving = false;
		}
	}

	function handleReset() {
		habit = {
			title: '',
			description: ''
		};
		tracking = {
			start_date: getLocalDateString(),
			duration_days: FREE_DURATION_DAYS
		};
		calendarDate = parseDate(tracking.start_date);
		error = '';
		success = false;
	}
</script>

<div class="page-shell">
	<div class="page-container">
		<div class="page-header">
			<div>
				<p class="eyebrow">New habit</p>
				<h1>Add Habit</h1>
			</div>
		</div>
		
		<div class="page-content">
		{#if loading}
			<div class="loading-state">
				<p>Loading...</p>
			</div>
		{:else if error && !loading && error.includes('Not authenticated')}
			<Card.Root class="surface-card mb-4 border-0 shadow-none">
				<Card.Content class="pt-6">
					<div class="text-destructive text-sm mb-4">{error}</div>
					<Button onclick={() => goto('/login?next=/app/add')} class="" disabled={false}>
						Go to Login
					</Button>
				</Card.Content>
			</Card.Root>
		{:else if atHabitLimit}
			<Card.Root class="surface-card border-0 shadow-none">
				<Card.Header>
					<Card.Title>Habit limit reached</Card.Title>
					<Card.Description>
						Free accounts support up to {FREE_HABIT_LIMIT} habits with a {FREE_DURATION_DAYS}-day duration
						each. Upgrade to Pro for unlimited habits and custom durations.
					</Card.Description>
				</Card.Header>
				<Card.Content class="flex flex-wrap gap-2">
					<Button href="/app/upgrade">Upgrade to Pro</Button>
					<Button variant="outline" href="/app">Back to Today</Button>
				</Card.Content>
			</Card.Root>
		{:else}
			<Card.Root class="surface-card border-0 shadow-none">
				<Card.Header class="">
					<Card.Title class="">Create a New Habit</Card.Title>
					<Card.Description class="">Fill in the details to create a new habit to track.</Card.Description>
				</Card.Header>
				<Card.Content class="">
					{#if success}
						<div class="mb-4 p-3 text-sm text-primary bg-primary/10 border border-primary/20 rounded-md">
							Habit created successfully! Redirecting...
						</div>
					{/if}
					{#if error}
						<div class="mb-4 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
							{error}
						</div>
					{/if}
					
					<form onsubmit={handleSubmit}>
						<div class="flex flex-col gap-6">
							<div class="grid gap-2">
								<Label for="title" class="">Title *</Label>
								<Input 
									id="title" 
									type="text" 
									placeholder="e.g., Drink 8 glasses of water"
									bind:value={habit.title}
									disabled={saving}
									required
									class=""
								/>
								<p class="text-xs text-muted-foreground">Give your habit a clear, actionable title</p>
							</div>

							<div class="grid gap-2">
								<Label for="description" class="">Description</Label>
								<Textarea
									id="description"
									placeholder="Optional: Add more details about this habit..."
									bind:value={habit.description}
									disabled={saving}
									class="min-h-[100px]"
								/>
								<p class="text-xs text-muted-foreground">Optional: Add notes or motivation for this habit</p>
							</div>

							<Separator class="my-4" />
							<div class="pt-4">
								<h3 class="text-sm font-semibold mb-4">Tracking Window</h3>
								
								<div class="grid gap-2 mb-4">
									<Label for="start_date" class="">Start Date</Label>
									<Popover.Root bind:open={popoverOpen}>
										<Popover.Trigger
											class="inline-flex h-9 w-full items-center justify-start rounded-md border border-input bg-transparent px-3 py-2 text-sm font-medium shadow-xs ring-offset-background placeholder:text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
											disabled={saving}
										>
											<CalendarIcon class="mr-2 h-4 w-4" />
											{#if calendarDate}
												{calendarDate.month.toString().padStart(2, '0')}/{calendarDate.day.toString().padStart(2, '0')}/{calendarDate.year}
											{:else}
												<span class="text-muted-foreground">Pick a date</span>
											{/if}
										</Popover.Trigger>
										<Popover.Content class="w-auto p-0" align="start">
											<Calendar bind:value={calendarDate} class="" />
										</Popover.Content>
									</Popover.Root>
									<p class="text-xs text-muted-foreground">Defaults to today. Set tomorrow or any future date if you want it to start later.</p>
								</div>

								<div class="grid gap-2">
									<Label for="duration" class="">Duration (days)</Label>
									{#if isFreePlan}
										<Input
											id="duration"
											type="number"
											value={FREE_DURATION_DAYS}
											readonly
											disabled
											class="bg-muted"
										/>
										<p class="text-xs text-muted-foreground">
											Free tier uses a fixed {FREE_DURATION_DAYS}-day window. End date:
											<span class="font-medium">{endDate}</span> — upgrade to Pro for custom durations.
										</p>
									{:else}
										<Input
											id="duration"
											type="number"
											min="1"
											step="1"
											bind:value={tracking.duration_days}
											disabled={saving}
											class=""
										/>
										<p class="text-xs text-muted-foreground">
											End date will be <span class="font-medium">{endDate}</span> ({tracking.duration_days} days total).
										</p>
									{/if}
								</div>
							</div>

							<div class="flex gap-2">
								<Button type="submit" disabled={saving} class="">
									{saving ? 'Creating...' : 'Create Habit'}
								</Button>
								<Button 
									type="button" 
									variant="outline"
									disabled={saving}
									onclick={handleReset}
									class=""
								>
									Reset
								</Button>
								<Button 
									type="button" 
									variant="ghost"
									disabled={saving}
									onclick={() => goto('/app')}
									class=""
								>
									Cancel
								</Button>
							</div>
						</div>
					</form>
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

	.page-content {
		color: var(--ink-soft);
	}

	.loading-state {
		text-align: center;
		padding: 2rem;
	}

	@media (max-width: 768px) {
		.page-container {
			padding: 1rem;
		}
	}
</style>
