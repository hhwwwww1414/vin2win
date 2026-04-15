import { expect, test } from '@playwright/test';
import { attachQaGuards } from './helpers';
import { fillRequiredSalePassport, mockListingSession, openSaleWizard } from './listing-new-helpers';

test('listing/new exposes extended engine displacement options and swatch color picker', async ({
  page,
}, testInfo) => {
  const detachGuards = await attachQaGuards(page, testInfo);

  try {
    await mockListingSession(page);

    await openSaleWizard(page);
    await expect(page.getByRole('heading', { name: 'Паспорт и превью' })).toBeVisible();
    await expect(page.locator('label').filter({ hasText: 'Марка' })).toBeVisible();
    await expect(page.locator('label').filter({ hasText: 'Двигатель' })).toHaveCount(0);

    await fillRequiredSalePassport(page);
    await page.getByRole('button', { name: 'Далее' }).click();
    await expect(page.getByRole('button', { name: 'Техника' })).toBeVisible();

    const displacementSelect = page.locator('label').filter({ hasText: 'Объём двигателя' }).locator('select');
    await expect(displacementSelect).toBeVisible();

    const displacementOptions = await displacementSelect.locator('option').evaluateAll((options) =>
      options.map((option) => option.textContent?.trim() ?? '').filter(Boolean)
    );

    expect(displacementOptions).toContain('0,1');
    expect(displacementOptions).toContain('8,0');
    expect(displacementOptions).toContain('8,5');
    expect(displacementOptions).toContain('10,0');
    expect(displacementOptions.length).toBe(85);

    const colorTrigger = page.locator('[data-slot="color-swatch-trigger"]').first();
    await expect(colorTrigger).toBeVisible();
    await colorTrigger.click();

    await expect(page.getByRole('button', { name: 'Белый' })).toBeVisible();
    await page.getByRole('button', { name: 'Белый' }).click();
    await expect(colorTrigger).toContainText('Белый');
  } finally {
    await detachGuards();
  }
});

test('advanced filters expose engine displacement range and swatch colors', async ({ page }, testInfo) => {
  const detachGuards = await attachQaGuards(page, testInfo);

  try {
    await page.route('**://images.unsplash.com/**', async (route) => {
      await route.fulfill({ status: 204, body: '' });
    });

    await page.goto('/');
    await page.getByRole('button', { name: /Расширенный поиск/i }).click();

    const engineField = page.locator('label').filter({ hasText: 'Объём двигателя от / до' });
    await expect(engineField).toBeVisible();
    await expect(engineField.locator('[data-slot="select-trigger"]')).toHaveCount(2);

    const engineFromTrigger = engineField.locator('[data-slot="select-trigger"]').first();
    await engineFromTrigger.click();

    const engineOptions = page.locator('[data-slot="select-content"]').last();
    await expect(engineOptions).toBeVisible();
    await expect(engineOptions.getByText('0,1 л', { exact: true })).toBeVisible();
    await expect(engineOptions.getByText('8,0 л', { exact: true })).toBeVisible();
    await expect(engineOptions.getByText('8,5 л', { exact: true })).toBeVisible();
    await expect(engineOptions.getByText('10,0 л', { exact: true })).toBeVisible();

    await page.keyboard.press('Escape');

    const colorTrigger = page.locator('[data-slot="color-swatch-trigger"]').last();
    await expect(colorTrigger).toBeVisible();
    await colorTrigger.click();

    await expect(page.getByRole('button', { name: 'Белый' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Чёрный' })).toBeVisible();
    await page.getByRole('button', { name: 'Белый' }).click();
    await expect(colorTrigger).toContainText('Белый');
  } finally {
    await detachGuards();
  }
});
