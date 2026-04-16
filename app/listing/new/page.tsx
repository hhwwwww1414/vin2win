'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MarketplaceHeader } from '@/components/marketplace/header';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { ColorSwatchSelect } from '@/components/ui/color-swatch-select';
import { CAR_CATALOG, CAR_MAKES, getModelsForMake } from '@/lib/car-catalog';
import type { ListingStatusValue } from '@/lib/listing-status';
import {
  buildSaleSubmissionPayload,
  mergeSaleFormWithEditableListing,
  type EditableSaleListingPayload,
  type SaleData,
} from '@/lib/sale-form';
import { formatEngineSpec } from '@/lib/listing-utils';
import { SALE_ROUTE } from '@/lib/routes';
import {
  DEFAULT_VEHICLE_COLORS,
  VEHICLE_ENGINE_DISPLACEMENT_OPTIONS,
  formatEngineDisplacementOptionLabel,
} from '@/lib/vehicle-metadata';
import { cn } from '@/lib/utils';
import {
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Search,
  Star,
  Upload,
  Video,
  X,
} from 'lucide-react';

type Scenario = 'sale' | 'wanted';
type SaleStep = 1 | 2 | 3 | 4 | 5;
type SubmissionMode = 'DRAFT' | 'PENDING';
type FieldErrors = Record<string, string>;

type PhotoItem = { file: File; url: string };
type VideoItem = { file: File; name: string; size: string; url: string };
type SessionUser = { name: string; phone?: string };

type WantedData = {
  authorName: string;
  contact: string;
  models: string;
  budgetMin: string;
  budgetMax: string;
  yearFrom: string;
  mileageMax: string;
  engine: string;
  transmission: string;
  drive: string;
  ownersMax: string;
  paintAllowed: boolean;
  region: string;
  comment: string;
  notTaxi: boolean;
  notCarsharing: boolean;
  notSalon: boolean;
  notChina: boolean;
  ptsOriginalOnly: boolean;
  ownerOnly: boolean;
  sendAvtoteka: boolean;
};

type DraftPayload = {
  version?: number;
  scenario: Scenario;
  step: SaleStep;
  sale: SaleData;
  wanted: WantedData;
};

const saleSteps: { id: SaleStep; title: string }[] = [
  { id: 1, title: 'Паспорт' },
  { id: 2, title: 'Техника' },
  { id: 3, title: 'История и состояние' },
  { id: 4, title: 'Фото и описание' },
  { id: 5, title: 'Сделка и контакты' },
];

const saleStepMeta: Record<
  SaleStep,
  {
    eyebrow: string;
    title: string;
    description: string;
    checkpoints: string[];
  }
> = {
  1: {
    eyebrow: 'Шаг 1',
    title: 'Паспорт и превью',
    description:
      'Укажите марку, модель, год, город, цену и тип кузова. Это ядро объявления и данные для первого превью.',
    checkpoints: ['Марка и модель', 'Год и город', 'Цена и кузов'],
  },
  2: {
    eyebrow: 'Шаг 2',
    title: 'Технический профиль',
    description:
      'Укажите двигатель, пробег, коробку, привод и другие технические параметры автомобиля.',
    checkpoints: ['Двигатель', 'Пробег', 'Коробка и привод'],
  },
  3: {
    eyebrow: 'Шаг 3',
    title: 'История и состояние',
    description:
      'Соберите историю владения, документы, проверки и текущее состояние автомобиля в одном смысловом блоке.',
    checkpoints: ['Владельцы', 'ПТС и окрасы', 'Вложения'],
  },
  4: {
    eyebrow: 'Шаг 4',
    title: 'Фото и описание',
    description:
      'Загрузите фотографии, выберите обложку и добавьте описание.',
    checkpoints: ['Обложка', 'Фото и видео', 'Описание'],
  },
  5: {
    eyebrow: 'Шаг 5',
    title: 'Сделка и контакты',
    description:
      'Добавьте контакты, тип продавца и условия сделки.',
    checkpoints: ['Контакт', 'Тип продавца', 'Условия сделки'],
  },
};

const saleDefaults: SaleData = {
  sellerName: '',
  contact: '',
  make: '',
  model: '',
  generation: '',
  year: '',
  vin: '',
  city: '',
  price: '',
  priceInHand: '',
  priceOnResources: '',
  bodyType: '',
  engine: '',
  engineDisplacementL: '',
  power: '',
  transmission: 'АКПП',
  drive: 'Передний',
  mileage: '',
  steering: 'Левый',
  color: '',
  trim: '',
  owners: '',
  registrations: '',
  keysCount: '2',
  ptsType: 'original',
  paintCount: '0',
  paintedElements: '',
  notTaxi: true,
  notCarsharing: true,
  avtotekaGreen: false,
  wheelSet: false,
  extraTires: false,
  glassOriginal: false,
  noInvestment: true,
  investmentNote: '',
  sellerType: 'broker',
  resourceStatus: 'not_listed',
  videoUrl: '',
  description: '',
};

const wantedDefaults: WantedData = {
  authorName: '',
  contact: '',
  models: '',
  budgetMin: '',
  budgetMax: '',
  yearFrom: '',
  mileageMax: '',
  engine: '',
  transmission: 'АКПП',
  drive: 'Любой',
  ownersMax: '',
  paintAllowed: false,
  region: '',
  comment: '',
  notTaxi: true,
  notCarsharing: true,
  notSalon: false,
  notChina: false,
  ptsOriginalOnly: false,
  ownerOnly: false,
  sendAvtoteka: false,
};

const MAX_LISTING_MEDIA_FILE_SIZE_BYTES = 300 * 1024 * 1024;
const MAX_LISTING_MEDIA_FILE_SIZE_LABEL = '300 MB';
const MAX_LISTING_PHOTO_COUNT = 20;
const MAX_LISTING_YEAR = 2027;
const LISTING_DRAFT_VERSION = 2;
const LISTING_DRAFT_STORAGE_KEY = 'vin2win:new-listing-draft';

const saleTransmissionOptions = ['АКПП', 'МКПП', 'Робот', 'Вариатор'] as const;
const saleDriveOptions = ['Передний', 'Задний', 'Полный'] as const;
const saleSteeringOptions = ['Левый', 'Правый'] as const;
/** Тип двигателя / топлива (значение сохраняется в поле `engine`). */
const saleEngineTypeOptions = ['Бензин', 'Дизель', 'Гибрид', 'Электро', 'ГБО'] as const;
const saleEngineDisplacementOptions = VEHICLE_ENGINE_DISPLACEMENT_OPTIONS;
const saleColorOptions = DEFAULT_VEHICLE_COLORS;

const SALE_ENGINE_TYPE_SET = new Set<string>(saleEngineTypeOptions);
const SALE_ENGINE_DISPLACEMENT_SET = new Set<string>(saleEngineDisplacementOptions);

function normalizeDuplicateEngineType(raw: string): string {
  const t = raw.trim();
  if (!t) {
    return '';
  }
  if (SALE_ENGINE_TYPE_SET.has(t)) {
    return t;
  }
  const lower = t.toLowerCase();
  const aliases: Record<string, (typeof saleEngineTypeOptions)[number]> = {
    бензин: 'Бензин',
    дизель: 'Дизель',
    гибрид: 'Гибрид',
    электро: 'Электро',
    гбо: 'ГБО',
  };
  return aliases[lower] ?? t;
}

function normalizeDuplicateEngineDisplacementL(raw: unknown): string {
  if (raw === '' || raw == null) {
    return '';
  }
  const str = String(raw).trim().replace(',', '.');
  const num = Number(str);
  if (!Number.isFinite(num)) {
    return str;
  }
  for (const opt of saleEngineDisplacementOptions) {
    if (Math.abs(Number(opt) - num) < 0.051) {
      return opt;
    }
  }
  return str;
}
const saleBodyTypeOptions = ['Седан', 'Хэтчбек', 'Лифтбек', 'Универсал', 'Купе', 'Кроссовер', 'Внедорожник', 'Минивэн', 'Пикап'] as const;
const wantedTransmissionOptions = ['Любая', ...saleTransmissionOptions] as const;
const wantedDriveOptions = ['Любой', ...saleDriveOptions] as const;
const salePtsTypeOptions = [
  { value: 'original', label: 'Оригинал' },
  { value: 'duplicate', label: 'Дубликат' },
  { value: 'epts', label: 'ЭПТС' },
] as const;
const saleSellerTypeOptions = [
  { value: 'broker', label: 'Подбор' },
  { value: 'commission', label: 'Комиссия' },
] as const;
const saleResourceStatusOptions = [
  { value: 'not_listed', label: 'Не на ресурсах' },
  { value: 'pre_resources', label: 'До ресурсов' },
  { value: 'on_resources', label: 'На ресурсах' },
] as const;

const inputClass =
  'w-full rounded-xl border border-border/70 bg-background/85 px-3.5 py-3 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-muted-foreground/60 focus:border-teal-accent/60 focus:bg-background focus:ring-2 focus:ring-teal-accent/30';
const errorInputClass = 'border-destructive/60 bg-destructive/5 focus:border-destructive focus:ring-destructive/20';

function normalizeSaleSellerType(value: string) {
  return value === 'commission' ? 'commission' : 'broker';
}

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </span>
      {children}
      {error ? <span className="block text-xs text-destructive">{error}</span> : null}
      {!error && hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-[transform,border-color,background-color,box-shadow] hover:-translate-y-[1px]',
        checked
          ? 'border-[var(--accent-border-soft)] bg-[var(--accent-bg-soft)] text-foreground shadow-[0_10px_24px_rgba(10,20,35,0.12)]'
          : 'border-border/70 bg-background/70 text-muted-foreground hover:border-teal-accent/25 hover:bg-background/90 hover:text-foreground'
      )}
    >
      <span className="pr-3">{label}</span>
      <span
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
          checked ? 'border-teal-accent bg-teal-accent text-[#09090B]' : 'border-border bg-background'
        )}
      >
        {checked ? <Check className="h-3.5 w-3.5" /> : null}
      </span>
    </button>
  );
}

function SaleStepRoadmap({
  step,
  onSelectStep,
}: {
  step: SaleStep;
  onSelectStep: (step: SaleStep) => void;
}) {
  const currentIndex = saleSteps.findIndex((item) => item.id === step);
  const progress = saleSteps.length > 1 ? (currentIndex / (saleSteps.length - 1)) * 100 : 0;
  const currentStep = saleSteps[currentIndex] ?? saleSteps[0];

  return (
    <div className="mb-6 sm:hidden">
      <div className="relative px-1 py-4">
        <div className="absolute left-4 right-4 top-8 h-1 rounded-full bg-border/80">
          <div className="h-full rounded-full bg-teal-accent transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <div className="relative flex items-start justify-between gap-1">
          {saleSteps.map((item) => {
            const isDone = item.id < step;
            const isCurrent = item.id === step;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectStep(item.id)}
                aria-current={isCurrent ? 'step' : undefined}
                disabled={item.id > step}
                className="flex flex-1 flex-col items-center text-center disabled:cursor-not-allowed"
              >
                <span
                  className={cn(
                    'z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-card text-xs font-semibold tabular-nums transition-all',
                    isDone && 'border-teal-accent bg-teal-accent text-[#09090B]',
                    isCurrent && 'border-teal-accent text-teal-accent shadow-[0_0_0_6px_rgba(129,216,208,0.12)]',
                    !isDone && !isCurrent && 'border-border text-muted-foreground'
                  )}
                >
                  {item.id}
                </span>
                <span
                  className={cn(
                    'mt-2 max-w-[4.75rem] text-[11px] leading-tight',
                    isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {item.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-1 text-center">
        <div className="text-sm font-medium text-foreground">
          Шаг {step} из {saleSteps.length}
        </div>
        <div className="text-xs text-muted-foreground">{currentStep.title}</div>
      </div>
    </div>
  );
}

function splitCsv(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinCsv(values: string[]) {
  return values.join(', ');
}

function normalizeCurrentSaleStep(value: unknown): SaleStep {
  return typeof value === 'number' && value >= 1 && value <= 5 ? (value as SaleStep) : 1;
}

function migrateLegacySaleStep(value: unknown): SaleStep {
  if (typeof value !== 'number') {
    return 1;
  }

  if (value === 6) {
    return 1;
  }

  if (value === 1) {
    return 2;
  }

  if (value === 2 || value === 3) {
    return 3;
  }

  if (value === 4 || value === 5) {
    return value;
  }

  return 1;
}

function fileSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function revokePhotos(photos: PhotoItem[]) {
  photos.forEach((photo) => URL.revokeObjectURL(photo.url));
}

function revokeVideoPreview(video: VideoItem | null) {
  if (video) {
    URL.revokeObjectURL(video.url);
  }
}

function wantedRestrictions(data: WantedData) {
  return [
    data.notTaxi && 'Не такси',
    data.notCarsharing && 'Не каршеринг',
    data.notSalon && 'Не из салона',
    data.notChina && 'Не Китай',
    data.ptsOriginalOnly && 'ПТС только оригинал',
    data.ownerOnly && 'Только от собственника',
    data.sendAvtoteka && 'Присылать только с автотекой',
  ].filter(Boolean);
}

function formatRubleValue(value: string) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }

  return `${numeric.toLocaleString('ru-RU')} ₽`;
}

function normalizeUniqueList(values: string[]) {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
}

function parseDraftPayload(raw: string | null): DraftPayload | null {
  if (!raw) {
    return null;
  }

  try {
    const payload = JSON.parse(raw) as Partial<DraftPayload> & { step?: unknown };
    if (!payload || (payload.scenario !== 'sale' && payload.scenario !== 'wanted')) {
      return null;
    }

    const step =
      payload.version === LISTING_DRAFT_VERSION
        ? normalizeCurrentSaleStep(payload.step)
        : migrateLegacySaleStep(payload.step);

    return {
      scenario: payload.scenario,
      step,
      sale: { ...saleDefaults, ...(payload.sale ?? {}) },
      wanted: { ...wantedDefaults, ...(payload.wanted ?? {}) },
    };
  } catch {
    return null;
  }
}

function parseRequestedScenario(value: string | null): Scenario | null {
  return value === 'sale' || value === 'wanted' ? value : null;
}

export default function NewListingPage() {
  const searchParams = useSearchParams();
  const duplicateId = searchParams.get('duplicate');
  const requestedScenario = parseRequestedScenario(searchParams.get('scenario'));
  const creationPath = requestedScenario ? `/listing/new?scenario=${requestedScenario}` : '/listing/new';
  const [scenario, setScenario] = useState<Scenario | null>(duplicateId ? 'sale' : requestedScenario);
  const [step, setStep] = useState<SaleStep>(1);
  const [sale, setSale] = useState<SaleData>(saleDefaults);
  const [wanted, setWanted] = useState<WantedData>(wantedDefaults);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [videoFile, setVideoFile] = useState<VideoItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [submittedStatus, setSubmittedStatus] = useState<ListingStatusValue | null>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [draftNotice, setDraftNotice] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const duplicateLoadedRef = useRef(false);
  const draftRestoredRef = useRef(false);
  const saleModelOptions = getModelsForMake(sale.make);
  const wantedModelOptions = useMemo(
    () =>
      normalizeUniqueList(
        CAR_CATALOG.flatMap((make) => make.models.map((model) => `${make.name} ${model.name}`))
      ),
    []
  );
  const wantedModelItems = useMemo(() => normalizeUniqueList(splitCsv(wanted.models)), [wanted.models]);
  const saleDirty = useMemo(
    () => JSON.stringify(sale) !== JSON.stringify(saleDefaults) || photos.length > 0 || Boolean(videoFile),
    [photos.length, sale, videoFile]
  );
  const wantedDirty = useMemo(() => JSON.stringify(wanted) !== JSON.stringify(wantedDefaults), [wanted]);

  const withFieldErrorClass = useCallback((name: string) => cn(inputClass, fieldErrors[name] && errorInputClass), [fieldErrors]);

  const updateFieldErrors = useCallback((nextErrors: FieldErrors, keys: string[]) => {
    setFieldErrors((current) => {
      const updated = { ...current };
      keys.forEach((key) => delete updated[key]);
      return { ...updated, ...nextErrors };
    });
  }, []);

  const clearError = useCallback((name: string) => {
    setFieldErrors((current) => {
      if (!current[name]) {
        return current;
      }

      const updated = { ...current };
      delete updated[name];
      return updated;
    });
  }, []);

  const updateSale = useCallback(
    <K extends keyof SaleData,>(key: K, value: SaleData[K]) => {
      setSale((current) => ({ ...current, [key]: value }));
      clearError(`sale.${String(key)}`);
    },
    [clearError]
  );

  const updateWanted = useCallback(
    <K extends keyof WantedData,>(key: K, value: WantedData[K]) => {
      setWanted((current) => ({ ...current, [key]: value }));
      clearError(`wanted.${String(key)}`);
    },
    [clearError]
  );

  const addWantedModel = useCallback(
    (value: string) => {
      const normalized = value.trim();
      if (!normalized) {
        return;
      }

      updateWanted('models', joinCsv(normalizeUniqueList([...wantedModelItems, normalized])));
    },
    [updateWanted, wantedModelItems]
  );

  const removeWantedModel = useCallback(
    (value: string) => {
      updateWanted(
        'models',
        joinCsv(wantedModelItems.filter((item) => item.toLowerCase() !== value.trim().toLowerCase()))
      );
    },
    [updateWanted, wantedModelItems]
  );

  useEffect(() => {
    let active = true;

    async function loadSession() {
      setAuthLoading(true);
      try {
        const response = await fetch('/api/auth/session', { cache: 'no-store' });
        const payload = (await response.json().catch(() => null)) as
          | {
              authenticated?: boolean;
              user?: SessionUser | null;
            }
          | null;

        if (!active) {
          return;
        }

        if (payload?.authenticated && payload.user) {
          setSessionUser(payload.user);
          setSale((current) => ({
            ...current,
            sellerName: current.sellerName || payload.user?.name || '',
            contact: current.contact || payload.user?.phone || '',
          }));
          setWanted((current) => ({
            ...current,
            authorName: current.authorName || payload.user?.name || '',
            contact: current.contact || payload.user?.phone || '',
          }));
        } else {
          setSessionUser(null);
        }
      } catch {
        if (active) {
          setSessionUser(null);
        }
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (duplicateId || requestedScenario || authLoading || draftRestoredRef.current) {
      return;
    }

    draftRestoredRef.current = true;

    const draft = parseDraftPayload(window.localStorage.getItem(LISTING_DRAFT_STORAGE_KEY));
    if (!draft) {
      return;
    }

    setScenario(draft.scenario);
    setStep(draft.step);
    setSale(draft.sale);
    setWanted(draft.wanted);
    setDraftNotice('Черновик восстановлен из браузера. Локальные фото и видеофайл нужно загрузить заново.');
  }, [authLoading, duplicateId, requestedScenario]);

  useEffect(() => {
    if (!duplicateId || duplicateLoadedRef.current || authLoading || !sessionUser) {
      return;
    }

    duplicateLoadedRef.current = true;

    async function loadDuplicate() {
      try {
        const response = await fetch(`/api/account/listings/${duplicateId}`);
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as EditableSaleListingPayload;
        setSale((current) => {
          const merged = mergeSaleFormWithEditableListing(current, data);
          return {
            ...merged,
            engine: normalizeDuplicateEngineType(merged.engine),
            engineDisplacementL: normalizeDuplicateEngineDisplacementL(merged.engineDisplacementL),
            sellerType: normalizeSaleSellerType(merged.sellerType),
          };
        });
        setScenario('sale');
        setDraftNotice('Данные объявления подставлены в форму. Фото и видео нужно выбрать заново.');
      } catch {
        // noop
      }
    }

    void loadDuplicate();
  }, [duplicateId, authLoading, sessionUser]);

  useEffect(() => {
    if (!scenario || submitted) {
      window.localStorage.removeItem(LISTING_DRAFT_STORAGE_KEY);
      return;
    }

    const hasDraft = scenario === 'sale' ? saleDirty : wantedDirty;
    if (!hasDraft) {
      window.localStorage.removeItem(LISTING_DRAFT_STORAGE_KEY);
      return;
    }

    const payload: DraftPayload = {
      version: LISTING_DRAFT_VERSION,
      scenario,
      step,
      sale,
      wanted,
    };

    window.localStorage.setItem(LISTING_DRAFT_STORAGE_KEY, JSON.stringify(payload));
  }, [sale, saleDirty, scenario, step, submitted, wanted, wantedDirty]);

  useEffect(() => {
    if (submitted) {
      return;
    }

    const shouldWarn = (scenario === 'sale' && saleDirty) || (scenario === 'wanted' && wantedDirty);
    if (!shouldWarn) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saleDirty, scenario, submitted, wantedDirty]);

  const resetAll = useCallback(() => {
    revokePhotos(photos);
    revokeVideoPreview(videoFile);
    window.localStorage.removeItem(LISTING_DRAFT_STORAGE_KEY);
    setScenario(null);
    setStep(1);
    setSale(saleDefaults);
    setWanted(wantedDefaults);
    setPhotos([]);
    setVideoFile(null);
    setIsSubmitting(false);
    setSubmitError(null);
    setMediaError(null);
    setSubmitted(false);
    setCreatedId(null);
    setSubmittedStatus(null);
    setFieldErrors({});
    setDraftNotice(null);
  }, [photos, videoFile]);

  const addPhotos = useCallback((files: FileList | null) => {
    if (!files) {
      return;
    }

    const selectedFiles = Array.from(files);
    const freeSlots = Math.max(0, MAX_LISTING_PHOTO_COUNT - photos.length);
    const acceptableFiles = selectedFiles
      .filter((file) => file.type.startsWith('image/') && file.size <= MAX_LISTING_MEDIA_FILE_SIZE_BYTES)
      .slice(0, freeSlots)
      .map((file) => ({ file, url: URL.createObjectURL(file) }));
    const rejectedCount =
      selectedFiles.filter((file) => !file.type.startsWith('image/') || file.size > MAX_LISTING_MEDIA_FILE_SIZE_BYTES).length +
      Math.max(0, selectedFiles.length - freeSlots - acceptableFiles.length);

    if (acceptableFiles.length > 0) {
      setPhotos((current) => [...current, ...acceptableFiles]);
      clearError('sale.photos');
      setDraftNotice(null);
    }

    if (rejectedCount > 0) {
      setMediaError(
        `Часть файлов не добавлена. Доступны JPG, PNG и WebP до ${MAX_LISTING_MEDIA_FILE_SIZE_LABEL}, максимум ${MAX_LISTING_PHOTO_COUNT} фото.`
      );
      return;
    }

    setMediaError(null);
  }, [clearError, photos.length]);

  const removePhoto = useCallback((index: number) => {
    setPhotos((current) => {
      const target = current[index];
      if (!target) {
        return current;
      }

      URL.revokeObjectURL(target.url);
      return current.filter((_, photoIndex) => photoIndex !== index);
    });
  }, []);

  const makePhotoCover = useCallback((index: number) => {
    if (index === 0) {
      return;
    }

    setPhotos((current) => {
      const target = current[index];
      if (!target) {
        return current;
      }

      return [target, ...current.filter((_, photoIndex) => photoIndex !== index)];
    });
  }, []);

  const movePhoto = useCallback((index: number, direction: 'left' | 'right') => {
    setPhotos((current) => {
      const nextIndex = direction === 'left' ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const nextPhotos = [...current];
      const currentItem = nextPhotos[index];
      nextPhotos[index] = nextPhotos[nextIndex];
      nextPhotos[nextIndex] = currentItem;
      return nextPhotos;
    });
  }, []);

  const pickVideo = useCallback((files: FileList | null) => {
    const file = files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('video/')) {
      setMediaError('Для видео допускаются только видеофайлы.');
      return;
    }

    if (file.size > MAX_LISTING_MEDIA_FILE_SIZE_BYTES) {
      setMediaError(`Размер видео не должен превышать ${MAX_LISTING_MEDIA_FILE_SIZE_LABEL}.`);
      return;
    }

    setMediaError(null);
    setDraftNotice(null);
    revokeVideoPreview(videoFile);
    setVideoFile({ file, name: file.name, size: fileSize(file.size), url: URL.createObjectURL(file) });
  }, [videoFile]);

  const validateSaleStep = useCallback(
    (targetStep: SaleStep) => {
      const nextErrors: FieldErrors = {};

      if (targetStep === 1) {
        if (!sale.make.trim()) nextErrors['sale.make'] = 'Укажите марку.';
        if (!sale.model.trim()) nextErrors['sale.model'] = 'Укажите модель.';
        if (!sale.year.trim()) {
          nextErrors['sale.year'] = 'Укажите год.';
        } else {
          const year = Number(sale.year);
          if (!Number.isFinite(year) || year < 1900 || year > MAX_LISTING_YEAR) {
            nextErrors['sale.year'] = `Год должен быть в диапазоне 1900–${MAX_LISTING_YEAR}.`;
          }
        }
        if (!sale.city.trim()) nextErrors['sale.city'] = 'Укажите город.';
        if (!sale.price.trim() || Number(sale.price) <= 0) nextErrors['sale.price'] = 'Укажите цену.';
        if (!sale.bodyType.trim()) nextErrors['sale.bodyType'] = 'Выберите тип кузова.';
      }

      if (targetStep === 2) {
        if (!sale.engine.trim()) nextErrors['sale.engine'] = 'Укажите двигатель.';
        if (!sale.mileage.trim() || Number(sale.mileage) < 0) nextErrors['sale.mileage'] = 'Укажите пробег.';
      }

      if (targetStep === 3) {
        if (!sale.owners.trim() || Number(sale.owners) < 1) nextErrors['sale.owners'] = 'Укажите владельцев.';
      }

      if (targetStep === 3 && !sale.noInvestment && !sale.investmentNote.trim()) {
        nextErrors['sale.investmentNote'] = 'Опишите, что требуется сделать.';
      }

      if (targetStep === 4) {
        if (!sale.description.trim()) nextErrors['sale.description'] = 'Добавьте описание.';
      }

      if (targetStep === 5) {
        if (!sale.sellerName.trim()) nextErrors['sale.sellerName'] = 'Укажите имя продавца.';
        if (!sale.contact.trim()) nextErrors['sale.contact'] = 'Укажите контакт.';
      }

      const keysByStep: Record<SaleStep, string[]> = {
        1: ['sale.make', 'sale.model', 'sale.year', 'sale.city', 'sale.price', 'sale.bodyType'],
        2: ['sale.engine', 'sale.mileage'],
        3: ['sale.owners', 'sale.investmentNote'],
        4: ['sale.description'],
        5: ['sale.sellerName', 'sale.contact'],
      };

      updateFieldErrors(nextErrors, keysByStep[targetStep]);
      return Object.keys(nextErrors).length === 0;
    },
    [sale, updateFieldErrors]
  );

  const validateWanted = useCallback(() => {
    const nextErrors: FieldErrors = {};
    if (!wanted.authorName.trim()) nextErrors['wanted.authorName'] = 'Укажите имя.';
    if (!wanted.contact.trim()) nextErrors['wanted.contact'] = 'Укажите контакт.';
    if (wantedModelItems.length === 0) nextErrors['wanted.models'] = 'Добавьте хотя бы одну модель.';
    if (!wanted.budgetMax.trim() || Number(wanted.budgetMax) <= 0) {
      nextErrors['wanted.budgetMax'] = 'Укажите верхнюю границу бюджета.';
    }

    updateFieldErrors(nextErrors, ['wanted.authorName', 'wanted.contact', 'wanted.models', 'wanted.budgetMax']);
    return Object.keys(nextErrors).length === 0;
  }, [updateFieldErrors, wanted.authorName, wanted.budgetMax, wanted.contact, wantedModelItems.length]);

  const validateSaleBeforeSubmit = useCallback(
    (mode: SubmissionMode) => {
      const stepsToCheck: SaleStep[] = [1, 2, 3, 4, 5];
      let valid = true;

      stepsToCheck.forEach((currentStep) => {
        if (!validateSaleStep(currentStep)) {
          valid = false;
        }
      });

      const nextErrors: FieldErrors = {};
      if (mode === 'PENDING' && photos.length === 0) {
        nextErrors['sale.photos'] = 'Добавьте хотя бы одну фотографию.';
      }

      if (Object.keys(nextErrors).length > 0) {
        valid = false;
      }

      updateFieldErrors(nextErrors, ['sale.photos']);
      return valid;
    },
    [photos.length, updateFieldErrors, validateSaleStep]
  );

  const handleSelectSaleStep = useCallback(
    (nextStep: SaleStep) => {
      if (nextStep <= step) {
        setStep(nextStep);
        setSubmitError(null);
      }
    },
    [step]
  );

  const handleNextSaleStep = useCallback(() => {
    if (!validateSaleStep(step)) {
      setSubmitError('Заполните обязательные поля текущего шага.');
      return;
    }

    setSubmitError(null);
    setStep((current) => Math.min(5, current + 1) as SaleStep);
  }, [step, validateSaleStep]);

  const submit = useCallback(
    async (mode: SubmissionMode) => {
      if (!scenario) {
        return;
      }

      if (!sessionUser) {
        setSubmitError('Для публикации нужно войти в аккаунт.');
        return;
      }

      if (scenario === 'sale') {
        const valid = validateSaleBeforeSubmit(mode);
        if (!valid) {
          setSubmitError('Проверьте обязательные поля перед отправкой.');
          return;
        }
      } else if (!validateWanted()) {
        setSubmitError('Проверьте обязательные поля запроса.');
        return;
      }

      setSubmitError(null);
      setIsSubmitting(true);

      try {
        if (scenario === 'sale') {
          const body = new FormData();
          body.append('payload', JSON.stringify(buildSaleSubmissionPayload(sale, mode)));
          photos.forEach((photo) => body.append('photos', photo.file));
          if (videoFile) {
            body.append('video', videoFile.file);
          }

          const response = await fetch('/api/listings', { method: 'POST', body });
          const payload = (await response.json().catch(() => null)) as
            | { id?: string; error?: string; status?: ListingStatusValue }
            | null;

          if (!response.ok) {
            throw new Error(payload?.error ?? 'Не удалось создать объявление.');
          }

          revokePhotos(photos);
          revokeVideoPreview(videoFile);
          setPhotos([]);
          setVideoFile(null);
          setCreatedId(payload?.id ?? null);
          setSubmittedStatus(payload?.status ?? mode);
        } else {
          const response = await fetch('/api/wanted', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...wanted,
              initialStatus: mode,
              models: wantedModelItems,
              restrictions: wantedRestrictions(wanted),
            }),
          });
          const payload = (await response.json().catch(() => null)) as
            | { id?: string; error?: string; status?: ListingStatusValue }
            | null;

          if (!response.ok) {
            throw new Error(payload?.error ?? 'Не удалось разместить запрос.');
          }

          setCreatedId(payload?.id ?? null);
          setSubmittedStatus(payload?.status ?? mode);
        }

        window.localStorage.removeItem(LISTING_DRAFT_STORAGE_KEY);
        setSubmitted(true);
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : 'Ошибка отправки формы.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      photos,
      sale,
      scenario,
      sessionUser,
      validateSaleBeforeSubmit,
      validateWanted,
      videoFile,
      wanted,
      wantedModelItems,
    ]
  );

  if (authLoading) {
    return (
      <div className="min-h-full">
        <MarketplaceHeader />
        <main id="page-main" className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <div className="relative overflow-hidden rounded-[32px] border border-border/70 bg-card/92 p-8 text-center shadow-[0_18px_50px_rgba(0,0,0,0.14)] dark:bg-surface-elevated/92 sm:p-10">
            <div
              className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_28%)]"
              aria-hidden="true"
            />
            <div
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/60 to-transparent"
              aria-hidden="true"
            />
            <div className="relative">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-teal-accent/20 bg-[var(--accent-bg-soft)] text-teal-accent">
                <Car className="h-6 w-6" />
              </div>
              <h1 className="mt-5 text-2xl font-semibold text-foreground sm:text-3xl">Проверяем сессию</h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Подгружаем доступ к публикации объявлений, черновикам и рабочим сценариям личного кабинета.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!sessionUser) {
    return (
      <div className="min-h-full">
        <MarketplaceHeader />
        <main id="page-main" className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <div className="relative overflow-hidden rounded-[32px] border border-border/70 bg-card/92 p-8 text-center shadow-[0_18px_50px_rgba(0,0,0,0.14)] dark:bg-surface-elevated/92 sm:p-10">
            <div
              className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_28%)]"
              aria-hidden="true"
            />
            <div
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/60 to-transparent"
              aria-hidden="true"
            />
            <div className="relative">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-teal-accent/20 bg-[var(--accent-bg-soft)] text-teal-accent">
                <Car className="h-6 w-6" />
              </div>
              <h1 className="mt-5 text-2xl font-semibold text-foreground sm:text-3xl">
                Публикация доступна только после входа
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Авторизация нужна, чтобы публиковать объявления, работать с подбором и контролировать статусы внутри личного кабинета.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href={`/login?next=${encodeURIComponent(creationPath)}`}
                  className="rounded-xl bg-teal-dark px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:opacity-95 dark:bg-teal-accent dark:text-[#09090B]"
                >
                  Войти
                </Link>
                <Link
                  href={`/register?next=${encodeURIComponent(creationPath)}`}
                  className="rounded-xl border border-border/80 bg-background/70 px-6 py-3 text-sm text-foreground transition-colors hover:border-teal-accent/35 hover:text-teal-accent dark:bg-background/10"
                >
                  Зарегистрироваться
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (submitted) {
    const href = createdId
      ? scenario === 'sale'
        ? `/listing/${createdId}`
        : `/wanted/${createdId}`
      : scenario === 'sale'
        ? SALE_ROUTE
        : '/wanted';
    const isDraft = submittedStatus === 'DRAFT';

    return (
      <div className="min-h-full">
        <MarketplaceHeader />
        <main id="page-main" className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
            <Check className="h-8 w-8 text-success" />
          </div>
          <h1 className="mb-3 text-2xl font-bold text-foreground">
            {isDraft
              ? scenario === 'sale'
                ? 'Черновик объявления сохранён'
                : 'Черновик запроса сохранён'
              : scenario === 'sale'
                ? 'Объявление отправлено на модерацию'
                : 'Запрос отправлен на модерацию'}
          </h1>
          <p className="mb-8 text-muted-foreground">
            {isDraft
              ? 'Черновик сохранён в личном кабинете. Вы сможете вернуться к нему и завершить публикацию в удобный момент.'
              : scenario === 'sale'
                ? 'Объявление принято в работу и отправлено на проверку модератору. После подтверждения карточка станет доступна участникам рынка.'
                : 'Запрос на подбор сохранён и отправлен на проверку модератору. После публикации он появится в ленте заявок.'}
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={href}
              className="rounded-lg bg-teal-dark px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 dark:bg-teal-accent dark:text-[#09090B]"
            >
              Открыть запись
            </Link>
            <button
              type="button"
              onClick={resetAll}
              className="rounded-lg border border-border px-6 py-2.5 text-sm text-foreground transition-colors hover:bg-muted/40"
            >
              Подать ещё
            </button>
          </div>
        </main>
      </div>
    );
  }

  const currentSaleStepMeta = saleStepMeta[step];
  const saleSnapshot = [
    sale.make && sale.model ? `${sale.make} ${sale.model}` : 'Выберите марку и модель',
    sale.price ? `Цена ${formatRubleValue(sale.price)}` : 'Добавьте цену',
    sale.city ? `Город ${sale.city}` : 'Укажите город',
    photos.length ? `${photos.length}/${MAX_LISTING_PHOTO_COUNT} фото` : 'Загрузите галерею',
  ];
  const wantedSnapshot = [
    wanted.authorName ? wanted.authorName : 'Укажите контактное лицо',
    splitCsv(wanted.models).length ? `${splitCsv(wanted.models).length} моделей в запросе` : 'Добавьте модели',
    wanted.budgetMax ? `До ${formatRubleValue(wanted.budgetMax)}` : 'Добавьте бюджет',
    wantedRestrictions(wanted).length ? `${wantedRestrictions(wanted).length} ограничений` : 'Ограничения не заданы',
  ];

  const saleStepContent = (
    <div className="space-y-5">
      {step === 1 ? (
        <>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Марка" required error={fieldErrors['sale.make']}>
            <Combobox
              options={CAR_MAKES}
              value={sale.make}
              onChange={(value) => {
                clearError('sale.make');
                clearError('sale.model');
                setSale((current) => ({
                  ...current,
                  make: value,
                  model: current.make === value ? current.model : '',
                }));
              }}
              placeholder="Выберите марку"
              searchPlaceholder="Найдите марку"
              emptyLabel="Марка не найдена"
              customValueLabel="Указать свою марку"
              clearable
              className={fieldErrors['sale.make'] ? errorInputClass : undefined}
            />
          </Field>

          <Field label="Модель" required error={fieldErrors['sale.model']}>
            <Combobox
              options={saleModelOptions}
              value={sale.model}
              onChange={(value) => updateSale('model', value)}
              placeholder="Выберите модель"
              searchPlaceholder={
                sale.make ? `Найдите модель ${sale.make}` : 'Сначала выберите марку или введите модель'
              }
              emptyLabel={sale.make ? 'Модель не найдена' : 'Список моделей появится после выбора марки'}
              customValueLabel="Указать свою модель"
              clearable
              className={fieldErrors['sale.model'] ? errorInputClass : undefined}
            />
          </Field>

          <Field label="Поколение">
            <input className={withFieldErrorClass('sale.generation')} value={sale.generation} onChange={(event) => updateSale('generation', event.target.value)} />
          </Field>

          <Field label="Год" required error={fieldErrors['sale.year']}>
            <select
              className={withFieldErrorClass('sale.year')}
              value={sale.year}
              onChange={(event) => updateSale('year', event.target.value)}
            >
              <option value="" disabled>Выберите год</option>
              {Array.from({ length: MAX_LISTING_YEAR - 1990 + 1 }, (_, i) => MAX_LISTING_YEAR - i).map((y) => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
          </Field>

          <Field label="VIN">
            <input className={withFieldErrorClass('sale.vin')} value={sale.vin} onChange={(event) => updateSale('vin', event.target.value.toUpperCase())} />
          </Field>

          <Field label="Город" required error={fieldErrors['sale.city']}>
            <input className={withFieldErrorClass('sale.city')} value={sale.city} onChange={(event) => updateSale('city', event.target.value)} />
          </Field>

          <Field label="Цена" required error={fieldErrors['sale.price']}>
            <input className={withFieldErrorClass('sale.price')} type="number" value={sale.price} onChange={(event) => updateSale('price', event.target.value)} />
          </Field>

          <Field label="Тип кузова" required error={fieldErrors['sale.bodyType']}>
            <select className={withFieldErrorClass('sale.bodyType')} value={sale.bodyType} onChange={(event) => updateSale('bodyType', event.target.value)}>
              <option value="" disabled>
                Выберите тип кузова
              </option>
              {saleBodyTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* Превью объявления */}
        <div className="mt-6 rounded-[20px] border border-teal-accent/30 bg-[var(--accent-bg-soft)] p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Превью объявления в ленте</h3>
          <div className="overflow-hidden rounded-[16px] border border-border/70 bg-card/95 shadow-sm">
            <div className="flex flex-col gap-3 p-3 sm:grid sm:grid-cols-[200px_minmax(0,1fr)] sm:items-start sm:gap-4 sm:p-4">
              <div className="overflow-hidden rounded-[12px] border border-border/50 bg-muted">
                {photos.length > 0 ? (
                  <Image src={photos[0].url} alt="Превью" width={200} height={140} unoptimized className="aspect-[16/10] w-full object-cover" />
                ) : (
                  <div className="flex aspect-[16/10] w-full items-center justify-center text-xs text-muted-foreground">Нет фото</div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">{sale.city || 'Город'}</p>
                <h4 className="mt-1 text-lg font-semibold text-foreground">
                  {sale.make || 'Марка'} {sale.model || 'Модель'}{sale.year ? `, ${sale.year}` : ''}
                </h4>
                <div className="mt-2 text-xl font-bold text-foreground tabular-nums">
                  {sale.price ? `${Number(sale.price).toLocaleString('ru-RU')} ₽` : 'Цена не указана'}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {sale.mileage ? <span>{Number(sale.mileage).toLocaleString('ru-RU')} км</span> : null}
                  {sale.engine || sale.engineDisplacementL ? (
                    <span>
                      {formatEngineSpec({
                        engine: sale.engine,
                        engineDisplacementL: sale.engineDisplacementL
                          ? Number(sale.engineDisplacementL.replace(',', '.'))
                          : undefined,
                      })}
                    </span>
                  ) : null}
                  {sale.transmission ? <span>{sale.transmission}</span> : null}
                  {sale.drive ? <span>{sale.drive}</span> : null}
                  {sale.power ? <span>{sale.power} л.с.</span> : null}
                </div>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Так ваше объявление будет выглядеть в ленте. Вы можете вернуться и отредактировать любое поле.
          </p>
        </div>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Двигатель" required error={fieldErrors['sale.engine']}>
              <select
                className={withFieldErrorClass('sale.engine')}
                value={sale.engine}
                onChange={(event) => updateSale('engine', event.target.value)}
              >
                <option value="">Выберите тип</option>
                {sale.engine && !SALE_ENGINE_TYPE_SET.has(sale.engine) ? (
                  <option value={sale.engine}>{sale.engine} (из объявления)</option>
                ) : null}
                {saleEngineTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Объём двигателя, л">
              <select
                className={withFieldErrorClass('sale.engineDisplacementL')}
                value={sale.engineDisplacementL}
                onChange={(event) => updateSale('engineDisplacementL', event.target.value)}
              >
                <option value="">Не указан</option>
                {sale.engineDisplacementL && !SALE_ENGINE_DISPLACEMENT_SET.has(sale.engineDisplacementL) ? (
                  <option value={sale.engineDisplacementL}>{sale.engineDisplacementL} л (из объявления)</option>
                ) : null}
                {saleEngineDisplacementOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatEngineDisplacementOptionLabel(option)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Мощность">
              <input className={withFieldErrorClass('sale.power')} type="number" value={sale.power} onChange={(event) => updateSale('power', event.target.value)} />
            </Field>

            <Field label="Коробка">
              <select className={withFieldErrorClass('sale.transmission')} value={sale.transmission} onChange={(event) => updateSale('transmission', event.target.value)}>
                {saleTransmissionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Привод">
              <select className={withFieldErrorClass('sale.drive')} value={sale.drive} onChange={(event) => updateSale('drive', event.target.value)}>
                {saleDriveOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Пробег" required error={fieldErrors['sale.mileage']}>
              <input className={withFieldErrorClass('sale.mileage')} type="number" value={sale.mileage} onChange={(event) => updateSale('mileage', event.target.value)} />
            </Field>

            <Field label="Руль">
              <select className={withFieldErrorClass('sale.steering')} value={sale.steering} onChange={(event) => updateSale('steering', event.target.value)}>
                {saleSteeringOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Цвет">
              <ColorSwatchSelect
                options={saleColorOptions}
                value={sale.color}
                onChange={(value) => updateSale('color', String(value))}
                triggerLabel="Цвет"
                emptyAriaLabel="Выбрать цвет"
                placeholder="Выбрать цвет"
                clearLabel="Не указан"
                className={withFieldErrorClass('sale.color')}
              />
            </Field>

            <Field label="Комплектация">
              <input className={withFieldErrorClass('sale.trim')} value={sale.trim} onChange={(event) => updateSale('trim', event.target.value)} />
            </Field>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Toggle label="Есть комплект колёс" checked={sale.wheelSet} onChange={(value) => updateSale('wheelSet', value)} />
            <Toggle label="Есть дополнительная резина" checked={sale.extraTires} onChange={(value) => updateSale('extraTires', value)} />
          </div>
        </>
      ) : null}

      {step === 3 ? (
        <>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Владельцев" required error={fieldErrors['sale.owners']}>
              <input className={withFieldErrorClass('sale.owners')} type="number" value={sale.owners} onChange={(event) => updateSale('owners', event.target.value)} />
            </Field>

            <Field label="Регистраций">
              <input className={withFieldErrorClass('sale.registrations')} type="number" value={sale.registrations} onChange={(event) => updateSale('registrations', event.target.value)} />
            </Field>

            <Field label="Ключей">
              <input className={withFieldErrorClass('sale.keysCount')} value={sale.keysCount} onChange={(event) => updateSale('keysCount', event.target.value)} />
            </Field>
          </div>

          <Field label="Тип ПТС">
            <select className={withFieldErrorClass('sale.ptsType')} value={sale.ptsType} onChange={(event) => updateSale('ptsType', event.target.value)}>
              {salePtsTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Количество окрасов">
              <input className={withFieldErrorClass('sale.paintCount')} type="number" value={sale.paintCount} onChange={(event) => updateSale('paintCount', event.target.value)} />
            </Field>

            <Field label="Окрашенные элементы">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {sale.paintedElements ? sale.paintedElements.split(',').filter(Boolean).map((el) => (
                    <span key={el.trim()} className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning">
                      {el.trim()}
                      <button
                        type="button"
                        onClick={() => {
                          const items = sale.paintedElements.split(',').map((i) => i.trim()).filter((i) => i && i !== el.trim());
                          updateSale('paintedElements', items.join(', '));
                          updateSale('paintCount', String(items.length));
                        }}
                        className="ml-0.5 text-warning/70 hover:text-warning"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )) : null}
                </div>
                <select
                  className={withFieldErrorClass('sale.paintedElements')}
                  value=""
                  onChange={(event) => {
                    if (!event.target.value) return;
                    const current = sale.paintedElements ? sale.paintedElements.split(',').map((i) => i.trim()).filter(Boolean) : [];
                    if (!current.includes(event.target.value)) {
                      const next = [...current, event.target.value];
                      updateSale('paintedElements', next.join(', '));
                      updateSale('paintCount', String(next.length));
                    }
                  }}
                >
                  <option value="">Добавить элемент...</option>
                  {['Арки', 'Бампер задний', 'Бампер передний', 'Двери', 'Задние крылья', 'Зеркала', 'Капот', 'Кромка капота', 'Кромка крыши', 'Крышка багажника', 'Крыша', 'Места сколов и царапин', 'Низ дверей', 'Передние крылья', 'Пороги', 'Пятая дверь', 'Ручки дверей', 'Стойки кузова'].map((el) => (
                    <option key={el} value={el} disabled={sale.paintedElements.includes(el)}>
                      {el}
                    </option>
                  ))}
                </select>
              </div>
            </Field>
          </div>

          <div className="space-y-2">
            <Toggle label="Не такси" checked={sale.notTaxi} onChange={(value) => updateSale('notTaxi', value)} />
            <Toggle label="Не каршеринг" checked={sale.notCarsharing} onChange={(value) => updateSale('notCarsharing', value)} />
            <Toggle label="Зеленая автотека" checked={sale.avtotekaGreen} onChange={(value) => updateSale('avtotekaGreen', value)} />
          </div>
        </div>

        <div className="space-y-4">
          <Toggle label="Оригинальные стекла" checked={sale.glassOriginal} onChange={(value) => updateSale('glassOriginal', value)} />
          <Toggle label="Без вложений" checked={sale.noInvestment} onChange={(value) => updateSale('noInvestment', value)} />
          {!sale.noInvestment ? (
            <Field label="Что нужно сделать" error={fieldErrors['sale.investmentNote']}>
              <textarea
                className={cn(withFieldErrorClass('sale.investmentNote'), 'min-h-28')}
                value={sale.investmentNote}
                onChange={(event) => updateSale('investmentNote', event.target.value)}
              />
            </Field>
          ) : null}
        </div>
        </>
      ) : null}

      {step === 5 ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Имя продавца" required error={fieldErrors['sale.sellerName']}>
              <input className={withFieldErrorClass('sale.sellerName')} value={sale.sellerName} onChange={(event) => updateSale('sellerName', event.target.value)} />
            </Field>

            <Field label="Контакт" required error={fieldErrors['sale.contact']} hint="+7 999 123-45-67 или @username">
              <input
                className={withFieldErrorClass('sale.contact')}
                placeholder="+7 999 123-45-67 или @username"
                value={sale.contact}
                onChange={(event) => updateSale('contact', event.target.value)}
              />
            </Field>

            <Field label="Тип продавца">
              <select className={withFieldErrorClass('sale.sellerType')} value={sale.sellerType} onChange={(event) => updateSale('sellerType', event.target.value)}>
                {saleSellerTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Статус на ресурсах">
              <select
                className={withFieldErrorClass('sale.resourceStatus')}
                value={sale.resourceStatus}
                onChange={(event) => updateSale('resourceStatus', event.target.value)}
              >
                {saleResourceStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Цена в руки">
              <input className={withFieldErrorClass('sale.priceInHand')} type="number" value={sale.priceInHand} onChange={(event) => updateSale('priceInHand', event.target.value)} />
            </Field>

            <Field label="Цена на ресурсах">
              <input
                className={withFieldErrorClass('sale.priceOnResources')}
                type="number"
                value={sale.priceOnResources}
                onChange={(event) => updateSale('priceOnResources', event.target.value)}
              />
            </Field>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="space-y-4">
          <Field
            label="Фотографии"
            required
            error={fieldErrors['sale.photos']}
            hint={`${photos.length}/${MAX_LISTING_PHOTO_COUNT}. Первое фото станет обложкой.`}
          >
            <div className="space-y-3">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                onChange={(event) => {
                  addPhotos(event.target.files);
                  event.target.value = '';
                }}
              />

              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={photos.length >= MAX_LISTING_PHOTO_COUNT}
                className={cn(
                  'flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center text-sm transition-colors',
                  photos.length >= MAX_LISTING_PHOTO_COUNT
                    ? 'cursor-not-allowed border-border/60 bg-muted/20 text-muted-foreground'
                    : 'border-border text-muted-foreground hover:border-teal-accent/50 hover:bg-muted/20 hover:text-foreground',
                  fieldErrors['sale.photos'] && 'border-destructive/50 bg-destructive/5'
                )}
              >
                <Upload className="mb-3 h-8 w-8" />
                <span className="font-medium text-foreground">Добавить фото</span>
                <span className="mt-1 text-xs">JPG, PNG, WebP до {MAX_LISTING_MEDIA_FILE_SIZE_LABEL}. Максимум {MAX_LISTING_PHOTO_COUNT} фото.</span>
              </button>

              {photos.length ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {photos.map((photo, index) => (
                    <div key={photo.url} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-card">
                      <Image src={photo.url} alt={`Фото ${index + 1}`} fill unoptimized sizes="(min-width: 640px) 25vw, 50vw" className="object-cover" />
                      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-1 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-2 py-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                        {index === 0 ? (
                          <span className="rounded-full bg-teal-accent px-2 py-0.5 text-[10px] font-semibold text-[#09090B]">Обложка</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => makePhotoCover(index)}
                            className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[10px] font-medium text-white transition-colors hover:bg-white/25"
                          >
                            <Star className="h-3 w-3" />
                            Сделать обложкой
                          </button>
                        )}

                        <div className="ml-auto flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => movePhoto(index, 'left')}
                            disabled={index === 0}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Сдвинуть фото влево"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => movePhoto(index, 'right')}
                            disabled={index === photos.length - 1}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white transition-colors hover:bg-black/75 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Сдвинуть фото вправо"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-black/85"
                            aria-label="Удалить фото"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-1 text-[10px] font-medium text-white">
                        <span className="inline-flex items-center gap-1">
                          <GripVertical className="h-3 w-3" />
                          {index + 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </Field>

          <Field label="Видео">
            <div className="space-y-3">
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="sr-only"
                onChange={(event) => {
                  pickVideo(event.target.files);
                  event.target.value = '';
                }}
              />

              {videoFile ? (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="relative aspect-video bg-black">
                    <video key={videoFile.url} src={videoFile.url} controls preload="metadata" className="h-full w-full bg-black object-contain" />
                  </div>
                  <div className="flex items-center gap-3 border-t border-border/70 bg-muted/20 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-accent/15">
                      <Video className="h-5 w-5 text-teal-accent" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{videoFile.name}</p>
                      <p className="text-xs text-muted-foreground">{videoFile.size}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        revokeVideoPreview(videoFile);
                        setVideoFile(null);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Удалить видео"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="flex w-full items-center justify-center rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted/20 hover:text-foreground"
                >
                  Загрузить видеофайл до {MAX_LISTING_MEDIA_FILE_SIZE_LABEL}
                </button>
              )}

              <input
                className={withFieldErrorClass('sale.videoUrl')}
                placeholder="Или ссылка на видео"
                value={sale.videoUrl}
                onChange={(event) => updateSale('videoUrl', event.target.value)}
              />
            </div>
          </Field>

          {mediaError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{mediaError}</div>
          ) : null}

          <Field label="Описание" required error={fieldErrors['sale.description']}>
            <textarea className={cn(withFieldErrorClass('sale.description'), 'min-h-32')} value={sale.description} onChange={(event) => updateSale('description', event.target.value)} />
          </Field>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="min-h-full">
      <MarketplaceHeader />
      <main id="page-main" className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <section className="relative mb-6 overflow-hidden rounded-[32px] border border-border/70 bg-card/92 shadow-[0_18px_50px_rgba(0,0,0,0.14)] dark:bg-surface-elevated/92">
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_28%)]"
            aria-hidden="true"
          />
          <div
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/60 to-transparent"
            aria-hidden="true"
          />
          <div className="relative p-5 sm:p-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-accent/20 bg-[var(--accent-bg-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-accent">
              <Star className="h-3.5 w-3.5" />
              Новое объявление
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Подать объявление или запрос на подбор
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              Выберите тип размещения, заполните данные и отправьте на модерацию. После проверки объявление появится в ленте.
            </p>
          </div>
        </section>

        {!scenario ? (
          <section className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setScenario('sale');
                setDraftNotice(null);
              }}
              className="group card-interactive relative overflow-hidden rounded-[28px] border border-border/70 bg-card/92 p-5 text-left shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-teal-accent/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-surface-elevated/92 sm:p-6"
            >
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/55 to-transparent"
              />
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-accent/20 bg-[var(--accent-bg-soft)] text-teal-accent">
                <Car className="h-5 w-5 text-teal-accent" />
              </div>
              <h2 className="mb-2 text-lg font-semibold text-foreground">Продаю автомобиль</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Заполните данные автомобиля, загрузите фото и укажите условия. После проверки объявление появится в ленте.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground dark:bg-background/10">
                  5 шагов
                </span>
                <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground dark:bg-background/10">
                  Фото и видео
                </span>
                <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground dark:bg-background/10">
                  Сделка и контакты
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setScenario('wanted');
                setDraftNotice(null);
              }}
              className="group card-interactive relative overflow-hidden rounded-[28px] border border-border/70 bg-card/92 p-5 text-left shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-teal-accent/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-surface-elevated/92 sm:p-6"
            >
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/55 to-transparent"
              />
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-accent/20 bg-[var(--accent-bg-soft)] text-teal-accent">
                <Search className="h-5 w-5 text-teal-accent" />
              </div>
              <h2 className="mb-2 text-lg font-semibold text-foreground">Ищу автомобиль</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Укажите бюджет, желаемые модели и ограничения. После модерации запрос увидят все продавцы.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground dark:bg-background/10">
                  Быстрое заполнение
                </span>
                <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground dark:bg-background/10">
                  Ограничения
                </span>
                <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground dark:bg-background/10">
                  Подбор под заказ
                </span>
              </div>
            </button>
          </section>
        ) : null}

        {draftNotice ? (
          <div className="mt-6 rounded-xl border border-teal-accent/20 bg-teal-accent/8 px-4 py-3 text-sm text-foreground">
            {draftNotice}
          </div>
        ) : null}

        {submitError ? (
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{submitError}</div>
        ) : null}
        {scenario === 'sale' ? (
          <div className="mt-6 rounded-[32px] border border-border/70 bg-card/92 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.14)] dark:bg-surface-elevated/92 sm:p-6">
            <SaleStepRoadmap step={step} onSelectStep={handleSelectSaleStep} />

            <div className="mb-6 hidden justify-center sm:flex">
              <div className="grid w-full max-w-5xl gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {saleSteps.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSaleStep(item.id)}
                    disabled={item.id > step}
                    className={cn(
                      'rounded-2xl border px-3 py-3 text-center text-sm transition-all disabled:cursor-not-allowed disabled:opacity-60',
                      item.id === step
                        ? 'border-teal-accent/40 bg-[var(--accent-bg-soft)] text-teal-accent shadow-[0_14px_32px_rgba(17,24,39,0.12)]'
                        : item.id < step
                          ? 'border-border/70 bg-background/75 text-foreground hover:border-teal-accent/25 hover:bg-background'
                          : 'border-border/70 bg-background/40 text-muted-foreground'
                    )}
                  >
                    <div className="font-semibold">{item.title}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
              <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-background/75 p-5 shadow-[0_16px_38px_rgba(8,15,27,0.08)]">
                <div
                  className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/60 to-transparent"
                  aria-hidden="true"
                />
                <div className="inline-flex items-center gap-2 rounded-full border border-teal-accent/20 bg-[var(--accent-bg-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-accent">
                  <Star className="h-3.5 w-3.5" />
                  {currentSaleStepMeta.eyebrow}
                </div>
                <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-2xl">
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">{currentSaleStepMeta.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{currentSaleStepMeta.description}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-card/80 px-4 py-3 text-sm text-muted-foreground dark:bg-background/10">
                    <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Статус</span>
                    <span className="mt-1 block text-foreground">{saleDirty ? 'Есть несохранённые изменения' : 'Можно продолжить'}</span>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {currentSaleStepMeta.checkpoints.map((checkpoint) => (
                    <span
                      key={checkpoint}
                      className="rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs font-medium text-muted-foreground dark:bg-background/10"
                    >
                      {checkpoint}
                    </span>
                  ))}
                </div>
              </section>

              <aside className="rounded-[28px] border border-border/70 bg-background/65 p-5 shadow-[0_14px_32px_rgba(8,15,27,0.07)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Сводка</p>
                <div className="mt-4 space-y-3">
                  {saleSnapshot.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-border/70 bg-card/75 px-4 py-3 text-sm text-foreground dark:bg-background/10"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </aside>
            </div>

            <div className="rounded-[28px] border border-border/70 bg-background/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-6">
              {saleStepContent}
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
              <Button
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                onClick={() => (step === 1 ? resetAll() : setStep((current) => (current - 1) as SaleStep))}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Назад
              </Button>

              {step < 5 ? (
                <Button
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-teal-dark text-white dark:bg-teal-accent dark:text-[#09090B]"
                  onClick={handleNextSaleStep}
                >
                  Далее
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={isSubmitting} onClick={() => submit('DRAFT')}>
                    {isSubmitting ? 'Сохраняем...' : 'Сохранить черновик'}
                  </Button>
                  <Button
                    size="sm"
                    disabled={isSubmitting}
                    className="bg-teal-dark text-white dark:bg-teal-accent dark:text-[#09090B]"
                    onClick={() => submit('PENDING')}
                  >
                    {isSubmitting ? 'Сохраняем...' : 'Отправить на модерацию'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {scenario === 'wanted' ? (
          <div className="mt-6 rounded-[32px] border border-border/70 bg-card/92 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.14)] dark:bg-surface-elevated/92 sm:p-6">
            <button
              type="button"
              onClick={() => setScenario(null)}
              className="mb-6 flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Назад
            </button>

            <div className="space-y-5">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_290px]">
                <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-background/75 p-5 shadow-[0_16px_38px_rgba(8,15,27,0.08)]">
                  <div
                    className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/60 to-transparent"
                    aria-hidden="true"
                  />
                  <div className="inline-flex items-center gap-2 rounded-full border border-teal-accent/20 bg-[var(--accent-bg-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-accent">
                    <Search className="h-3.5 w-3.5" />
                    Wanted flow
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">Соберите профиль поиска</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Опишите, какую машину ищете, какие ограничения для вас обязательны и в каком бюджете должна уложиться сделка.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {wantedSnapshot.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs font-medium text-muted-foreground dark:bg-background/10"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </section>

                <aside className="rounded-[28px] border border-border/70 bg-background/65 p-5 shadow-[0_14px_32px_rgba(8,15,27,0.07)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Checklist</p>
                  <div className="mt-4 space-y-3">
                    {['Контактное лицо', 'Модели и бюджет', 'Ограничения и комментарий'].map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-border/70 bg-card/75 px-4 py-3 text-sm text-foreground dark:bg-background/10"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </aside>
              </div>
              <section className="rounded-[28px] border border-border/70 bg-background/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="mb-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Контакт</p>
                  <h3 className="mt-2 text-lg font-semibold text-foreground">Кто размещает запрос</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Ваше имя" required error={fieldErrors['wanted.authorName']}>
                  <input className={withFieldErrorClass('wanted.authorName')} value={wanted.authorName} onChange={(event) => updateWanted('authorName', event.target.value)} />
                </Field>

                <Field label="Контакт" required error={fieldErrors['wanted.contact']} hint="+7 999 123-45-67 или @username">
                  <input
                    className={withFieldErrorClass('wanted.contact')}
                    placeholder="+7 999 123-45-67 или @username"
                    value={wanted.contact}
                    onChange={(event) => updateWanted('contact', event.target.value)}
                  />
                </Field>
                </div>
              </section>

              <Field label="Марки и модели" required error={fieldErrors['wanted.models']} hint="Можно выбрать несколько вариантов.">
                <div className="space-y-3">
                  <Combobox
                    options={wantedModelOptions}
                    value=""
                    onChange={addWantedModel}
                    placeholder="Добавьте марку и модель"
                    searchPlaceholder="Найдите марку или модель"
                    emptyLabel="Совпадений не найдено"
                    customValueLabel="Добавить свой вариант"
                    className={fieldErrors['wanted.models'] ? errorInputClass : undefined}
                  />

                  {wantedModelItems.length ? (
                    <div className="flex flex-wrap gap-2">
                      {wantedModelItems.map((item) => (
                        <span key={item} className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-sm text-foreground">
                          {item}
                          <button
                            type="button"
                            onClick={() => removeWantedModel(item)}
                            className="text-muted-foreground transition-colors hover:text-foreground"
                            aria-label={`Удалить ${item}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Бюджет от">
                  <input className={withFieldErrorClass('wanted.budgetMin')} type="number" value={wanted.budgetMin} onChange={(event) => updateWanted('budgetMin', event.target.value)} />
                </Field>

                <Field label="Бюджет до" required error={fieldErrors['wanted.budgetMax']}>
                  <input className={withFieldErrorClass('wanted.budgetMax')} type="number" value={wanted.budgetMax} onChange={(event) => updateWanted('budgetMax', event.target.value)} />
                </Field>

                <Field label="Год от">
                  <input className={withFieldErrorClass('wanted.yearFrom')} type="number" value={wanted.yearFrom} onChange={(event) => updateWanted('yearFrom', event.target.value)} />
                </Field>

                <Field label="Пробег до">
                  <input className={withFieldErrorClass('wanted.mileageMax')} type="number" value={wanted.mileageMax} onChange={(event) => updateWanted('mileageMax', event.target.value)} />
                </Field>

                <Field label="Двигатель">
                  <input className={withFieldErrorClass('wanted.engine')} value={wanted.engine} onChange={(event) => updateWanted('engine', event.target.value)} />
                </Field>

                <Field label="Владельцев не более">
                  <input className={withFieldErrorClass('wanted.ownersMax')} value={wanted.ownersMax} onChange={(event) => updateWanted('ownersMax', event.target.value)} />
                </Field>

                <Field label="Коробка">
                  <select className={withFieldErrorClass('wanted.transmission')} value={wanted.transmission} onChange={(event) => updateWanted('transmission', event.target.value)}>
                    {wantedTransmissionOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Привод">
                  <select className={withFieldErrorClass('wanted.drive')} value={wanted.drive} onChange={(event) => updateWanted('drive', event.target.value)}>
                    {wantedDriveOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Регион">
                  <input className={withFieldErrorClass('wanted.region')} value={wanted.region} onChange={(event) => updateWanted('region', event.target.value)} />
                </Field>
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <Toggle label="Окрасы допустимы" checked={wanted.paintAllowed} onChange={(value) => updateWanted('paintAllowed', value)} />
                <Toggle label="Не такси" checked={wanted.notTaxi} onChange={(value) => updateWanted('notTaxi', value)} />
                <Toggle label="Не каршеринг" checked={wanted.notCarsharing} onChange={(value) => updateWanted('notCarsharing', value)} />
                <Toggle label="Не из салона" checked={wanted.notSalon} onChange={(value) => updateWanted('notSalon', value)} />
                <Toggle label="Не Китай" checked={wanted.notChina} onChange={(value) => updateWanted('notChina', value)} />
                <Toggle label="ПТС только оригинал" checked={wanted.ptsOriginalOnly} onChange={(value) => updateWanted('ptsOriginalOnly', value)} />
                <Toggle label="Только от собственника" checked={wanted.ownerOnly} onChange={(value) => updateWanted('ownerOnly', value)} />
                <Toggle label="Присылать только с автотекой" checked={wanted.sendAvtoteka} onChange={(value) => updateWanted('sendAvtoteka', value)} />
              </div>

              <Field label="Комментарий">
                <textarea className={cn(withFieldErrorClass('wanted.comment'), 'min-h-32')} value={wanted.comment} onChange={(event) => updateWanted('comment', event.target.value)} />
              </Field>
            </div>

            <div className="mt-8 flex justify-end gap-2 border-t border-border/70 pt-5">
              <Button variant="outline" size="sm" disabled={isSubmitting} onClick={() => submit('DRAFT')}>
                {isSubmitting ? 'Сохраняем...' : 'Черновик'}
              </Button>
              <Button
                size="sm"
                disabled={isSubmitting}
                className="bg-teal-dark text-white dark:bg-teal-accent dark:text-[#09090B]"
                onClick={() => submit('PENDING')}
              >
                {isSubmitting ? 'Сохраняем...' : 'На модерацию'}
              </Button>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
