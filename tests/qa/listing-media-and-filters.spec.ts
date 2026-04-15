import path from 'node:path';
import { expect, test } from '@playwright/test';
import { attachQaGuards } from './helpers';
import { fillRequiredSalePassport, mockListingSession, openSaleWizard } from './listing-new-helpers';

const photoFixturePath = path.resolve(process.cwd(), 'public/cars/cruiser/cruiser.jpg');
const videoFixturePath = path.resolve(process.cwd(), 'public/cars/cruiser/cruiser.MOV');

test('listing/new keeps uploaded photo and video visible before submit', async ({ page }, testInfo) => {
  const detachGuards = await attachQaGuards(page, testInfo);

  try {
    await mockListingSession(page);
    await page.route('**://images.unsplash.com/**', async (route) => {
      await route.fulfill({ status: 204, body: '' });
    });

    await openSaleWizard(page);

    await fillRequiredSalePassport(page);
    await page.getByRole('button', { name: 'Далее' }).click();
    await page.locator('label').filter({ hasText: 'Двигатель' }).locator('select').selectOption({ index: 1 });
    await page.locator('label').filter({ hasText: 'Пробег' }).locator('input').fill('32000');
    await page.getByRole('button', { name: 'Далее' }).click();

    await page.locator('label').filter({ hasText: 'Владельцев' }).locator('input').fill('1');
    await page.getByRole('button', { name: 'Далее' }).click();

    const fileInputs = page.locator('input[type="file"]');
    await expect(fileInputs).toHaveCount(2);
    await fileInputs.nth(0).setInputFiles(photoFixturePath);

    const photoPreview = page.getByAltText('Фото 1');
    await expect(photoPreview).toBeVisible();

    const photoBounds = await photoPreview.boundingBox();
    expect(photoBounds?.height ?? 0).toBeGreaterThan(80);

    await fileInputs.nth(1).setInputFiles(videoFixturePath);
    await expect(page.locator('video')).toBeVisible();
  } finally {
    await detachGuards();
  }
});

test('advanced filters use themed dropdown surfaces in dark mode', async ({ page }, testInfo) => {
  const detachGuards = await attachQaGuards(page, testInfo);

  try {
    await page.route('**://images.unsplash.com/**', async (route) => {
      await route.fulfill({ status: 204, body: '' });
    });
    await page.goto('/sale');

    await page.getByRole('button', { name: /Расширенный поиск/i }).click();
    await expect(page.getByRole('heading', { name: 'Все фильтры' })).toBeVisible();

    const selectTriggers = page.locator('[data-slot="select-trigger"]');
    const yearFromTrigger = selectTriggers.nth(1);
    await expect(yearFromTrigger).toBeVisible();
    await yearFromTrigger.click();

    const yearOptions = page.locator('[data-slot="select-content"]').last();
    await expect(yearOptions).toBeVisible();
    await expect(yearOptions).not.toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(yearOptions.getByText('Любой', { exact: true })).toBeVisible();

    await page.keyboard.press('Escape');

    await selectTriggers.nth(3).click();

    const mileageOptions = page.locator('[data-slot="select-content"]').last();
    await expect(mileageOptions).toBeVisible();
    await expect(mileageOptions).not.toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(mileageOptions.getByText('от 0 км', { exact: true })).toBeVisible();
  } finally {
    await detachGuards();
  }
});
