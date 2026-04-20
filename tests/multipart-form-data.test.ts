import assert from 'node:assert/strict';
import test from 'node:test';

async function loadMultipartModule() {
  try {
    return await import('../lib/server/multipart-form-data');
  } catch {
    assert.fail('parseMultipartRequest is not implemented yet');
  }
}

test('parseMultipartRequest accepts multipart files with RFC5987 filename parameters', async () => {
  const { parseMultipartRequest } = await loadMultipartModule();
  const boundary = '----vin2win-test-boundary';
  const body = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="payload"',
    '',
    '{"sellerName":"Vladimir"}',
    `--${boundary}`,
    `Content-Disposition: form-data; name="photos"; filename*=utf-8''%D1%82%D0%B5%D1%81%D1%82.jpg`,
    'Content-Type: image/jpeg',
    '',
    '123',
    `--${boundary}--`,
    '',
  ].join('\r\n');

  const request = new Request('http://localhost/api/listings', {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body,
  });

  const formData = await parseMultipartRequest(request);
  const payload = formData.get('payload');
  const photo = formData.get('photos');

  assert.equal(payload, '{"sellerName":"Vladimir"}');
  assert.ok(photo instanceof File);
  assert.equal(photo.name, 'тест.jpg');
  assert.equal(photo.type, 'image/jpeg');
  assert.equal(await photo.text(), '123');
});
