'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, FileImage, Loader2, ScanText, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type {
  VehicleDocumentOcrFields,
  VehicleDocumentOcrResult,
  VehicleDocumentOcrWarning,
} from '@/lib/ocr/vehicle-document';
import { cn } from '@/lib/utils';

type VehicleDocumentOcrPanelProps = {
  onApply: (fields: VehicleDocumentOcrFields) => void;
  disabled?: boolean;
};

type OcrResponse = VehicleDocumentOcrResult | { error?: string };

const FIELD_LABELS: Array<[keyof VehicleDocumentOcrFields, string]> = [
  ['vin', 'VIN'],
  ['brand', 'Марка'],
  ['model', 'Модель'],
  ['vehicleType', 'Тип ТС'],
  ['year', 'Год выпуска'],
  ['enginePowerHp', 'Мощность, л.с.'],
];

function hasOcrFields(fields: VehicleDocumentOcrFields | undefined): fields is VehicleDocumentOcrFields {
  return Boolean(fields && Object.values(fields).some(Boolean));
}

function formatConfidence(value: number | undefined): string | null {
  if (value == null) {
    return null;
  }

  return `${Math.round(value * 100)}%`;
}

function warningForField(warnings: VehicleDocumentOcrWarning[], field: keyof VehicleDocumentOcrFields) {
  return warnings.find((warning) => warning.field === field);
}

export function VehicleDocumentOcrPanel({ onApply, disabled = false }: VehicleDocumentOcrPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<VehicleDocumentOcrResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const canRecognize = Boolean(file) && !loading && !disabled;
  const canApply = hasOcrFields(result?.fields) && !loading && !disabled;

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);

  const recognizedRows = useMemo(() => {
    if (!result) {
      return [];
    }

    return FIELD_LABELS.map(([field, label]) => ({
      field,
      label,
      value: result.fields[field],
      confidence: formatConfidence(result.confidence[field]),
      warning: warningForField(result.warnings, field),
    })).filter((row) => Boolean(row.value));
  }, [result]);

  function reset() {
    setFile(null);
    setResult(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  async function recognize() {
    if (!file || loading) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const body = new FormData();
      body.append('file', file);

      const response = await fetch('/api/ocr/vehicle-document', {
        method: 'POST',
        body,
      });
      const payload = (await response.json().catch(() => null)) as OcrResponse | null;

      if (!response.ok) {
        throw new Error(payload && 'error' in payload && payload.error ? payload.error : 'Не удалось распознать документ.');
      }

      if (!payload || !('fields' in payload)) {
        throw new Error('OCR вернул пустой результат.');
      }

      setResult(payload);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Не удалось распознать документ.');
    } finally {
      setLoading(false);
    }
  }

  function applyResult() {
    if (!result || !hasOcrFields(result.fields)) {
      return;
    }

    onApply(result.fields);
  }

  return (
    <section
      data-vehicle-document-ocr-panel="true"
      className="rounded-[24px] border border-teal-accent/25 bg-background/65 p-4 shadow-sm shadow-teal-accent/5 sm:p-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Документы авто</p>
          <div className="mt-2 flex items-center gap-2">
            <ScanText className="h-5 w-5 text-teal-accent" />
            <p className="text-base font-semibold text-foreground">Заполнить по фото ПТС или СТС</p>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Распознаем VIN, марку, модель, тип ТС, год выпуска и мощность. Значения попадут в форму только после подтверждения.
          </p>
        </div>

        {result && hasOcrFields(result.fields) ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
            <Check className="h-3.5 w-3.5" />
            Данные найдены
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            capture="environment"
            className="sr-only"
            disabled={disabled || loading}
            onChange={(event) => {
              const selectedFile = event.target.files?.[0] ?? null;
              setFile(selectedFile);
              setResult(null);
              setError(null);
            }}
          />

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || loading}
            className={cn(
              'flex min-h-36 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center text-sm transition-colors',
              disabled || loading
                ? 'cursor-not-allowed border-border/60 bg-muted/20 text-muted-foreground'
                : 'border-border text-muted-foreground hover:border-teal-accent/50 hover:bg-muted/20 hover:text-foreground'
            )}
          >
            <Upload className="mb-3 h-7 w-7" />
            <span className="font-medium text-foreground">Загрузить или сфотографировать документ</span>
            <span className="mt-1 text-xs">JPG или PNG до 10 MB</span>
          </button>

          {file ? (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                {previewUrl ? (
                  <Image src={previewUrl} alt="Превью документа" fill unoptimized sizes="64px" className="object-cover" />
                ) : (
                  <FileImage className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
              <button
                type="button"
                onClick={reset}
                disabled={loading}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Убрать документ"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" onClick={recognize} disabled={!canRecognize} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanText className="h-4 w-4" />}
              {loading ? 'Распознаем...' : 'Распознать документ'}
            </Button>
            <Button type="button" variant="outline" onClick={applyResult} disabled={!canApply} className="gap-2">
              <Check className="h-4 w-4" />
              Применить к форме
            </Button>
          </div>
        </div>

        <div className="min-h-36 rounded-xl border border-border/70 bg-card/70 p-3">
          {error ? (
            <div className="flex gap-2 rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          {!error && !result ? (
            <div className="flex h-full min-h-28 flex-col justify-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Поля появятся после распознавания.</p>
              <p className="mt-1 leading-6">Проверьте найденные значения перед применением: форма не сохраняется автоматически.</p>
            </div>
          ) : null}

          {result ? (
            <div className="space-y-3">
              {recognizedRows.length > 0 ? (
                <div className="grid gap-2">
                  {recognizedRows.map((row) => (
                    <div
                      key={row.field}
                      className={cn(
                        'grid gap-1 rounded-lg border border-border/65 bg-background/75 px-3 py-2 sm:grid-cols-[9rem_1fr_auto]',
                        row.warning && 'border-warning/35 bg-warning/5'
                      )}
                    >
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{row.label}</span>
                      <span className="break-words text-sm font-semibold text-foreground">{row.value}</span>
                      {row.confidence ? <span className="text-xs text-muted-foreground">{row.confidence}</span> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Поддержанные поля не найдены. Попробуйте фото без бликов и обрезанных краёв.</p>
              )}

              {result.warnings.length > 0 ? (
                <div className="space-y-1.5">
                  {result.warnings.map((warning, index) => (
                    <p key={`${warning.code}-${index}`} className="flex gap-2 text-xs leading-5 text-warning">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{warning.message}</span>
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
