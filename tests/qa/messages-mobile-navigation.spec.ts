import { expect, test } from '@playwright/test';

function getChatQaCredentials() {
  const email = process.env.CHAT_QA_EMAIL;
  const password = process.env.CHAT_QA_PASSWORD;

  if (!email || !password) {
    test.skip(true, 'CHAT_QA_EMAIL or CHAT_QA_PASSWORD is not configured.');
  }

  return { email: email!, password: password! };
}

function escapeForRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('mobile chat cards open the selected thread', async ({ page }, testInfo) => {
  const { email, password } = getChatQaCredentials();
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  try {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.locator('main').getByRole('button', { name: /^войти$|^РІРѕР№С‚Рё$/i }).click();
    await page.waitForURL(/\/account/);

    await page.goto('/messages');

    const firstChat = page.locator('main a[href^="/messages/"]').first();
    await expect(firstChat).toBeVisible();

    const targetHref = await firstChat.getAttribute('href');
    expect(targetHref, 'Expected a chat card href in the messages list').toBeTruthy();

    await firstChat.click();
    await expect(page).toHaveURL(new RegExp(`${escapeForRegExp(targetHref!)}$`));
  } finally {
    await testInfo.attach('console-errors', {
      body: consoleErrors.join('\n\n'),
      contentType: 'text/plain',
    });
    expect(consoleErrors, 'Browser console errors detected').toEqual([]);
  }
});
