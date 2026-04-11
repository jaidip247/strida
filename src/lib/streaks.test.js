import { describe, it, expect } from 'vitest';
import { computeStreakStats } from './streaks.js';

describe('computeStreakStats', () => {
	it('returns zeros when no completions', () => {
		expect(computeStreakStats([], '2026-04-01', '2026-04-30', '2026-04-07')).toEqual({
			currentStreak: 0,
			bestStreak: 0,
			lastCompletedDate: null
		});
	});

	it('single completed day: best 1, current alive if today or yesterday', () => {
		const r = computeStreakStats(['2026-04-07'], '2026-04-01', '2026-04-30', '2026-04-07');
		expect(r.bestStreak).toBe(1);
		expect(r.currentStreak).toBe(1);
		expect(r.lastCompletedDate).toBe('2026-04-07');
	});

	it('current zero when last completion was two+ calendar days ago', () => {
		const r = computeStreakStats(['2026-04-05'], '2026-04-01', '2026-04-30', '2026-04-07');
		expect(r.currentStreak).toBe(0);
		expect(r.bestStreak).toBe(1);
	});

	it('yesterday completion keeps streak alive with run length', () => {
		const r = computeStreakStats(
			['2026-04-05', '2026-04-06'],
			'2026-04-01',
			'2026-04-30',
			'2026-04-07'
		);
		expect(r.currentStreak).toBe(2);
		expect(r.bestStreak).toBe(2);
	});

	it('best streak can exceed current when last run is broken', () => {
		const r = computeStreakStats(
			['2026-04-01', '2026-04-02', '2026-04-03', '2026-04-10'],
			'2026-04-01',
			'2026-04-30',
			'2026-04-12'
		);
		expect(r.bestStreak).toBe(3);
		expect(r.currentStreak).toBe(0);
	});

	it('ignores dates outside window', () => {
		const r = computeStreakStats(
			['2026-03-28', '2026-04-01', '2026-04-02'],
			'2026-04-01',
			'2026-04-30',
			'2026-04-07'
		);
		expect(r.lastCompletedDate).toBe('2026-04-02');
		expect(r.bestStreak).toBe(2);
	});

	it('future last completion yields current zero', () => {
		const r = computeStreakStats(['2026-04-10'], '2026-04-01', '2026-04-30', '2026-04-07');
		expect(r.currentStreak).toBe(0);
	});
});
