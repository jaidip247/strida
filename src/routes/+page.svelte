<script>
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import {
		CheckCircle2,
		Target,
		TrendingUp,
		Sparkles,
		Calendar,
		BarChart3,
		Users,
		Zap,
		ArrowRight,
		ChevronDown
	} from '@lucide/svelte';

	let email = $state('');
	let isSubmitting = $state(false);
	let submitted = $state(false);
	let openFaq = $state(null);

	const features = [
		{
			icon: Target,
			title: 'Track Your Habits',
			description: 'Easily track your daily habits with our intuitive interface. Set goals and monitor your progress over time.'
		},
		{
			icon: TrendingUp,
			title: 'Visual Progress',
			description: 'See your progress with beautiful charts and statistics. Understand your patterns and celebrate your wins.'
		},
		{
			icon: Sparkles,
			title: 'Smart Tips & Tricks',
			description: 'Get personalized tips and tricks to help you stick to your habits. Learn from experts and build lasting routines.'
		},
		{
			icon: Calendar,
			title: 'Flexible Scheduling',
			description: 'Set custom schedules for your habits. Daily, weekly, or custom intervals - whatever works for you.'
		},
		{
			icon: BarChart3,
			title: 'Detailed Analytics',
			description: 'Dive deep into your habit data. Understand your streaks, success rates, and areas for improvement.'
		},
		{
			icon: Users,
			title: 'Community Support',
			description: 'Join a community of habit builders. Share your journey and get inspired by others.'
		}
	];

	const pricingPlans = [
		{
			name: 'Free',
			price: '$0',
			period: 'forever',
			description: 'Perfect for getting started',
			features: [
				'Track up to 5 habits',
				'Basic progress tracking',
				'Weekly tips & tricks',
				'Mobile app access',
				'Community support'
			],
			cta: 'Get Started',
			popular: false
		},
		{
			name: 'Pro',
			price: '$9.99',
			period: 'per month',
			description: 'For serious habit builders',
			features: [
				'Unlimited habits',
				'Advanced analytics',
				'Daily personalized tips',
				'Priority support',
				'Export your data',
				'Custom reminders',
				'Streak recovery'
			],
			cta: 'Start Free Trial',
			popular: true
		},
		{
			name: 'Team',
			price: '$29.99',
			period: 'per month',
			description: 'For teams and groups',
			features: [
				'Everything in Pro',
				'Team collaboration',
				'Shared habit challenges',
				'Team analytics',
				'Admin dashboard',
				'Custom branding',
				'API access'
			],
			cta: 'Contact Sales',
			popular: false
		}
	];

	const faqs = [
		{
			question: 'How does Strida help me build habits?',
			answer: 'Strida provides a comprehensive platform to track your habits, monitor your progress, and receive personalized tips and tricks. Our app uses proven behavioral science principles to help you build lasting habits through consistent tracking, visual feedback, and smart reminders.'
		},
		{
			question: 'What kind of tips and tricks do you provide?',
			answer: 'We provide personalized tips based on your habit patterns, success rates, and goals. These include strategies for overcoming common obstacles, motivation techniques, habit stacking ideas, and evidence-based methods from behavioral psychology to help you maintain consistency.'
		},
		{
			question: 'Can I use Strida for multiple habits?',
			answer: 'Yes! The free plan allows you to track up to 5 habits, while Pro and Team plans offer unlimited habit tracking. You can organize habits by category, set different schedules, and track them all in one place.'
		},
		{
			question: 'Is there a mobile app?',
			answer: "Yes, Strida is available on both iOS and Android. You can sync your data across all your devices, so you can track your habits whether you're at home or on the go."
		},
		{
			question: 'How do I cancel my subscription?',
			answer: "You can cancel your subscription at any time from your account settings. There are no cancellation fees, and you'll continue to have access to Pro features until the end of your billing period."
		},
		{
			question: 'Do you offer refunds?',
			answer: "We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied with Strida, contact our support team within 30 days of your purchase for a full refund."
		}
	];

	function toggleFaq(index) {
		openFaq = openFaq === index ? null : index;
	}

	async function handleNewsletterSubmit(e) {
		e.preventDefault();
		isSubmitting = true;
		await new Promise((resolve) => setTimeout(resolve, 1000));
		submitted = true;
		isSubmitting = false;
		email = '';
		setTimeout(() => {
			submitted = false;
		}, 3000);
	}
</script>

<svelte:head>
	<title>Strida - Build Better Habits, One Day at a Time</title>
	<meta name="description" content="Strida helps you build lasting habits with smart tracking, personalized tips, and beautiful progress visualization." />
</svelte:head>

<div class="landing-ambient" aria-hidden="true"></div>

<nav class="topbar">
	<div class="landing-container bar-inner">
		<a href="/" class="brand">Strida</a>
		<div class="actions">
			<Button variant="ghost" href="/login" disabled={false}>Login</Button>
			<Button href="/register" disabled={false}>Get Started</Button>
		</div>
	</div>
</nav>

<section class="landing-section hero-section">
	<div class="landing-container hero-card surface-card">
		<div class="hero-content">
			<div class="hero-pill">
				<Zap class="h-4 w-4" />
				<span>New: AI-powered habit insights</span>
			</div>
			<h1>
				Build Better Habits,
				<span>One Day at a Time</span>
			</h1>
			<p>
				Strida helps you build lasting habits with smart tracking, personalized tips, and beautiful progress
				visualization.
			</p>
			<div class="hero-actions">
				<Button size="lg" class="w-full sm:w-auto" href="/register" disabled={false}>
					Get Started Free
					<ArrowRight class="ml-2 h-4 w-4" />
				</Button>
				<Button variant="outline" size="lg" class="w-full sm:w-auto" href="/login" disabled={false}>
					Login
				</Button>
			</div>
		</div>
	</div>
</section>

<section id="features" class="landing-section">
	<div class="landing-container">
		<div class="section-header">
			<h2>Everything You Need to Succeed</h2>
			<p>
				Strida provides all the tools and insights you need to build and maintain healthy habits.
			</p>
		</div>
		<div class="grid-cards feature-grid">
			{#each features as feature}
				{@const Icon = feature.icon}
				<Card.Root class="surface-card border-0 shadow-none">
					<Card.Content class="p-6">
						<div class="icon-wrap">
							<Icon class="h-5 w-5" />
						</div>
						<Card.Title class="mb-2">{feature.title}</Card.Title>
						<Card.Description>{feature.description}</Card.Description>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	</div>
</section>

<section id="pricing" class="landing-section alt-surface">
	<div class="landing-container">
		<div class="section-header">
			<h2>Simple, Transparent Pricing</h2>
			<p>
				Choose the plan that works best for you. All plans include our core habit tracking features.
			</p>
		</div>
		<div class="grid-cards pricing-grid">
			{#each pricingPlans as plan}
				<Card.Root class="surface-card border-0 shadow-none {plan.popular ? 'popular' : ''}">
					{#if plan.popular}
						<div class="popular-tag">Most Popular</div>
					{/if}
					<Card.Header class="pb-8 pt-6">
						<Card.Title class="text-2xl">{plan.name}</Card.Title>
						<div class="mt-4">
							<span class="text-4xl font-bold metric">{plan.price}</span>
							<span class="price-period"> / {plan.period}</span>
						</div>
						<Card.Description class="mt-2">{plan.description}</Card.Description>
					</Card.Header>
					<Card.Content class="pb-6">
						<ul class="space-y-3">
							{#each plan.features as feature}
								<li class="feature-item">
									<CheckCircle2 class="mt-0.5 h-5 w-5 shrink-0" />
									<span class="text-sm">{feature}</span>
								</li>
							{/each}
						</ul>
					</Card.Content>
					<Card.Footer class="pt-6">
						<Button
							variant={plan.popular ? 'default' : 'outline'}
							class="w-full"
							href={plan.name === 'Team' ? undefined : '/register'}
							disabled={false}
						>
							{plan.cta}
						</Button>
					</Card.Footer>
				</Card.Root>
			{/each}
		</div>
	</div>
</section>

<section class="landing-section">
	<div class="landing-container">
		<Card.Root class="surface-card border-0 shadow-none newsletter">
			<Card.Content class="p-8 md:p-12">
				<div class="section-header compact">
					<h2>Stay Updated with Habit-Building Tips</h2>
					<p>
						Subscribe to our newsletter and get weekly tips, tricks, and insights to help you build better
						habits.
					</p>
				</div>
				{#if submitted}
					<div class="subscribe-success">
						<CheckCircle2 class="mx-auto mb-2 h-8 w-8" />
						<p class="font-medium">Thanks for subscribing! Check your email for confirmation.</p>
					</div>
				{:else}
					<form onsubmit={handleNewsletterSubmit} class="subscribe-form">
						<div class="subscribe-field-wrap">
							<label for="newsletter-email" class="subscribe-label">Email address</label>
							<div class="subscribe-input-row">
								<Input
									id="newsletter-email"
									type="email"
									placeholder="you@example.com"
									required
									class="newsletter-input flex-1"
									bind:value={email}
								/>
								<Button type="submit" disabled={isSubmitting || false} class="newsletter-submit sm:w-auto">
									{#if isSubmitting}
										Subscribing...
									{:else}
										Get Weekly Tips
										<ArrowRight class="ml-2 h-4 w-4" />
									{/if}
								</Button>
							</div>
							<p class="subscribe-meta">One practical email each week. No spam. Unsubscribe anytime.</p>
						</div>
					</form>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</section>

<section id="faq" class="landing-section alt-surface">
	<div class="landing-container">
		<div class="section-header">
			<h2>Frequently Asked Questions</h2>
			<p>
				Everything you need to know about Strida and how it can help you build better habits.
			</p>
		</div>
		<div class="faq-list">
			{#each faqs as faq, index}
				<Card.Root class="surface-card border-0 shadow-none">
					<Card.Header class="">
						<button
							type="button"
							class="faq-trigger"
							onclick={() => toggleFaq(index)}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									toggleFaq(index);
								}
							}}
						>
							<div class="faq-row">
								<Card.Title class="text-left">{faq.question}</Card.Title>
								<ChevronDown class="h-5 w-5 shrink-0 transition-transform {openFaq === index ? 'rotate-180' : ''}" />
							</div>
						</button>
					</Card.Header>
					{#if openFaq === index}
						<Card.Content class="pt-0">
							<p class="text-muted-foreground">{faq.answer}</p>
						</Card.Content>
					{/if}
				</Card.Root>
			{/each}
		</div>
	</div>
</section>

<section class="landing-section">
	<div class="landing-container">
		<div class="final-cta">
			<h2>Ready to Build Better Habits?</h2>
			<p>
				Join thousands of people who are already using Strida to transform their lives, one habit at a time.
			</p>
			<div class="hero-actions">
				<Button size="lg" class="w-full sm:w-auto" href="/register" disabled={false}>
					Start Your Free Trial
					<ArrowRight class="ml-2 h-4 w-4" />
				</Button>
				<Button variant="outline" size="lg" class="w-full sm:w-auto" href="/login" disabled={false}>
					Already have an account? Login
				</Button>
			</div>
		</div>
	</div>
</section>

<style>
	.landing-ambient {
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: -1;
		background:
			radial-gradient(85% 70% at 12% 16%, color-mix(in srgb, var(--pop) 10%, transparent 90%) 0%, transparent 60%),
			radial-gradient(75% 72% at 88% 82%, color-mix(in srgb, #ffffff 86%, var(--pop) 14%) 0%, transparent 58%),
			linear-gradient(120deg, #f7f7f4 0%, #faf8f2 45%, #f7f7f4 100%);
		background-size: 170% 170%, 190% 190%, 130% 130%;
		animation: ambientShift 70s ease-in-out infinite alternate;
	}

	.topbar {
		position: sticky;
		top: 0;
		z-index: 30;
		background: color-mix(in srgb, var(--paper) 88%, white 12%);
		border-bottom: 1px solid var(--line-strong);
		backdrop-filter: blur(6px);
	}

	.landing-container {
		max-width: 1100px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	.bar-inner {
		height: 64px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.brand {
		font-size: 1.35rem;
		font-weight: 700;
		letter-spacing: -0.03em;
	}

	.actions {
		display: flex;
		gap: 0.55rem;
	}

	.landing-section {
		padding: 3.5rem 0;
	}

	.hero-section {
		padding-top: 2.2rem;
	}

	.hero-card {
		overflow: hidden;
	}

	.hero-content {
		padding: 2.3rem;
	}

	.hero-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		border: 1px solid color-mix(in srgb, var(--pop) 28%, var(--line-strong) 72%);
		border-radius: 999px;
		padding: 0.34rem 0.7rem;
		font-size: 0.78rem;
		color: var(--ink-soft);
		background: color-mix(in srgb, var(--pop-soft) 48%, #ffffff 52%);
	}

	.hero-content h1 {
		margin-top: 1rem;
		font-size: clamp(2.2rem, 5.5vw, 4.4rem);
		line-height: 1.03;
		letter-spacing: -0.04em;
		font-weight: 700;
	}

	.hero-content h1 span {
		display: block;
		color: var(--ink-soft);
	}

	.hero-content p {
		max-width: 62ch;
		margin-top: 1rem;
		color: var(--ink-soft);
		font-size: 1.06rem;
	}

	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.7rem;
		margin-top: 1.3rem;
	}

	.section-header {
		text-align: center;
		margin-bottom: 2.2rem;
	}

	.section-header h2 {
		font-size: clamp(1.8rem, 4vw, 3rem);
		line-height: 1.08;
		letter-spacing: -0.03em;
		font-weight: 680;
	}

	.section-header p {
		max-width: 70ch;
		margin: 0.9rem auto 0;
		color: var(--ink-soft);
	}

	.grid-cards {
		display: grid;
		gap: 0.85rem;
	}

	.feature-grid {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	.pricing-grid {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	.alt-surface {
		background: color-mix(in srgb, var(--paper) 76%, white 24%);
		border-top: 1px solid var(--line);
		border-bottom: 1px solid var(--line);
	}

	.icon-wrap {
		height: 2.25rem;
		width: 2.25rem;
		border: 1px solid var(--line-strong);
		border-radius: 0.65rem;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 0.9rem;
		color: var(--ink-soft);
		background: white;
	}

	.popular-tag {
		position: absolute;
		top: -0.62rem;
		left: 50%;
		transform: translateX(-50%);
		background: var(--pop);
		color: #fff;
		border-radius: 999px;
		padding: 0.17rem 0.55rem;
		font-size: 0.72rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.price-period {
		color: var(--ink-soft);
	}

	.feature-item {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		color: var(--ink-soft);
	}

	.feature-item :global(svg) {
		color: var(--ink);
	}

	.section-header.compact {
		margin-bottom: 1.2rem;
	}

	.subscribe-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.subscribe-field-wrap {
		max-width: 720px;
		margin: 0 auto;
		width: 100%;
	}

	.subscribe-label {
		display: block;
		font-size: 0.84rem;
		font-weight: 600;
		color: var(--ink-soft);
		margin-bottom: 0.38rem;
	}

	.subscribe-input-row {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.55rem;
		align-items: center;
	}

	:global(.newsletter-input) {
		height: 3.15rem;
		border-radius: 0.65rem;
		border-width: 2px;
		border-color: #ceccc5;
		background: #fff;
		padding-left: 0.95rem;
		padding-right: 0.95rem;
		font-size: 0.96rem;
		font-weight: 520;
		color: #1d1d1d;
		box-shadow: none;
	}

	:global(.newsletter-input::placeholder) {
		color: #8f8f8f;
	}

	:global(.newsletter-input:focus-visible) {
		border-color: #adaca5;
		box-shadow: 0 0 0 2px rgba(173, 172, 165, 0.18);
	}

	:global(.newsletter-submit) {
		height: 3.15rem;
		border-radius: 0.65rem;
		padding-left: 1.2rem;
		padding-right: 1.2rem;
		font-weight: 600;
	}

	.subscribe-meta {
		margin-top: 0.44rem;
		font-size: 0.78rem;
		color: var(--ink-soft);
	}

	.subscribe-success {
		border: 1px solid var(--line-strong);
		border-radius: 12px;
		padding: 1rem;
		color: var(--ink);
		background: white;
	}

	.faq-list {
		max-width: 760px;
		margin: 0 auto;
		display: grid;
		gap: 0.7rem;
	}

	.faq-trigger {
		width: 100%;
		text-align: left;
		background: transparent;
		border: 0;
		cursor: pointer;
	}

	.faq-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.8rem;
	}

	.final-cta {
		text-align: center;
		max-width: 780px;
		margin: 0 auto;
	}

	.final-cta h2 {
		font-size: clamp(1.8rem, 4.3vw, 3.3rem);
		line-height: 1.08;
		letter-spacing: -0.035em;
		font-weight: 680;
	}

	.final-cta p {
		margin-top: 0.8rem;
		color: var(--ink-soft);
	}

	.final-cta .hero-actions {
		justify-content: center;
	}

	@media (max-width: 900px) {
		.feature-grid,
		.pricing-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 768px) {
		.hero-card {
			grid-template-columns: 1fr;
		}

		.hero-content {
			padding: 1.15rem;
		}

		.feature-grid,
		.pricing-grid {
			grid-template-columns: 1fr;
		}

		.actions {
			gap: 0.35rem;
		}

		:global(.subscribe-form) {
			flex-direction: row;
			flex-wrap: wrap;
		}

		.subscribe-input-row {
			grid-template-columns: 1fr;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.landing-ambient {
			animation: none;
		}
	}

	@keyframes ambientShift {
		0% {
			background-position: 0% 0%, 100% 100%, 50% 50%;
		}
		50% {
			background-position: 10% 8%, 88% 90%, 56% 45%;
		}
		100% {
			background-position: 18% 16%, 82% 84%, 60% 40%;
		}
	}
</style>
