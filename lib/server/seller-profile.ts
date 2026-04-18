import { ProfileType, type SellerProfile as PrismaSellerProfile } from '@prisma/client';
import type { SellerProfile } from '@/lib/types';
import { prisma } from './prisma';

interface SellerProfileRecordShape {
  id: string;
  legacyId: string | null;
  name: string;
  profileType: ProfileType;
  verified: boolean;
  onPlatformSince: string;
  phone: string | null;
  about: string | null;
  avatarUrl: string | null;
  avatarStorageKey: string | null;
  coverUrl: string | null;
  coverStorageKey: string | null;
  avatarCropX: number | null;
  avatarCropY: number | null;
  avatarZoom: number | null;
  coverCropX: number | null;
  coverCropY: number | null;
}

export interface UpdateAccountSellerProfileInput {
  name: string;
  phone?: string | null;
  about?: string | null;
  avatarUrl?: string | null;
  avatarStorageKey?: string | null;
  coverUrl?: string | null;
  coverStorageKey?: string | null;
  avatarCropX?: number | null;
  avatarCropY?: number | null;
  avatarZoom?: number | null;
  coverCropX?: number | null;
  coverCropY?: number | null;
}

export interface UpdateAccountSellerProfileResult {
  sellerProfile: SellerProfile;
  replacedStorageKeys: string[];
}

function normalizeOptionalString(value: string | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeOptionalNumber(value: number | null | undefined, fallback?: number) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || !Number.isFinite(value)) {
    return fallback ?? null;
  }

  return value;
}

export function mapSellerProfileRecord(profile: SellerProfileRecordShape): SellerProfile {
  return {
    id: profile.id,
    legacyId: profile.legacyId ?? undefined,
    name: profile.name,
    type: profile.profileType === ProfileType.COMPANY ? 'company' : 'person',
    verified: profile.verified,
    onPlatformSince: profile.onPlatformSince,
    phone: profile.phone ?? undefined,
    about: profile.about ?? undefined,
    avatarUrl: profile.avatarUrl ?? undefined,
    avatarStorageKey: profile.avatarStorageKey ?? undefined,
    coverUrl: profile.coverUrl ?? undefined,
    coverStorageKey: profile.coverStorageKey ?? undefined,
    avatarCropX: profile.avatarCropX ?? undefined,
    avatarCropY: profile.avatarCropY ?? undefined,
    avatarZoom: profile.avatarZoom ?? undefined,
    coverCropX: profile.coverCropX ?? undefined,
    coverCropY: profile.coverCropY ?? undefined,
  };
}

export async function getEditableSellerProfileByUserId(userId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      sellerProfile: true,
    },
  });

  if (!user) {
    return null;
  }

  if (!user.sellerProfile) {
    return null;
  }

  return mapSellerProfileRecord(user.sellerProfile);
}

export async function updateAccountSellerProfile(
  userId: string,
  input: UpdateAccountSellerProfileInput
): Promise<UpdateAccountSellerProfileResult> {
  const name = input.name.trim();

  if (!name) {
    throw new Error('Имя продавца не может быть пустым.');
  }

  const currentUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      sellerProfile: true,
    },
  });

  if (!currentUser) {
    throw new Error('Пользователь не найден.');
  }

  const phone = normalizeOptionalString(input.phone);
  const about = normalizeOptionalString(input.about);
  const avatarUrl = normalizeOptionalString(input.avatarUrl);
  const avatarStorageKey = normalizeOptionalString(input.avatarStorageKey);
  const coverUrl = normalizeOptionalString(input.coverUrl);
  const coverStorageKey = normalizeOptionalString(input.coverStorageKey);
  const avatarCropX = normalizeOptionalNumber(input.avatarCropX, 50);
  const avatarCropY = normalizeOptionalNumber(input.avatarCropY, 50);
  const avatarZoom = normalizeOptionalNumber(input.avatarZoom, 1);
  const coverCropX = normalizeOptionalNumber(input.coverCropX, 50);
  const coverCropY = normalizeOptionalNumber(input.coverCropY, 50);

  const existingProfile = currentUser.sellerProfile;
  const replacedStorageKeys: string[] = [];

  const updatedProfile = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: {
        id: currentUser.id,
      },
      data: {
        name,
        phone,
      },
    });

    let profile: PrismaSellerProfile;

    if (existingProfile) {
      profile = await tx.sellerProfile.update({
        where: {
          id: existingProfile.id,
        },
        data: {
          name,
          phone,
          about,
          ...(avatarUrl !== undefined ? { avatarUrl } : {}),
          ...(avatarStorageKey !== undefined ? { avatarStorageKey } : {}),
          ...(coverUrl !== undefined ? { coverUrl } : {}),
          ...(coverStorageKey !== undefined ? { coverStorageKey } : {}),
          ...(avatarCropX !== undefined ? { avatarCropX } : {}),
          ...(avatarCropY !== undefined ? { avatarCropY } : {}),
          ...(avatarZoom !== undefined ? { avatarZoom } : {}),
          ...(coverCropX !== undefined ? { coverCropX } : {}),
          ...(coverCropY !== undefined ? { coverCropY } : {}),
        },
      });
    } else {
      profile = await tx.sellerProfile.create({
        data: {
          userId: currentUser.id,
          name,
          profileType: ProfileType.PERSON,
          verified: false,
          onPlatformSince: String(new Date().getFullYear()),
          phone,
          about: about ?? null,
          avatarUrl: avatarUrl ?? null,
          avatarStorageKey: avatarStorageKey ?? null,
          coverUrl: coverUrl ?? null,
          coverStorageKey: coverStorageKey ?? null,
          avatarCropX: avatarCropX ?? 50,
          avatarCropY: avatarCropY ?? 50,
          avatarZoom: avatarZoom ?? 1,
          coverCropX: coverCropX ?? 50,
          coverCropY: coverCropY ?? 50,
        },
      });
    }

    return profile;
  });

  if (
    existingProfile?.avatarStorageKey &&
    avatarStorageKey &&
    existingProfile.avatarStorageKey !== avatarStorageKey
  ) {
    replacedStorageKeys.push(existingProfile.avatarStorageKey);
  }

  if (
    existingProfile?.coverStorageKey &&
    coverStorageKey &&
    existingProfile.coverStorageKey !== coverStorageKey
  ) {
    replacedStorageKeys.push(existingProfile.coverStorageKey);
  }

  return {
    sellerProfile: mapSellerProfileRecord(updatedProfile),
    replacedStorageKeys,
  };
}
