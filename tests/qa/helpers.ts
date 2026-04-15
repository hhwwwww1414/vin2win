import fs from 'node:fs';
import path from 'node:path';
import { expect, type Page, type TestInfo } from '@playwright/test';

function parseDotEnv(raw: string) {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .reduce<Record<string, string>>((acc, line) => {
      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) {
        return acc;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      acc[key] = value;
      return acc;
    }, {});
}

export function getLocalQaEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    return {};
  }

  return parseDotEnv(fs.readFileSync(envPath, 'utf8'));
}

export async function attachQaGuards(page: Page, testInfo: TestInfo) {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  const ignoreConsolePatterns = [
    /_next\/webpack-hmr/i,
    /WebSocket connection .*webpack-hmr/i,
  ];
  const ignoreRequestPatterns = [/_next\/webpack-hmr/i];

  page.on('console', (message) => {
    const text = message.text();
    const isBenignCaretHydrationMismatch =
      /A tree hydrated but some attributes of the server rendered HTML didn't match the client properties/i.test(
        text
      ) && /caret-color:"transparent"/i.test(text);

    if (
      message.type() === 'error' &&
      !isBenignCaretHydrationMismatch &&
      !ignoreConsolePatterns.some((pattern) => pattern.test(text))
    ) {
      consoleErrors.push(text);
    }
  });

  page.on('requestfailed', (request) => {
    if (ignoreRequestPatterns.some((pattern) => pattern.test(request.url()))) {
      return;
    }

    const errorText = request.failure()?.errorText ?? 'unknown failure';
    const isBenignImageAbort = /_next\/image/i.test(request.url()) && /ERR_ABORTED/i.test(errorText);
    const isBenignVideoAbort = /\.(mov|mp4|webm)(\?|$)/i.test(request.url()) && /ERR_ABORTED/i.test(errorText);
    const isBenignBlobAbort = request.url().startsWith('blob:') && /ERR_ABORTED/i.test(errorText);
    const isBenignSessionAbort = /\/api\/auth\/session/i.test(request.url()) && /ERR_ABORTED/i.test(errorText);
    const isBenignRscAbort = /\?_rsc=/i.test(request.url()) && /ERR_ABORTED/i.test(errorText);
    const isBenignViewCounterAbort = /\/api\/listings\/[^/]+\/view/i.test(request.url()) && /ERR_ABORTED/i.test(errorText);
    const isBenignCompareAbort = /\/api\/listings\/compare/i.test(request.url()) && /ERR_ABORTED/i.test(errorText);
    const isBenignRemoteImageOrb =
      /s3\.twcstorage\.ru/i.test(request.url()) &&
      /\.(png|jpe?g|webp|gif)(\?|$)/i.test(request.url()) &&
      /ERR_BLOCKED_BY_ORB/i.test(errorText);

    if (
      isBenignImageAbort ||
      isBenignVideoAbort ||
      isBenignBlobAbort ||
      isBenignSessionAbort ||
      isBenignRscAbort ||
      isBenignViewCounterAbort ||
      isBenignCompareAbort ||
      isBenignRemoteImageOrb
    ) {
      return;
    }

    failedRequests.push(`${request.method()} ${request.url()} :: ${errorText}`);
  });

  return async () => {
    if (consoleErrors.length > 0) {
      await testInfo.attach('console-errors', {
        body: consoleErrors.join('\n\n'),
        contentType: 'text/plain',
      });
    }

    if (failedRequests.length > 0) {
      await testInfo.attach('failed-requests', {
        body: failedRequests.join('\n\n'),
        contentType: 'text/plain',
      });
    }

    expect(consoleErrors, 'Browser console errors detected').toEqual([]);
    expect(failedRequests, 'Failed network requests detected').toEqual([]);
  };
}

export async function getFirstListingPath(page: Page) {
  await page.goto('/sale');

  const href = await page.locator('a[href^="/listing/"]').evaluateAll((links) => {
    const candidate = links
      .map((link) => link.getAttribute('href'))
      .find((value) => value && /^\/listing\/(?!new$)[^/]+/.test(value));

    return candidate ?? null;
  });

  expect(href, 'Expected at least one public listing on the home page').toBeTruthy();
  return href as string;
}

export async function getFirstSellerPath(page: Page) {
  const listingPath = await getFirstListingPath(page);

  await page.goto(listingPath);

  const href = await page.locator('a[href^="/seller/"]').evaluateAll((links) => {
    const candidate = links
      .map((link) => link.getAttribute('href'))
      .find((value) => value && /^\/seller\/[^/]+$/.test(value));

    return candidate ?? null;
  });

  expect(href, 'Expected a seller profile link on the listing detail page').toBeTruthy();
  return href as string;
}

export async function getFirstWantedPath(page: Page) {
  await page.goto('/wanted');

  const href = await page.locator('a[href^="/wanted/"]').evaluateAll((links) => {
    const candidate = links
      .map((link) => link.getAttribute('href'))
      .find((value) => value && /^\/wanted\/[^/]+$/.test(value));

    return candidate ?? null;
  });

  return href as string | null;
}

export async function getFirstModeratedWantedPath(page: Page) {
  await loginAsAdmin(page);
  await page.goto('/admin');

  const href = await page.locator('a[href^="/wanted/"]').evaluateAll((links) => {
    const candidate = links
      .map((link) => link.getAttribute('href'))
      .find((value) => value && /^\/wanted\/[^/]+$/.test(value));

    return candidate ?? null;
  });

  expect(href, 'Expected at least one wanted detail link in admin moderation').toBeTruthy();
  return href as string;
}

export async function loginAsAdmin(page: Page) {
  const env = getLocalQaEnv();
  const email = process.env.ADMIN_EMAIL || env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD || env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL or ADMIN_PASSWORD is missing for Playwright login flow.');
  }

  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('main').getByRole('button', { name: /войти/i }).click();
  await page.waitForURL(/\/account/);
}
