import { absoluteUrl } from '@/lib/seo';

export const INDEXNOW_KEY =
  process.env.INDEXNOW_KEY ?? 'a0b1c2d3e4f5472a9b8c6d5e4f3a2b1c';
export const INDEXNOW_KEY_LOCATION = absoluteUrl(`/${INDEXNOW_KEY}.txt`);
const INDEXNOW_ENDPOINT = 'https://yandex.com/indexnow';

export async function pingIndexNow(urls: string[]) {
  const normalizedUrls = [...new Set(urls.filter(Boolean).map((url) => absoluteUrl(url)))];

  if (normalizedUrls.length === 0) {
    return;
  }

  try {
    await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        host: 'vin2win.ru',
        key: INDEXNOW_KEY,
        keyLocation: INDEXNOW_KEY_LOCATION,
        urlList: normalizedUrls,
      }),
      signal: AbortSignal.timeout(1500),
    });
  } catch {
    // Best-effort ping: publication/update/delete flows must not depend on IndexNow availability.
  }
}

// TODO: call pingIndexNow() after successful publish/update/delete for public sale and wanted listings.
