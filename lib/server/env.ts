type RequiredEnvKey =
  | 'POSTGRESQL_HOST'
  | 'POSTGRESQL_PORT'
  | 'POSTGRESQL_USER'
  | 'POSTGRESQL_PASSWORD'
  | 'POSTGRESQL_DBNAME'
  | 'S3_ENDPOINT'
  | 'S3_BUCKET'
  | 'S3_ACCESS_KEY'
  | 'S3_SECRET_KEY'
  | 'S3_PUBLIC_URL';

function getRequiredEnv(name: RequiredEnvKey): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getIntegerEnv(name: RequiredEnvKey): number {
  const raw = getRequiredEnv(name);
  const value = Number(raw);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer`);
  }

  return value;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function buildDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = getRequiredEnv('POSTGRESQL_HOST');
  const port = getIntegerEnv('POSTGRESQL_PORT');
  const user = encodeURIComponent(getRequiredEnv('POSTGRESQL_USER'));
  const password = encodeURIComponent(getRequiredEnv('POSTGRESQL_PASSWORD'));
  const dbName = encodeURIComponent(getRequiredEnv('POSTGRESQL_DBNAME'));

  return `postgresql://${user}:${password}@${host}:${port}/${dbName}?schema=public`;
}

function getBooleanEnv(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value == null) {
    return fallback;
  }

  return value === '1' || value.toLowerCase() === 'true';
}

function getOptionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function getPositiveIntegerEnv(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer`);
  }

  return parsed;
}

function getOptionalIntegerEnv(name: string): number | undefined {
  const value = process.env[name];
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer`);
  }

  return parsed;
}

export const serverEnv = {
  databaseUrl: buildDatabaseUrl(),
  s3Endpoint: trimTrailingSlash(getRequiredEnv('S3_ENDPOINT')),
  s3Bucket: getRequiredEnv('S3_BUCKET'),
  s3AccessKey: getRequiredEnv('S3_ACCESS_KEY'),
  s3SecretKey: getRequiredEnv('S3_SECRET_KEY'),
  s3PublicUrl: trimTrailingSlash(getRequiredEnv('S3_PUBLIC_URL')),
  s3Region: process.env.S3_REGION ?? 'us-east-1',
  s3ForcePathStyle: getBooleanEnv('S3_FORCE_PATH_STYLE', true),
  sessionCookieName: process.env.SESSION_COOKIE_NAME?.trim() || 'vin2win_session',
  sessionTtlDays: getPositiveIntegerEnv('SESSION_TTL_DAYS', 30),
  adminEmail: getOptionalEnv('ADMIN_EMAIL')?.toLowerCase(),
  adminPassword: getOptionalEnv('ADMIN_PASSWORD'),
  adminName: getOptionalEnv('ADMIN_NAME') ?? 'vin2win admin',
  adminPhone: getOptionalEnv('ADMIN_PHONE'),
  smtpHost: getOptionalEnv('SMTP_HOST'),
  smtpPort: getOptionalIntegerEnv('SMTP_PORT'),
  smtpUser: getOptionalEnv('SMTP_USER'),
  smtpPassword: getOptionalEnv('SMTP_PASSWORD'),
  smtpFrom: getOptionalEnv('SMTP_FROM'),
  smtpSecure: getBooleanEnv('SMTP_SECURE', false),
  telegramBotToken: getOptionalEnv('TELEGRAM_BOT_TOKEN'),
  telegramApiBase: trimTrailingSlash(getOptionalEnv('TELEGRAM_API_BASE') ?? 'https://api.telegram.org'),
  telegramDefaultChatId: getOptionalEnv('TELEGRAM_DEFAULT_CHAT_ID'),
  telegramBotUsername: getOptionalEnv('NEXT_PUBLIC_TELEGRAM_BOT_USERNAME'),
  vapidPublicKey: getOptionalEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY'),
  vapidPrivateKey: getOptionalEnv('VAPID_PRIVATE_KEY'),
  vapidSubject: getOptionalEnv('VAPID_SUBJECT') ?? 'mailto:admin@vin2win.ru',
};
