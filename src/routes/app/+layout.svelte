<script>
	import { browser } from '$app/environment';
	import {
		Bell,
		Brain,
		Calendar,
		BarChart,
		ChevronsLeft,
		ChevronsRight,
		Plus,
		Settings,
		User
	} from '@lucide/svelte';
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	import { appSettings, patchAppSettings } from '$lib/stores/app-settings.js';
	import { unreadCount } from '$lib/stores/notifications.js';

	let { data, children } = $props();

	const navItems = [
		{ href: '/app', icon: Calendar, label: 'Today', exact: true },
		{ href: '/app/add', icon: Plus, label: 'Add Habit' },
		{ href: '/app/progress', icon: BarChart, label: 'Progress' },
		{ href: '/app/insights', icon: Brain, label: 'Insights' },
		{ href: '/app/notifications', icon: Bell, label: 'Notifications', notify: true, mobileShort: 'Alerts' },
		{ href: '/app/settings', icon: Settings, label: 'Settings' }
	];

	const mobileNavItems = [
		...navItems,
		{ href: '/app/profile', icon: User, label: 'Profile' }
	];

	const user = $derived(data.session?.user);
	const sidebarEmail = $derived(user?.email ?? '');
	const sidebarName = $derived(
		user?.user_metadata?.full_name ||
			user?.user_metadata?.name ||
			sidebarEmail?.split('@')[0] ||
			'Account'
	);
	const sidebarAvatar = $derived(
		user?.user_metadata?.avatar_url || user?.user_metadata?.picture || ''
	);
	const sidebarInitial = $derived(
		sidebarName.trim().charAt(0).toUpperCase() || '?'
	);

	function toggleSidebarCollapsed() {
		patchAppSettings({ sidebarCollapsed: !get(appSettings).sidebarCollapsed });
	}

	$effect(() => {
		if (!browser) return;
		const unsub = appSettings.subscribe((s) => {
			document.documentElement.classList.toggle('strida-reduce-motion', s.reduceMotion);
		});
		return unsub;
	});
</script>

<div
	class="app-layout"
	class:sidebar-collapsed={$appSettings.sidebarCollapsed}
	class:strida-layout-no-motion={$appSettings.reduceMotion}
	style:--sidebar-w={$appSettings.sidebarCollapsed ? '72px' : '240px'}
>
	<aside class="sidebar-desktop" aria-label="App navigation">
		<div class="sidebar-desktop-inner">
			<div class="sidebar-header">
				<div class="brand">
					{#if $appSettings.sidebarCollapsed}
						<div class="wordmark-compact" title="Strida">S</div>
					{:else}
						<div class="wordmark">Strida</div>
						<p>One mark at a time.</p>
					{/if}
				</div>
				<button
					type="button"
					class="sidebar-collapse-btn"
					onclick={toggleSidebarCollapsed}
					aria-label={$appSettings.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
				>
					{#if $appSettings.sidebarCollapsed}
						<ChevronsRight size={18} aria-hidden="true" />
					{:else}
						<ChevronsLeft size={18} aria-hidden="true" />
					{/if}
				</button>
			</div>

			<div class="sidebar-section">
				<nav class="desktop-nav" aria-label="Primary">
					{#each navItems as item}
						{@const Icon = item.icon}
						{@const isActive = item.exact
							? $page.url.pathname === item.href
							: $page.url.pathname.startsWith(item.href)}
						{@const showBadge = item.notify && $unreadCount > 0}
						<a
							href={item.href}
							class="nav-link"
							class:active={isActive}
							class:nav-link--collapsed={$appSettings.sidebarCollapsed}
							title={$appSettings.sidebarCollapsed ? item.label : undefined}
						>
							<span class="nav-link-main">
								<span class="nav-icon-wrap">
									<Icon size={18} />
									{#if showBadge && $appSettings.sidebarCollapsed}
										<span class="nav-dot" aria-label="{$unreadCount} unread"></span>
									{/if}
								</span>
								{#if !$appSettings.sidebarCollapsed}
									<span class="nav-label">{item.label}</span>
								{/if}
							</span>
							{#if showBadge && !$appSettings.sidebarCollapsed}
								<span class="nav-badge">{$unreadCount > 99 ? '99+' : $unreadCount}</span>
							{/if}
						</a>
					{/each}
				</nav>
			</div>

			<div class="sidebar-section sidebar-section--footer">
				<a
					href="/app/profile"
					class="user-block"
					class:user-block--collapsed={$appSettings.sidebarCollapsed}
					class:active={$page.url.pathname.startsWith('/app/profile')}
					title={$appSettings.sidebarCollapsed ? 'Profile' : undefined}
				>
					{#if sidebarAvatar}
						<img src={sidebarAvatar} alt="" class="user-avatar-img" />
					{:else}
						<div class="user-avatar-fallback">{sidebarInitial}</div>
					{/if}
					{#if !$appSettings.sidebarCollapsed}
						<div class="user-text">
							<span class="user-name">{sidebarName}</span>
							<span class="user-email">{sidebarEmail}</span>
						</div>
					{/if}
				</a>
			</div>
		</div>
	</aside>

	<main class="main-content">
		{@render children?.()}
	</main>

	<nav class="sidebar-mobile" aria-label="Mobile navigation">
		{#each mobileNavItems as item}
			{@const Icon = item.icon}
			{@const isActive = item.exact
				? $page.url.pathname === item.href
				: $page.url.pathname.startsWith(item.href)}
			{@const showBadge = item.notify && $unreadCount > 0}
			<a href={item.href} class="nav-button" class:active={isActive}>
				<span class="nav-button-icon-wrap">
					<Icon size={18} />
					{#if showBadge}
						<span class="nav-button-dot" aria-label="{$unreadCount} unread"></span>
					{/if}
				</span>
				<span>{item.mobileShort ?? item.label.split(' ')[0]}</span>
			</a>
		{/each}
	</nav>
</div>

<style>
	.app-layout {
		--sidebar-inset: 12px;
		--sidebar-gap: 12px;
		min-height: 100vh;
		background: var(--paper);
	}

	.sidebar-desktop {
		position: fixed;
		top: var(--sidebar-inset);
		left: var(--sidebar-inset);
		z-index: 20;
		width: var(--sidebar-w, 240px);
		height: calc(100vh - 2 * var(--sidebar-inset));
		max-height: calc(100vh - 2 * var(--sidebar-inset));
		overflow: hidden;
		border: 1px solid var(--line);
		border-radius: 14px;
		background: var(--paper-elevated);
		box-shadow: var(--paper-shadow);
	}

	.app-layout:not(.strida-layout-no-motion) .sidebar-desktop {
		transition: width 220ms var(--ease-settle);
	}

	.sidebar-desktop-inner {
		height: 100%;
		max-height: 100%;
		padding: 0.85rem 0.65rem;
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		overflow-x: hidden;
		overflow-y: hidden;
		min-width: 0;
		box-sizing: border-box;
	}

	.sidebar-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.35rem;
		flex-shrink: 0;
	}

	.brand {
		min-width: 0;
		flex: 1;
	}

	.brand .wordmark {
		font-size: 1.15rem;
		font-weight: 700;
		letter-spacing: -0.025em;
		color: var(--pop);
	}

	.brand p {
		margin-top: 0.12rem;
		font-size: 0.7rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-soft);
	}

	.wordmark-compact {
		width: 36px;
		height: 36px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1rem;
		font-weight: 700;
		color: var(--primary-foreground);
		background: var(--pop);
		margin: 0 auto;
	}

	.sidebar-collapsed .brand {
		display: flex;
		justify-content: center;
		width: 100%;
	}

	.sidebar-collapse-btn {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 34px;
		height: 34px;
		padding: 0;
		border-radius: 8px;
		border: 1px solid var(--line);
		background: color-mix(in srgb, var(--paper) 70%, var(--paper-elevated) 30%);
		color: var(--ink-soft);
		cursor: pointer;
		transition:
			background 140ms ease,
			color 140ms ease,
			border-color 140ms ease;
	}

	.sidebar-collapse-btn:hover {
		color: var(--ink);
		background: var(--paper-elevated);
		border-color: var(--line-strong);
	}

	.sidebar-collapsed .sidebar-header {
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		min-width: 0;
	}

	.sidebar-collapsed .sidebar-collapse-btn {
		margin: 0 auto;
	}

	.sidebar-section {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		min-height: 0;
	}

	.sidebar-section--footer {
		flex-shrink: 0;
		margin-top: auto;
		padding-top: 0.45rem;
		border-top: 1px solid var(--line);
	}

	.desktop-nav {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		flex: 1;
		min-height: 0;
		min-width: 0;
		overflow-x: hidden;
		overflow-y: auto;
		align-content: start;
	}

	.user-block {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		padding: 0.5rem 0.5rem;
		border-radius: 9px;
		border: 1px solid transparent;
		text-decoration: none;
		color: inherit;
		transition: 140ms ease;
	}

	.user-block--collapsed {
		justify-content: center;
		padding: 0.45rem;
	}

	.user-block:hover {
		background: color-mix(in srgb, var(--paper) 40%, var(--paper-elevated) 60%);
		border-color: var(--line);
	}

	.user-block.active {
		border-color: color-mix(in srgb, var(--pop) 35%, var(--line-strong) 65%);
		background: color-mix(in srgb, var(--pop-soft) 45%, var(--paper-elevated) 55%);
	}

	.user-avatar-img {
		width: 40px;
		height: 40px;
		border-radius: 999px;
		object-fit: cover;
		flex-shrink: 0;
		border: 1px solid var(--line);
	}

	.user-avatar-fallback {
		width: 40px;
		height: 40px;
		border-radius: 999px;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--ink);
		background: color-mix(in srgb, var(--pop-soft) 55%, var(--paper-elevated) 45%);
		border: 1px solid var(--line);
	}

	.user-text {
		display: flex;
		flex-direction: column;
		gap: 0.08rem;
		min-width: 0;
	}

	.user-name {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--ink);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.user-email {
		font-size: 0.68rem;
		color: var(--ink-soft);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.nav-link {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.35rem;
		padding: 0.5rem 0.55rem;
		border-radius: 9px;
		border: 1px solid transparent;
		text-decoration: none;
		color: var(--ink-soft);
		transition: 140ms ease;
	}

	.nav-link-main {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-width: 0;
	}

	.nav-icon-wrap {
		position: relative;
		display: inline-flex;
		flex-shrink: 0;
		width: 18px;
		height: 18px;
		align-items: center;
		justify-content: center;
	}

	.nav-link--collapsed {
		justify-content: center;
		padding: 0.5rem 0.45rem;
		min-width: 0;
	}

	.nav-link--collapsed .nav-link-main {
		justify-content: center;
		flex-shrink: 0;
	}

	.nav-label {
		font-size: 0.84rem;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.nav-badge {
		flex-shrink: 0;
		min-width: 1.25rem;
		height: 1.25rem;
		padding: 0 0.35rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 0.65rem;
		font-weight: 600;
		color: var(--ink);
		background: color-mix(in srgb, var(--line) 85%, var(--paper-elevated) 15%);
		border-radius: 999px;
	}

	.nav-dot {
		position: absolute;
		top: 0;
		right: 0;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--pop);
		box-shadow: 0 0 0 2px var(--paper-elevated);
		pointer-events: none;
	}

	.nav-link:hover {
		color: var(--ink);
		background: color-mix(in srgb, var(--paper) 35%, var(--paper-elevated) 65%);
		border-color: var(--line);
	}

	.nav-link.active {
		color: var(--pop);
		border-color: color-mix(in srgb, var(--pop) 35%, var(--line-strong) 65%);
		background: color-mix(in srgb, var(--pop-soft) 45%, var(--paper-elevated) 55%);
	}

	.nav-link.active :global(svg) {
		color: var(--pop);
	}

	.main-content {
		margin-left: calc(var(--sidebar-inset) + var(--sidebar-w, 240px) + var(--sidebar-gap));
		padding-bottom: 88px;
		min-height: 100vh;
		box-sizing: border-box;
	}

	.app-layout:not(.strida-layout-no-motion) .main-content {
		transition: margin-left 220ms var(--ease-settle);
	}

	.sidebar-mobile {
		display: none;
	}

	@media (max-width: 768px) {
		.app-layout {
			background: var(--paper);
		}

		.sidebar-desktop {
			display: none;
		}

		.main-content {
			margin-left: 0;
			padding-bottom: 76px;
		}

		.sidebar-mobile {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			display: flex;
			align-items: stretch;
			justify-content: flex-start;
			gap: 0.15rem;
			overflow-x: auto;
			-webkit-overflow-scrolling: touch;
			scrollbar-width: none;
			background: var(--paper-elevated);
			border-top: 1px solid var(--line-strong);
			padding: 0.3rem 0.4rem;
			z-index: 10;
		}

		.sidebar-mobile::-webkit-scrollbar {
			display: none;
		}

		.nav-button {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 0.08rem;
			font-size: 0.62rem;
			padding: 0.22rem 0.28rem;
			min-width: 2.5rem;
			flex: 1 0 auto;
			color: var(--ink-soft);
			text-decoration: none;
			border-radius: 8px;
			border: 1px solid transparent;
			background: transparent;
		}

		.nav-button-icon-wrap {
			position: relative;
			display: inline-flex;
		}

		.nav-button-dot {
			position: absolute;
			top: -3px;
			right: -5px;
			width: 7px;
			height: 7px;
			border-radius: 50%;
			background: var(--pop);
			box-shadow: 0 0 0 2px var(--paper-elevated);
		}

		.nav-button.active {
			color: var(--pop);
			border-color: color-mix(in srgb, var(--pop) 35%, var(--line) 65%);
		}
	}
</style>
