import { browser } from '$app/environment';
import { derived, writable } from 'svelte/store';

export const NOTIFICATIONS_STORAGE_KEY = 'strida:notifications';

/**
 * @typedef {Object} AppNotification
 * @property {string} id
 * @property {string} title
 * @property {string} body
 * @property {string} createdAt ISO date string
 * @property {boolean} read
 */

/** @param {unknown} raw @returns {AppNotification[]} */
function normalizeList(raw) {
	if (!Array.isArray(raw)) return [];
	const out = [];
	for (const item of raw) {
		if (!item || typeof item !== 'object') continue;
		const id = typeof item.id === 'string' ? item.id : '';
		const title = typeof item.title === 'string' ? item.title : '';
		const body = typeof item.body === 'string' ? item.body : '';
		const createdAt = typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString();
		const read = Boolean(item.read);
		if (!id || !title) continue;
		out.push({ id, title, body, createdAt, read });
	}
	return out;
}

function persist(list) {
	if (!browser) return;
	try {
		localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
	} catch {
		/* ignore */
	}
}

function initialList() {
	if (!browser) return [];
	try {
		const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
		if (!raw) {
			const welcome = [
				{
					id: 'welcome-1',
					title: 'Welcome to Strida',
					body: 'Your in-app notifications will appear here. Mark them read or clear them anytime.',
					createdAt: new Date().toISOString(),
					read: false
				}
			];
			persist(welcome);
			return welcome;
		}
		return normalizeList(JSON.parse(raw));
	} catch {
		return [];
	}
}

/** @type {import('svelte/store').Writable<AppNotification[]>} */
export const notifications = writable(initialList());

/**
 * @param {AppNotification[]} list
 */
export function setNotifications(list) {
	const next = normalizeList(list);
	notifications.set(next);
	persist(next);
}

/**
 * @param {Partial<AppNotification> & { id: string }} patch
 */
export function patchNotification(patch) {
	notifications.update((list) => {
		const next = list.map((n) => (n.id === patch.id ? { ...n, ...patch } : n));
		persist(next);
		return next;
	});
}

/**
 * @param {string} id
 */
export function markRead(id) {
	patchNotification({ id, read: true });
}

export function markAllRead() {
	notifications.update((list) => {
		const next = list.map((n) => ({ ...n, read: true }));
		persist(next);
		return next;
	});
}

/**
 * @param {string} id
 */
export function removeNotification(id) {
	notifications.update((list) => {
		const next = list.filter((n) => n.id !== id);
		persist(next);
		return next;
	});
}

export function clearAll() {
	notifications.set([]);
	persist([]);
}

/** @param {Omit<AppNotification, 'read'> & { read?: boolean }} item */
export function addNotification(item) {
	const row = {
		id: item.id,
		title: item.title,
		body: item.body,
		createdAt: item.createdAt,
		read: item.read ?? false
	};
	notifications.update((list) => {
		const next = [row, ...list.filter((n) => n.id !== row.id)];
		persist(next);
		return next;
	});
}

export const unreadCount = derived(notifications, (list) => list.filter((n) => !n.read).length);
