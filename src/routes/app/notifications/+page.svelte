<script>
	import { Bell, CheckCheck } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { markAllRead, markRead, notifications } from '$lib/stores/notifications.js';

	/** @param {string} iso */
	function formatDate(iso) {
		try {
			const d = new Date(iso);
			return d.toLocaleString(undefined, {
				month: 'short',
				day: 'numeric',
				hour: 'numeric',
				minute: '2-digit'
			});
		} catch {
			return iso;
		}
	}
</script>

<svelte:head>
	<title>Notifications · Strida</title>
</svelte:head>

<div class="notifications-page">
	<div class="page-header">
		<div>
			<h1 class="page-title">Notifications</h1>
			<p class="page-sub">In-app messages and updates</p>
		</div>
		{#if $notifications.some((n) => !n.read)}
			<Button variant="outline" size="sm" onclick={() => markAllRead()}>
				<CheckCheck class="h-4 w-4" aria-hidden="true" />
				Mark all read
			</Button>
		{/if}
	</div>

	{#if $notifications.length === 0}
		<Card.Root class="border-dashed shadow-none">
			<Card.Content class="flex flex-col items-center gap-2 py-10 px-6 text-center">
				<div class="mb-1 opacity-85" aria-hidden="true">
					<Bell class="h-10 w-10 text-muted-foreground" />
				</div>
				<p class="font-semibold text-foreground">No notifications yet</p>
				<p class="max-w-sm text-sm text-muted-foreground">
					When something needs your attention, it will show up here.
				</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<ul class="notif-list" role="list">
			{#each $notifications as n (n.id)}
				<li class="notif-item" class:notif-item--unread={!n.read}>
					<Card.Root class="notif-card shadow-sm">
						<Card.Content class="flex flex-row items-start justify-between gap-4 p-4 !pt-4">
							<div class="notif-main">
								<p class="notif-title">{n.title}</p>
								{#if n.body}
									<p class="notif-text text-muted-foreground text-sm">{n.body}</p>
								{/if}
								<p class="notif-meta text-muted-foreground text-xs">{formatDate(n.createdAt)}</p>
							</div>
							<div class="notif-actions">
								{#if !n.read}
									<Button variant="ghost" size="sm" onclick={() => markRead(n.id)}>Mark read</Button>
								{/if}
							</div>
						</Card.Content>
					</Card.Root>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.notifications-page {
		max-width: 42rem;
		margin: 0 auto;
		padding: 1.25rem 1rem 2rem;
		box-sizing: border-box;
	}

	.page-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.25rem;
		flex-wrap: wrap;
	}

	.page-title {
		font-size: 1.35rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: var(--ink);
		margin: 0;
	}

	.page-sub {
		margin: 0.2rem 0 0;
		font-size: 0.88rem;
		color: var(--ink-soft);
	}

	.notif-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	.notif-item--unread :global(.notif-card) {
		border-color: color-mix(in srgb, var(--pop) 28%, var(--border) 72%);
		background: color-mix(in srgb, var(--pop-soft) 35%, var(--card) 65%);
	}

	.notif-main {
		min-width: 0;
		flex: 1;
	}

	.notif-title {
		font-weight: 600;
		font-size: 0.95rem;
		color: var(--ink);
		margin: 0 0 0.25rem;
	}

	.notif-text {
		margin: 0 0 0.35rem;
		line-height: 1.45;
	}

	.notif-meta {
		margin: 0;
	}

	.notif-actions {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		flex-shrink: 0;
	}
</style>
