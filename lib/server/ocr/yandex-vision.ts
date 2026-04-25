export type YandexOcrRequestPayload = {
  content: string;
  mimeType: string;
  languageCodes: string[];
  model: 'page';
};

export type BuildYandexOcrRequestPayloadInput = {
  bytes: Uint8Array;
  mimeType: string;
};

export type RecognizeVehicleDocumentInput = {
  file: File;
  apiKey: string;
  endpoint: string;
  timeoutMs: number;
};

export function buildYandexOcrRequestPayload(input: BuildYandexOcrRequestPayloadInput): YandexOcrRequestPayload {
  return {
    content: Buffer.from(input.bytes).toString('base64'),
    mimeType: input.mimeType,
    languageCodes: ['ru'],
    model: 'page',
  };
}

export async function recognizeVehicleDocumentWithYandex(input: RecognizeVehicleDocumentInput): Promise<unknown> {
  const bytes = new Uint8Array(await input.file.arrayBuffer());
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs);

  try {
    const response = await fetch(input.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Api-Key ${input.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        buildYandexOcrRequestPayload({
          bytes,
          mimeType: input.file.type || 'image/jpeg',
        })
      ),
      signal: controller.signal,
    });

    const payload = (await response.json().catch(() => null)) as unknown;

    if (!response.ok) {
      throw new Error('Yandex OCR request failed.');
    }

    return payload;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Yandex OCR request timed out.');
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
