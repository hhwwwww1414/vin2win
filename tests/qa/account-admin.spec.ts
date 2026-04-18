import { expect, test } from '@playwright/test';
import { attachQaGuards, loginAsAdmin } from './helpers';

test('listing/new keeps publisher entry surfaces after login', async ({ page }, testInfo) => {
  const detachGuards = await attachQaGuards(page, testInfo);

  try {
    await loginAsAdmin(page);
    await page.goto('/listing/new');

    await expect(page.locator('main h1').first()).toBeVisible();

    const scenarioButtons = page.locator('main').locator('section').nth(1).locator('button');
    await expect(scenarioButtons).toHaveCount(2);

    await scenarioButtons.first().click();
    await expect(page.getByText('Snapshot')).toBeVisible();
  } finally {
    await detachGuards();
  }
});

test('account dashboard keeps inbox and primary action surfaces', async ({ page }, testInfo) => {
  const detachGuards = await attachQaGuards(page, testInfo);

  try {
    await loginAsAdmin(page);
    await page.goto('/account');

    await expect(page.locator('main h1').first()).toBeVisible();
    await expect(page.locator('a[href="/listing/new"]').first()).toBeVisible();
    await expect(page.getByText('Inbox')).toBeVisible();
    await expect(page.getByRole('button', { name: /Редактировать профиль/i })).toBeVisible();
  } finally {
    await detachGuards();
  }
});

test('admin dashboard keeps control surface hierarchy', async ({ page }, testInfo) => {
  const detachGuards = await attachQaGuards(page, testInfo);

  try {
    await loginAsAdmin(page);
    await page.goto('/admin');

    await expect(page.locator('main h1').first()).toBeVisible();
    await expect(page.getByText('Admin control')).toBeVisible();
  } finally {
    await detachGuards();
  }
});
