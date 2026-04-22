import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { attachQaGuards } from './helpers';

test('home page smoke and visual structure', async ({ page }, testInfo) => {
  const assertClean = await attachQaGuards(page, testInfo);

  await page.goto('/');
  await expect(page.locator('main')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Профессиональный авторынок/i })).toBeVisible();
  await expect(page.locator('main a[href="/sale"]').first()).toBeVisible();
  await expect(page.locator('main a[href="/listing/new"]').first()).toBeVisible();
  await expect(page.locator('section[aria-label="Быстрые фильтры"]')).toHaveCount(0);

  await testInfo.attach('home-screenshot', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });

  await assertClean();
});

test('sale page keeps marketplace feed and quick filters', async ({ page }, testInfo) => {
  const assertClean = await attachQaGuards(page, testInfo);

  await page.goto('/sale');
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('h1').first()).toBeVisible();
  await expect(page.locator('section[aria-label="Быстрые фильтры"]')).toBeVisible();
  await expect(page.locator('main a[href^="/listing/"]').first()).toBeVisible();

  await testInfo.attach('sale-screenshot', {
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

  await page.goto('/sale');
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

test('advanced filters header stays stable after selecting a filter', async ({ page }, testInfo) => {
  const assertClean = await attachQaGuards(page, testInfo);

  await page.route('**://images.unsplash.com/**', async (route) => {
    await route.fulfill({ status: 204, body: '' });
  });

  await page.goto('/sale');
  await page.getByRole('button', { name: /Расширенный поиск/i }).click();

  const dialog = page.locator('[data-slot="sheet-content"]').first();
  const closeButton = dialog.getByRole('button', { name: /close/i });
  const inactiveBadge = dialog.getByText('Базовый набор', { exact: true });
  const scrollRegion = dialog.locator('div.min-h-0.flex-1.overflow-y-auto').first();
  const targetFilter = dialog.locator('label').filter({ hasText: 'Есть цена в руки' }).first();

  await expect.poll(async () => (await dialog.boundingBox())?.x ?? Number.POSITIVE_INFINITY).toBeLessThan(1000);

  await expect(dialog).toBeVisible();
  await expect(closeButton).toBeVisible();
  await expect(inactiveBadge).toBeVisible();
  await expect(targetFilter).toBeVisible();

  const inactiveBadgeBox = await inactiveBadge.boundingBox();
  const closeButtonBox = await closeButton.boundingBox();

  expect(inactiveBadgeBox).not.toBeNull();
  expect(closeButtonBox).not.toBeNull();
  expect((inactiveBadgeBox?.x ?? 0) + (inactiveBadgeBox?.width ?? 0)).toBeLessThanOrEqual((closeButtonBox?.x ?? 0) - 4);

  await targetFilter.scrollIntoViewIfNeeded();

  const scrollBefore = await scrollRegion.evaluate((element) => element.scrollTop);
  const filterBoxBefore = await targetFilter.boundingBox();

  await targetFilter.click();

  const activeBadge = dialog.getByText(/1 активн/i).first();
  await expect(activeBadge).toBeVisible();

  const scrollAfter = await scrollRegion.evaluate((element) => element.scrollTop);
  const filterBoxAfter = await targetFilter.boundingBox();
  const activeBadgeBox = await activeBadge.boundingBox();
  const closeButtonBoxAfter = await closeButton.boundingBox();

  expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThanOrEqual(12);
  expect(Math.abs((filterBoxAfter?.y ?? 0) - (filterBoxBefore?.y ?? 0))).toBeLessThanOrEqual(12);
  expect(activeBadgeBox).not.toBeNull();
  expect(closeButtonBoxAfter).not.toBeNull();
  expect((activeBadgeBox?.x ?? 0) + (activeBadgeBox?.width ?? 0)).toBeLessThanOrEqual((closeButtonBoxAfter?.x ?? 0) - 4);

  await testInfo.attach('advanced-filters-header-stability', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });

  await assertClean();
});

test('advanced filters combobox keeps scrolling inside the sheet', async ({ page }, testInfo) => {
  const assertClean = await attachQaGuards(page, testInfo);

  await page.goto('/sale');
  await page.getByRole('button', { name: /Расширенный поиск/i }).click();

  const dialog = page.locator('[data-slot="sheet-content"]').first();
  const regionField = dialog.locator('label').filter({ hasText: 'Область / край' }).first();

  await expect.poll(async () => (await dialog.boundingBox())?.x ?? Number.POSITIVE_INFINITY).toBeLessThan(1000);

  await regionField.getByRole('combobox').click();

  const list = page.locator('[cmdk-list]').last();
  await expect(list).toBeVisible();
  await list.hover();

  const scrollBefore = await list.evaluate((element) => {
    element.scrollTop = 0;
    return element.scrollTop;
  });

  await page.mouse.wheel(0, 420);

  const scrollAfter = await list.evaluate((element) => element.scrollTop);
  expect(scrollBefore).toBe(0);
  expect(scrollAfter).toBeGreaterThan(0);

  await assertClean();
});

test('wanted page keeps a strong hero and routes request CTA into wanted flow', async ({ page }, testInfo) => {
  const assertClean = await attachQaGuards(page, testInfo);

  await page.goto('/wanted');
  await expect(page.locator('main h1').first()).toBeVisible();
  await expect(page.locator('main a[href="/listing/new?scenario=wanted"]').first()).toBeVisible();
  await expect(page.locator('main a[href="/listing/new"]')).toHaveCount(0);

  await testInfo.attach('wanted-page', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });

  await assertClean();
});

test('wanted creation gate preserves the wanted scenario through auth links', async ({ page }, testInfo) => {
  const assertClean = await attachQaGuards(page, testInfo);

  await page.goto('/listing/new?scenario=wanted');
  await expect(page.locator('main').getByRole('link', { name: /^Войти$/i })).toHaveAttribute(
    'href',
    '/login?next=%2Flisting%2Fnew%3Fscenario%3Dwanted'
  );
  await expect(page.locator('main').getByRole('link', { name: /Зарегистрироваться/i })).toHaveAttribute(
    'href',
    '/register?next=%2Flisting%2Fnew%3Fscenario%3Dwanted'
  );

  await testInfo.attach('wanted-create-gate', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });

  await assertClean();
});

test('login page keeps auth surface, submit CTA and telegram entry', async ({ page }, testInfo) => {
  const assertClean = await attachQaGuards(page, testInfo);

  await page.goto('/login');
  await expect(page.locator('main h1').first()).toBeVisible();
  await expect(page.locator('main').getByRole('button', { name: /^Войти$/i })).toBeVisible();
  await expect(page.locator('main').getByText(/Telegram/i).first()).toBeVisible();

  await testInfo.attach('login-page', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });

  await assertClean();
});

test('register page keeps legal consent and placeholder legal links', async ({ page }, testInfo) => {
  const assertClean = await attachQaGuards(page, testInfo);

  await page.goto('/register');
  await expect(page.locator('main h1').first()).toBeVisible();
  await expect(page.getByTestId('birth-date-trigger')).toBeVisible();
  await expect(page.getByRole('checkbox')).toBeVisible();
  await expect(page.locator('main a[href="/privacy-policy"]').first()).toBeVisible();
  await expect(page.locator('main a[href="/user-agreement"]').first()).toBeVisible();

  await testInfo.attach('register-page', {
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

  await page.goto('/sale?view=compact');

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

  await page.goto('/sale?view=table');

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
