import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { attachQaGuards } from './helpers';

test('home page smoke and visual structure', async ({ page }, testInfo) => {
  const assertClean = await attachQaGuards(page, testInfo);

  await page.goto('/');
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('h1').first()).toBeVisible();
  await expect(page.locator('section[aria-label="Быстрые фильтры"]')).toBeVisible();
  await expect(page.locator('main a[href^="/listing/"]').first()).toBeVisible();

  await testInfo.attach('home-screenshot', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });

  await assertClean();
});

test('mobile menu keeps a valid tap target', async ({ page }, testInfo) => {
  test.skip((page.viewportSize()?.width ?? 0) > 640, 'This check only matters on the mobile project.');

  const assertClean = await attachQaGuards(page, testInfo);

  await page.goto('/');

  const mobileMenuButton = page.locator('button[aria-expanded]').first();
  await expect(mobileMenuButton).toBeVisible();

  const bounds = await mobileMenuButton.boundingBox();
  expect(bounds?.width ?? 0).toBeGreaterThanOrEqual(44);
  expect(bounds?.height ?? 0).toBeGreaterThanOrEqual(44);

  await testInfo.attach('mobile-home-screenshot', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });

  await assertClean();
});

test('advanced filters sheet stays usable', async ({ page }, testInfo) => {
  const assertClean = await attachQaGuards(page, testInfo);

  await page.goto('/');
  await page.getByRole('button', { name: /Расширенный поиск/i }).click();

  const dialog = page.locator('[data-slot="sheet-content"]').first();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Все фильтры', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Диапазоны', { exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: /Применить фильтры/i })).toBeVisible();

  await testInfo.attach('advanced-filters-sheet', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });

  await assertClean();
});

test('wanted page keeps a strong hero and primary CTA', async ({ page }, testInfo) => {
  const assertClean = await attachQaGuards(page, testInfo);

  await page.goto('/wanted');
  await expect(page.locator('main h1').first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Создать запрос/i }).first()).toBeVisible();

  await testInfo.attach('wanted-page', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });

  await assertClean();
});

test('login page keeps auth surface and submit CTA', async ({ page }, testInfo) => {
  const assertClean = await attachQaGuards(page, testInfo);

  await page.goto('/login');
  await expect(page.locator('main h1').first()).toBeVisible();
  await expect(page.locator('main').getByRole('button', { name: /^Войти$/i })).toBeVisible();

  await testInfo.attach('login-page', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });

  await assertClean();
});

test('home page basic accessibility stays healthy', async ({ page }) => {
  await page.goto('/');

  const results = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze();

  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});

test('compact list mode keeps elevated price and split meta', async ({ page }, testInfo) => {
  const assertClean = await attachQaGuards(page, testInfo);

  await page.goto('/?view=compact');

  const row = page.locator('[data-testid="listing-compact-row"]').first();
  await expect(row).toBeVisible();
  await expect(row.locator('.price-primary')).toBeVisible();
  await expect(row.locator('.price-primary')).toContainText(/\d/);

  await testInfo.attach('compact-view', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });

  await assertClean();
});

test('table mode keeps sticky data header and highlighted numeric columns', async ({ page }, testInfo) => {
  const assertClean = await attachQaGuards(page, testInfo);

  await page.goto('/?view=table');

  const table = page.locator('table').first();
  await expect(table).toBeVisible();
  await expect(page.locator('thead th').first()).toBeVisible();
  await expect(page.locator('td[data-col="price"]').first()).toBeVisible();

  await page.locator('thead').getByRole('button').nth(1).click();
  await expect(page.locator('td[data-col="price"]').first()).toBeVisible();

  await testInfo.attach('table-view', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });

  await assertClean();
});
