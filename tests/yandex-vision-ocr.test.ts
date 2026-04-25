import test from 'node:test';
import assert from 'node:assert/strict';
import { buildYandexOcrRequestPayload } from '@/lib/server/ocr/yandex-vision';

test('buildYandexOcrRequestPayload sends page OCR request with base64 file content', () => {
  const payload = buildYandexOcrRequestPayload({
    bytes: new Uint8Array(Buffer.from('ocr-test')),
    mimeType: 'image/jpeg',
  });

  assert.deepEqual(payload, {
    content: Buffer.from('ocr-test').toString('base64'),
    mimeType: 'image/jpeg',
    languageCodes: ['ru'],
    model: 'page',
  });
});
