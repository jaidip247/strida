import { test, expect } from '@playwright/test';

const viewports = [
	{ name: 'mobile-375', width: 375, height: 812 },
	{ name: 'mobile-430', width: 430, height: 932 },
	{ name: 'tablet-768', width: 768, height: 1024 },
	{ name: 'laptop-1024', width: 1024, height: 768 },
	{ name: 'desktop-1440', width: 1440, height: 900 }
];

test.describe('landing responsiveness', () => {
	for (const vp of viewports) {
		test(`home renders at ${vp.name}`, async ({ page }) => {
			await page.setViewportSize({ width: vp.width, height: vp.height });
			await page.goto('/');
			await expect(page.getByRole('heading', { level: 1 })).toContainText('Restart');
			await page.waitForTimeout(250);
			await page.screenshot({ path: `test-results/landing-${vp.name}.png`, fullPage: true });
		});
	}
});

