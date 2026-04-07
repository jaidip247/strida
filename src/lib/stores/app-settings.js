import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { HABITS_PAGE_SIZE } from '$lib/utils/pagination.js';

export const SETTINGS_STORAGE_KEY = 'strida:settings';

/** @typedef {'sunday' | 'monday'} WeekStartsOn */

/**
 * @typedef {Object} AppSettings
 * @property {WeekStartsOn} weekStartsOn
 * @property {number} habitsPerPage
 * @property {boolean} confirmBeforeComplete
 * @property {boolean} compactLists
 * @property {boolean} reduceMotion
 * @property {boolean} sidebarCollapsed
 */

/** @type {AppSettings} */
export const defaultAppSettings = {
	weekStartsOn: 'sunday',
	habitsPerPage: HABITS_PAGE_SIZE,
	confirmBeforeComplete: false,
	compactLists: false,
	reduceMotion: false,
	sidebarCollapsed: false
};

const MIN_PAGE = 5;
const MAX_PAGE = 50;

/**
 * @param {Partial<AppSettings> | null | undefined} raw
 * @returns {AppSettings}
 */
export function normalizeAppSettings(raw) {
	const base = { ...defaultAppSettings };
	if (!raw || typeof raw !== 'object') return base;

	if (raw.weekStartsOn === 'monday' || raw.weekStartsOn === 'sunday') {
		base.weekStartsOn = raw.weekStartsOn;
	}

	const n = Number(raw.habitsPerPage);
	if (Number.isFinite(n)) {
		base.habitsPerPage = Math.min(MAX_PAGE, Math.max(MIN_PAGE, Math.round(n)));
	}

	base.confirmBeforeComplete = Boolean(raw.confirmBeforeComplete);
	base.compactLists = Boolean(raw.compactLists);
	base.reduceMotion = Boolean(raw.reduceMotion);
	base.sidebarCollapsed = Boolean(raw.sidebarCollapsed);

	return base;
}

/**
 * @returns {AppSettings}
 */
export function loadAppSettingsFromStorage() {
	if (!browser) return { ...defaultAppSettings };
	try {
		const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
		if (!raw) return { ...defaultAppSettings };
		const parsed = JSON.parse(raw);
		return normalizeAppSettings(parsed);
	} catch {
		return { ...defaultAppSettings };
	}
}

/**
 * @param {AppSettings} value
 */
export function persistAppSettings(value) {
	if (!browser) return;
	try {
		localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(value));
	} catch {
		/* ignore quota / private mode */
	}
}

/** @type {import('svelte/store').Writable<AppSettings>} */
export const appSettings = writable(loadAppSettingsFromStorage());

/**
 * @param {Partial<AppSettings>} patch
 */
export function patchAppSettings(patch) {
	appSettings.update((current) => {
		const next = normalizeAppSettings({ ...current, ...patch });
		persistAppSettings(next);
		return next;
	});
}

export { MIN_PAGE as SETTINGS_MIN_HABITS_PER_PAGE, MAX_PAGE as SETTINGS_MAX_HABITS_PER_PAGE };
