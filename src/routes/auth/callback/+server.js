import { createClient } from '$lib/supabase/server';
import { redirect } from '@sveltejs/kit';
import { sanitizeNextPath } from '$lib/utils/auth';

export async function GET(event) {
	const requestUrl = new URL(event.request.url);
	const code = requestUrl.searchParams.get('code');
	const next = sanitizeNextPath(requestUrl.searchParams.get('next'), '/app');

	if (code) {
		const supabase = createClient(event);
		const { error } = await supabase.auth.exchangeCodeForSession(code);

		if (!error) {
			throw redirect(303, next);
		}
	}

	throw redirect(303, '/login?error=auth_callback_error');
}

