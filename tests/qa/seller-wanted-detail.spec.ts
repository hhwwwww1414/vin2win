import { expect, test } from '@playwright/test';
import { attachQaGuards, getFirstModeratedWantedPath, getFirstSellerPath, getFirstWantedPath } from './helpers';

test('seller profile keeps trust hero and active listing feed', async ({ page }, testInfo) => {
  const assertClean = await attachQaGuards(page, testInfo);
  const sellerPath = await getFirstSellerPath(page);

  await page.goto(sellerPath);
  await expect(page.locator('main h1').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: /Активные объявления/i })).toBeVisible();
  await expect(page.locator('main a[href^="/listing/"]').first()).toBeVisible();

  await testInfo.attach('seller-profile', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });

  await assertClean();
});

test('wanted detail keeps briefing and response rail visible', async ({ page }, testInfo) => {
  const assertClean = await attachQaGuards(page, testInfo);
  const wantedPath = (await getFirstWantedPath(page)) ?? (await getFirstModeratedWantedPath(page));

  await page.goto(wantedPath);
  await expect(page.locator('main h1').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: /Технический бриф/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Ответить на запрос/i })).toBeVisible();

  await testInfo.attach('wanted-detail', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });

  await assertClean();
});
