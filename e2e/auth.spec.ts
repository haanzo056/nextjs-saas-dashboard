import { expect, test } from '@playwright/test';

test('redirects anonymous users to sign-in and back', async ({ page }) => {
  await page.goto('/w/acme/members');
  await expect(page).toHaveURL(/\/sign-in\?callbackUrl=/);

  await page.getByLabel('Email').fill('demo@pulse.dev');
  await page.getByLabel('Password').fill('demo1234');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/w\/acme\/members$/);
  await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible();
});

test('shows an error for bad credentials', async ({ page }) => {
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill('demo@pulse.dev');
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByText('Invalid email or password.')).toBeVisible();
  await expect(page).toHaveURL(/\/sign-in/);
});
