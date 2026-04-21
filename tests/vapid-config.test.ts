import assert from 'node:assert/strict';
import { createECDH } from 'node:crypto';
import test from 'node:test';
import {
  deriveVapidPublicKeyFromPrivateKey,
  encodeBase64Url,
  normalizeVapidKey,
  resolveVapidPublicKey,
} from '@/lib/server/vapid-config';

function createVapidKeyPair() {
  const ecdh = createECDH('prime256v1');
  ecdh.generateKeys();

  return {
    publicKey: encodeBase64Url(ecdh.getPublicKey(undefined, 'uncompressed')),
    privateKey: encodeBase64Url(ecdh.getPrivateKey()),
  };
}

test('normalizeVapidKey trims whitespace and wrapping quotes', () => {
  assert.equal(normalizeVapidKey('  "abc-123"  '), 'abc-123');
});

test('deriveVapidPublicKeyFromPrivateKey rebuilds the matching public key', () => {
  const pair = createVapidKeyPair();

  assert.equal(deriveVapidPublicKeyFromPrivateKey(pair.privateKey), pair.publicKey);
});

test('resolveVapidPublicKey prefers the key derived from the private key', () => {
  const expectedPair = createVapidKeyPair();
  const mismatchedPair = createVapidKeyPair();

  assert.equal(
    resolveVapidPublicKey({
      publicKey: mismatchedPair.publicKey,
      privateKey: expectedPair.privateKey,
    }),
    expectedPair.publicKey,
  );
});
