<script>
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { createClient } from '$lib/supabase/client';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { getOAuthRedirectUrl, sanitizeNextPath } from '$lib/utils/auth';
	import AuthFrame from '$lib/components/AuthFrame.svelte';

	const supabase = createClient();
	
	let email = '';
	let password = '';
	let loading = false;
	let error = '';

	function getNextPath() {
		return sanitizeNextPath($page.url.searchParams.get('next'), '/app');
	}
	
	// Check for error in URL query params
	onMount(() => {
		const errorParam = $page.url.searchParams.get('error');
		if (errorParam === 'auth_callback_error') {
			error = 'Authentication failed. Please try again.';
		}
		const reason = $page.url.searchParams.get('reason');
		if (reason === 'account_closed') {
			error = 'This account was closed and you were signed out.';
		}
	});

	async function handleEmailLogin(e) {
		e.preventDefault();
		loading = true;
		error = '';

		const { data, error: authError } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (authError) {
			error = authError.message;
			loading = false;
		} else {
			goto(getNextPath());
		}
	}

	async function handleGoogleLogin() {
		loading = true;
		error = '';

		const { error: authError } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: getOAuthRedirectUrl(getNextPath())
			}
		});

		if (authError) {
			error = authError.message;
			loading = false;
		}
		// OAuth redirect will happen automatically
	}
</script>

<AuthFrame
	title="Welcome back"
	description="Sign in to continue your daily rhythm."
>
	<Card.Root class="surface-card w-full max-w-sm border-0 shadow-none">
		<Card.Content class="">
			{#if error}
				<div class="mb-4 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
					{error}
				</div>
			{/if}
			<form on:submit={handleEmailLogin}>
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
					<div class="grid gap-2">
						<div class="flex items-center">
							<Label for="password" class="">Password</Label>
							<a href={`/forgot-password?next=${encodeURIComponent(getNextPath())}`} class="ms-auto inline-block text-sm underline-offset-4 pop-link font-medium text-underline">
								Forgot your password?
							</a>
						</div>
						<Input 
							id="password" 
							type="password" 
							required 
							bind:value={password}
							disabled={loading}
							class="" 
						/>
					</div>
					<Button type="submit" class="w-full" disabled={loading}>
						{loading ? 'Logging in...' : 'Login'}
					</Button>
				</div>
			</form>
		</Card.Content>
		<Card.Footer class="flex-col gap-2">
			<div class="relative w-full">
				<div class="absolute inset-0 flex items-center">
					<Separator />
				</div>
				<div class="relative flex justify-center text-xs uppercase">
					<span class="bg-background px-2 text-muted-foreground">Or continue with</span>
				</div>
			</div>
			<Button 
				variant="outline" 
				class="w-full" 
				disabled={loading}
				onclick={handleGoogleLogin}
				type="button"
			>
				<svg class="mr-2 h-4 w-4" viewBox="0 0 24 24">
					<path
						fill="currentColor"
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
					/>
					<path
						fill="currentColor"
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
					/>
					<path
						fill="currentColor"
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
					/>
					<path
						fill="currentColor"
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
					/>
				</svg>
				Login with Google
			</Button>
			<Card.Action class="">
				<p class="text-sm text-muted-foreground">
					Don't have an account? <a href={`/register?next=${encodeURIComponent(getNextPath())}`} class="pop-link underline underline-offset-4 hover:underline font-medium">Sign Up</a>
				</p>
			</Card.Action>
		</Card.Footer>
	</Card.Root>
</AuthFrame>
