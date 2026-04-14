import { expect, test } from '@playwright/test';
import { attachQaGuards, getFirstListingPath } from './helpers';

test('listing detail exposes gallery controls on desktop', async ({ page }, testInfo) => {
  test.skip((page.viewportSize()?.width ?? 0) < 900, 'Desktop-only gallery flow.');

  const assertClean = await attachQaGuards(page, testInfo);
  const listingPath = await getFirstListingPath(page);

  await page.goto(listingPath);
  await expect(page.locator('main h1').first()).toBeVisible();
  await expect(page.getByText('Юр. чистота', { exact: true })).toBeVisible();

  const expandTrigger = page.getByRole('button', { name: /развернуть/i }).last();
  await expect(expandTrigger).toBeVisible();

  await testInfo.attach('listing-detail-desktop', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });

  await assertClean();
});

test('listing detail keeps mobile sticky CTA visible', async ({ page }, testInfo) => {
  test.skip((page.viewportSize()?.width ?? 0) > 640, 'Mobile-only CTA flow.');

  const assertClean = await attachQaGuards(page, testInfo);
  const listingPath = await getFirstListingPath(page);

  await page.goto(listingPath);
  await expect(page.locator('div.fixed button').first()).toBeVisible();

  await testInfo.attach('listing-detail-mobile', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });

  await assertClean();
});

test('guest submission CTA routes through login', async ({ page }, testInfo) => {
  test.skip((page.viewportSize()?.width ?? 0) < 900, 'Use desktop layout for the guest CTA regression check.');

  const assertClean = await attachQaGuards(page, testInfo);

  await page.goto('/');
  await expect(page.locator('header a[href="/login?next=%2Flisting%2Fnew"]').first()).toBeVisible();

  await testInfo.attach('guest-submit-cta', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });

  await assertClean();
});
