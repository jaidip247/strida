import { redirect } from '@sveltejs/kit';

export async function load({ locals, url, params }) {
	const session = await locals.getSession();

	if (!session) {
		const next = `${url.pathname}${url.search}`;
		throw redirect(303, `/login?next=${encodeURIComponent(next)}`);
	}

	return { session, habitId: params.id };
}
