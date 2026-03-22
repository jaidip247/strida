import autoAdapter from '@sveltejs/adapter-auto';
import staticAdapter from '@sveltejs/adapter-static';

const isMobileBuild = process.env.BUILD_TARGET === 'mobile';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: isMobileBuild
			? staticAdapter({
					pages: 'build',
					assets: 'build',
					fallback: 'index.html'
				})
			: autoAdapter(),
		alias: {
			"@/*": "./src/*",
		},
		// Needed for Capacitor static shell; keeps client routing working in the app.
		prerender: isMobileBuild
			? {
					handleHttpError: 'ignore'
				}
			: undefined
	}
};

export default config;
