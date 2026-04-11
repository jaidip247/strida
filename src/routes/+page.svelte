<script>
	import './landing-marketing.css';
	/* eslint-disable svelte/no-navigation-without-resolve */
	import {
		CheckCircle2,
		ArrowRight,
		Brain,
		HeartHandshake,
		RefreshCcw,
		Shield,
		Sparkles,
		Stethoscope,
		Sunrise,
		Bell,
		TrendingUp,
		ChevronDown,
		MoonStar
	} from '@lucide/svelte';

	let openFaq = $state(null);

	const painPoints = [
		{
			title: 'All-or-nothing streak pressure',
			body: 'Missing one day can make you feel like you failed — even when you’re doing better than before.'
		},
		{
			title: 'No guidance when life happens',
			body: 'Travel, sickness, long work weeks… most trackers don’t help you adjust — they just log the miss.'
		},
		{
			title: 'You don’t know what to do next',
			body: 'A list of habits isn’t a plan. Coaching is about turning “I should” into a doable next step.'
		}
	];

	const coachingLoop = [
		{
			icon: HeartHandshake,
			title: 'Make it gentle',
			body: 'Define the smallest version that still counts. If you can do it on a bad day, it’s sustainable.'
		},
		{
			icon: RefreshCcw,
			title: 'Track reality (not perfection)',
			body: 'Done, skip, or sick — so your plan stays honest and your streak doesn’t become a guilt trap.'
		},
		{
			icon: Brain,
			title: 'Learn patterns and adjust',
			body: 'Strida surfaces what’s working and what isn’t — then nudges you toward the next best action.'
		}
	];

	const principles = [
		{
			icon: Shield,
			title: 'Evidence-based structure',
			body: 'The flow is built around behavior change research — clarity, consistency, and feedback loops.'
		},
		{
			icon: Sparkles,
			title: 'Motivation without the hype',
			body: 'Coaching should feel calm and practical — not like a productivity sermon.'
		},
		{
			icon: TrendingUp,
			title: 'Progress you can see',
			body: 'Wins, misses, and rest days all teach you something. Strida helps you notice and adapt.'
		}
	];

	const insightExamples = [
		{
			title: 'Pattern',
			body: 'You’re most consistent on days you start before 10am.',
			icon: Sunrise
		},
		{
			title: 'Nudge',
			body: 'Tonight: 2 habits are still open. Want a smaller “minimum” for low-energy days?',
			icon: Bell
		},
		{
			title: 'Adjustment',
			body: 'Your habit fails most after late nights. Try a shorter version on those days.',
			icon: MoonStar
		}
	];

	const pricingPlans = [
		{
			name: 'Free',
			price: '$0',
			period: 'forever',
			description: 'Start gently and build consistency',
			features: ['Up to 2 habits', 'Today view + basic progress', 'Reminders', 'Web + Android app'],
			cta: 'Start free',
			popular: false,
			href: '/register'
		},
		{
			name: 'Pro',
			price: '$9.99',
			period: 'per month',
			description: 'Deeper insights and flexible programs',
			features: [
				'Unlimited habits',
				'Full insights + analytics',
				'Custom habit durations',
				'Export your data',
				'Reminders'
			],
			cta: 'Upgrade to Pro',
			popular: true,
			href: '/register'
		}
	];

	const faqs = [
		{
			question: 'What happens when I miss a day?',
			answer:
				'Strida is designed for restarts. Instead of treating a miss like failure, you can log a skip or sick day so your habit plan stays realistic and you keep momentum.'
		},
		{
			question: 'What is skip / sick mode?',
			answer:
				'If you can’t do a habit because of sickness or life constraints, you can mark it as skipped/sick for the day. The point is to reduce mental load and stop “perfect streaks” from becoming pressure.'
		},
		{
			question: 'How do AI insights work?',
			answer:
				'Strida looks for patterns in your check-ins (like time-of-day consistency or common failure windows) and turns them into practical suggestions and gentle nudges. It’s there to help you adjust — not to judge you.'
		},
		{
			question: 'Is Strida therapy?',
			answer:
				'No. Strida provides educational, behavior-focused guidance and tools. It is not medical advice, diagnosis, or treatment.'
		},
		{
			question: 'Will I get spammed with notifications?',
			answer:
				'No. Reminders are designed to be calm and useful: a morning habit list and an end-of-day “what’s still open” reminder, with optional nudges you can control.'
		},
		{
			question: 'Is there a mobile app?',
			answer:
				'Yes. Your account works on the web and in the Android app (built with Capacitor).'
		}
	];

	function toggleFaq(index) {
		openFaq = openFaq === index ? null : index;
	}
</script>

<svelte:head>
	<title>Strida — a gentle habit coach</title>
	<meta
		name="description"
		content="Strida is a gentle habit coach: evidence-based guidance, flexible skip/sick days, and AI insights that help you restart without guilt."
	/>
</svelte:head>

<div class="landing-page">
	<header class="lp-nav">
		<div class="lp-container lp-nav-inner">
			<a href="/" class="lp-brand">Strida</a>
			<nav class="lp-nav-links" aria-label="Primary">
				<a href="#how">How it works</a>
				<a href="#science">Science</a>
				<a href="#ai">AI insights</a>
				<a href="#pricing">Pricing</a>
				<a href="#faq">Help</a>
			</nav>
			<div class="lp-nav-actions">
				<a href="/login" class="lp-btn-pill lp-btn-pill--ghost">Login</a>
				<a href="/register" class="lp-btn-pill lp-btn-pill--dark">
					<span class="lp-nav-cta-full">Sign up for free</span>
					<span class="lp-nav-cta-short">Sign up</span>
				</a>
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
					<p class="lp-eyebrow">A habit coach for real life</p>
					<h1 id="hero-heading">Restart without guilt.</h1>
					<p class="lp-hero-lead">
						Strida helps you build better habits with evidence-based structure, flexible skip/sick days,
						and AI insights that turn “I should” into a doable next step.
					</p>
					<div class="lp-hero-cta">
						<a href="/register" class="lp-btn-pill lp-btn-pill--dark">
							Sign up free
							<ArrowRight class="h-4 w-4" aria-hidden="true" />
						</a>
						<a href="#how" class="lp-btn-pill lp-btn-pill--ghost">See how it works</a>
					</div>
					<ul class="lp-hero-badges" aria-label="What you get">
						<li><CheckCircle2 class="h-4 w-4" aria-hidden="true" /> Skip/sick days reduce pressure</li>
						<li><CheckCircle2 class="h-4 w-4" aria-hidden="true" /> Daily reminders that help (not spam)</li>
						<li><CheckCircle2 class="h-4 w-4" aria-hidden="true" /> Coaching loop built on research</li>
					</ul>
				</div>
			</div>
		</section>

		<section class="lp-value" aria-labelledby="value-heading">
			<div class="lp-container">
				<div class="lp-value-head">
					<h2 id="value-heading">Most habit apps track. Strida coaches.</h2>
					<p>
						If you’re tired of streak pressure, Strida helps you restart gently and build a system that
						holds up on low-energy days — not just your best days.
					</p>
				</div>
				<div class="lp-cards-3" aria-label="Common pain points">
					{#each painPoints as item (item.title)}
						<div class="lp-card">
							<h3>{item.title}</h3>
							<p>{item.body}</p>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<section id="how" class="lp-section lp-section--muted" aria-labelledby="how-heading">
			<div class="lp-container">
				<div class="lp-section-head">
					<h2 id="how-heading">How Strida coaches your habit</h2>
					<p>A simple loop that makes consistency easier to repeat.</p>
				</div>
				<div class="lp-feature-grid">
					{#each coachingLoop as step (step.title)}
						{@const Icon = step.icon}
						<div class="lp-demo-cell lp-demo-cell--coach">
							<div class="lp-icon-badge" aria-hidden="true">
								<Icon class="h-4 w-4" />
							</div>
							<div>
								<h3 class="text-base font-semibold">{step.title}</h3>
								<p class="mt-1 text-sm leading-relaxed">{step.body}</p>
							</div>
						</div>
					{/each}
				</div>
				<div class="lp-section-cta">
					<a href="/register" class="lp-btn-pill lp-btn-pill--dark inline-flex">
						Start with one habit
						<ArrowRight class="h-4 w-4" aria-hidden="true" />
					</a>
				</div>
			</div>
		</section>

		<section id="science" class="lp-section" aria-labelledby="science-heading">
			<div class="lp-container">
				<div class="lp-section-head">
					<h2 id="science-heading">Built on proven behavior science</h2>
					<p>Structure, feedback loops, and compassion — without overpromising.</p>
				</div>
				<div class="lp-feature-grid lp-feature-grid--two">
					{#each principles as p (p.title)}
						{@const Icon = p.icon}
						<div class="lp-demo-cell lp-demo-cell--coach">
							<div class="lp-icon-badge" aria-hidden="true">
								<Icon class="h-4 w-4" />
							</div>
							<div>
								<h3 class="text-base font-semibold">{p.title}</h3>
								<p class="mt-1 text-sm leading-relaxed">{p.body}</p>
							</div>
						</div>
					{/each}
				</div>
				<p class="lp-disclaimer" role="note">
					<Stethoscope class="h-4 w-4" aria-hidden="true" />
					<span>Strida provides educational guidance — not medical advice, diagnosis, or treatment.</span>
				</p>
			</div>
		</section>

		<section id="ai" class="lp-section lp-section--muted" aria-labelledby="ai-heading">
			<div class="lp-container">
				<div class="lp-section-head">
					<h2 id="ai-heading">AI insights that feel human</h2>
					<p>
						Your data tells a story. Strida’s behavior analysis engine finds patterns and suggests
						adjustments — so you can keep going even when motivation dips.
					</p>
				</div>
				<div class="lp-insight-grid" aria-label="Example insights">
					{#each insightExamples as ex (ex.title)}
						{@const Icon = ex.icon}
						<div class="lp-insight-card">
							<div class="lp-insight-top">
								<span class="lp-insight-chip">{ex.title}</span>
								<span class="lp-insight-icon" aria-hidden="true"><Icon class="h-4 w-4" /></span>
							</div>
							<p class="lp-insight-body">{ex.body}</p>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<section class="lp-section" aria-labelledby="skip-heading">
			<div class="lp-container">
				<div class="lp-section-head">
					<h2 id="skip-heading">Skip / sick mode lowers the mental load</h2>
					<p>Because building habits shouldn’t punish you for being human.</p>
				</div>
				<div class="lp-skip-grid">
					<div class="lp-skip-card">
						<div class="lp-icon-badge" aria-hidden="true"><Stethoscope class="h-4 w-4" /></div>
						<h3>Sick happens</h3>
						<p>Mark it sick, reduce pressure, and resume when you’re better — without spiraling.</p>
					</div>
					<div class="lp-skip-card">
						<div class="lp-icon-badge" aria-hidden="true"><RefreshCcw class="h-4 w-4" /></div>
						<h3>Skips are information</h3>
						<p>Skips show you friction. Strida helps you adjust the habit to fit your life.</p>
					</div>
					<div class="lp-skip-card">
						<div class="lp-icon-badge" aria-hidden="true"><HeartHandshake class="h-4 w-4" /></div>
						<h3>Consistency over perfection</h3>
						<p>A plan you can restart is the plan you can keep.</p>
					</div>
				</div>
			</div>
		</section>

		<section class="lp-section lp-section--muted" aria-labelledby="reminders-heading">
			<div class="lp-container">
				<div class="lp-section-head">
					<h2 id="reminders-heading">Reminders that help you follow through</h2>
					<p>Two calm touchpoints, plus optional nudges — on your terms.</p>
				</div>
				<div class="lp-reminder-grid">
					<div class="lp-reminder-card">
						<div class="lp-reminder-title">
							<Sunrise class="h-4 w-4" aria-hidden="true" />
							<span>Morning digest</span>
						</div>
						<p>Start the day with a simple list of what you’re tracking today.</p>
					</div>
					<div class="lp-reminder-card">
						<div class="lp-reminder-title">
							<Bell class="h-4 w-4" aria-hidden="true" />
							<span>End-of-day pending</span>
						</div>
						<p>Before your day ends, get a reminder of habits still not marked done.</p>
					</div>
				</div>
			</div>
		</section>

		<section id="pricing" class="lp-section" aria-labelledby="pricing-heading">
			<div class="lp-container">
				<div class="lp-section-head">
					<h2 id="pricing-heading">Simple pricing</h2>
					<p>Start free. Upgrade when you want deeper analytics and unlimited habits.</p>
				</div>
				<div class="lp-pricing-grid">
					{#each pricingPlans as plan (plan.name)}
						<div class="lp-price-card {plan.popular ? 'lp-price-card--popular' : ''}">
							<h3 class="text-lg font-semibold">{plan.name}</h3>
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
							<a href={plan.href} class="lp-btn-pill lp-btn-pill--dark w-full text-center">
								{plan.cta}
							</a>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<section id="faq" class="lp-section lp-section--muted">
			<div class="lp-container">
				<div class="lp-section-head">
					<h2>Frequently asked questions</h2>
					<p>Quick answers about coaching, reminders, and flexibility.</p>
				</div>
				<div class="lp-faq-list">
					{#each faqs as faq, index (faq.question)}
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
							When you make restarting easy, consistency follows.
						</h2>
						<p class="lp-quote-sub">
							Start with one habit. Make it doable. Track reality. Adjust with insight — and keep going.
						</p>
						<div class="lp-quote-cta">
							<a href="/register" class="lp-btn-pill lp-btn-pill--light">Start free</a>
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
						<li><a href="#how">How it works</a></li>
						<li><a href="#ai">AI insights</a></li>
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
