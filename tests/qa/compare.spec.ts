import { expect, test } from '@playwright/test';
import { attachQaGuards } from './helpers';

test('compare tray opens a richer compare workspace', async ({ page }, testInfo) => {
  const assertClean = await attachQaGuards(page, testInfo);

  await page.goto('/sale');

  const compareButtons = page.locator('button[aria-label="Добавить к сравнению"]');
  await expect(compareButtons.first()).toBeVisible();

  await compareButtons.nth(0).click();

  await expect(page.getByText('Сравнение автомобилей').first()).toBeVisible();
  const openCompareLink = page.getByRole('link', { name: /Открыть сравнение/i });
  await expect(openCompareLink).toBeVisible();
  const compareHref = await openCompareLink.getAttribute('href');
  expect(compareHref).toBeTruthy();

  await page.goto(compareHref as string);
  await page.waitForURL(/\/compare\?/);

  await expect(page.locator('main h1').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: /Compare board/i })).toBeVisible();
  await expect(page.getByText('Параметры', { exact: true })).toBeVisible();

  await testInfo.attach('compare-workspace', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });

  await assertClean();
});
