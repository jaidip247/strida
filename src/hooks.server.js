import { createClient } from '$lib/supabase/server';

export async function handle({ event, resolve }) {
	event.locals.supabase = createClient(event);

	/**
	 * a little helper that is written for convenience so that instead
	 * of calling `const { data: { session } } = await event.locals.supabase.auth.getSession()`
	 * you can just call `await event.locals.getSession()`
	 */
	event.locals.getSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		return session;
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range';
		}
	});
}

