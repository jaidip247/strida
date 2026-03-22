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
			answer: 'Yes, Strida is available on both iOS and Android. You can sync your data across all your devices, so you can track your habits whether you\'re at home or on the go.'
		},
		{
			question: 'How do I cancel my subscription?',
			answer: 'You can cancel your subscription at any time from your account settings. There are no cancellation fees, and you\'ll continue to have access to Pro features until the end of your billing period.'
		},
		{
			question: 'Do you offer refunds?',
			answer: 'We offer a 30-day money-back guarantee for all paid plans. If you\'re not satisfied with Strida, contact our support team within 30 days of your purchase for a full refund.'
		}
	];

	function toggleFaq(index) {
		openFaq = openFaq === index ? null : index;
	}

	async function handleNewsletterSubmit(e) {
		e.preventDefault();
		isSubmitting = true;
		// Simulate API call
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

<!-- Navigation Header -->
<nav class="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
	<div class="container mx-auto px-4">
		<div class="flex h-16 items-center justify-between">
			<a href="/" class="text-2xl font-bold">Strida</a>
			<div class="flex items-center gap-4">
				<Button variant="ghost" href="/login" disabled={false}>Login</Button>
				<Button href="/register" disabled={false}>Get Started</Button>
			</div>
		</div>
	</div>
</nav>

<!-- Banner Section -->
<section class="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5 py-20 md:py-32">
	<div class="container mx-auto px-4">
		<div class="mx-auto max-w-4xl text-center">
			<div class="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-2 text-sm backdrop-blur-sm">
				<Zap class="h-4 w-4 text-primary" />
				<span class="text-muted-foreground">New: AI-powered habit insights</span>
			</div>
			<h1 class="mb-6 text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
				Build Better Habits,
				<span class="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
					One Day at a Time
				</span>
			</h1>
			<p class="mb-8 text-xl text-muted-foreground md:text-2xl">
				Strida helps you build lasting habits with smart tracking, personalized tips, and beautiful progress
				visualization.
			</p>
			<div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
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
	<div class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent"></div>
</section>

<!-- Features Section -->
<section id="features" class="py-20 md:py-32">
	<div class="container mx-auto px-4">
		<div class="mb-16 text-center">
			<h2 class="mb-4 text-4xl font-bold tracking-tight md:text-5xl">Everything You Need to Succeed</h2>
			<p class="mx-auto max-w-2xl text-lg text-muted-foreground">
				Strida provides all the tools and insights you need to build and maintain healthy habits.
			</p>
		</div>
		<div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
			{#each features as feature}
				{@const Icon = feature.icon}
				<Card.Root class="border-2 transition-all hover:border-primary/50 hover:shadow-lg">
					<Card.Content class="p-6">
						<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
							<Icon class="h-6 w-6 text-primary" />
						</div>
						<Card.Title class="mb-2">{feature.title}</Card.Title>
						<Card.Description class="text-muted-foreground">{feature.description}</Card.Description>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	</div>
</section>

<!-- Pricing Section -->
<section id="pricing" class="bg-muted/50 py-20 md:py-32">
	<div class="container mx-auto px-4">
		<div class="mb-16 text-center">
			<h2 class="mb-4 text-4xl font-bold tracking-tight md:text-5xl">Simple, Transparent Pricing</h2>
			<p class="mx-auto max-w-2xl text-lg text-muted-foreground">
				Choose the plan that works best for you. All plans include our core habit tracking features.
			</p>
		</div>
		<div class="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
			{#each pricingPlans as plan}
				<Card.Root
					class="relative border-2 transition-all hover:shadow-lg {plan.popular
						? 'border-primary shadow-lg'
						: ''}"
				>
					{#if plan.popular}
						<div
							class="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-sm font-medium text-primary-foreground"
						>
							Most Popular
						</div>
					{/if}
					<Card.Header class="pb-8 pt-6">
						<Card.Title class="text-2xl">{plan.name}</Card.Title>
						<div class="mt-4">
							<span class="text-4xl font-bold">{plan.price}</span>
							<span class="text-muted-foreground"> / {plan.period}</span>
						</div>
						<Card.Description class="mt-2">{plan.description}</Card.Description>
					</Card.Header>
					<Card.Content class="pb-6">
						<ul class="space-y-3">
							{#each plan.features as feature}
								<li class="flex items-start gap-2">
									<CheckCircle2 class="mt-0.5 h-5 w-5 shrink-0 text-primary" />
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

<!-- Newsletter CTA Section -->
<section class="py-20 md:py-32">
	<div class="container mx-auto px-4">
		<Card.Root class="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
			<Card.Content class="p-8 md:p-12">
				<div class="mx-auto max-w-2xl text-center">
					<h2 class="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
						Stay Updated with Habit-Building Tips
					</h2>
					<p class="mb-8 text-lg text-muted-foreground">
						Subscribe to our newsletter and get weekly tips, tricks, and insights to help you build better
						habits.
					</p>
					{#if submitted}
						<div class="rounded-lg bg-primary/10 p-4 text-primary">
							<CheckCircle2 class="mx-auto mb-2 h-8 w-8" />
							<p class="font-medium">Thanks for subscribing! Check your email for confirmation.</p>
						</div>
					{:else}
						<form onsubmit={handleNewsletterSubmit} class="flex flex-col gap-4 sm:flex-row">
							<Input
								type="email"
								placeholder="Enter your email"
								required
								class="flex-1"
								bind:value={email}
							/>
							<Button type="submit" disabled={isSubmitting || false} class="sm:w-auto">
								{#if isSubmitting}
									Subscribing...
								{:else}
									Subscribe
									<ArrowRight class="ml-2 h-4 w-4" />
								{/if}
							</Button>
						</form>
					{/if}
				</div>
			</Card.Content>
		</Card.Root>
	</div>
</section>

<!-- FAQ Section -->
<section id="faq" class="bg-muted/50 py-20 md:py-32">
	<div class="container mx-auto px-4">
		<div class="mb-16 text-center">
			<h2 class="mb-4 text-4xl font-bold tracking-tight md:text-5xl">Frequently Asked Questions</h2>
			<p class="mx-auto max-w-2xl text-lg text-muted-foreground">
				Everything you need to know about Strida and how it can help you build better habits.
			</p>
		</div>
		<div class="mx-auto max-w-3xl space-y-4">
			{#each faqs as faq, index}
				<Card.Root class="border-2">
					<Card.Header class="">
						<button
							type="button"
							class="w-full cursor-pointer select-none text-left"
							onclick={() => toggleFaq(index)}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									toggleFaq(index);
								}
							}}
						>
							<div class="flex items-center justify-between">
								<Card.Title class="text-left">{faq.question}</Card.Title>
								<ChevronDown
									class="h-5 w-5 shrink-0 transition-transform {openFaq === index
										? 'rotate-180'
										: ''}"
								/>
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

<!-- Final CTA Section -->
<section class="py-20 md:py-32">
	<div class="container mx-auto px-4">
		<div class="mx-auto max-w-3xl text-center">
			<h2 class="mb-6 text-4xl font-bold tracking-tight md:text-5xl">Ready to Build Better Habits?</h2>
			<p class="mb-8 text-xl text-muted-foreground">
				Join thousands of people who are already using Strida to transform their lives, one habit at a time.
			</p>
			<div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
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
