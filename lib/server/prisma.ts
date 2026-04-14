import { PrismaClient } from '@prisma/client';
import { serverEnv } from './env';

declare global {
  var __prisma__: PrismaClient | undefined;
}

function createPrismaClient() {
  return new PrismaClient({
    datasourceUrl: serverEnv.databaseUrl,
  });
}

export const prisma = globalThis.__prisma__ ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma__ = prisma;
}
