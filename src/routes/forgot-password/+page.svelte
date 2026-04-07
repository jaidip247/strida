<script>
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { createClient } from '$lib/supabase/client';
	import { getPasswordResetRedirectUrl } from '$lib/utils/auth';
	import AuthFrame from '$lib/components/AuthFrame.svelte';

	const supabase = createClient();

	let email = '';
	let loading = false;
	let error = '';
	let success = '';

	async function handlePasswordReset(event) {
		event.preventDefault();
		loading = true;
		error = '';
		success = '';

		const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: getPasswordResetRedirectUrl()
		});

		if (resetError) {
			error = resetError.message;
			loading = false;
			return;
		}

		success = 'Password reset email sent. Check your inbox for the secure reset link.';
		loading = false;
	}
</script>

<AuthFrame
	title="Reset access"
	description="Enter your email and we will send a secure reset link."
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
			<form on:submit={handlePasswordReset}>
				<div class="flex flex-col gap-6">
					<div class="grid gap-2">
						<Label for="email" class="">Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="m@example.com"
							required
							bind:value={email}
							disabled={loading}
							class=""
						/>
					</div>
					<Button type="submit" class="w-full" disabled={loading}>
						{loading ? 'Sending...' : 'Send reset link'}
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
