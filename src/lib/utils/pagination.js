/** Default page size for habit lists (today view, progress tabs, insights). */
export const HABITS_PAGE_SIZE = 10;

/**
 * Inclusive Supabase `.range(from, to)` bounds for a zero-based page index.
 * @param {number} pageIndex
 * @param {number} [pageSize=HABITS_PAGE_SIZE]
 */
export function getPageRange(pageIndex, pageSize = HABITS_PAGE_SIZE) {
	const from = pageIndex * pageSize;
	return { from, to: from + pageSize - 1 };
}

/**
 * @template T
 * @param {T[]} items
 * @param {number} pageIndex
 * @param {number} [pageSize=HABITS_PAGE_SIZE]
 * @returns {{ items: T[]; page: number; totalPages: number; total: number; rangeFrom: number; rangeTo: number }}
 */
export function getHabitPageSlice(items, pageIndex, pageSize = HABITS_PAGE_SIZE) {
	const list = items ?? [];
	const total = list.length;
	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	const page = Math.min(Math.max(0, pageIndex), totalPages - 1);
	const start = page * pageSize;
	const slice = list.slice(start, start + pageSize);
	return {
		items: slice,
		page,
		totalPages,
		total,
		rangeFrom: total === 0 ? 0 : start + 1,
		rangeTo: start + slice.length
	};
}
