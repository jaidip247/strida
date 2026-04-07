<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { ModeWatcher } from 'mode-watcher';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Light default aligns with marketing landing; users can still toggle dark in-app and on /. -->
<ModeWatcher defaultMode="light" />
{@render children()}
<Toaster richColors />
