<script>
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { createClient } from '$lib/supabase/client';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { LogOut, Settings } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	const supabase = createClient();

	let loading = $state(false);
	let saving = $state(false);
	let error = $state('');
	let success = $state(false);
	
	let profile = $state({
		name: '',
		email: '',
		avatar_url: '',
		bio: '',
		timezone: '',
		country: ''
	});
	
	let googleProfile = $state(null);
	/** True when this account has a Google OAuth identity (not email/password only). */
	let signedInWithGoogle = $state(false);

	let user = $state(null);

	let loggingOut = $state(false);

	onMount(async () => {
		await loadProfile();
	});

	function getFriendlySupabaseError(err, fallbackMessage) {
		const raw = String(err?.message || fallbackMessage || 'Request failed');
		const code = err?.cause?.code || err?.code || '';
		const timeout =
			code === 'UND_ERR_CONNECT_TIMEOUT' ||
			raw.toLowerCase().includes('connect timeout') ||
			raw.toLowerCase().includes('fetch failed');

		if (timeout) {
			return 'Unable to reach Supabase right now (network timeout). Please check your internet/firewall/VPN and try again.';
		}

		return raw;
	}

	async function loadProfile() {
		loading = true;
		error = '';

		try {
			// Get current user using Supabase Auth API
			const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
			
			if (authError) throw authError;
			if (!authUser) {
				error = 'Not authenticated';
				loading = false;
				return;
			}

			user = authUser;
			signedInWithGoogle = (authUser.identities || []).some((id) => id.provider === 'google');

			// Get user metadata from auth (populated from Google login)
			const metadata = authUser.user_metadata || {};
			
			// Extract Google profile information
			// Google OAuth provides: full_name, name, email, avatar_url, picture, etc.
			googleProfile = {
				full_name: metadata.full_name,
				name: metadata.name || metadata.full_name,
				email: metadata.email || authUser.email,
				avatar_url: metadata.avatar_url || metadata.picture,
				email_verified: metadata.email_verified,
				provider: metadata.provider || 'google'
			};
			
			// Fetch user from User table using Supabase REST API
			// Note: Table name is case-sensitive "User" not "user"
			const { data: userData, error: userError } = await supabase
				.from('User')
				.select('*')
				.eq('id', authUser.id)
				.single();

			// Handle different error cases
			if (userError) {
				if (userError.code === 'PGRST116') {
					// User record not found - will create it with Google profile data
					console.log('User record not found, will create new user record from Google profile');
				} else {
					// Other errors (permissions, table doesn't exist, etc.)
					console.error('Error fetching user:', userError);
					error = `Unable to load user profile: ${userError.message}`;
					// Still populate from Google metadata as fallback
				}
			}

			const meta = authUser.user_metadata || {};
			const defaultTz =
				typeof Intl !== 'undefined'
					? Intl.DateTimeFormat().resolvedOptions().timeZone || ''
					: '';

			// Populate profile: User table wins for editable fields; metadata fills gaps (e.g. email signup)
			profile = {
				name: userData?.name || googleProfile.name || meta.name || meta.full_name || '',
				email: googleProfile.email || userData?.email || authUser.email || '',
				avatar_url: googleProfile.avatar_url || '',
				bio: userData?.bio ?? meta.bio ?? '',
				timezone: userData?.timezone ?? meta.timezone ?? defaultTz,
				country: userData?.country ?? meta.country ?? ''
			};

			// If user record doesn't exist, create it with Google profile data
			if (!userData && !userError) {
				await upsertUser();
			} else if (userData && (!userData.name || !userData.email)) {
				// If User record exists but is missing data, update it with Google profile
				await upsertUser();
			}
		} catch (e) {
			error = getFriendlySupabaseError(e, 'Failed to load profile');
			console.error('Error loading profile:', e);
		} finally {
			loading = false;
		}
	}

	async function upsertUser() {
		// Use upsert to create or update user record in one operation
		// This is more efficient than separate insert/update logic
		// Use Google profile data if available, otherwise use current profile data
		const userDataToSave = {
			id: user.id,
			name: profile.name || googleProfile?.name || '',
			email: profile.email || googleProfile?.email || user.email || '',
			bio: profile.bio?.trim() || null,
			timezone: profile.timezone?.trim() || null,
			country: profile.country?.trim() || null,
			updated_at: new Date().toISOString()
		};

		const { error: upsertError } = await supabase
			.from('User')
			.upsert(userDataToSave, {
				onConflict: 'id'
			});

		if (upsertError) {
			console.error('Error upserting user:', upsertError);
			// Don't throw - allow user to still see the form
		}
	}


	async function handleLogout() {
		loggingOut = true;
		try {
			await supabase.auth.signOut();
			await goto('/login');
		} finally {
			loggingOut = false;
		}
	}

	async function handleSubmit(e) {
		e.preventDefault();
		saving = true;
		error = '';
		success = false;

		try {
			// Use upsert to handle both insert and update cases
			// This ensures the user record exists and is updated in one operation
			const { data, error: upsertError } = await supabase
				.from('User')
				.upsert({
					id: user.id,
					name: profile.name,
					email: profile.email,
					bio: profile.bio?.trim() || null,
					timezone: profile.timezone?.trim() || null,
					country: profile.country?.trim() || null,
					updated_at: new Date().toISOString()
				}, {
					onConflict: 'id'
				})
				.select()
				.single();

			if (upsertError) {
				// Check for specific error types
				if (upsertError.code === '42P01') {
					throw new Error('User table does not exist. Please check your database.');
				} else if (upsertError.code === '42501') {
					throw new Error('Permission denied. Check your Row Level Security policies.');
				} else {
					throw upsertError;
				}
			}

			// Update local profile with returned data
			if (data) {
				profile = {
					...profile,
					...data
				};
			}

			success = true;
			toast.success('Profile updated');
			setTimeout(() => {
				success = false;
			}, 3000);
		} catch (e) {
			error = getFriendlySupabaseError(e, 'Failed to save profile');
			toast.error('Failed to save profile');
			console.error('Error saving profile:', e);
		} finally {
			saving = false;
		}
	}
</script>

<div class="page-shell">
	<div class="page-container">
		<div class="page-header">
			<div>
				<p class="eyebrow">Account</p>
				<h1>Profile</h1>
			</div>
			<a href="/app/settings" class="settings-shortcut">
				<Settings class="h-4 w-4" aria-hidden="true" />
				App settings
			</a>
		</div>
		
		<div class="page-content">
		{#if loading}
			<div class="loading-state">
				<p>Loading profile...</p>
			</div>
		{:else if error && !loading}
			<Card.Root class="surface-card mb-4 border-0 shadow-none">
				<Card.Content class="pt-6">
					<div class="text-destructive text-sm">{error}</div>
				</Card.Content>
			</Card.Root>
		{:else}
			<Card.Root class="surface-card border-0 shadow-none">
				<Card.Header class="">
					<Card.Title class="">Profile Information</Card.Title>
					<Card.Description class="">Update your profile information. Changes will be saved to your account.</Card.Description>
				</Card.Header>
				<Card.Content class="">
					{#if success}
						<div class="mb-4 p-3 text-sm text-primary bg-primary/10 border border-primary/20 rounded-md">
							Profile updated successfully!
						</div>
					{/if}
					{#if error}
						<div class="mb-4 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
							{error}
						</div>
					{/if}
					
					<form onsubmit={handleSubmit}>
						<div class="flex flex-col gap-6">
							{#if profile.avatar_url || googleProfile?.avatar_url}
								<div class="flex items-center gap-4 p-4 bg-secondary rounded-lg border border-border">
									<img 
										src={profile.avatar_url || googleProfile?.avatar_url} 
										alt="" 
										class="w-20 h-20 rounded-full object-cover border-2 border-border"
									/>
									<div>
										<p class="text-sm font-medium">Google Profile Picture</p>
										<p class="text-xs text-muted-foreground">From your Google account</p>
										{#if googleProfile?.email_verified}
											<p class="text-xs text-primary mt-1">✓ Email verified</p>
										{/if}
									</div>
								</div>
							{/if}

							<div class="grid gap-2">
								<Label for="email" class="">Email</Label>
								<Input 
									id="email" 
									type="email" 
									bind:value={profile.email}
									disabled={true}
									class="bg-secondary"
								/>
								<p class="text-xs text-muted-foreground">
									{#if signedInWithGoogle}
										From your Google account {googleProfile?.email_verified ? '(verified)' : ''}
									{:else}
										Your sign-in address
									{/if}
								</p>
							</div>

							<div class="grid gap-2">
								<Label for="name" class="">Name</Label>
								<Input 
									id="name" 
									type="text" 
									placeholder="John Doe"
									bind:value={profile.name}
									disabled={saving}
									class=""
								/>
								<p class="text-xs text-muted-foreground">
									{#if signedInWithGoogle && googleProfile?.name}
										From Google: {googleProfile.name}
									{:else}
										Shown in the app
									{/if}
								</p>
							</div>

							<div class="grid gap-2">
								<Label for="bio">Bio</Label>
								<Textarea
									id="bio"
									placeholder="A short note about you or what you're building with Strida"
									rows={4}
									bind:value={profile.bio}
									disabled={saving}
									class="min-h-[5rem] resize-y"
								/>
							</div>

							<div class="grid gap-2">
								<Label for="timezone">Timezone</Label>
								<Input
									id="timezone"
									type="text"
									placeholder="e.g. Europe/London"
									bind:value={profile.timezone}
									disabled={saving}
								/>
								<p class="text-xs text-muted-foreground">Used for date context and future reminders.</p>
							</div>

							<div class="grid gap-2">
								<Label for="country">Country / region</Label>
								<Input
									id="country"
									type="text"
									autocomplete="country-name"
									bind:value={profile.country}
									disabled={saving}
								/>
							</div>

							<div class="flex gap-2">
								<Button type="submit" disabled={saving} class="">
									{saving ? 'Saving...' : 'Save Changes'}
								</Button>
								<Button 
									type="button" 
									variant="outline"
									disabled={saving}
									onclick={loadProfile}
									class=""
								>
									Reset
								</Button>
							</div>
						</div>
					</form>
				</Card.Content>
			</Card.Root>
		{/if}

		{#if !loading && user}
			<Card.Root class="surface-card border-0 shadow-none" style="margin-top: 1rem;">
				<Card.Header>
					<Card.Title>Sign out</Card.Title>
					<Card.Description>End your session on this device.</Card.Description>
				</Card.Header>
				<Card.Content>
					<Button variant="outline" class="gap-2" disabled={loggingOut} onclick={handleLogout}>
						<LogOut class="h-4 w-4" />
						{loggingOut ? 'Signing out...' : 'Log out'}
					</Button>
				</Card.Content>
			</Card.Root>
		{/if}
		</div>
	</div>
</div>

<style>
	.page-shell {
		display: block;
	}

	.page-container {
		padding: 2rem;
		max-width: 800px;
		margin: 0;
	}

	.page-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
		margin-bottom: 1.4rem;
	}

	.settings-shortcut {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.86rem;
		font-weight: 600;
		color: var(--pop);
		text-decoration: none;
		padding: 0.35rem 0.5rem;
		border-radius: 8px;
		border: 1px solid color-mix(in srgb, var(--pop) 35%, var(--line) 65%);
		transition:
			background 120ms ease,
			border-color 120ms ease;
	}

	.settings-shortcut:hover {
		background: var(--pop-soft);
		border-color: var(--pop);
	}

	.eyebrow {
		font-size: 0.72rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink-soft);
		margin-bottom: 0.35rem;
	}

	.page-header h1 {
		font-size: 1.6rem;
		font-weight: 640;
		letter-spacing: -0.02em;
	}

	.page-content {
		color: var(--ink-soft);
	}

	.loading-state {
		text-align: center;
		padding: 2rem;
	}

	@media (max-width: 768px) {
		.page-container {
			padding: 1rem;
		}
	}
</style>
