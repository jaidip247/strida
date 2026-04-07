<script>
	import { Calendar as CalendarPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import * as Select from '$lib/components/ui/select/index.js';

	let {
		ref = $bindable(null),
		class: className,
		value,
		onchange,
		...restProps
	} = $props();
</script>

<span
	class={cn(
		'border-input shadow-xs relative flex min-w-0 rounded-md border',
		className
	)}
>
	<CalendarPrimitive.MonthSelect class="contents min-w-0" {...restProps}>
		{#snippet child({ props: monthProps, monthItems, selectedMonthItem })}
			{@const { onchange: monthOnChange, value: monthValue, ...monthTriggerAttrs } = monthProps}
			{@const effectiveMonth = value !== undefined ? value : monthValue}
			<Select.Root
				type="single"
				value={String(effectiveMonth)}
				disabled={monthTriggerAttrs.disabled === true}
				onValueChange={(v) => {
					const ev = { target: { value: v }, currentTarget: { value: v } };
					if (typeof onchange === 'function') onchange(ev);
					else monthOnChange?.(ev);
				}}
			>
				<Select.Trigger
					bind:ref
					{...monthTriggerAttrs}
					size="sm"
					class={cn(
						'border-0 shadow-none h-8 w-full min-w-[9rem] justify-between gap-1 rounded-md bg-transparent px-2 font-medium'
					)}
				>
					<span data-slot="select-value" class="truncate text-left text-sm">
						{monthItems.find((item) => item.value === effectiveMonth)?.label ??
							selectedMonthItem.label}
					</span>
				</Select.Trigger>
				<Select.Content align="start" class="max-h-72">
					{#each monthItems as monthItem (monthItem.value)}
						<Select.Item value={String(monthItem.value)} label={monthItem.label}>
							{monthItem.label}
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		{/snippet}
	</CalendarPrimitive.MonthSelect>
</span>
