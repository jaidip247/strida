<script>
	import { Button } from '$lib/components/ui/button/index.js';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { HABITS_PAGE_SIZE } from '$lib/utils/pagination.js';

	let {
		totalItems = 0,
		pageSize = HABITS_PAGE_SIZE,
		page = $bindable(0)
	} = $props();

	const totalPages = $derived(Math.max(1, Math.ceil(totalItems / pageSize)));
	const safePage = $derived(Math.min(Math.max(0, page), totalPages - 1));
	const rangeFrom = $derived(totalItems === 0 ? 0 : safePage * pageSize + 1);
	const rangeTo = $derived(Math.min(totalItems, (safePage + 1) * pageSize));

	function goPrev() {
		page = Math.max(0, safePage - 1);
	}

	function goNext() {
		page = Math.min(totalPages - 1, safePage + 1);
	}

	// Keep parent bind:page aligned when totalItems shrinks or pageSize changes.
	$effect(() => {
		const clamped = safePage;
		if (page !== clamped) {
			page = clamped;
		}
	});
</script>

{#if totalItems > pageSize}
	<div class="habit-pagination" role="navigation" aria-label="Paged results">
		<p class="habit-pagination-meta">
			Showing {rangeFrom}–{rangeTo} of {totalItems}
		</p>
		<div class="habit-pagination-actions">
			<Button variant="outline" size="sm" type="button" disabled={safePage <= 0} onclick={goPrev}>
				<ChevronLeft class="size-4" aria-hidden="true" />
				Previous
			</Button>
			<span class="habit-pagination-pages" aria-live="polite">
				Page {safePage + 1} of {totalPages}
			</span>
			<Button
				variant="outline"
				size="sm"
				type="button"
				disabled={safePage >= totalPages - 1}
				onclick={goNext}
			>
				Next
				<ChevronRight class="size-4" aria-hidden="true" />
			</Button>
		</div>
	</div>
{/if}

<style>
	.habit-pagination {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--line);
	}

	.habit-pagination-meta {
		font-size: 0.8rem;
		color: var(--ink-soft);
		margin: 0;
	}

	.habit-pagination-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.habit-pagination-pages {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--ink-soft);
		order: -1;
		width: 100%;
		text-align: center;
	}

	@media (min-width: 480px) {
		.habit-pagination {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
		}

		.habit-pagination-pages {
			order: 0;
			width: auto;
			flex: 1;
		}
	}
</style>
