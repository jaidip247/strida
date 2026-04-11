import { expect, test } from 'playwright/test';

test.describe('Plan / Pro (unauthenticated)', () => {
	test('redirects /app/upgrade to login with next param', async ({ page }) => {
		const res = await page.goto('/app/upgrade');
		expect(res?.status()).toBeLessThan(400);
		await expect(page).toHaveURL(/\/login/);
		const u = new URL(page.url());
		expect(u.searchParams.get('next')).toContain('/app/upgrade');
	});

	test('redirects /app/insights to login', async ({ page }) => {
		await page.goto('/app/insights');
		await expect(page).toHaveURL(/\/login/);
	});

	test('redirects /app/progress to login', async ({ page }) => {
		await page.goto('/app/progress');
		await expect(page).toHaveURL(/\/login/);
	});

	test('marketing page loads', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/Strida/i);
		await expect(page.getByRole('link', { name: 'Strida' }).first()).toBeVisible();
	});
});

const e2eEmail = process.env.E2E_EMAIL;
const e2ePassword = process.env.E2E_PASSWORD;
const e2eHasCreds = Boolean(e2eEmail && e2ePassword);
const expectPaid = process.env.E2E_EXPECT_PLAN === 'paid';

const describeAuth = e2eHasCreds ? test.describe : test.describe.skip;

describeAuth('Plan / Pro (authenticated)', () => {
	test('after login, upgrade page matches expected plan', async ({ page }) => {
		await page.goto('/login');
		await page.locator('#email').fill(e2eEmail);
		await page.locator('#password').fill(e2ePassword);
		await page.getByRole('button', { name: /^Login$/i }).click();
		await page.waitForURL(/\/app/, { timeout: 30_000 });

		await page.goto('/app/upgrade');
		await expect(page.getByText('Strida Pro', { exact: true })).toBeVisible();

		if (expectPaid) {
			await expect(page.getByText('You already have Pro access.')).toBeVisible();
			await expect(page.getByRole('link', { name: /Back to app/i })).toBeVisible();
		} else {
			await expect(page.getByRole('button', { name: /Continue to checkout/i })).toBeVisible();
		}
	});

	test('paid plan can open insights and progress', async ({ page }) => {
		test.skip(!expectPaid, 'Set E2E_EXPECT_PLAN=paid to assert Pro routes');

		await page.goto('/login');
		await page.locator('#email').fill(e2eEmail);
		await page.locator('#password').fill(e2ePassword);
		await page.getByRole('button', { name: /^Login$/i }).click();
		await page.waitForURL(/\/app/, { timeout: 30_000 });

		await page.goto('/app/insights');
		await expect(page).not.toHaveURL(/\/app\/upgrade/);
		await expect(page.getByRole('heading', { name: /insights/i })).toBeVisible();

		await page.goto('/app/progress');
		await expect(page).not.toHaveURL(/\/app\/upgrade/);
		await expect(page.getByRole('heading', { name: /progress/i })).toBeVisible();
	});
});
