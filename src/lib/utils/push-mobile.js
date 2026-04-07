/**
 * Mobile push notification helpers using Capacitor PushNotifications plugin.
 *
 * Only runs inside a Capacitor native shell. On the web this module is a no-op.
 */

import { Capacitor } from '@capacitor/core';

let PushNotifications = null;

/**
 * Check if we are running inside a Capacitor native app.
 */
export function isNativeApp() {
	return Capacitor.isNativePlatform();
}

/**
 * Lazily load the PushNotifications plugin (only available in native).
 */
async function getPlugin() {
	if (PushNotifications) return PushNotifications;
	if (!isNativeApp()) return null;
	const mod = await import('@capacitor/push-notifications');
	PushNotifications = mod.PushNotifications;
	return PushNotifications;
}

/**
 * Register for push notifications on the native device.
 * Saves the FCM token to the PushSubscription table.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} userId
 * @returns {Promise<boolean>} true if registration succeeded
 */
export async function registerMobilePush(supabase, userId) {
	const plugin = await getPlugin();
	if (!plugin) return false;

	let permResult = await plugin.checkPermissions();
	if (permResult.receive === 'prompt') {
		permResult = await plugin.requestPermissions();
	}
	if (permResult.receive !== 'granted') return false;

	return new Promise((resolve) => {
		plugin.addListener('registration', async (token) => {
			const { error } = await supabase.from('PushSubscription').upsert(
				{
					user_id: userId,
					endpoint: token.value,
					platform: 'android'
				},
				{ onConflict: 'user_id,endpoint' }
			);
			resolve(!error);
		});

		plugin.addListener('registrationError', () => {
			resolve(false);
		});

		plugin.register();
	});
}

/**
 * Unregister from mobile push and remove the subscription.
 */
export async function unregisterMobilePush(supabase, userId) {
	const plugin = await getPlugin();
	if (!plugin) return;

	await supabase
		.from('PushSubscription')
		.delete()
		.eq('user_id', userId)
		.eq('platform', 'android');
}
