<script>
	import './landing-marketing.css';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import {
		CheckCircle2,
		Target,
		TrendingUp,
		Sparkles,
		Calendar,
		BarChart3,
		Users,
		ArrowRight,
		ChevronDown,
		Repeat,
		Bell,
		ShieldCheck
	} from '@lucide/svelte';

	let email = $state('');
	let isSubmitting = $state(false);
	let submitted = $state(false);
	let openFaq = $state(null);

	let demoCadence = $state('daily');
	let demoReminders = $state(true);
	let demoHabitName = $state('Morning walk');
	let demoConfirm = $state(true);

	const features = [
		{
			icon: Target,
			title: 'Track Your Habits',
			description:
				'Easily track your daily habits with our intuitive interface. Set goals and monitor your progress over time.'
		},
		{
			icon: TrendingUp,
			title: 'Visual Progress',
			description:
				'See your progress with beautiful charts and statistics. Understand your patterns and celebrate your wins.'
		},
		{
			icon: Sparkles,
			title: 'Smart Tips & Tricks',
			description:
				'Get personalized tips and tricks to help you stick to your habits. Learn from experts and build lasting routines.'
		},
		{
			icon: Calendar,
			title: 'Flexible Scheduling',
			description:
				'Set custom schedules for your habits. Daily, weekly, or custom intervals - whatever works for you.'
		},
		{
			icon: BarChart3,
			title: 'Detailed Analytics',
			description:
				'Dive deep into your habit data. Understand your streaks, success rates, and areas for improvement.'
		},
		{
			icon: Users,
			title: 'Community Support',
			description:
				'Join a community of habit builders. Share your journey and get inspired by others.'
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
			popular: false,
			href: '/register'
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
			popular: true,
			href: '/register'
		}
	];

	const faqs = [
		{
			question: 'How does Strida help me build habits?',
			answer:
				'Strida provides a comprehensive platform to track your habits, monitor your progress, and receive personalized tips and tricks. Our app uses proven behavioral science principles to help you build lasting habits through consistent tracking, visual feedback, and smart reminders.'
		},
		{
			question: 'What kind of tips and tricks do you provide?',
			answer:
				'We provide personalized tips based on your habit patterns, success rates, and goals. These include strategies for overcoming common obstacles, motivation techniques, habit stacking ideas, and evidence-based methods from behavioral psychology to help you maintain consistency.'
		},
		{
			question: 'Can I use Strida for multiple habits?',
			answer:
				'Yes! The free plan allows you to track up to 5 habits, while Pro offers unlimited habit tracking. You can organize habits by category, set different schedules, and track them all in one place.'
		},
		{
			question: 'Is there a mobile app?',
			answer:
				"Yes, Strida is available on both iOS and Android. You can sync your data across all your devices, so you can track your habits whether you're at home or on the go."
		},
		{
			question: 'How do I cancel my subscription?',
			answer:
				"You can cancel your subscription at any time from your account settings. There are no cancellation fees, and you'll continue to have access to Pro features until the end of your billing period."
		},
		{
			question: 'Do you offer refunds?',
			answer:
				"We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied with Strida, contact our support team within 30 days of your purchase for a full refund."
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
	<title>Strida — Build better habits, one day at a time</title>
	<meta
		name="description"
		content="Strida helps you build lasting habits with smart tracking, personalized tips, and beautiful progress visualization."
	/>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="landing-page">
	<header class="lp-nav">
		<div class="lp-container lp-nav-inner">
			<a href="/" class="lp-brand">Strida</a>
			<nav class="lp-nav-links" aria-label="Primary">
				<a href="#features">Features</a>
				<a href="#pricing">Pricing</a>
				<a href="#faq">Help</a>
			</nav>
			<nav class="lp-nav-links-mobile" aria-label="Primary mobile">
				<a href="#features">Features</a>
				<a href="#pricing">Pricing</a>
				<a href="#faq">Help</a>
			</nav>
			<div class="lp-nav-actions">
				<a href="/login" class="lp-btn-pill lp-btn-pill--ghost">Login</a>
				<a href="/register" class="lp-btn-pill lp-btn-pill--dark">Sign up for free</a>
			</div>
		</div>
	</header>

	<main id="main-content">
		<section class="lp-hero" aria-labelledby="hero-heading">
			<div class="lp-hero-floats" aria-hidden="true">
				<img class="lp-float lp-float--1" src="/landing/hero-float-1.svg" alt="" />
				<img class="lp-float lp-float--2" src="/landing/hero-float-2.svg" alt="" />
				<img class="lp-float lp-float--3" src="/landing/hero-float-3.svg" alt="" />
				<img class="lp-float lp-float--4" src="/landing/hero-float-1.svg" alt="" />
				<img class="lp-float lp-float--5" src="/landing/hero-float-2.svg" alt="" />
				<img class="lp-float lp-float--6" src="/landing/hero-float-3.svg" alt="" />
				<img class="lp-float lp-float--7" src="/landing/hero-float-1.svg" alt="" />
				<img class="lp-float lp-float--8" src="/landing/hero-float-3.svg" alt="" />
			</div>
			<div class="lp-container">
				<div class="lp-hero-inner">
					<h1 id="hero-heading">Show up every day.</h1>
					<p class="lp-hero-lead">
						A calm habit system for people who want progress without the pressure. Track, reflect, and
						keep going.
					</p>
					<div class="lp-hero-cta">
						<a href="/register" class="lp-btn-pill lp-btn-pill--dark">
							Become the first to know
							<ArrowRight class="h-4 w-4" aria-hidden="true" />
						</a>
					</div>
				</div>
			</div>
		</section>

		<section class="lp-logos" aria-label="Trusted by teams">
			<div class="lp-container">
				<div class="lp-logos-row">
					<img src="/landing/logo-1.svg" alt="" />
					<img src="/landing/logo-2.svg" alt="" />
					<img src="/landing/logo-3.svg" alt="" />
					<img src="/landing/logo-4.svg" alt="" />
					<img src="/landing/logo-5.svg" alt="" />
					<img src="/landing/logo-6.svg" alt="" />
				</div>
			</div>
		</section>

		<section class="lp-value">
			<div class="lp-container">
				<div class="lp-value-head">
					<h2>We help you stay consistent—clearer, kinder, and easier than a spreadsheet.</h2>
					<p>
						See today’s habits, your streaks, and what’s next. Built for real life: missed days, travel,
						and busy weeks.
					</p>
				</div>
				<div class="lp-preview-wrap">
					<div class="lp-mock lp-mock--back" aria-hidden="true">
						<img src="/landing/mockup-a.svg" alt="" />
					</div>
					<div class="lp-mock lp-mock--front" aria-hidden="true">
						<img src="/landing/mockup-b.svg" alt="" />
					</div>
					<div class="lp-sticky">Don’t break the chain! — you’ve got this</div>
				</div>
			</div>
		</section>

		<section id="features" class="lp-section lp-section--muted">
			<div class="lp-container">
				<div class="lp-section-head">
					<h2>Everything you need to keep momentum</h2>
					<p>Tracking, insights, and gentle structure—without turning life into a dashboard.</p>
				</div>
				<div class="lp-feature-grid">
					{#each features as feature}
						{@const Icon = feature.icon}
						<div class="lp-demo-cell">
							<div class="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-600">
								<Icon class="h-4 w-4" aria-hidden="true" />
							</div>
							<div>
								<h3 class="text-base font-semibold text-neutral-950">{feature.title}</h3>
								<p class="mt-1 text-sm leading-relaxed text-neutral-600">{feature.description}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<section id="pricing" class="lp-section">
			<div class="lp-container">
				<div class="lp-section-head">
					<h2>With simple pricing</h2>
					<p>Start free. Upgrade when you want deeper analytics and unlimited habits.</p>
				</div>
				<div class="lp-pricing-grid">
					{#each pricingPlans as plan}
						<div
							class="lp-price-card {plan.popular ? 'lp-price-card--popular' : ''}"
						>
							<h3 class="text-lg font-semibold text-neutral-950">{plan.name}</h3>
							<p class="mt-1 text-sm text-neutral-600">{plan.description}</p>
							<div class="mt-4">
								<span class="lp-price-tag">{plan.price}</span>
								<span class="lp-price-period"> / {plan.period}</span>
							</div>
							<ul class="lp-price-features">
								{#each plan.features as item}
									<li>
										<CheckCircle2 class="mt-0.5 h-5 w-5 shrink-0 text-neutral-800" aria-hidden="true" />
										<span>{item}</span>
									</li>
								{/each}
							</ul>
							<a
								href={plan.href}
								class="lp-btn-pill lp-btn-pill--dark w-full text-center"
							>
								{plan.cta}
							</a>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<section class="lp-section lp-section--muted" aria-labelledby="flex-heading">
			<div class="lp-container">
				<div class="lp-section-head">
					<h2 id="flex-heading">What makes Strida flexible?</h2>
					<p>
						You decide how often a habit counts, how you get nudged, and what “done” means—so the app
						adapts to travel, shift work, or low-energy weeks instead of punishing them.
					</p>
				</div>
				<ul class="lp-flex-points" aria-label="How flexibility shows up in the app">
					<li>
						<span class="lp-flex-point-icon" aria-hidden="true"><Repeat class="h-5 w-5" /></span>
						<div>
							<strong>Schedule that matches reality</strong>
							<span>Daily, weekdays-only, or weekly—repeat rules live on each habit, not in a rigid template.</span>
						</div>
					</li>
					<li>
						<span class="lp-flex-point-icon" aria-hidden="true"><Bell class="h-5 w-5" /></span>
						<div>
							<strong>Reminders on your terms</strong>
							<span>Turn pushes on or off per habit so you get signal without notification fatigue.</span>
						</div>
					</li>
					<li>
						<span class="lp-flex-point-icon" aria-hidden="true"><ShieldCheck class="h-5 w-5" /></span>
						<div>
							<strong>Intentional completions</strong>
							<span>Optional confirmation catches accidental taps—useful for habits you want to log mindfully.</span>
						</div>
					</li>
				</ul>
				<p class="lp-flex-demo-caption">Try the same controls you’ll use after sign-up:</p>
				<div class="lp-demo-grid">
					<div class="lp-demo-cell">
						<span class="lp-demo-label">Cadence</span>
						<p class="lp-demo-hint">How often this habit should appear on your list.</p>
						<Label for="lp-demo-select" class="sr-only">Repeat</Label>
						<Select.Root type="single" bind:value={demoCadence}>
							<Select.Trigger id="lp-demo-select" class="w-full max-w-none justify-between">
								<span data-slot="select-value">
									{demoCadence === 'daily'
										? 'Every day'
										: demoCadence === 'weekdays'
											? 'Weekdays'
											: 'Weekly'}
								</span>
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="daily" label="Every day">Every day</Select.Item>
								<Select.Item value="weekdays" label="Weekdays">Weekdays</Select.Item>
								<Select.Item value="weekly" label="Weekly">Weekly</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
					<div class="lp-demo-cell">
						<span class="lp-demo-label">Reminders</span>
						<p class="lp-demo-hint">Gentle nudges when you want them—not a firehose.</p>
						<div class="flex flex-1 items-center justify-between gap-2">
							<span class="text-sm text-neutral-700">Push notifications</span>
							<Switch bind:checked={demoReminders} aria-label="Toggle reminders demo" />
						</div>
					</div>
					<div class="lp-demo-cell">
						<span class="lp-demo-label">Habit name</span>
						<p class="lp-demo-hint">Name it so your future self knows exactly what to do.</p>
						<Input bind:value={demoHabitName} placeholder="e.g. Read 10 pages" class="w-full" />
					</div>
					<div class="lp-demo-cell">
						<span class="lp-demo-label">Safety</span>
						<p class="lp-demo-hint">Extra tap so a streak isn’t broken by mistake.</p>
						<div class="flex flex-1 items-center gap-2 pt-1">
							<Checkbox id="lp-demo-confirm" bind:checked={demoConfirm} />
							<Label for="lp-demo-confirm" class="text-sm font-normal text-neutral-700">
								Confirm before completing
							</Label>
						</div>
					</div>
				</div>
				<div class="mt-10 text-center">
					<a href="/register" class="lp-btn-pill lp-btn-pill--dark inline-flex">
						Get started
						<ArrowRight class="h-4 w-4" aria-hidden="true" />
					</a>
				</div>
			</div>
		</section>

		<section class="lp-section">
			<div class="lp-container">
				<div class="lp-section-head">
					<h2>Stay in the loop</h2>
					<p>One practical note on habits when we have something worth sharing. No spam.</p>
				</div>
				<div class="lp-newsletter">
					{#if submitted}
						<div class="flex flex-col items-center gap-2 py-4 text-center">
							<CheckCircle2 class="h-10 w-10 text-emerald-600" aria-hidden="true" />
							<p class="font-medium text-neutral-900">Thanks! We’ll be in touch.</p>
						</div>
					{:else}
						<form class="lp-newsletter-form" onsubmit={handleNewsletterSubmit}>
							<label for="newsletter-email" class="text-sm font-medium text-neutral-700"
								>Email</label
							>
							<div class="lp-newsletter-row">
								<Input
									id="newsletter-email"
									type="email"
									placeholder="you@example.com"
									required
									class="min-h-11 flex-1"
									bind:value={email}
								/>
								<Button type="submit" class="rounded-full px-6" disabled={isSubmitting}>
									{isSubmitting ? 'Sending…' : 'Subscribe'}
								</Button>
							</div>
						</form>
					{/if}
				</div>
			</div>
		</section>

		<section id="faq" class="lp-section lp-section--muted">
			<div class="lp-container">
				<div class="lp-section-head">
					<h2>Frequently asked questions</h2>
					<p>Quick answers about Strida and how we handle your data and subscription.</p>
				</div>
				<div class="lp-faq-list">
					{#each faqs as faq, index}
						<div class="lp-faq-item">
							<button
								type="button"
								class="lp-faq-trigger"
								aria-expanded={openFaq === index}
								onclick={() => toggleFaq(index)}
							>
								<span>{faq.question}</span>
								<ChevronDown
									class="h-5 w-5 shrink-0 transition-transform {openFaq === index
										? 'rotate-180'
										: ''}"
									aria-hidden="true"
								/>
							</button>
							{#if openFaq === index}
								<div class="lp-faq-body">
									{faq.answer}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</section>

		<section class="lp-quote" aria-labelledby="quote-heading">
			<div class="lp-container">
				<div class="lp-quote-inner">
					<div>
						<h2 id="quote-heading" class="lp-quote-text">
							When you make it easy to show up, the small wins stack faster than you expect.
						</h2>
						<p class="lp-quote-sub">
							Strida is for anyone who’s tired of all-or-nothing streaks—and wants a system that still
							feels human.
						</p>
						<div class="lp-quote-cta">
							<a href="/register" class="lp-btn-pill lp-btn-pill--light">Join now</a>
						</div>
					</div>
					<div class="lp-quote-img">
						<img src="/landing/letter.svg" alt="" />
					</div>
				</div>
			</div>
		</section>
	</main>

	<footer class="lp-footer">
		<div class="lp-container">
			<div class="lp-footer-grid">
				<div>
					<div class="lp-footer-brand">Strida</div>
					<p class="mt-3 max-w-xs text-sm leading-relaxed text-emerald-100/90">
						One mark at a time. Build habits that fit your life.
					</p>
				</div>
				<div class="lp-footer-col">
					<h3>Company</h3>
					<ul>
						<li><a href="/">About</a></li>
						<li><a href="#faq">Careers</a></li>
						<li><a href="#faq">Contact</a></li>
					</ul>
				</div>
				<div class="lp-footer-col">
					<h3>Product</h3>
					<ul>
						<li><a href="#features">Features</a></li>
						<li><a href="#pricing">Pricing</a></li>
						<li><a href="/login">Login</a></li>
						<li><a href="/register">Sign up</a></li>
					</ul>
				</div>
				<div class="lp-footer-col">
					<h3>Social</h3>
					<ul>
						<li><a href="https://twitter.com" rel="noopener noreferrer">Twitter</a></li>
						<li><a href="https://github.com" rel="noopener noreferrer">GitHub</a></li>
					</ul>
				</div>
			</div>
			<div class="lp-footer-bottom">
				© {new Date().getFullYear()} Strida. All rights reserved.
			</div>
		</div>
	</footer>
</div>
