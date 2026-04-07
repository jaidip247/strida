<script>
	import { Calendar as CalendarPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import * as Select from '$lib/components/ui/select/index.js';

	let {
		ref = $bindable(null),
		class: className,
		value,
		...restProps
	} = $props();
</script>

<span
	class={cn(
		'border-input shadow-xs relative flex min-w-0 rounded-md border',
		className
	)}
>
	<CalendarPrimitive.YearSelect class="contents min-w-0" {...restProps}>
		{#snippet child({ props: yearProps, yearItems, selectedYearItem })}
			{@const { onchange: yearOnChange, value: yearValue, ...yearTriggerAttrs } = yearProps}
			{@const effectiveYear = value !== undefined ? value : yearValue}
			<Select.Root
				type="single"
				value={String(effectiveYear)}
				disabled={yearTriggerAttrs.disabled === true}
				onValueChange={(v) => yearOnChange?.({ target: { value: v } })}
			>
				<Select.Trigger
					bind:ref
					{...yearTriggerAttrs}
					size="sm"
					class={cn(
						'border-0 shadow-none h-8 w-full min-w-[5rem] justify-between gap-1 rounded-md bg-transparent px-2 font-medium'
					)}
				>
					<span data-slot="select-value" class="truncate text-left text-sm">
						{yearItems.find((item) => item.value === effectiveYear)?.label ??
							selectedYearItem.label}
					</span>
				</Select.Trigger>
				<Select.Content align="start" class="max-h-72">
					{#each yearItems as yearItem (yearItem.value)}
						<Select.Item value={String(yearItem.value)} label={yearItem.label}>
							{yearItem.label}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		{/snippet}
	</CalendarPrimitive.YearSelect>
</span>
