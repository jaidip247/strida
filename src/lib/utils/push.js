/**
 * Browser push notification helpers.
 *
 * Uses the standard Push API / Notification API.
 * Subscriptions are stored in Supabase PushSubscription table.
 */

/**
 * Check if push notifications are supported in this browser.
 */
export function isPushSupported() {
	return (
		typeof window !== 'undefined' &&
		'serviceWorker' in navigator &&
		'PushManager' in window &&
		'Notification' in window
	);
}

/**
 * Request notification permission from the user.
 * @returns {Promise<NotificationPermission>}
 */
export async function requestPermission() {
	if (!isPushSupported()) return 'denied';
	return Notification.requestPermission();
}

/**
 * Get the current notification permission state.
 */
export function getPermission() {
	if (!isPushSupported()) return 'denied';
	return Notification.permission;
}

/**
 * Register the service worker and subscribe to push.
 * @param {string} vapidPublicKey - VAPID public key (base64url)
 * @returns {Promise<PushSubscription|null>}
 */
export async function subscribeToPush(vapidPublicKey) {
	if (!isPushSupported()) return null;

	const registration = await navigator.serviceWorker.register('/sw.js');
	await navigator.serviceWorker.ready;

	const existing = await registration.pushManager.getSubscription();
	if (existing) return existing;

	const subscription = await registration.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
	});

	return subscription;
}

/**
 * Unsubscribe from push and remove local subscription.
 */
export async function unsubscribeFromPush() {
	if (!isPushSupported()) return;
	const registration = await navigator.serviceWorker.getRegistration();
	if (!registration) return;
	const subscription = await registration.pushManager.getSubscription();
	if (subscription) await subscription.unsubscribe();
}

/**
 * Save a push subscription to the Supabase PushSubscription table.
 */
export async function saveSubscription(supabase, userId, subscription) {
	const json = subscription.toJSON();
	const { error } = await supabase.from('PushSubscription').upsert(
		{
			user_id: userId,
			endpoint: json.endpoint,
			keys_p256dh: json.keys?.p256dh || null,
			keys_auth: json.keys?.auth || null,
			platform: 'web'
		},
		{ onConflict: 'user_id,endpoint' }
	);
	return { error };
}

/**
 * Remove subscription from Supabase.
 */
export async function removeSubscription(supabase, userId) {
	const { error } = await supabase
		.from('PushSubscription')
		.delete()
		.eq('user_id', userId)
		.eq('platform', 'web');
	return { error };
}

/**
 * Check if user has an active push subscription stored.
 */
export async function hasSubscription(supabase, userId) {
	const { data, error } = await supabase
		.from('PushSubscription')
		.select('id')
		.eq('user_id', userId)
		.eq('platform', 'web')
		.limit(1);

	if (error) return false;
	return (data?.length || 0) > 0;
}

function urlBase64ToUint8Array(base64String) {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const rawData = atob(base64);
	const outputArray = new Uint8Array(rawData.length);
	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}
