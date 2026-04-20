import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { parseMultipartRequest } from '@/lib/server/multipart-form-data';
import { deleteS3Objects, uploadToS3, buildS3PublicUrl } from '@/lib/server/s3';
import { getEditableSellerProfileByUserId, updateAccountSellerProfile } from '@/lib/server/seller-profile';

export const runtime = 'nodejs';

function parseString(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseOptionalNumber(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function ensureFile(value: FormDataEntryValue | null) {
  return value instanceof File && value.size > 0 ? value : null;
}

function ensureProfileImage(file: File, label: 'аватар' | 'обложка') {
  if (!file.type.startsWith('image/')) {
    throw new Error(`Для поля "${label}" можно загружать только изображения.`);
  }

  return file;
}

function normalizeExtension(file: File) {
  const extension = path.extname(file.name).toLowerCase();
  if (extension) {
    return extension;
  }

  switch (file.type) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    default:
      return '.bin';
  }
}

async function uploadProfileImage(file: File, params: { sellerKey: string; kind: 'avatar' | 'cover' }) {
  const extension = normalizeExtension(file);
  const objectKey = [
    'uploads',
    'seller-profiles',
    params.sellerKey,
    params.kind,
    `${randomUUID()}${extension}`,
  ].join('/');
  const bytes = new Uint8Array(await file.arrayBuffer());

  await uploadToS3({
    key: objectKey,
    body: bytes,
    contentType: file.type || undefined,
    cacheControl: 'public, max-age=31536000, immutable',
    contentLength: file.size,
  });

  return {
    storageKey: objectKey,
    publicUrl: buildS3PublicUrl(objectKey),
  };
}

export async function PUT(request: Request) {
  const currentUser = await getSessionUser();

  if (!currentUser) {
    return NextResponse.json({ error: 'Требуется авторизация.' }, { status: 401 });
  }

  const uploadedKeys: string[] = [];
  let sellerProfileSaved = false;

  try {
    const existingProfile = await getEditableSellerProfileByUserId(currentUser.id);
    const formData = await parseMultipartRequest(request);
    const name = parseString(formData.get('name'));
    const phone = parseString(formData.get('phone'));
    const about = parseString(formData.get('about'));
    const sellerKey = existingProfile?.id ?? currentUser.sellerProfileId ?? currentUser.id;

    const avatarFile = ensureFile(formData.get('avatar'));
    const coverFile = ensureFile(formData.get('cover'));

    const uploadedAvatar = avatarFile
      ? await uploadProfileImage(ensureProfileImage(avatarFile, 'аватар'), {
          sellerKey,
          kind: 'avatar',
        })
      : null;

    if (uploadedAvatar) {
      uploadedKeys.push(uploadedAvatar.storageKey);
    }

    const uploadedCover = coverFile
      ? await uploadProfileImage(ensureProfileImage(coverFile, 'обложка'), {
          sellerKey,
          kind: 'cover',
        })
      : null;

    if (uploadedCover) {
      uploadedKeys.push(uploadedCover.storageKey);
    }

    const result = await updateAccountSellerProfile(currentUser.id, {
      name,
      phone,
      about,
      avatarUrl: uploadedAvatar?.publicUrl,
      avatarStorageKey: uploadedAvatar?.storageKey,
      coverUrl: uploadedCover?.publicUrl,
      coverStorageKey: uploadedCover?.storageKey,
      avatarCropX: parseOptionalNumber(formData.get('avatarCropX')),
      avatarCropY: parseOptionalNumber(formData.get('avatarCropY')),
      avatarZoom: parseOptionalNumber(formData.get('avatarZoom')),
      coverCropX: parseOptionalNumber(formData.get('coverCropX')),
      coverCropY: parseOptionalNumber(formData.get('coverCropY')),
    });
    sellerProfileSaved = true;

    if (result.replacedStorageKeys.length > 0) {
      await deleteS3Objects(result.replacedStorageKeys).catch(() => undefined);
    }

    return NextResponse.json({
      sellerProfile: result.sellerProfile,
    });
  } catch (error) {
    if (!sellerProfileSaved && uploadedKeys.length > 0) {
      await deleteS3Objects(uploadedKeys).catch(() => undefined);
    }

    const message = error instanceof Error ? error.message : 'Не удалось обновить профиль продавца.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
