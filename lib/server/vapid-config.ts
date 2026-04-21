import { createECDH } from 'node:crypto';

function stripWrappingQuotes(value: string) {
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === '\'' && last === '\'')) {
      return value.slice(1, -1);
    }
  }

  return value;
}

export function normalizeVapidKey(value?: string | null) {
  if (!value) {
    return undefined;
  }

  const normalized = stripWrappingQuotes(value.trim()).replace(/\s+/g, '');
  return normalized || undefined;
}

export function decodeBase64Url(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const normalized = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized, 'base64');
}

export function encodeBase64Url(value: Uint8Array) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export function isValidUncompressedP256PublicKey(value?: string | null) {
  const normalized = normalizeVapidKey(value);
  if (!normalized) {
    return false;
  }

  try {
    const bytes = decodeBase64Url(normalized);
    return bytes.length === 65 && bytes[0] === 0x04;
  } catch {
    return false;
  }
}

export function deriveVapidPublicKeyFromPrivateKey(value?: string | null) {
  const normalized = normalizeVapidKey(value);
  if (!normalized) {
    return undefined;
  }

  try {
    const ecdh = createECDH('prime256v1');
    ecdh.setPrivateKey(decodeBase64Url(normalized));
    return encodeBase64Url(ecdh.getPublicKey(undefined, 'uncompressed'));
  } catch {
    return undefined;
  }
}

export function resolveVapidPublicKey(input: {
  publicKey?: string | null;
  privateKey?: string | null;
}) {
  const derivedPublicKey = deriveVapidPublicKeyFromPrivateKey(input.privateKey);
  if (derivedPublicKey) {
    return derivedPublicKey;
  }

  const normalizedPublicKey = normalizeVapidKey(input.publicKey);
  if (isValidUncompressedP256PublicKey(normalizedPublicKey)) {
    return normalizedPublicKey;
  }

  return deriveVapidPublicKeyFromPrivateKey(input.privateKey);
}
