<script>
	import { onMount } from 'svelte';
	import { ChevronDown } from '@lucide/svelte';
	import { createClient } from '$lib/supabase/client';
	import * as Card from '$lib/components/ui/card/index.js';
	import HabitPagination from '$lib/components/HabitPagination.svelte';
	import { getHabitPageSlice } from '$lib/utils/pagination.js';
	import { appSettings } from '$lib/stores/app-settings.js';

	const supabase = createClient();
	let loading = $state(true);
	let error = $state('');
	let habits = $state([]);
	let insightsPage = $state(0);
	let expandedTips = $state(new Set());

	const researchCatalog = [
		{
			id: 'sleep',
			keywords: ['sleep', 'bed', 'night', 'wake', 'wakeup', 'rest', 'nap', 'insomnia'],
			title: 'Sleep regularity is linked to better health outcomes',
			body: 'Medical guidance consistently recommends enough nightly sleep and regular sleep timing for cardiometabolic and cognitive health.',
			sourceTitle: 'NHLBI: Sleep Deprivation and Deficiency',
			sourceUrl: 'https://www.nhlbi.nih.gov/health/sleep-deprivation',
			actionableTips: [
				'Keep a consistent bedtime and wake time, even on weekends.',
				'Avoid screens for 30-60 minutes before bed to improve melatonin production.',
				'Keep your bedroom cool (around 65-68 F / 18-20 C) for optimal sleep.'
			]
		},
		{
			id: 'activity',
			keywords: ['walk', 'run', 'exercise', 'workout', 'cardio', 'steps', 'jog', 'gym', 'lift', 'swim', 'cycle', 'bike', 'hike', 'sport'],
			title: 'Regular physical activity lowers disease risk',
			body: 'Even moderate, consistent activity improves cardiovascular and metabolic outcomes, and reduces all-cause mortality risk.',
			sourceTitle: 'WHO Fact Sheet: Physical Activity',
			sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/physical-activity',
			actionableTips: [
				'Aim for at least 150 minutes of moderate activity per week (about 22 min/day).',
				'Stack exercise with an existing habit (e.g., walk right after your morning coffee).',
				'Start with 10-minute sessions and gradually increase duration.'
			]
		},
		{
			id: 'mindfulness',
			keywords: ['meditate', 'meditation', 'mindful', 'mindfulness', 'breath', 'breathing', 'journal', 'gratitude', 'calm', 'yoga'],
			title: 'Mindfulness practices may improve stress and sleep quality',
			body: 'Clinical research suggests mindfulness-based practices can help with stress-related symptoms and improve psychological well-being.',
			sourceTitle: 'NCCIH: Meditation and Mindfulness',
			sourceUrl: 'https://www.nccih.nih.gov/health/meditation-and-mindfulness-what-you-need-to-know',
			actionableTips: [
				'Start with just 5 minutes of focused breathing daily before scaling up.',
				'Try body-scan meditation before bed to transition into restful sleep.',
				'Use journaling as a form of reflective mindfulness: write 3 things you noticed today.'
			]
		},
		{
			id: 'nutrition',
			keywords: ['protein', 'vegetable', 'meal', 'eat', 'diet', 'nutrition', 'fruit', 'sugar', 'cook', 'food', 'calorie', 'fast', 'fasting'],
			title: 'Consistent healthy eating patterns improve long-term outcomes',
			body: 'Nutrition research favors sustained dietary patterns (not short bursts) for reducing chronic disease risk over time.',
			sourceTitle: 'WHO: Healthy Diet',
			sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet',
			actionableTips: [
				'Meal-prep on one day to reduce decision fatigue during the week.',
				'Add one extra serving of vegetables to a meal you already eat daily.',
				'Eat slowly and mindfully; it takes about 20 minutes for fullness signals to register.'
			]
		},
		{
			id: 'alcohol_tobacco',
			keywords: ['alcohol', 'drink', 'smoke', 'smoking', 'cigarette', 'vape', 'nicotine', 'sober', 'quit'],
			title: 'Reducing alcohol and tobacco exposure has strong health benefits',
			body: 'Evidence supports risk reduction from limiting alcohol use and stopping tobacco exposure, including cardiovascular and cancer risk benefits.',
			sourceTitle: 'CDC: About Alcohol Use / Tobacco',
			sourceUrl: 'https://www.cdc.gov/alcohol/about-alcohol-use/index.html',
			actionableTips: [
				'Track your consumption to build awareness before trying to reduce.',
				'Replace the ritual: swap an evening drink with herbal tea or sparkling water.',
				'Tell a friend or accountability partner about your goal for social support.'
			]
		},
		{
			id: 'hydration',
			keywords: ['water', 'hydrate', 'hydration', 'drink water', 'glass', 'fluid', 'thirst'],
			title: 'Adequate hydration supports cognitive and physical performance',
			body: 'Even mild dehydration (1-2% body weight loss) can impair mood, concentration, and physical endurance. Consistent fluid intake throughout the day is recommended.',
			sourceTitle: 'EFSA: Scientific Opinion on Dietary Reference Values for Water',
			sourceUrl: 'https://www.efsa.europa.eu/en/efsajournal/pub/1459',
			actionableTips: [
				'Keep a reusable water bottle visible at your desk or bag as a cue.',
				'Drink a glass of water first thing in the morning before coffee.',
				'Set periodic reminders if you tend to forget during focused work.'
			]
		},
		{
			id: 'reading',
			keywords: ['read', 'reading', 'book', 'learn', 'study', 'course', 'podcast', 'education', 'language'],
			title: 'Lifelong learning is associated with cognitive resilience',
			body: 'Engaging in cognitively stimulating activities like reading and learning new skills may help build cognitive reserve and delay age-related cognitive decline.',
			sourceTitle: 'NIH: Cognitive and Social Activities and Long-term Dementia Risk',
			sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/36223553/',
			actionableTips: [
				'Read for just 15-20 minutes before bed instead of scrolling.',
				'Alternate between fiction and non-fiction to engage different cognitive processes.',
				'Summarize what you learned in a short note to improve retention.'
			]
		},
		{
			id: 'social',
			keywords: ['friend', 'social', 'family', 'call', 'connect', 'community', 'volunteer', 'relationship', 'talk'],
			title: 'Social connection is a key factor in longevity and mental health',
			body: 'Strong social relationships are linked to a 50% increased likelihood of survival. Loneliness is a risk factor comparable to smoking or obesity.',
			sourceTitle: 'PLOS Medicine: Social Relationships and Mortality Risk',
			sourceUrl: 'https://journals.plos.org/plosmedicine/article?id=10.1371/journal.pmed.1000316',
			actionableTips: [
				'Schedule one short call or in-person meetup with someone each week.',
				'Send a brief "thinking of you" message to strengthen a low-effort connection.',
				'Join a group with shared interests (book club, running group, class).'
			]
		},
		{
			id: 'screen_time',
			keywords: ['screen', 'phone', 'digital', 'detox', 'social media', 'scroll', 'limit', 'device'],
			title: 'Excessive screen time is linked to poorer mental health outcomes',
			body: 'Research suggests that high recreational screen use (especially social media) correlates with increased anxiety, depression, and sleep disruption.',
			sourceTitle: 'BMC Public Health: Screen Time and Psychological Well-Being',
			sourceUrl: 'https://bmcpublichealth.biomedcentral.com/articles/10.1186/s12889-020-09585-y',
			actionableTips: [
				'Set a daily screen-time limit using your device\'s built-in tools.',
				'Designate one room (e.g., bedroom) as a phone-free zone.',
				'Replace 15 minutes of scrolling with a short walk or stretching session.'
			]
		},
		{
			id: 'stretching',
			keywords: ['stretch', 'flexibility', 'mobility', 'posture', 'foam roll', 'warm up', 'cool down', 'pilates'],
			title: 'Regular stretching improves flexibility and reduces injury risk',
			body: 'Consistent flexibility and mobility work helps maintain joint range of motion, supports posture, and can reduce musculoskeletal pain.',
			sourceTitle: 'ACSM: Stretching and Flexibility Guidelines',
			sourceUrl: 'https://www.acsm.org/education-resources/trending-topics-resources/physical-activity-guidelines',
			actionableTips: [
				'Do a 5-minute stretch routine right after waking up each morning.',
				'Focus on hip flexors and shoulders if you sit at a desk most of the day.',
				'Hold each stretch for 15-30 seconds; never bounce or force into pain.'
			]
		}
	];

	function inferResearchForHabit(habit) {
		const text = `${habit?.title || ''} ${habit?.description || ''}`.toLowerCase();
		return researchCatalog.filter((item) => item.keywords.some((keyword) => text.includes(keyword)));
	}

	const researchInsights = $derived.by(() => {
		const seen = new Set();
		const mapped = [];

		for (const habit of habits) {
			const matches = inferResearchForHabit(habit);
			for (const matched of matches) {
				const key = `${habit.id}:${matched.id}`;
				if (seen.has(key)) continue;
				seen.add(key);
				mapped.push({
					...matched,
					habitId: habit.id,
					habitTitle: habit.title,
					_key: key
				});
			}
		}

		return mapped;
	});

	const habitsPageSize = $derived($appSettings.habitsPerPage);
	const insightsSlice = $derived(getHabitPageSlice(researchInsights, insightsPage, habitsPageSize));

	function toggleTips(key) {
		const next = new Set(expandedTips);
		if (next.has(key)) next.delete(key);
		else next.add(key);
		expandedTips = next;
	}

	async function loadHabits() {
		loading = true;
		error = '';
		try {
			const {
				data: { user },
				error: authError
			} = await supabase.auth.getUser();

			if (authError || !user) {
				error = 'Not authenticated';
				loading = false;
				return;
			}

			const { data, error: habitsError } = await supabase.from('Habit').select('id, title, description').eq('user_id', user.id);

			if (habitsError) {
				error = habitsError.message || 'Failed to load habits';
				loading = false;
				return;
			}

			habits = data || [];
			insightsPage = 0;
		} catch (e) {
			error = e?.message || 'Failed to load research insights';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadHabits();
	});
</script>

<div class="page-shell" class:page-shell--compact={$appSettings.compactLists}>
	<div class="page-container">
		<div class="page-header">
			<div>
				<p class="eyebrow">Research-backed habit insights</p>
				<h1>Insights</h1>
			</div>
		</div>
		<div class="page-content">
			{#if loading}
				<Card.Root class="surface-card border-0 shadow-none">
					<Card.Content class="pt-6">
						<p class="insight-body">Loading research insights...</p>
					</Card.Content>
				</Card.Root>
			{:else if error}
				<Card.Root class="surface-card border-0 shadow-none">
					<Card.Content class="pt-6">
						<p class="text-destructive text-sm">{error}</p>
					</Card.Content>
				</Card.Root>
			{:else if researchInsights.length === 0}
				<Card.Root class="surface-card border-0 shadow-none">
					<Card.Content class="pt-6">
						<p class="insight-body">
							Add habits related to sleep, exercise, mindfulness, nutrition, hydration, reading, social connection, screen time, or stretching to see research-linked insights.
						</p>
					</Card.Content>
				</Card.Root>
			{:else}
				<div class="insights-stack">
					{#each insightsSlice.items as item (item._key)}
						<Card.Root class="surface-card border-0 shadow-none">
							<Card.Content class="pt-6">
								<div class="insight-top-row">
									<div class="metric-chip metric">Habit: {item.habitTitle}</div>
									<a href="/app/habit/{item.habitId}" class="view-habit-link">View habit</a>
								</div>
								<h3 class="insight-title">{item.title}</h3>
								<p class="insight-body">{item.body}</p>
								<p class="source">
									Source:
									<a class="pop-link" href={item.sourceUrl} target="_blank" rel="noreferrer">
										{item.sourceTitle}
									</a>
								</p>

								{#if item.actionableTips?.length > 0}
									<button class="tips-toggle" onclick={() => toggleTips(item._key)}>
										<span>Actionable tips</span>
										<ChevronDown class="h-4 w-4 tips-chevron {expandedTips.has(item._key) ? 'expanded' : ''}" />
									</button>
									{#if expandedTips.has(item._key)}
										<ul class="tips-list">
											{#each item.actionableTips as tip}
												<li>{tip}</li>
											{/each}
										</ul>
									{/if}
								{/if}
							</Card.Content>
						</Card.Root>
					{/each}
				</div>
				<HabitPagination
					bind:page={insightsPage}
					totalItems={researchInsights.length}
					pageSize={habitsPageSize}
				/>
			{/if}
		</div>
		<p class="disclaimer">
			For education only. This is not medical advice.
		</p>
	</div>
</div>

<style>
	.page-shell {
		display: block;
	}

	.page-container {
		padding: 2rem;
		max-width: 860px;
		margin: 0;
	}

	.page-header {
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
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}

	.page-shell--compact .insights-stack {
		gap: 0.55rem;
	}

	.page-shell--compact .insight-title {
		margin-top: 0.35rem;
	}

	.page-shell--compact .insight-body {
		margin-top: 0.25rem;
	}

	.insights-stack {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}

	.insight-top-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.view-habit-link {
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--pop);
		text-decoration: none;
	}

	.view-habit-link:hover {
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.insight-title {
		font-size: 1.02rem;
		font-weight: 600;
		margin-top: 0.55rem;
	}

	.insight-body {
		font-size: 0.92rem;
		color: var(--ink-soft);
		margin-top: 0.4rem;
		max-width: 58ch;
	}

	.metric-chip {
		display: inline-flex;
		font-size: 0.76rem;
		padding: 0.2rem 0.45rem;
		border-radius: 999px;
		border: 1px solid var(--line-strong);
		color: var(--ink-soft);
	}

	.source {
		margin-top: 0.72rem;
		font-size: 0.86rem;
		color: var(--ink-soft);
	}

	.tips-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		margin-top: 0.7rem;
		padding: 0.3rem 0.5rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--ink-soft);
		background: transparent;
		border: 1px solid var(--line);
		border-radius: 6px;
		cursor: pointer;
		transition: color 120ms ease, border-color 120ms ease;
	}

	.tips-toggle:hover {
		color: var(--ink);
		border-color: var(--line-strong);
	}

	:global(.tips-chevron) {
		transition: transform 180ms ease;
	}

	:global(.tips-chevron.expanded) {
		transform: rotate(180deg);
	}

	.tips-list {
		margin-top: 0.5rem;
		padding-left: 1.2rem;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.tips-list li {
		font-size: 0.86rem;
		color: var(--ink-soft);
		line-height: 1.45;
	}

	.disclaimer {
		margin-top: 0.95rem;
		font-size: 0.76rem;
		color: var(--ink-soft);
	}

	@media (max-width: 768px) {
		.page-container {
			padding: 1rem;
		}
	}
</style>
