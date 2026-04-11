<script>
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { createClient } from '$lib/supabase/client';
	import { Sparkles } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { FREE_DURATION_DAYS, FREE_HABIT_LIMIT } from '$lib/constants/plan.js';

	let { data } = $props();

	const supabase = createClient();
	const feature = $derived($page.url.searchParams.get('feature') || '');
	const checkout = $derived($page.url.searchParams.get('checkout') || '');

	let loading = $state(false);

	$effect(() => {
		if (checkout === 'cancel') {
			toast.message('Checkout was cancelled.');
		}
	});

	async function startCheckout() {
		loading = true;
		try {
			const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
			if (sessionError || !sessionData.session) {
				toast.error('Sign in required.');
				return;
			}
			const { data: fnData, error: fnError } = await supabase.functions.invoke('create-checkout-session', {
				method: 'POST',
				body: {}
			});
			if (fnError) {
				toast.error(fnError.message || 'Could not start checkout.');
				return;
			}
			const url = fnData?.url;
			if (typeof url === 'string' && url.startsWith('http')) {
				window.location.href = url;
				return;
			}
			toast.error(fnData?.error || 'Checkout is not available.');
		} catch (e) {
			toast.error(e?.message || 'Checkout failed.');
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Upgrade · Strida</title>
</svelte:head>

<div class="upgrade-page">
	<Card.Root class="max-w-lg border-0 shadow-none">
		<Card.Header>
			<div class="icon-wrap">
				<Sparkles class="h-8 w-8 text-primary" aria-hidden="true" />
			</div>
			<Card.Title class="text-xl">Strida Pro</Card.Title>
			<Card.Description>
				{#if feature === 'insights'}
					Insights and research-backed tips are part of Pro.
				{:else if feature === 'progress'}
					Advanced progress charts and analytics are part of Pro.
				{:else}
					Unlock unlimited habits, full insights, and analytics.
				{/if}
			</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			<ul class="list-inside list-disc text-sm text-muted-foreground space-y-1">
				<li>Unlimited habits</li>
				<li>Full insights and analytics</li>
				<li>Custom habit durations</li>
			</ul>
			{#if data.plan === 'paid'}
				<p class="text-sm font-medium text-primary">You already have Pro access.</p>
				<Button href="/app">Back to app</Button>
			{:else}
				<Button class="w-full" onclick={startCheckout} disabled={loading}>
					{loading ? 'Redirecting…' : 'Continue to checkout'}
				</Button>
				<p class="text-xs text-muted-foreground">
					Secure checkout via Razorpay (Indian cards, UPI, netbanking, and more). After payment is
					confirmed, your account unlocks Pro automatically—refresh if it takes a few seconds.
				</p>
				<p class="text-xs text-muted-foreground">
					Free accounts can track up to {FREE_HABIT_LIMIT} habits with a {FREE_DURATION_DAYS}-day duration
					each.
				</p>
			{/if}
		</Card.Content>
	</Card.Root>
</div>

<style>
	.upgrade-page {
		max-width: 36rem;
		margin: 0 auto;
		padding: 1.5rem 1rem 2rem;
	}
	.icon-wrap {
		margin-bottom: 0.5rem;
	}
</style>
