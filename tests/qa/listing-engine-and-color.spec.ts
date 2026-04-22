import { expect, test, type Page } from '@playwright/test';
import { attachQaGuards } from './helpers';
import { fillRequiredSalePassport, mockListingSession, openSaleWizard } from './listing-new-helpers';

async function mockEngineCatalogChain(page: Page) {
  await page.route('**/api/vehicle-catalog/**', async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;

    const payloads: Record<string, { items: unknown[] }> = {
      '/api/vehicle-catalog/brands': {
        items: [{ id: 'brand_toyota', label: 'Toyota' }],
      },
      '/api/vehicle-catalog/models': {
        items: [{ id: 'model_camry', label: 'Camry', hint: '1982-2026' }],
      },
      '/api/vehicle-catalog/years': {
        items: [{ id: '2024', label: '2024' }],
      },
      '/api/vehicle-catalog/bodies': {
        items: [{ id: 'body_sedan', label: 'Седан' }],
      },
      '/api/vehicle-catalog/generations': {
        items: [{ id: 'generation_xv80', label: 'XV80', hint: '2024-' }],
      },
      '/api/vehicle-catalog/fuel-types': {
        items: [{ id: 'fuel_gasoline', label: 'Бензин' }],
      },
      '/api/vehicle-catalog/drive-types': {
        items: [{ id: 'drive_fwd', label: 'Передний' }],
      },
      '/api/vehicle-catalog/transmissions': {
        items: [{ id: 'transmission_automatic', label: 'АКПП' }],
      },
      '/api/vehicle-catalog/modifications': {
        items: [
          {
            id: 'mod_camry',
            label: '249 л.с. 2.5 бензин, передний привод, АКПП',
            engineId: 'engine_gasoline_2_5',
            fuelTypeId: 'fuel_gasoline',
            transmissionId: 'transmission_automatic',
            driveTypeId: 'drive_fwd',
            fuelLabel: 'Бензин',
            transmissionLabel: 'АКПП',
            driveLabel: 'Передний',
            powerHp: 249,
            engineVolumeL: 2.5,
          },
        ],
      },
    };

    const payload = payloads[pathname];
    if (!payload) {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });
  });
}

test('listing/new exposes extended engine displacement options and swatch color picker', async ({
  page,
}, testInfo) => {
  const detachGuards = await attachQaGuards(page, testInfo);

  try {
    await mockListingSession(page);
    await mockEngineCatalogChain(page);

    await openSaleWizard(page);
    await expect(page.getByRole('button', { name: 'Паспорт' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Техника' })).toHaveCount(0);
    await expect(page.locator('label').filter({ hasText: 'Марка' })).toBeVisible();
    await expect(page.locator('label').filter({ hasText: 'Двигатель' })).toHaveCount(0);

    await fillRequiredSalePassport(page);
    await page.locator('label').filter({ hasText: 'Привод' }).locator('select').selectOption('Передний');
    await page.locator('label').filter({ hasText: 'Коробка' }).locator('select').selectOption('АКПП');

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

    await page.goto('/sale');
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
