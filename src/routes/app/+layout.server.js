import { redirect } from '@sveltejs/kit';

export async function load({ locals, url }) {
	const session = await locals.getSession();

	if (!session) {
		const next = `${url.pathname}${url.search}`;
		throw redirect(303, `/login?next=${encodeURIComponent(next)}`);
	}

	const supabase = locals.supabase;
	const { data: account, error: accountError } = await supabase
		.from('User')
		.select('deleted_at, plan')
		.eq('id', session.user.id)
		.maybeSingle();

	// Missing migration 009: column "plan" does not exist — fall back to free tier.
	if (accountError?.code === '42703') {
		return { session, plan: /** @type {'free' | 'paid'} */ ('free') };
	}

	if (account?.deleted_at) {
		await supabase.auth.signOut();
		throw redirect(303, '/login?reason=account_closed');
	}

	/** @type {'free' | 'paid'} */
	const plan = account?.plan === 'paid' ? 'paid' : 'free';

	return { session, plan };
}
