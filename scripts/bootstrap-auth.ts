import './load-env';
import { randomBytes, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import { ProfileType, UserRole } from '@prisma/client';
import { serverEnv } from '../lib/server/env';
import { prisma } from '../lib/server/prisma';

const scrypt = promisify(scryptCallback);
const PASSWORD_HASH_PREFIX = 'scrypt';
const PASSWORD_KEY_LENGTH = 64;

function getCurrentYearString(): string {
  return String(new Date().getFullYear());
}

async function hashPassword(password: string): Promise<string> {
  const normalized = password.trim();
  if (normalized.length < 7) {
    throw new Error('ADMIN_PASSWORD must contain at least 7 characters.');
  }

  const salt = randomBytes(16);
  const derivedKey = (await scrypt(normalized, salt, PASSWORD_KEY_LENGTH)) as Buffer;
  return [PASSWORD_HASH_PREFIX, salt.toString('hex'), derivedKey.toString('hex')].join(':');
}

async function claimOrphanedListings(userId: string) {
  const [saleResult, wantedResult] = await Promise.all([
    prisma.saleListing.updateMany({
      where: {
        createdByUserId: null,
      },
      data: {
        createdByUserId: userId,
      },
    }),
    prisma.wantedListing.updateMany({
      where: {
        createdByUserId: null,
      },
      data: {
        createdByUserId: userId,
      },
    }),
  ]);

  return {
    sale: saleResult.count,
    wanted: wantedResult.count,
  };
}

async function main() {
  if (!serverEnv.adminEmail || !serverEnv.adminPassword) {
    console.log('ADMIN_EMAIL / ADMIN_PASSWORD are not configured. Skipping auth bootstrap.');
    return;
  }

  const existing = await prisma.user.findUnique({
    where: {
      email: serverEnv.adminEmail,
    },
    include: {
      sellerProfile: true,
    },
  });

  if (!existing) {
    const passwordHash = await hashPassword(serverEnv.adminPassword);
    const created = await prisma.user.create({
      data: {
        email: serverEnv.adminEmail,
        passwordHash,
        name: serverEnv.adminName,
        phone: serverEnv.adminPhone,
        role: UserRole.ADMIN,
        sellerProfile: {
          create: {
            name: serverEnv.adminName,
            profileType: ProfileType.PERSON,
            verified: true,
            onPlatformSince: getCurrentYearString(),
            phone: serverEnv.adminPhone,
          },
        },
      },
    });

    const claimed = await claimOrphanedListings(created.id);

    console.log(`Created admin user ${created.email}`);
    console.log(`Claimed orphaned listings: sale=${claimed.sale}, wanted=${claimed.wanted}`);
    return;
  }

  await prisma.user.update({
    where: {
      id: existing.id,
    },
    data: {
      role: UserRole.ADMIN,
      name: serverEnv.adminName,
      phone: serverEnv.adminPhone,
    },
  });

  if (!existing.sellerProfile) {
    await prisma.sellerProfile.create({
      data: {
        userId: existing.id,
        name: serverEnv.adminName,
        profileType: ProfileType.PERSON,
        verified: true,
        onPlatformSince: getCurrentYearString(),
        phone: serverEnv.adminPhone,
      },
    });
  } else {
    await prisma.sellerProfile.update({
      where: {
        id: existing.sellerProfile.id,
      },
      data: {
        name: serverEnv.adminName,
        phone: serverEnv.adminPhone,
        verified: true,
      },
    });
  }

  const claimed = await claimOrphanedListings(existing.id);

  console.log(`Synced admin user ${existing.email}`);
  console.log(`Claimed orphaned listings: sale=${claimed.sale}, wanted=${claimed.wanted}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
