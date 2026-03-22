<!-- Shared layout for all app routes with sidebar navigation -->
<script>
	import { Calendar, Plus, BarChart, Brain, User, LogOut } from "@lucide/svelte";
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import { createClient } from "$lib/supabase/client";
	
	const navItems = [
		{ href: "/app", icon: Calendar, label: "Today", exact: true },
		{ href: "/app/add", icon: Plus, label: "Add Habit" },
		{ href: "/app/progress", icon: BarChart, label: "Progress" },
		{ href: "/app/insights", icon: Brain, label: "Insights" },
		{ href: "/app/profile", icon: User, label: "Profile" }
	];

	const supabase = createClient();
	let loggingOut = false;

	async function handleLogout() {
		loggingOut = true;
		await supabase.auth.signOut();
		await goto("/login");
		loggingOut = false;
	}
</script>

<div class="app-layout">
	<div class="sidebar sidebar-desktop">
		<nav class="desktop-nav">
			{#each navItems as item}
				{@const Icon = item.icon}
				{@const isActive = item.exact ? $page.url.pathname === item.href : $page.url.pathname.startsWith(item.href)}
				<a href={item.href} class="nav-link" class:active={isActive}>
					<Icon size={20} />
					<span>{item.label}</span>
				</a>
			{/each}
		</nav>
		<div class="desktop-logout">
			<button class="logout-button" onclick={handleLogout} disabled={loggingOut}>
				<LogOut size={18} />
				<span>{loggingOut ? "Logging out..." : "Log out"}</span>
			</button>
		</div>
	</div>

	<div class="main-content">
		<slot />
	</div>

	<div class="sidebar sidebar-mobile">
		{#each navItems  as item}
			{@const Icon = item.icon}
			{@const isActive = $page.url.pathname.startsWith(item.href)}
			<a href={item.href} class="nav-button" class:active={isActive}>
				<Icon size={20} />
				<span>{item.label.split(' ')[0]}</span>
			</a>
		{/each}
		<button class="nav-button" onclick={handleLogout} disabled={loggingOut}>
			<LogOut size={20} />
			<span>{loggingOut ? "..." : "Logout"}</span>
		</button>
	</div>
</div>

<style>
	.app-layout {
		min-height: 100vh;
		display: flex;
	}

	.sidebar {
		width: 100%;
		padding: 0.4rem;
	}

	.sidebar-desktop {
		width: 200px;
		height: 100vh;
		position: fixed;
		left: 0;
		top: 0;
		background-color: #fff;
		border-right: 1px solid #e0e0e0;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.desktop-nav {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem 0.5rem;
	}

	.desktop-logout {
		padding: 1rem 0.5rem;
		border-top: 1px solid #e0e0e0;
	}

	.logout-button {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.75rem 1rem;
		background: none;
		border: none;
		border-radius: 0.5rem;
		color: #666;
		cursor: pointer;
		transition: all 0.2s;
	}

	.logout-button:hover:enabled {
		background-color: #f9f9f9;
		color: #000;
	}

	.logout-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.nav-link {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		color: #666;
		text-decoration: none;
		border-radius: 0.5rem;
		transition: all 0.2s;
	}

	.nav-link:hover {
		background-color: #f9f9f9;
		color: #000;
	}

	.nav-link.active {
		background-color: #f5f5f5;
		color: #000;
		font-weight: 500;
	}

	.main-content {
		flex: 1;
		margin-left: 200px;
		padding-bottom: 80px; /* Space for mobile bottom bar */
	}

	.sidebar-mobile {  
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		align-items: center;
		justify-content: space-around;
		background-color: #fff;
		border-top: 1px solid #e0e0e0;
		z-index: 1000;
		width: 100%;
	}

	.nav-button {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem;
		background: none;
		border: none;
		cursor: pointer;
		color: #666;
		text-decoration: none;
		transition: color 0.2s;
	}

	.nav-button:hover {
		color: #000;
	}

	.nav-button.active {
		color: #000;
	}

	.nav-button span {
		font-size: 0.75rem;
	}

	@media screen and (max-width: 768px) {
		.sidebar-desktop {
			display: none;
		}

		.main-content {
			margin-left: 0;
		}

		.sidebar-mobile {
			display: flex;
		}
	}

	@media screen and (min-width: 769px) {
		.sidebar-mobile {
			display: none;
		}
	}
</style>




