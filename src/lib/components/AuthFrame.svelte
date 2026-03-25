<script>
	let {
		title = 'Welcome',
		description = '',
		children
	} = $props();
</script>

<section class="auth-shell">
	<div class="auth-paper">
		<div class="auth-panel">
			<header class="auth-header">
				<h1>{title}</h1>
				{#if description}
					<p>{description}</p>
				{/if}
			</header>
			<div class="auth-content">
				{@render children?.()}
			</div>
		</div>
	</div>
</section>

<style>
	.auth-shell {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 1.2rem;
	}

	.auth-paper {
		width: min(560px, 100%);
		border: 1px solid var(--line-strong);
		border-radius: 14px;
		background: var(--paper);
		box-shadow: var(--paper-shadow);
		overflow: hidden;
	}

	.auth-panel {
		padding: 2rem;
		max-width: 460px;
		margin: 0 auto;
	}

	.auth-header {
		margin-bottom: 1.2rem;
	}

	.auth-header h1 {
		font-size: 1.38rem;
		font-weight: 640;
		letter-spacing: -0.01em;
		color: var(--ink);
	}

	.auth-header p {
		margin-top: 0.35rem;
		color: var(--ink-soft);
		font-size: 0.94rem;
		max-width: 42ch;
	}

	@media (max-width: 768px) {
		.auth-panel {
			padding: 1.25rem;
		}
	}
</style>
