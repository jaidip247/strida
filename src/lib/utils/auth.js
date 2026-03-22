/**
 * Authentication URL utilities
 * Handles dynamic domain configuration for OAuth callbacks
 */

/**
 * Get the base URL for the current environment
 * Supports:
 * - Environment variable override (PUBLIC_APP_URL)
 * - window.location.origin (client-side)
 * - Request headers (server-side)
 */
export function getBaseUrl(request) {
	// Check for environment variable override first
	if (typeof window !== 'undefined') {
		// Client-side: check for PUBLIC_APP_URL
		const envUrl = import.meta.env.PUBLIC_APP_URL;
		if (envUrl) {
			return envUrl;
		}
		// Fallback to current origin
		return window.location.origin;
	}

	// Server-side: use environment variable or construct from request
	if (import.meta.env.PUBLIC_APP_URL) {
		return import.meta.env.PUBLIC_APP_URL;
	}

	if (request) {
		const url = new URL(request.url);
		return `${url.protocol}//${url.host}`;
	}

	// Fallback (shouldn't happen in production)
	return 'http://localhost:5173';
}

/**
 * Get the OAuth callback URL
 * @param next - Optional path to redirect to after authentication
 * @param request - Optional request object (for server-side)
 */
export function getCallbackUrl(next = '/app', request) {
	const baseUrl = getBaseUrl(request);
	const nextPath = next.startsWith('/') ? next : `/${next}`;
	return `${baseUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`;
}

/**
 * Get allowed redirect URLs for Supabase configuration
 * Useful for documentation and validation
 */
export function getAllowedRedirectUrls() {
	const baseUrl = getBaseUrl();
	return [
		`${baseUrl}/auth/callback`,
		`${baseUrl}/auth/callback?next=/app`,
		`${baseUrl}/auth/callback?next=/`,
		// Add any other callback patterns you use
	];
}

