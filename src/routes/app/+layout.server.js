import { redirect } from '@sveltejs/kit';

export async function load({ locals, url }) {
	const session = await locals.getSession();

	if (!session) {
		const next = `${url.pathname}${url.search}`;
		throw redirect(303, `/login?next=${encodeURIComponent(next)}`);
	}

	const supabase = locals.supabase;
	const { data: account } = await supabase
		.from('User')
		.select('deleted_at')
		.eq('id', session.user.id)
		.maybeSingle();

	if (account?.deleted_at) {
		await supabase.auth.signOut();
		throw redirect(303, '/login?reason=account_closed');
	}

	return { session };
}
