import { expect, test, type Page } from '@playwright/test';
import { attachQaGuards } from './helpers';
import { mockListingSession, openSaleWizard } from './listing-new-helpers';

async function mockVehicleCatalogChain(page: Page) {
  await page.route('**/api/vehicle-catalog/**', async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;
    const fuelTypeId = url.searchParams.get('fuelTypeId');

    const payloads: Record<string, { items: unknown[] }> = {
      '/api/vehicle-catalog/brands': {
        items: [{ id: 'brand_land-rover', label: 'Land Rover' }],
      },
      '/api/vehicle-catalog/models': {
        items: [{ id: 'model_range-rover-sport', label: 'Range Rover Sport', hint: '2005-2026' }],
      },
      '/api/vehicle-catalog/years': {
        items: [{ id: '2020', label: '2020' }],
      },
      '/api/vehicle-catalog/bodies': {
        items: [{ id: 'body_suv', label: 'Внедорожник' }],
      },
      '/api/vehicle-catalog/generations': {
        items: [{ id: 'generation_l494', label: '2013-2022, Second generation (L494)', hint: '2013-2022' }],
      },
      '/api/vehicle-catalog/fuel-types': {
        items: [
          { id: 'fuel_gasoline', label: 'Бензин' },
          { id: 'fuel_diesel', label: 'Дизель' },
        ],
      },
      '/api/vehicle-catalog/drive-types': {
        items: [{ id: 'drive_awd', label: 'Полный' }],
      },
      '/api/vehicle-catalog/transmissions': {
        items: [{ id: 'transmission_automatic', label: 'АКПП' }],
      },
      '/api/vehicle-catalog/modifications': {
        items:
          fuelTypeId === 'fuel_diesel'
            ? [
                {
                  id: 'mod_diesel',
                  label: '249 л.с. 3.0 дизель, полный привод, АКПП',
                  engineId: 'engine_diesel_3_0',
                  fuelTypeId: 'fuel_diesel',
                  transmissionId: 'transmission_automatic',
                  driveTypeId: 'drive_awd',
                  fuelLabel: 'Дизель',
                  transmissionLabel: 'АКПП',
                  driveLabel: 'Полный',
                  powerHp: 249,
                  engineVolumeL: 3,
                },
              ]
            : [
                {
                  id: 'mod_gasoline',
                  label: '340 л.с. 3.0 бензин, полный привод, АКПП',
                  engineId: 'engine_gasoline_3_0',
                  fuelTypeId: 'fuel_gasoline',
                  transmissionId: 'transmission_automatic',
                  driveTypeId: 'drive_awd',
                  fuelLabel: 'Бензин',
                  transmissionLabel: 'АКПП',
                  driveLabel: 'Полный',
                  powerHp: 340,
                  engineVolumeL: 3,
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

test('listing/new applies catalog modification data and resets dependent fields when fuel changes', async ({
  page,
}, testInfo) => {
  const detachGuards = await attachQaGuards(page, testInfo);

  try {
    await mockListingSession(page);
    await mockVehicleCatalogChain(page);
    await openSaleWizard(page);
    await selectComboboxValue(page, 'Марка', 'Land Rover');
    await selectComboboxValue(page, 'Модель', 'Range Rover Sport');
    await page.locator('label').filter({ hasText: 'Год' }).locator('select').selectOption('2020');
    await page.locator('label').filter({ hasText: 'Тип кузова' }).locator('select').selectOption('Внедорожник');
    await selectComboboxValue(page, 'Поколение', '2013-2022, Second generation (L494)');
    await selectComboboxValue(page, 'Область / край', 'Алтайский край');
    await selectComboboxValue(page, 'Город', 'Барнаул');
    await page.locator('label').filter({ hasText: 'Цена' }).locator('input').fill('3500000');
    await page.getByRole('button', { name: 'Далее' }).click();
    await expect(page.locator('label').filter({ hasText: 'Двигатель' })).toBeVisible();

    await page.locator('label').filter({ hasText: 'Двигатель' }).locator('select').selectOption('Бензин');
    await page
      .locator('label')
      .filter({ hasText: 'Модификация / комплектация' })
      .locator('select')
      .selectOption('mod_gasoline');

    await expect(page.locator('label').filter({ hasText: 'Мощность' }).locator('input')).toHaveValue('340');
    await expect(
      page.locator('label').filter({ hasText: 'Объём двигателя' }).locator('select')
    ).toHaveValue('3.0');
    await expect(page.getByRole('combobox', { name: 'Коробка' })).toHaveValue('АКПП');
    await expect(page.getByRole('combobox', { name: 'Привод' })).toHaveValue('Полный');

    await page.locator('label').filter({ hasText: 'Двигатель' }).locator('select').selectOption('Дизель');

    await expect(
      page.locator('label').filter({ hasText: 'Модификация / комплектация' }).locator('select')
    ).toHaveValue('');
    await expect(page.locator('label').filter({ hasText: 'Мощность' }).locator('input')).toHaveValue('');
    await expect(
      page.locator('label').filter({ hasText: 'Объём двигателя' }).locator('select')
    ).toHaveValue('');
  } finally {
    await detachGuards();
  }
});

async function selectComboboxValue(page: Page, label: string, value: string) {
  const field = page.locator('label').filter({ hasText: label });

  await field.getByRole('combobox').click();
  await page.locator('[cmdk-input]').last().fill(value);
  const option = page.locator('[cmdk-item]').filter({ hasText: value }).first();
  await expect(option).toBeVisible();
  await option.click();
  await expect(field.getByRole('combobox')).toContainText(value);
}
