import { redirect } from '@sveltejs/kit';

export const load = async ({ url }) => {
	const code = url.searchParams.get('code');
	if (!code) return {};

	// Some providers/configs may return users to "/" with ?code=...
	// Route those callbacks through the dedicated handler.
	const callbackUrl = new URL('/auth/callback', url);
	for (const [key, value] of url.searchParams.entries()) {
		callbackUrl.searchParams.set(key, value);
	}

	throw redirect(303, `${callbackUrl.pathname}${callbackUrl.search}`);
};
