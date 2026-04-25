import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/auth';
import { serverEnv } from '@/lib/server/env';
import { parseMultipartRequest } from '@/lib/server/multipart-form-data';
import {
  extractYandexOcrText,
  parseVehicleDocumentOcrText,
} from '@/lib/server/ocr/vehicle-document-parser';
import { recognizeVehicleDocumentWithYandex } from '@/lib/server/ocr/yandex-vision';

export const runtime = 'nodejs';

const SUPPORTED_MIME_TYPES = new Set(['image/jpeg', 'image/png']);

function ensureFile(value: FormDataEntryValue | null): File | null {
  return value instanceof File && value.size > 0 ? value : null;
}

function validateVehicleDocumentFile(file: File): string | null {
  if (!SUPPORTED_MIME_TYPES.has(file.type)) {
    return 'Загрузите фото документа в формате JPG или PNG.';
  }

  if (file.size > serverEnv.ocrMaxFileSizeBytes) {
    const limitMb = Math.round(serverEnv.ocrMaxFileSizeBytes / 1024 / 1024);
    return `Размер фото документа не должен превышать ${limitMb} MB.`;
  }

  return null;
}

function safeOcrError(error: unknown): { message: string; status: number } {
  const message = error instanceof Error ? error.message : '';

  if (message === 'Yandex OCR request timed out.') {
    return { message: 'OCR не успел обработать документ. Попробуйте фото меньшего размера.', status: 504 };
  }

  if (message === 'Yandex OCR request failed.') {
    return { message: 'OCR-провайдер временно не обработал документ. Попробуйте ещё раз.', status: 502 };
  }

  return { message: 'Не удалось распознать документ.', status: 500 };
}

export async function POST(request: Request) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Требуется авторизация.' }, { status: 401 });
    }

    if (!serverEnv.yandexOcrApiKey) {
      return NextResponse.json({ error: 'OCR не настроен на сервере.' }, { status: 503 });
    }

    const formData = await parseMultipartRequest(request);
    const file = ensureFile(formData.get('file'));

    if (!file) {
      return NextResponse.json({ error: 'Загрузите фото документа.' }, { status: 400 });
    }

    const validationError = validateVehicleDocumentFile(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: file.size > serverEnv.ocrMaxFileSizeBytes ? 413 : 400 });
    }

    const yandexResponse = await recognizeVehicleDocumentWithYandex({
      file,
      apiKey: serverEnv.yandexOcrApiKey,
      endpoint: serverEnv.yandexVisionOcrEndpoint,
      timeoutMs: serverEnv.ocrTimeoutMs,
    });
    const text = extractYandexOcrText(yandexResponse);
    const result = parseVehicleDocumentOcrText(text);
    const safeResult = {
      documentType: result.documentType,
      fields: result.fields,
      confidence: result.confidence,
      warnings: result.warnings,
    };

    if (Object.keys(safeResult.fields).length === 0) {
      return NextResponse.json(
        {
          ...safeResult,
          warnings: [
            ...safeResult.warnings,
            {
              code: 'NO_SUPPORTED_FIELDS',
              message: 'Не удалось найти VIN, марку, модель, тип ТС, год или мощность. Попробуйте более чёткое фото.',
            },
          ],
        },
        { status: 200 }
      );
    }

    return NextResponse.json(safeResult, { status: 200 });
  } catch (error) {
    const safeError = safeOcrError(error);
    return NextResponse.json({ error: safeError.message }, { status: safeError.status });
  }
}
