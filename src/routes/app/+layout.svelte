<script>
	import { Calendar, Plus, BarChart, Brain, User, LogOut } from '@lucide/svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { createClient } from '$lib/supabase/client';

	const navItems = [
		{ href: '/app', icon: Calendar, label: 'Today', exact: true },
		{ href: '/app/add', icon: Plus, label: 'Add Habit' },
		{ href: '/app/progress', icon: BarChart, label: 'Progress' },
		{ href: '/app/insights', icon: Brain, label: 'Insights' },
		{ href: '/app/profile', icon: User, label: 'Profile' }
	];

	const supabase = createClient();
	let loggingOut = false;

	async function handleLogout() {
		loggingOut = true;
		await supabase.auth.signOut();
		await goto('/login');
		loggingOut = false;
	}
</script>

<div class="app-layout">
	<aside class="sidebar-desktop">
		<div class="brand">
			<div class="wordmark">Strida</div>
			<p>One mark at a time.</p>
		</div>
		<nav class="desktop-nav">
			{#each navItems as item}
				{@const Icon = item.icon}
				{@const isActive = item.exact ? $page.url.pathname === item.href : $page.url.pathname.startsWith(item.href)}
				<a href={item.href} class="nav-link" class:active={isActive}>
					<Icon size={18} />
					<span>{item.label}</span>
				</a>
			{/each}
		</nav>
		<button class="logout-button" onclick={handleLogout} disabled={loggingOut}>
			<LogOut size={18} />
			<span>{loggingOut ? 'Logging out...' : 'Log out'}</span>
		</button>
	</aside>

	<main class="main-content">
		<slot />
	</main>

	<nav class="sidebar-mobile">
		{#each navItems as item}
			{@const Icon = item.icon}
			{@const isActive = item.exact ? $page.url.pathname === item.href : $page.url.pathname.startsWith(item.href)}
			<a href={item.href} class="nav-button" class:active={isActive}>
				<Icon size={18} />
				<span>{item.label.split(' ')[0]}</span>
			</a>
		{/each}
		<button class="nav-button" onclick={handleLogout} disabled={loggingOut}>
			<LogOut size={18} />
			<span>Out</span>
		</button>
	</nav>
</div>

<style>
	.app-layout {
		min-height: 100vh;
		display: grid;
		grid-template-columns: 220px 1fr;
		background: var(--paper);
	}

	.sidebar-desktop {
		border-right: 1px solid var(--line-strong);
		padding: 1rem 0.7rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		background: var(--paper);
	}

	.brand .wordmark {
		font-size: 1.2rem;
		font-weight: 700;
		letter-spacing: -0.025em;
		color: var(--ink);
	}

	.brand p {
		margin-top: 0.15rem;
		font-size: 0.76rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-soft);
	}

	.desktop-nav {
		display: grid;
		gap: 0.3rem;
	}

	.nav-link,
	.logout-button {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		padding: 0.58rem 0.7rem;
		border-radius: 9px;
		border: 1px solid transparent;
		text-decoration: none;
		color: var(--ink-soft);
		transition: 140ms ease;
	}

	.nav-link:hover,
	.logout-button:hover:enabled {
		color: var(--ink);
		background: rgba(255, 255, 255, 0.55);
		border-color: var(--line);
	}

	.nav-link.active {
		color: var(--pop);
		border-color: color-mix(in srgb, var(--pop) 35%, var(--line-strong) 65%);
		background: color-mix(in srgb, var(--pop-soft) 45%, var(--paper-elevated) 55%);
	}

	.logout-button {
		margin-top: auto;
		background: none;
		width: 100%;
		cursor: pointer;
	}

	.logout-button:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.main-content {
		padding-bottom: 88px;
	}

	.sidebar-mobile {
		display: none;
	}

	@media (max-width: 768px) {
		.app-layout {
			display: block;
		}

		.sidebar-desktop {
			display: none;
		}

		.main-content {
			padding-bottom: 76px;
		}

		.sidebar-mobile {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			display: flex;
			align-items: center;
			justify-content: space-around;
			background: var(--paper-elevated);
			border-top: 1px solid var(--line-strong);
			padding: 0.35rem;
			z-index: 10;
		}

		.nav-button {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 0.12rem;
			font-size: 0.72rem;
			padding: 0.28rem 0.45rem;
			color: var(--ink-soft);
			text-decoration: none;
			border-radius: 8px;
			border: 1px solid transparent;
			background: transparent;
		}

		.nav-button.active {
			color: var(--pop);
			border-color: color-mix(in srgb, var(--pop) 35%, var(--line) 65%);
		}
	}
</style>




