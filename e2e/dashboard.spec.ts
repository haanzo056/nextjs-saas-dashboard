import { expect, test, type Page } from '@playwright/test';

async function signIn(page: Page, email: string) {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('demo1234');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/\/w\//);
}

test('owner sees metrics and can switch range', async ({ page }) => {
  await signIn(page, 'demo@pulse.dev');
  await expect(page.getByRole('heading', { name: 'Acme Analytics' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Top pages' })).toBeVisible();

  const metrics = page.waitForResponse((r) => r.url().includes('/metrics?range=7d') && r.ok());
  await page.getByRole('radio', { name: '7 days' }).click();
  await metrics;
  await expect(page).toHaveURL(/range=7d/);
});

test('members cannot see the audit log', async ({ page }) => {
  await signIn(page, 'lee@pulse.dev');
  await expect(page.getByRole('link', { name: 'Audit log' })).toHaveCount(0);

  const res = await page.goto('/w/acme/audit');
  expect(res?.status()).toBe(404);
});
