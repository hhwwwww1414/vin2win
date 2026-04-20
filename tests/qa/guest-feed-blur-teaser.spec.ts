import { expect, test } from '@playwright/test';
import { attachQaGuards, getLocalQaEnv, loginAsAdmin } from './helpers';

function hasAdminCredentials() {
  const env = getLocalQaEnv();
  return Boolean(process.env.ADMIN_EMAIL || env.ADMIN_EMAIL) && Boolean(process.env.ADMIN_PASSWORD || env.ADMIN_PASSWORD);
}

test('guest sale feed blurs listings after the first three cards', async ({ page }, testInfo) => {
  const assertClean = await attachQaGuards(page, testInfo);

  await page.goto('/sale');

  const listingFeed = page
    .locator('main section')
    .filter({ has: page.locator('a[href^="/listing/"]') })
    .first();
  await expect(listingFeed).toBeVisible();

  const directItemsCount = await listingFeed.locator(':scope > *').count();
  expect(directItemsCount).toBeGreaterThan(3);

  const lockedItems = listingFeed.locator('[data-guest-listing-teaser-lock="true"]');
  await expect(lockedItems.first()).toBeVisible();
  await expect(page.getByRole('link', { name: /^Войти$/i }).first()).toHaveAttribute(
    'href',
    /\/login\?next=%2Fsale/
  );

  expect(await lockedItems.count()).toBe(directItemsCount - 3);

  await testInfo.attach('guest-sale-teaser-lock', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });

  await assertClean();
});

test('authenticated sale feed shows listings without teaser overlay', async ({ page }, testInfo) => {
  test.skip(!hasAdminCredentials(), 'ADMIN_EMAIL/ADMIN_PASSWORD are required for authenticated guest teaser QA.');

  const assertClean = await attachQaGuards(page, testInfo);

  await loginAsAdmin(page);
  await page.goto('/sale');

  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('[data-guest-listing-teaser-lock="true"]')).toHaveCount(0);

  await testInfo.attach('authenticated-sale-without-teaser-lock', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });

  await assertClean();
});
