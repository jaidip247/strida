<script>
	import { User } from "@lucide/svelte";
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { createClient } from '$lib/supabase/client';
	import { onMount } from 'svelte';

	const supabase = createClient();

	let loading = false;
	let saving = false;
	let error = '';
	let success = false;
	
	let profile = {
		name: '',
		email: '',
		avatar_url: ''
	};
	
	let googleProfile = null;

	let user = null;

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

			// Populate profile with Google profile data first, then fallback to User table data
			// Priority: Google profile > User table > empty
			profile = {
				name: googleProfile.name || userData?.name || '',
				email: googleProfile.email || userData?.email || authUser.email || '',
				avatar_url: googleProfile.avatar_url || ''
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
			setTimeout(() => {
				success = false;
			}, 3000);
		} catch (e) {
			error = getFriendlySupabaseError(e, 'Failed to save profile');
			console.error('Error saving profile:', e);
		} finally {
			saving = false;
		}
	}
</script>

<div class="page-container">
	<div class="page-header">
		<User size={24} />
		<h1>Profile</h1>
	</div>
	
	<div class="page-content">
		{#if loading}
			<div class="loading-state">
				<p>Loading profile...</p>
			</div>
		{:else if error && !loading}
			<Card.Root class="mb-4">
				<Card.Content class="pt-6">
					<div class="text-red-600 text-sm">{error}</div>
				</Card.Content>
			</Card.Root>
		{:else}
			<Card.Root class="">
				<Card.Header class="">
					<Card.Title class="">Profile Information</Card.Title>
					<Card.Description class="">Update your profile information. Changes will be saved to your account.</Card.Description>
				</Card.Header>
				<Card.Content class="">
					{#if success}
						<div class="mb-4 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
							Profile updated successfully!
						</div>
					{/if}
					{#if error}
						<div class="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
							{error}
						</div>
					{/if}
					
					<form on:submit={handleSubmit}>
						<div class="flex flex-col gap-6">
							{#if profile.avatar_url || googleProfile?.avatar_url}
								<div class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
									<img 
										src={profile.avatar_url || googleProfile?.avatar_url} 
										alt="" 
										class="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
									/>
									<div>
										<p class="text-sm font-medium">Google Profile Picture</p>
										<p class="text-xs text-gray-500">From your Google account</p>
										{#if googleProfile?.email_verified}
											<p class="text-xs text-green-600 mt-1">✓ Email verified</p>
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
									class="bg-gray-50"
								/>
								<p class="text-xs text-gray-500">
									Email from Google account {googleProfile?.email_verified ? '(verified)' : ''}
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
								<p class="text-xs text-gray-500">
									{#if googleProfile?.name}
										Fetched from Google: {googleProfile.name}
									{:else}
										Your display name
									{/if}
								</p>
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
	</div>
</div>

<style>
	.page-container {
		padding: 2rem;
		max-width: 800px;
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 2rem;
	}

	.page-header h1 {
		font-size: 1.875rem;
		font-weight: 600;
	}

	.page-content {
		color: #666;
	}

	.loading-state {
		text-align: center;
		padding: 2rem;
	}
</style>
