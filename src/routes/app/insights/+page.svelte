<script>
	import { Brain } from "@lucide/svelte";
</script>

<div class="page-container">
	<div class="page-header">
		<Brain size={24} />
		<h1>Insights</h1>
	</div>
	
	<div class="page-content">
		<p>Get insights and tips about your habits here.</p>
		<!-- Insights and analytics will go here -->
	</div>
</div>

<style>
	.page-container {
		padding: 2rem;
		max-width: 800px;
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 2rem;
	}

	.page-header h1 {
		font-size: 1.875rem;
		font-weight: 600;
	}

	.page-content {
		color: #666;
	}
</style>







