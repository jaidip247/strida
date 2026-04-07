<script>
	import { version } from '$app/environment';
	import { onMount } from 'svelte';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { createClient } from '$lib/supabase/client';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import {
		buildUserExportPayload,
		downloadJsonFile,
		buildUserExportPdfBlob,
		downloadBlob
	} from '$lib/utils/account-export.js';
	import {
		appSettings,
		patchAppSettings,
		SETTINGS_MIN_HABITS_PER_PAGE,
		SETTINGS_MAX_HABITS_PER_PAGE
	} from '$lib/stores/app-settings.js';
	import { setMode, resetMode, userPrefersMode } from 'mode-watcher';
	import { User, Bell, BellOff, ChevronDown, Download, FileText } from '@lucide/svelte';
	import {
		isPushSupported,
		requestPermission,
		getPermission,
		subscribeToPush,
		unsubscribeFromPush,
		saveSubscription,
		removeSubscription,
		hasSubscription
	} from '$lib/utils/push';

	const supabase = createClient();
	const appVersion = version || '0.0.1';

	let pushUser = $state(/** @type {import('@supabase/supabase-js').User | null} */ (null));
	let pushSupported = $state(false);
	let pushEnabled = $state(false);
	let pushToggling = $state(false);
	let pushInitDone = $state(false);

	let exportBusy = $state(false);
	let deleteDialogOpen = $state(false);
	let deleteConfirmText = $state('');
	let deleteBusy = $state(false);

	const pageSizeBase = [5, 10, 15, 20, 25, 50].filter(
		(n) => n >= SETTINGS_MIN_HABITS_PER_PAGE && n <= SETTINGS_MAX_HABITS_PER_PAGE
	);

	const pageSizeOptions = $derived.by(() => {
		const cur = $appSettings.habitsPerPage;
		if (pageSizeBase.includes(cur)) return pageSizeBase;
		return [...pageSizeBase, cur].sort((a, b) => a - b);
	});

	/** @param {string} v */
	function applyThemeValue(v) {
		if (v === 'system') resetMode();
		else if (v === 'light' || v === 'dark') setMode(v);
	}

	/** @param {string} v */
	function applyWeekStartValue(v) {
		if (v === 'monday' || v === 'sunday') patchAppSettings({ weekStartsOn: v });
	}

	/** @param {string} v */
	function applyPageSizeValue(v) {
		const n = Number(v);
		if (Number.isFinite(n)) patchAppSettings({ habitsPerPage: n });
	}

	async function runExportJson() {
		exportBusy = true;
		try {
			const {
				data: { user },
				error: authError
			} = await supabase.auth.getUser();
			if (authError || !user) {
				toast.error('Sign in to export data');
				return;
			}
			const payload = await buildUserExportPayload(supabase, user.id);
			const safe = (user.email || 'strida').replace(/[^a-z0-9_-]+/gi, '_').slice(0, 48);
			downloadJsonFile(`strida-export-${safe}-${new Date().toISOString().slice(0, 10)}.json`, payload);
			toast.success('JSON download started');
		} catch (e) {
			console.error(e);
			toast.error(getFriendlySupabaseError(e, 'Export failed'));
		} finally {
			exportBusy = false;
		}
	}

	async function runExportPdf() {
		exportBusy = true;
		try {
			const {
				data: { user },
				error: authError
			} = await supabase.auth.getUser();
			if (authError || !user) {
				toast.error('Sign in to export data');
				return;
			}
			const payload = await buildUserExportPayload(supabase, user.id);
			const blob = await buildUserExportPdfBlob(payload);
			const safe = (user.email || 'strida').replace(/[^a-z0-9_-]+/gi, '_').slice(0, 48);
			downloadBlob(`strida-export-${safe}-${new Date().toISOString().slice(0, 10)}.pdf`, blob);
			toast.success('PDF download started');
		} catch (e) {
			console.error(e);
			toast.error(getFriendlySupabaseError(e, 'Export failed'));
		} finally {
			exportBusy = false;
		}
	}

	function openDeleteDialog() {
		deleteConfirmText = '';
		deleteDialogOpen = true;
	}

	async function confirmSoftDeleteAccount() {
		if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
			toast.error('Type DELETE to confirm');
			return;
		}
		deleteBusy = true;
		try {
			const {
				data: { user },
				error: authError
			} = await supabase.auth.getUser();
			if (authError || !user) {
				toast.error('Not signed in');
				return;
			}
			if (isPushSupported()) {
				await unsubscribeFromPush();
				await removeSubscription(supabase, user.id);
			}
			const now = new Date().toISOString();
			const { data: updatedRows, error: updError } = await supabase
				.from('User')
				.update({
					deleted_at: now,
					name: 'Deleted account',
					bio: null,
					timezone: null,
					country: null,
					updated_at: now
				})
				.eq('id', user.id)
				.select('id');

			if (updError) {
				const msg = String(updError.message || '');
				if (msg.includes('deleted_at') || msg.includes('column')) {
					toast.error('Add column deleted_at (migration 008) on your Supabase project, then try again.');
				} else {
					toast.error(getFriendlySupabaseError(updError, 'Could not close account'));
				}
				return;
			}
			if (!updatedRows?.length) {
				toast.error('No profile row found. Open Profile once, then try again.');
				return;
			}

			deleteDialogOpen = false;
			await supabase.auth.signOut();
			toast.success('Account closed');
			await goto('/login?reason=account_closed');
		} catch (e) {
			console.error(e);
			toast.error(getFriendlySupabaseError(e, 'Could not close account'));
		} finally {
			deleteBusy = false;
		}
	}

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

	async function loadPushState() {
		const {
			data: { user },
			error: authError
		} = await supabase.auth.getUser();
		if (authError || !user) {
			pushUser = null;
			pushEnabled = false;
			pushInitDone = true;
			return;
		}
		pushUser = user;
		if (isPushSupported()) {
			pushEnabled = await hasSubscription(supabase, user.id);
		} else {
			pushEnabled = false;
		}
		pushInitDone = true;
	}

	async function togglePushNotifications() {
		if (!pushUser) return;
		pushToggling = true;
		try {
			if (pushEnabled) {
				await unsubscribeFromPush();
				await removeSubscription(supabase, pushUser.id);
				pushEnabled = false;
				toast.success('Push notifications disabled');
			} else {
				const permission = await requestPermission();
				if (permission !== 'granted') {
					toast.error('Notification permission denied by browser');
					pushToggling = false;
					return;
				}
				const vapidKey = import.meta.env.PUBLIC_VAPID_PUBLIC_KEY;
				if (!vapidKey) {
					toast.error('Push notifications not configured on this server');
					pushToggling = false;
					return;
				}
				const subscription = await subscribeToPush(vapidKey);
				if (!subscription) {
					toast.error(
						'Could not create push subscription. Check that the site is served over HTTPS (or localhost) and try again.'
					);
					pushToggling = false;
					return;
				}
				const { error: saveError } = await saveSubscription(supabase, pushUser.id, subscription);
				if (saveError) {
					toast.error(getFriendlySupabaseError(saveError, 'Failed to save subscription'));
					pushToggling = false;
					return;
				}
				pushEnabled = true;
				toast.success('Push notifications enabled');
			}
		} catch (e) {
			console.error('Push toggle error:', e);
			toast.error('Failed to toggle notifications');
		} finally {
			pushToggling = false;
		}
	}

	onMount(() => {
		pushSupported = isPushSupported();
		void loadPushState();
	});
</script>

<div class="page-shell">
	<div class="page-container">
		<div class="page-header">
			<div>
				<p class="eyebrow">Preferences</p>
				<h1>Settings</h1>
			</div>
			<a href="/app/profile" class="account-link">
				<User class="h-4 w-4" aria-hidden="true" />
				Account &amp; profile
			</a>
		</div>

		<div class="page-content">
			<Card.Root class="surface-card border-0 shadow-none">
				<Card.Header>
					<Card.Title>General</Card.Title>
					<Card.Description>Appearance and motion.</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="settings-stack">
					<div class="field-row">
						<div class="field-label">
							<Label for="setting-theme">Theme</Label>
							<p class="field-hint">Applied on this device only.</p>
						</div>
						<Select.Root
							type="single"
							value={userPrefersMode.current}
							onValueChange={applyThemeValue}
						>
							<Select.Trigger
								id="setting-theme"
								class="h-8 w-full max-w-[16rem] justify-between border-[var(--line-strong)] bg-[var(--paper-elevated)] text-[var(--ink)] text-sm sm:w-44"
								aria-label="Color theme"
							>
								<span data-slot="select-value" class="truncate">
									{userPrefersMode.current === 'light'
										? 'Light'
										: userPrefersMode.current === 'dark'
											? 'Dark'
											: 'System'}
								</span>
							</Select.Trigger>
							<Select.Content align="end">
								<Select.Item value="light" label="Light">Light</Select.Item>
								<Select.Item value="dark" label="Dark">Dark</Select.Item>
								<Select.Item value="system" label="System">System</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>

					<div class="field-row field-row-toggle">
						<div class="field-label">
							<Label for="setting-compact">Compact lists</Label>
							<p class="field-hint">Tighter spacing on habit lists and insight cards.</p>
						</div>
						<Switch
							id="setting-compact"
							checked={$appSettings.compactLists}
							onCheckedChange={(v) => patchAppSettings({ compactLists: v === true })}
							aria-label="Compact lists"
						/>
					</div>

					<div class="field-row field-row-toggle">
						<div class="field-label">
							<Label for="setting-motion">Reduce motion</Label>
							<p class="field-hint">Shortens animations across the app where supported.</p>
						</div>
						<Switch
							id="setting-motion"
							checked={$appSettings.reduceMotion}
							onCheckedChange={(v) => patchAppSettings({ reduceMotion: v === true })}
							aria-label="Reduce motion"
						/>
					</div>

					<div class="field-row">
						<div class="field-label">
							<Label for="setting-timezone">Date &amp; time</Label>
							<p class="field-hint">“Today” and dates use your device’s local timezone.</p>
						</div>
						<p class="read-only-value" id="setting-timezone">
							{typeof Intl !== 'undefined'
								? Intl.DateTimeFormat().resolvedOptions().timeZone
								: 'Local device'}
						</p>
					</div>
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root class="surface-card border-0 shadow-none">
				<Card.Header>
					<Card.Title>Habits</Card.Title>
					<Card.Description>Daily flow and list layout.</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="settings-stack">
					<div class="field-row">
						<div class="field-label">
							<Label for="setting-week">Week starts on</Label>
							<p class="field-hint">Saved for future calendar views; charts may follow in a later update.</p>
						</div>
						<Select.Root
							type="single"
							value={$appSettings.weekStartsOn}
							onValueChange={applyWeekStartValue}
						>
							<Select.Trigger
								id="setting-week"
								class="h-8 w-full max-w-[16rem] justify-between border-[var(--line-strong)] bg-[var(--paper-elevated)] text-[var(--ink)] text-sm sm:w-44"
								aria-label="First day of the week"
							>
								<span data-slot="select-value">
									{$appSettings.weekStartsOn === 'monday' ? 'Monday' : 'Sunday'}
								</span>
							</Select.Trigger>
							<Select.Content align="end">
								<Select.Item value="sunday" label="Sunday">Sunday</Select.Item>
								<Select.Item value="monday" label="Monday">Monday</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>

					<div class="field-row">
						<div class="field-label">
							<Label for="setting-page-size">Habits per page</Label>
							<p class="field-hint">Today, Progress, and Insights lists.</p>
						</div>
						<Select.Root
							type="single"
							value={String($appSettings.habitsPerPage)}
							onValueChange={applyPageSizeValue}
						>
							<Select.Trigger
								id="setting-page-size"
								class="h-8 w-full max-w-[16rem] justify-between border-[var(--line-strong)] bg-[var(--paper-elevated)] text-[var(--ink)] text-sm sm:w-44"
								aria-label="Number of habits per page"
							>
								<span data-slot="select-value">{$appSettings.habitsPerPage}</span>
							</Select.Trigger>
							<Select.Content align="end">
								{#each pageSizeOptions as n}
									<Select.Item value={String(n)} label={String(n)}>{n}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div class="field-row field-row-toggle">
						<div class="field-label">
							<Label for="setting-confirm">Confirm before completing</Label>
							<p class="field-hint">Ask for confirmation when checking off a habit on Today.</p>
						</div>
						<Switch
							id="setting-confirm"
							checked={$appSettings.confirmBeforeComplete}
							onCheckedChange={(v) => patchAppSettings({ confirmBeforeComplete: v === true })}
							aria-label="Confirm before completing a habit"
						/>
					</div>
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root class="surface-card border-0 shadow-none">
				<Card.Header>
					<Card.Title>Notifications</Card.Title>
					<Card.Description>Get daily reminders to check in on your habits.</Card.Description>
				</Card.Header>
				<Card.Content>
					{#if !pushSupported}
						<p class="field-hint muted">Push notifications are not supported in this browser.</p>
					{:else if !pushInitDone}
						<p class="field-hint muted">Loading notification status…</p>
					{:else if !pushUser}
						<p class="field-hint muted">Sign in to manage notifications.</p>
					{:else}
						<div class="push-row">
							<div class="push-info">
								{#if pushEnabled}
									<Bell class="h-5 w-5 shrink-0" />
								{:else}
									<BellOff class="h-5 w-5 shrink-0" />
								{/if}
								<div>
									<p class="push-status">
										{pushEnabled ? 'Push notifications enabled' : 'Push notifications disabled'}
									</p>
									<p class="field-hint muted push-sub">
										{pushEnabled
											? 'You will receive daily habit reminders.'
											: 'Enable to get daily habit reminders in your browser.'}
									</p>
								</div>
							</div>
							<Button
								variant={pushEnabled ? 'outline' : 'default'}
								size="sm"
								type="button"
								disabled={pushToggling}
								onclick={togglePushNotifications}
							>
								{pushToggling ? 'Updating...' : pushEnabled ? 'Disable' : 'Enable'}
							</Button>
						</div>
						{#if getPermission() === 'denied'}
							<p class="field-hint destructive mt-3">
								Notifications are blocked by your browser. Update your browser settings to allow
								notifications from this site.
							</p>
						{/if}
					{/if}
				</Card.Content>
			</Card.Root>

			<Card.Root class="surface-card border-0 shadow-none">
				<Card.Header>
					<Card.Title>Data &amp; privacy</Card.Title>
					<Card.Description>Download your habits or close your account (data is kept but the app stays off-limits).</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="settings-stack">
					<div class="field-row field-row-actions">
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<Button
										type="button"
										variant="outline"
										disabled={exportBusy}
										{...props}
										class="gap-1.5"
									>
										<Download class="h-4 w-4" aria-hidden="true" />
										{exportBusy ? 'Preparing…' : 'Export data'}
										<ChevronDown class="h-4 w-4 opacity-60" aria-hidden="true" />
									</Button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="start" class="min-w-48">
								<DropdownMenu.Item
									class="gap-2"
									disabled={exportBusy}
									onclick={() => runExportJson()}
								>
									<FileText class="h-4 w-4" aria-hidden="true" />
									Download JSON
								</DropdownMenu.Item>
								<DropdownMenu.Item
									class="gap-2"
									disabled={exportBusy}
									onclick={() => runExportPdf()}
								>
									<FileText class="h-4 w-4" aria-hidden="true" />
									Download PDF
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
						<Button type="button" variant="outline" onclick={openDeleteDialog}>
							Delete account
						</Button>
					</div>
					<p class="field-hint muted">
						Export includes your profile row, habits, and completion history. Deleting your account is a soft delete:
						you are signed out and cannot use the app until the account is restored in the database.
					</p>
					</div>
				</Card.Content>
			</Card.Root>

			<Dialog.Root bind:open={deleteDialogOpen}>
				<Dialog.Content showCloseButton={true} class="sm:max-w-md">
					<Dialog.Header>
						<Dialog.Title>Delete account?</Dialog.Title>
						<Dialog.Description>
							This soft-deletes your profile: you will be signed out and blocked from the app. Your rows are not
							erased immediately. Type <strong>DELETE</strong> to confirm.
						</Dialog.Description>
					</Dialog.Header>
					<div class="grid gap-2 py-2">
						<Label for="delete-confirm">Confirmation</Label>
						<Input
							id="delete-confirm"
							autocomplete="off"
							placeholder="DELETE"
							bind:value={deleteConfirmText}
							disabled={deleteBusy}
						/>
					</div>
					<Dialog.Footer class="gap-2 sm:gap-0">
						<Button
							type="button"
							variant="outline"
							disabled={deleteBusy}
							onclick={() => (deleteDialogOpen = false)}
						>
							Cancel
						</Button>
						<Button type="button" variant="destructive" disabled={deleteBusy} onclick={confirmSoftDeleteAccount}>
							{deleteBusy ? 'Closing…' : 'Close account'}
						</Button>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>

			<Card.Root class="surface-card border-0 shadow-none">
				<Card.Header>
					<Card.Title>About</Card.Title>
					<Card.Description>Strida — one mark at a time.</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="settings-stack">
					<p class="read-only-value">Version {appVersion}</p>
					</div>
				</Card.Content>
			</Card.Root>
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

	.account-link {
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

	.account-link:hover {
		background: var(--pop-soft);
		border-color: var(--pop);
	}

	.page-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		color: var(--ink-soft);
	}

	.settings-stack {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.field-row {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}

	@media (min-width: 560px) {
		.field-row:not(.field-row-toggle):not(.field-row-actions) {
			flex-direction: row;
			align-items: flex-start;
			justify-content: space-between;
			gap: 1rem;
		}

		.field-row:not(.field-row-toggle) .field-label {
			flex: 1;
			min-width: 0;
		}

		.field-row:not(.field-row-toggle) .read-only-value {
			width: 11rem;
			flex-shrink: 0;
		}
	}

	.field-row-toggle {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.field-row-actions {
		flex-direction: row;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.field-label :global(label) {
		font-weight: 600;
		color: var(--ink);
	}

	.field-hint {
		font-size: 0.8rem;
		margin: 0.15rem 0 0;
		line-height: 1.4;
		color: var(--ink-soft);
	}

	.field-hint.muted {
		margin-top: 0;
	}

	.read-only-value {
		margin: 0;
		font-size: 0.88rem;
		color: var(--ink-soft);
	}

	.push-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.push-info {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		min-width: 0;
	}

	.push-status {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--ink);
	}

	.push-sub {
		margin-top: 0.2rem;
	}

	.field-hint.destructive {
		color: var(--destructive);
		margin-top: 0.75rem;
	}

	@media (max-width: 768px) {
		.page-container {
			padding: 1rem;
		}
	}
</style>
