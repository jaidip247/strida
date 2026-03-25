import { redirect } from '@sveltejs/kit';
import { sanitizeNextPath } from '$lib/utils/auth';

export async function load({ locals, url }) {
	const session = await locals.getSession();
	const next = sanitizeNextPath(url.searchParams.get('next'), '/app');

	if (session) {
		throw redirect(303, next);
	}
}
