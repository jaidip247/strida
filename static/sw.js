/// <reference lib="webworker" />

self.addEventListener('push', (event) => {
	const data = event.data?.json() ?? {};
	const title = data.title || 'Strida';
	const options = {
		body: data.body || 'Time to check in on your habits!',
		icon: '/favicon.svg',
		badge: '/favicon.svg',
		tag: data.tag || 'strida-reminder',
		data: { url: data.url || '/app' }
	};

	event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const path = event.notification.data?.url || '/app';
	const targetUrl = new URL(path, self.location.origin).href;

	event.waitUntil(
		clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
			for (const client of clientList) {
				if (!client.url.startsWith(self.location.origin) || !('focus' in client)) continue;
				if ('navigate' in client && typeof client.navigate === 'function') {
					return client.navigate(targetUrl).then(() => client.focus());
				}
				return client.focus();
			}
			if (clients.openWindow) {
				return clients.openWindow(targetUrl);
			}
		})
	);
});
