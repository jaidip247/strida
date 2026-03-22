<script>
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { createClient } from '$lib/supabase/client';
	import { getCallbackUrl } from '$lib/utils/auth';

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
			redirectTo: getCallbackUrl('/reset-password')
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

<div class="container mx-auto p-10 flex justify-center items-center h-screen">
	<Card.Root class="w-full max-w-sm">
		<Card.Header class="">
			<Card.Title class="">Forgot your password?</Card.Title>
			<Card.Description class="">Enter your email to receive a password reset link</Card.Description>
			
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
        <p class="text-sm text-gray-500">
				<a href="/login" class="text-blue-500 underline underline-offset-4 hover:underline font-medium">Back to login</a>
        </p>
			</Card.Action>
		</Card.Footer>
	</Card.Root>
</div>
