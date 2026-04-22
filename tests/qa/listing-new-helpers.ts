import { expect, type Page } from '@playwright/test';

export async function mockListingSession(page: Page) {
  await page.route('**/api/auth/session', async (route) => {
    await route.fulfill({
      json: {
        authenticated: true,
        favoriteCount: 0,
        chatUnreadCount: 0,
        chatSoundEnabled: false,
        user: {
          id: 'qa-user',
          role: 'ADMIN',
          name: 'QA User',
          phone: '+7 999 000-00-00',
        },
      },
    });
  });

  await page.route('**/api/chat-presence*', async (route) => {
    await route.fulfill({ status: 204, body: '' });
  });

  await page.route('**/api/realtime/chat-events*', async (route) => {
    await route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
      body: ': connected\n\n',
    });
  });
}

export async function openSaleWizard(page: Page) {
  await page.goto('/listing/new');
  await page.getByRole('button', { name: /Продаю автомобиль/i }).click();
}

async function selectComboboxValue(page: Page, label: string, value: string) {
  const field = page.locator('label').filter({ hasText: label });

  await field.getByRole('combobox').click();
  await page.locator('[cmdk-input]').last().fill(value);
  const option = page.locator('[cmdk-item]').filter({ hasText: value }).first();
  await expect(option).toBeVisible();
  await option.click();
  await expect(field.getByRole('combobox')).toContainText(value);
}

async function selectFirstComboboxValue(page: Page, label: string) {
  const field = page.locator('label').filter({ hasText: label });

  await field.getByRole('combobox').click();
  const option = page.locator('[cmdk-item]').first();
  await expect(option).toBeVisible();
  const optionText = (await option.textContent())?.trim() ?? '';
  await option.click();
  await expect(field.getByRole('combobox')).toContainText(optionText);
}

async function selectFirstSelectValue(page: Page, label: string) {
  const select = page.locator('label').filter({ hasText: label }).locator('select');
  const values = await select
    .locator('option:not([disabled])')
    .evaluateAll((options) => options.map((option) => option.getAttribute('value') ?? '').filter(Boolean));

  expect(values.length).toBeGreaterThan(0);
  await select.selectOption(values[0]);
}

export async function fillRequiredSalePassport(page: Page) {
  await selectComboboxValue(page, 'Марка', 'Toyota');
  await selectComboboxValue(page, 'Модель', 'Camry');
  await page.locator('label').filter({ hasText: 'Год' }).locator('select').selectOption('2024');
  await page.locator('label').filter({ hasText: 'Кузов' }).locator('select').selectOption('Седан');
  const generationField = page.locator('label').filter({ hasText: 'Поколение' });
  if (await generationField.count()) {
    if (await generationField.getByRole('combobox').count()) {
      await selectFirstComboboxValue(page, 'Поколение');
    } else {
      await generationField.locator('input').fill('I');
    }
  }
  await selectComboboxValue(page, 'Город', 'Москва');
  await expect(page.locator('label').filter({ hasText: 'Область / край' }).locator('input')).toHaveValue(
    'Москва и Московская область'
  );
  await page.locator('label').filter({ hasText: 'Цена' }).locator('input').fill('2500000');
  await selectFirstSelectValue(page, 'Двигатель');
  await page.locator('label').filter({ hasText: 'Пробег' }).locator('input').fill('10000');
}
