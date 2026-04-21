import { serverEnv } from './env';
import { deriveVapidPublicKeyFromPrivateKey, normalizeVapidKey } from './vapid-config';

export interface EffectiveVapidConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}

export function getEffectiveVapidPublicKey() {
  const privateKey = normalizeVapidKey(serverEnv.vapidPrivateKey);
  if (!privateKey) {
    return null;
  }

  return deriveVapidPublicKeyFromPrivateKey(privateKey) ?? null;
}

export function getEffectiveVapidConfig(): EffectiveVapidConfig | null {
  const privateKey = normalizeVapidKey(serverEnv.vapidPrivateKey);
  const publicKey = getEffectiveVapidPublicKey();

  if (!privateKey || !publicKey || !serverEnv.vapidSubject) {
    return null;
  }

  return {
    publicKey,
    privateKey,
    subject: serverEnv.vapidSubject,
  };
}
