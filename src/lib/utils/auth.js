/**
 * Authentication redirect URL utilities.
 *
 * Supports dynamic URI resolution per environment using:
 * - PUBLIC_APP_URL (global site URL)
 * - PUBLIC_AUTH_CALLBACK_URL (full OAuth callback URL override)
 * - PUBLIC_PASSWORD_RESET_URL (full reset-password URL override)
 *
 * This keeps Supabase redirectTo/emailRedirectTo values environment-safe
 * for local/dev/staging/production.
 */

function trimSlash(value) {
	return value ? value.replace(/\/+$/, '') : '';
}

function ensureAbsoluteUrl(value, fallbackBase) {
	if (!value) return '';
	if (/^https?:\/\//i.test(value)) return value;
	if (!fallbackBase) return value;
	const relative = value.startsWith('/') ? value : `/${value}`;
	return `${trimSlash(fallbackBase)}${relative}`;
}

/**
 * Resolve app base URL for current environment.
 *
 * Priority:
 * 1) PUBLIC_APP_URL
 * 2) browser origin (client)
 * 3) request URL origin (server)
 * 4) localhost fallback
 */
export function getBaseUrl(request) {
	const envAppUrl = trimSlash(import.meta.env.PUBLIC_APP_URL);
	if (envAppUrl) return envAppUrl;

	if (typeof window !== 'undefined' && window.location?.origin) {
		return trimSlash(window.location.origin);
	}

	if (request) {
		const url = new URL(request.url);
		return `${url.protocol}//${url.host}`;
	}

	return 'http://localhost:5173';
}

function normalizeNextPath(next = '/app') {
	return next.startsWith('/') ? next : `/${next}`;
}

/**
 * Sanitize "next" path used for post-auth navigation.
 * Only allow relative in-app paths to avoid open redirects.
 */
export function sanitizeNextPath(next, fallback = '/app') {
	if (!next || typeof next !== 'string') return fallback;
	if (!next.startsWith('/')) return fallback;
	if (next.startsWith('//')) return fallback;
	return next;
}

/**
 * Get OAuth callback URL for Supabase OAuth flows.
 * Honors PUBLIC_AUTH_CALLBACK_URL when set.
 */
export function getOAuthRedirectUrl(next = '/app', request) {
	const baseUrl = getBaseUrl(request);
	const nextPath = sanitizeNextPath(normalizeNextPath(next), '/app');
	const callbackOverride = ensureAbsoluteUrl(import.meta.env.PUBLIC_AUTH_CALLBACK_URL, baseUrl);

	if (callbackOverride) {
		const url = new URL(callbackOverride);
		url.searchParams.set('next', nextPath);
		return url.toString();
	}

	return `${baseUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`;
}

/**
 * Get reset password URL for Supabase resetPasswordForEmail.
 * Honors PUBLIC_PASSWORD_RESET_URL when set.
 */
export function getPasswordResetRedirectUrl(request) {
	const baseUrl = getBaseUrl(request);
	const resetOverride = ensureAbsoluteUrl(import.meta.env.PUBLIC_PASSWORD_RESET_URL, baseUrl);
	return resetOverride || `${baseUrl}/reset-password`;
}

/**
 * Backward-compatible alias for existing callers.
 * Prefer getOAuthRedirectUrl in new code.
 */
export function getCallbackUrl(next = '/app', request) {
	return getOAuthRedirectUrl(next, request);
}

/**
 * Utility list for Supabase dashboard allow-list setup.
 */
export function getAllowedRedirectUrls() {
	const baseUrl = getBaseUrl();
	return [
		getOAuthRedirectUrl('/app'),
		getOAuthRedirectUrl('/'),
		getPasswordResetRedirectUrl(),
		`${baseUrl}/auth/callback`
	];
}

