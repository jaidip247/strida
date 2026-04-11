export async function load({ parent, locals }) {
	const { plan } = await parent();
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();
	if (!user) {
		return { plan, habitCount: 0 };
	}
	const { count, error } = await locals.supabase
		.from('Habit')
		.select('*', { count: 'exact', head: true })
		.eq('user_id', user.id);

	if (error) {
		console.error('add page habit count load', error);
	}

	return {
		plan,
		habitCount: count ?? 0
	};
}
