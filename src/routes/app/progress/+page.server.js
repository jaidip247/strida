import { redirect } from '@sveltejs/kit';

export async function load({ parent }) {
	const { plan } = await parent();
	if (plan !== 'paid') {
		throw redirect(303, '/app/upgrade?feature=progress');
	}
	return {};
}
