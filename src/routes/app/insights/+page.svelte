<script>
	import { onMount } from 'svelte';
	import { createClient } from '$lib/supabase/client';
	import * as Card from '$lib/components/ui/card/index.js';

	const supabase = createClient();
	let loading = $state(true);
	let error = $state('');
	let habits = $state([]);

	const researchCatalog = [
		{
			id: 'sleep',
			keywords: ['sleep', 'bed', 'night', 'wake', 'wakeup', 'rest'],
			title: 'Sleep regularity is linked to better health outcomes',
			body: 'Medical guidance consistently recommends enough nightly sleep and regular sleep timing for cardiometabolic and cognitive health.',
			sourceTitle: 'NHLBI: Sleep Deprivation and Deficiency',
			sourceUrl: 'https://www.nhlbi.nih.gov/health/sleep-deprivation'
		},
		{
			id: 'activity',
			keywords: ['walk', 'run', 'exercise', 'workout', 'cardio', 'steps', 'jog', 'gym'],
			title: 'Regular physical activity lowers disease risk',
			body: 'Even moderate, consistent activity improves cardiovascular and metabolic outcomes, and reduces all-cause mortality risk.',
			sourceTitle: 'WHO Fact Sheet: Physical Activity',
			sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/physical-activity'
		},
		{
			id: 'mindfulness',
			keywords: ['meditate', 'meditation', 'mindful', 'mindfulness', 'breath', 'breathing', 'journal'],
			title: 'Mindfulness practices may improve stress and sleep quality',
			body: 'Clinical research suggests mindfulness-based practices can help with stress-related symptoms and improve psychological well-being.',
			sourceTitle: 'NCCIH: Meditation and Mindfulness',
			sourceUrl: 'https://www.nccih.nih.gov/health/meditation-and-mindfulness-what-you-need-to-know'
		},
		{
			id: 'nutrition',
			keywords: ['protein', 'vegetable', 'meal', 'eat', 'diet', 'nutrition', 'fruit', 'sugar'],
			title: 'Consistent healthy eating patterns improve long-term outcomes',
			body: 'Nutrition research favors sustained dietary patterns (not short bursts) for reducing chronic disease risk over time.',
			sourceTitle: 'WHO: Healthy Diet',
			sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet'
		},
		{
			id: 'alcohol_tobacco',
			keywords: ['alcohol', 'drink', 'smoke', 'smoking', 'cigarette', 'vape', 'nicotine'],
			title: 'Reducing alcohol and tobacco exposure has strong health benefits',
			body: 'Evidence supports risk reduction from limiting alcohol use and stopping tobacco exposure, including cardiovascular and cancer risk benefits.',
			sourceTitle: 'CDC: About Alcohol Use / Tobacco',
			sourceUrl: 'https://www.cdc.gov/alcohol/about-alcohol-use/index.html'
		}
	];

	function inferResearchForHabit(habit) {
		const text = `${habit?.title || ''} ${habit?.description || ''}`.toLowerCase();
		return researchCatalog.find((item) => item.keywords.some((keyword) => text.includes(keyword)));
	}

	const researchInsights = $derived.by(() => {
		const seen = new Set();
		const mapped = [];

		for (const habit of habits) {
			const matched = inferResearchForHabit(habit);
			if (!matched) continue;
			const key = `${habit.id}:${matched.id}`;
			if (seen.has(key)) continue;
			seen.add(key);
			mapped.push({
				...matched,
				habitTitle: habit.title
			});
		}

		return mapped;
	});

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

<div class="page-shell">
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
						<p class="text-red-600 text-sm">{error}</p>
					</Card.Content>
				</Card.Root>
			{:else if researchInsights.length === 0}
				<Card.Root class="surface-card border-0 shadow-none">
					<Card.Content class="pt-6">
						<p class="insight-body">
							Add habits like sleep, exercise, mindfulness, or nutrition to get research-linked insights.
						</p>
					</Card.Content>
				</Card.Root>
			{:else}
				{#each researchInsights as item}
					<Card.Root class="surface-card border-0 shadow-none">
						<Card.Content class="pt-6">
							<div class="metric-chip metric">Habit: {item.habitTitle}</div>
							<h3 class="insight-title">{item.title}</h3>
							<p class="insight-body">{item.body}</p>
							<p class="source">
								Source:
								<a class="pop-link" href={item.sourceUrl} target="_blank" rel="noreferrer">
									{item.sourceTitle}
								</a>
							</p>
						</Card.Content>
					</Card.Root>
				{/each}
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
		display: grid;
		gap: 0.8rem;
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







