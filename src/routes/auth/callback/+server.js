import { createClient } from '$lib/supabase/server';
import { redirect } from '@sveltejs/kit';

export async function GET(event) {
	const requestUrl = new URL(event.request.url);
	const code = requestUrl.searchParams.get('code');
	const next = requestUrl.searchParams.get('next') ?? '/app';

	if (code) {
		const supabase = createClient(event);
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		
		if (!error) {
			// Use relative path for redirect (SvelteKit will handle it correctly)
			// This ensures it works with any domain
			const redirectTo = next.startsWith('/') ? next : `/${next}`;
			throw redirect(303, redirectTo);
		}
	}

	// return the user to an error page with instructions
	// Use relative path to work with any domain
	throw redirect(303, '/login?error=auth_callback_error');
}

