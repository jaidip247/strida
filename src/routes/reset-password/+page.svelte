<script>
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { createClient } from '$lib/supabase/client';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import AuthFrame from '$lib/components/AuthFrame.svelte';

	const supabase = createClient();

	let password = '';
	let confirmPassword = '';
	let loading = false;
	let checkingSession = true;
	let error = '';
	let success = '';

	onMount(async () => {
		const {
			data: { session }
		} = await supabase.auth.getSession();

		if (!session) {
			error = 'Your reset link is invalid or has expired. Please request a new password reset email.';
		}

		checkingSession = false;
	});

	async function handleResetPassword(event) {
		event.preventDefault();
		error = '';
		success = '';

		if (password.length < 8) {
			error = 'Password must be at least 8 characters long.';
			return;
		}

		if (password !== confirmPassword) {
			error = 'Passwords do not match.';
			return;
		}

		loading = true;
		const { error: updateError } = await supabase.auth.updateUser({ password });

		if (updateError) {
			error = updateError.message;
			loading = false;
			return;
		}

		success = 'Password updated successfully. Redirecting to login...';
		await supabase.auth.signOut();
		setTimeout(() => goto('/login'), 1200);
		loading = false;
	}
</script>

<AuthFrame
	title="Choose a new password"
	description="Keep it secure and easy to remember."
>
	<Card.Root class="surface-card w-full max-w-sm border-0 shadow-none">
		<Card.Content class="">
			{#if error}
				<div class="mb-4 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
					{error}
				</div>
			{/if}
			{#if success}
				<div class="mb-4 rounded-md border p-3 text-sm pop-surface">
					{success}
				</div>
			{/if}
			<form on:submit={handleResetPassword}>
				<div class="flex flex-col gap-6">
					<div class="grid gap-2">
						<div class="flex items-center">
							<Label for="password" class="">Password</Label>
						</div>
						<Input id="password" type="password" required bind:value={password} disabled={loading || checkingSession} class="" />
					</div>
					<div class="grid gap-2">
						<div class="flex items-center">
							<Label for="confirm-password" class="">Confirm Password</Label>
						</div>
						<Input id="confirm-password" type="password" required bind:value={confirmPassword} disabled={loading || checkingSession} class="" />
					</div>
					<Button type="submit" class="w-full" disabled={loading || checkingSession || Boolean(error && error.includes('invalid or has expired'))}>
						{checkingSession ? 'Checking link...' : loading ? 'Saving...' : 'Save new password'}
					</Button>
				</div>
			</form>
		</Card.Content>
		<Card.Footer class="flex-col gap-2">
      <Card.Action class="">
        <p class="text-sm text-muted-foreground">
				<a href="/login" class="pop-link underline underline-offset-4 hover:underline font-medium">Back to login</a>
        </p>
			</Card.Action>
		</Card.Footer>
	</Card.Root>
</AuthFrame>
