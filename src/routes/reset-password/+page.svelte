<script>
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { createClient } from '$lib/supabase/client';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

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

<div class="container mx-auto p-10 flex justify-center items-center h-screen">
	<Card.Root class="w-full max-w-sm">
		<Card.Header class="">
			<Card.Title class="">Reset password</Card.Title>
			<Card.Description class="">Enter your new password</Card.Description>
			
		</Card.Header>
		<Card.Content class="">
			{#if error}
				<div class="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
					{error}
				</div>
			{/if}
			{#if success}
				<div class="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
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
        <p class="text-sm text-gray-500">
				<a href="/login" class="text-blue-500 underline underline-offset-4 hover:underline font-medium">Back to login</a>
        </p>
			</Card.Action>
		</Card.Footer>
	</Card.Root>
</div>
