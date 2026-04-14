'use client';

import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Filter, Gauge, Layers3, MapPin, RotateCcw, Save, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { CAR_CATALOG, CAR_MAKES, getModelsForMake } from '@/lib/car-catalog';
import { getCitiesForRegion, getRegionForCity, getRuRegionOptions } from '@/lib/ru-regions';
import { hasActiveSaleSearchFilters, SALE_SEARCH_SORT_OPTIONS } from '@/lib/sale-search';
import type { SaleSearchFacets, SaleSearchFilters } from '@/lib/types';
import { cn } from '@/lib/utils';

const CLEAR_SELECT_VALUE = '__clear__';

function prepareDraftFilters(filters: SaleSearchFilters): SaleSearchFilters {
  const inferredRegion = filters.region ?? getRegionForCity(filters.city[0]);
  const regionCities = inferredRegion ? getCitiesForRegion(inferredRegion) : [];
  const selectedCity = filters.city[0];
  const cityMatchesRegion =
    !inferredRegion ||
    !selectedCity ||
    regionCities.some((city) => city.toLowerCase() === selectedCity.toLowerCase());

  return {
    ...filters,
    region: inferredRegion,
    city: cityMatchesRegion ? filters.city.slice(0, 1) : [],
  };
}

function countActiveFilters(filters: SaleSearchFilters) {
  let count = 0;

  count += filters.make.length;
  count += filters.model.length;
  if (filters.region) count += 1;
  count += filters.bodyType.length;
  count += filters.transmission.length;
  count += filters.drive.length;
  count += filters.color.length;
  count += filters.city.length;
  count += filters.sellerType.length;
  count += filters.resourceStatus.length;
  count += filters.filters.length;

  if (filters.yearFrom) count += 1;
  if (filters.yearTo) count += 1;
  if (filters.priceMin) count += 1;
  if (filters.priceMax) count += 1;
  if (filters.mileageMin || filters.mileageMax) count += 1;
  if (filters.powerMin) count += 1;
  if (filters.powerMax) count += 1;
  if (filters.ownersMax) count += 1;
  if (filters.paintCountMax !== undefined) count += 1;
  if (filters.ptsOriginal) count += 1;
  if (filters.avtotekaStatus === 'green') count += 1;
  if (filters.noAccident) count += 1;
  if (filters.noTaxi) count += 1;
  if (filters.noCarsharing) count += 1;
  if (filters.hasPhoto) count += 1;
  if (filters.priceInHand) count += 1;
  if (filters.noInvestment) count += 1;
  if (filters.sort !== 'date') count += 1;

  return count;
}

function buildSummaryPills(filters: SaleSearchFilters) {
  const items: string[] = [];

  if (filters.make[0]) items.push(filters.make[0]);
  if (filters.model[0]) items.push(filters.model[0]);
  if (filters.region) items.push(filters.region);
  if (filters.city[0]) items.push(filters.city[0]);

  if (filters.priceMin || filters.priceMax) {
    const min = filters.priceMin ? `от ${filters.priceMin.toLocaleString('ru-RU')}` : '';
    const max = filters.priceMax ? `до ${filters.priceMax.toLocaleString('ru-RU')}` : '';
    items.push(`Цена ${[min, max].filter(Boolean).join(' ')}`.trim());
  }

  if (filters.yearFrom || filters.yearTo) {
    const from = filters.yearFrom ? `от ${filters.yearFrom}` : '';
    const to = filters.yearTo ? `до ${filters.yearTo}` : '';
    items.push(`Год ${[from, to].filter(Boolean).join(' ')}`.trim());
  }

  if (filters.mileageMin || filters.mileageMax) {
    const from = filters.mileageMin ? `от ${filters.mileageMin.toLocaleString('ru-RU')} км` : '';
    const to = filters.mileageMax ? `до ${filters.mileageMax.toLocaleString('ru-RU')} км` : '';
    items.push(`Пробег ${[from, to].filter(Boolean).join(' ')}`.trim());
  }

  if (filters.ptsOriginal) items.push('ПТС оригинал');
  if (filters.avtotekaStatus === 'green') items.push('Автотека зелёная');
  if (filters.noTaxi) items.push('Не такси');
  if (filters.noInvestment) items.push('Без вложений');

  return items.slice(0, 6);
}
function SectionShell({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-[var(--radius-card)] border border-border/50 bg-card/80 p-3 dark:bg-surface-elevated/80 sm:p-4">
      {children}
    </section>
  );
}

function SectionTitle({
  eyebrow,
  title,
  icon,
}: {
  eyebrow: string;
  title: string;
  icon: ReactNode;
}) {
  return (
    <div className="mb-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{eyebrow}</p>
      <h3 className="mt-1 flex items-center gap-2 text-sm font-semibold text-foreground sm:text-[15px]">
        <span className="text-teal-accent">{icon}</span>
        {title}
      </h3>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function textInputClassName() {
  return 'w-full rounded-xl border border-border/80 bg-background/75 px-3 py-2.5 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/60 focus:border-teal-accent/50 focus:ring-2 focus:ring-teal-accent/15 dark:bg-background/10';
}

function selectTriggerClassName() {
  return cn(textInputClassName(), 'h-auto min-h-11 justify-between py-2.5 shadow-none');
}

function toggleArrayValue(current: string[], value: string) {
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
}

function ChipGroup({
  values,
  active,
  labels,
  onToggle,
}: {
  values: string[];
  active: string[];
  labels?: Record<string, string>;
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => {
        const isActive = active.includes(value);

        return (
          <button
            key={value}
            type="button"
            onClick={() => onToggle(value)}
            aria-pressed={isActive}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              isActive
                ? 'bg-[var(--accent-bg-soft)] text-teal-accent'
                : 'bg-background/50 text-muted-foreground hover:bg-background/80 hover:text-foreground dark:bg-background/10'
            )}
          >
            {labels?.[value] ?? value}
          </button>
        );
      })}
    </div>
  );
}

function CheckboxRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors',
        checked
          ? 'border-teal-accent/25 bg-[var(--accent-bg-soft)] text-foreground'
          : 'border-border/70 bg-background/60 text-foreground hover:border-border dark:bg-background/10'
      )}
    >
      <span
        className={cn(
          'flex h-5 w-5 items-center justify-center rounded-md border transition-colors',
          checked ? 'border-teal-accent bg-teal-accent text-[#09090B]' : 'border-border bg-background text-transparent dark:bg-background/20'
        )}
      >
        <Check className="h-3.5 w-3.5" />
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      />
      <span>{label}</span>
    </label>
  );
}

export function AdvancedFilters({
  open,
  onOpenChange,
  filters,
  facets,
  canSaveSearch,
  isSavingSearch = false,
  onApply,
  onReset,
  onSaveSearch,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: SaleSearchFilters;
  facets: SaleSearchFacets;
  canSaveSearch: boolean;
  isSavingSearch?: boolean;
  onApply: (filters: SaleSearchFilters) => void;
  onReset: () => void;
  onSaveSearch?: (filters: SaleSearchFilters, name?: string) => void;
}) {
  const [draft, setDraft] = useState(() => prepareDraftFilters(filters));
  const [searchName, setSearchName] = useState('');
  const [headerScrollTop, setHeaderScrollTop] = useState(0);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const availableMakes = useMemo(
    () => Array.from(new Set([...CAR_MAKES, ...facets.makes])).sort((left, right) => left.localeCompare(right, 'ru')),
    [facets.makes]
  );
  const availableRegions = useMemo(
    () => Array.from(new Set([...getRuRegionOptions(), ...facets.regions])).sort((left, right) => left.localeCompare(right, 'ru')),
    [facets.regions]
  );
  const availableRegionCities = useMemo(() => getCitiesForRegion(draft.region), [draft.region]);

  const availableModels = useMemo(() => {
    if (draft.make.length === 1) {
      return Array.from(
        new Set([
          ...getModelsForMake(draft.make[0]),
          ...(facets.modelsByMake[draft.make[0]] ?? []),
        ])
      ).sort((left, right) => left.localeCompare(right, 'ru'));
    }

    return Array.from(
      new Set([
        ...CAR_CATALOG.flatMap((make) => make.models.map((model) => model.name)),
        ...Object.values(facets.modelsByMake).flat(),
      ])
    ).sort((left, right) => left.localeCompare(right, 'ru'));
  }, [draft.make, facets.modelsByMake]);

  const activeFilterCount = useMemo(() => countActiveFilters(draft), [draft]);
  const summaryPills = useMemo(() => buildSummaryPills(draft), [draft]);
  const draftHasFilters = hasActiveSaleSearchFilters(draft);
  const isHeaderElevated = headerScrollTop > 4;
  const isHeaderCondensed = headerScrollTop > 72;
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 1990 + 2 }, (_, index) => currentYear + 1 - index);
  const mileageOptions = Array.from({ length: 50 }, (_, index) => (index + 1) * 10000);

  useEffect(() => {
    if (!open) {
      return;
    }

    const node = contentRef.current;
    if (node) {
      node.scrollTop = 0;
    }
  }, [open]);

  const handleSheetScroll = (event: React.UIEvent<HTMLDivElement>) => {
    setHeaderScrollTop(event.currentTarget.scrollTop);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setHeaderScrollTop(0);
    if (nextOpen) {
      setDraft(prepareDraftFilters(filters));
      setSearchName('');
    }

    onOpenChange(nextOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-hidden border-l border-border/70 bg-background/96 p-0 supports-[backdrop-filter]:bg-background/94 sm:max-w-[860px]"
      >
        <SheetHeader
          className={cn(
            'relative z-20 shrink-0 border-b border-border bg-[var(--surface-soft-strong)] pr-16 backdrop-blur-md transition-all duration-300 dark:bg-[var(--surface-soft-strong)] xl:px-6',
            isHeaderCondensed ? 'pb-3' : 'pb-5',
            isHeaderElevated && 'shadow-[var(--shadow-surface)]'
          )}
        >
          <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', isHeaderCondensed && 'gap-3')}>
            <div className="min-w-0">
              <SheetTitle className={cn('flex items-center gap-2 transition-all duration-200', isHeaderCondensed ? 'text-base sm:text-lg' : 'text-lg')}>
                <Filter className="h-4 w-4 text-teal-accent" />
                Все фильтры
              </SheetTitle>
              <SheetDescription className="sr-only">
                Настройте поиск по марке, бюджету, кузову, технике и истории.
              </SheetDescription>
            </div>

            <div
              className={cn(
                'inline-flex items-center gap-2 self-start rounded-2xl border border-border/70 bg-card/80 px-3 py-2 text-sm font-medium text-foreground transition-all duration-200 dark:bg-surface-elevated/80',
                isHeaderCondensed && 'rounded-xl px-2.5 py-1.5 text-xs sm:rounded-2xl sm:px-3 sm:py-2 sm:text-sm'
              )}
            >
              <Sparkles className="h-4 w-4 text-teal-accent" />
              {activeFilterCount > 0 ? `${activeFilterCount} активных` : 'Базовый набор'}
            </div>
          </div>

          {summaryPills.length > 0 ? (
            <div className={cn('mt-3 flex gap-2 transition-all duration-200', isHeaderCondensed ? 'mt-2 flex-nowrap overflow-x-auto pb-1 scrollbar-hide' : 'flex-wrap')}>
              {summaryPills.map((item) => (
                <span
                  key={item}
                  className="shrink-0 rounded-full bg-background/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground dark:bg-background/10"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : null}
        </SheetHeader>

        <div ref={contentRef} onScroll={handleSheetScroll} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="space-y-4 px-4 py-4 sm:px-6">
            <SectionShell>
            <SectionTitle
              eyebrow="Основа поиска"
              title="Марка, модель, город и выдача"
              icon={<Filter className="h-4 w-4" />}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Марка">
                <Combobox
                  options={availableMakes}
                  value={draft.make[0] ?? ''}
                  onChange={(value) => setDraft((current) => ({ ...current, make: value ? [value] : [], model: [] }))}
                  placeholder="Например, Toyota"
                  searchPlaceholder="Найдите марку"
                  emptyLabel="Марка не найдена"
                  customValueLabel="Указать свою марку"
                  clearable
                />
              </Field>

              <Field label="Модель">
                <Combobox
                  options={availableModels}
                  value={draft.model[0] ?? ''}
                  onChange={(value) => setDraft((current) => ({ ...current, model: value ? [value] : [] }))}
                  placeholder="Например, Camry"
                  searchPlaceholder={draft.make[0] ? `Найдите модель ${draft.make[0]}` : 'Найдите модель'}
                  emptyLabel="Модель не найдена"
                  customValueLabel="Указать свою модель"
                  clearable
                />
              </Field>

              <Field label="Область / край">
                <Combobox
                  options={availableRegions}
                  value={draft.region ?? ''}
                  onChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      region: value || undefined,
                      city: [],
                    }))
                  }
                  placeholder="Выберите регион"
                  searchPlaceholder="Найдите регион"
                  emptyLabel="Регион не найден"
                  clearable
                  allowCustom={false}
                />
              </Field>

              <Field label="Город">
                <Combobox
                  options={availableRegionCities}
                  value={draft.city[0] ?? ''}
                  onChange={(value) => setDraft((current) => ({ ...current, city: value ? [value] : [] }))}
                  placeholder={draft.region ? 'Выберите город' : 'Сначала выберите регион'}
                  searchPlaceholder="Найдите город"
                  emptyLabel={draft.region ? 'Город не найден' : 'Выберите регион'}
                  clearable
                  allowCustom={false}
                  disabled={!draft.region}
                />
              </Field>

              <Field label="Сортировка">
                <Select
                  value={draft.sort}
                  onValueChange={(value) => setDraft((current) => ({ ...current, sort: value as SaleSearchFilters['sort'] }))}
                >
                  <SelectTrigger className={selectTriggerClassName()}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SALE_SEARCH_SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </SectionShell>

          <SectionShell>
            <SectionTitle
              eyebrow="Диапазоны"
              title="Цена, год, пробег и мощность"
              icon={<Gauge className="h-4 w-4" />}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Год от">
                <Select
                  value={draft.yearFrom ? String(draft.yearFrom) : CLEAR_SELECT_VALUE}
                  onValueChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      yearFrom: value === CLEAR_SELECT_VALUE ? undefined : Number(value),
                    }))
                  }
                >
                  <SelectTrigger className={selectTriggerClassName()}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CLEAR_SELECT_VALUE}>Любой</SelectItem>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Год до">
                <Select
                  value={draft.yearTo ? String(draft.yearTo) : CLEAR_SELECT_VALUE}
                  onValueChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      yearTo: value === CLEAR_SELECT_VALUE ? undefined : Number(value),
                    }))
                  }
                >
                  <SelectTrigger className={selectTriggerClassName()}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CLEAR_SELECT_VALUE}>Любой</SelectItem>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Цена от">
                <input
                  className={textInputClassName()}
                  inputMode="numeric"
                  value={draft.priceMin ?? ''}
                  onChange={(event) => setDraft((current) => ({ ...current, priceMin: event.target.value ? Number(event.target.value) : undefined }))}
                  placeholder="1 500 000"
                />
              </Field>
              <Field label="Цена до">
                <input
                  className={textInputClassName()}
                  inputMode="numeric"
                  value={draft.priceMax ?? ''}
                  onChange={(event) => setDraft((current) => ({ ...current, priceMax: event.target.value ? Number(event.target.value) : undefined }))}
                  placeholder="4 000 000"
                />
              </Field>
              <Field label="Пробег от / до">
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    value={draft.mileageMin ? String(draft.mileageMin) : CLEAR_SELECT_VALUE}
                    onValueChange={(value) =>
                      setDraft((current) => ({
                        ...current,
                        mileageMin: value === CLEAR_SELECT_VALUE ? undefined : Number(value),
                      }))
                    }
                  >
                    <SelectTrigger className={selectTriggerClassName()}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CLEAR_SELECT_VALUE}>от 0 км</SelectItem>
                      {mileageOptions.map((value) => (
                        <SelectItem key={value} value={String(value)}>
                          от {value.toLocaleString('ru-RU')} км
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={draft.mileageMax ? String(draft.mileageMax) : CLEAR_SELECT_VALUE}
                    onValueChange={(value) =>
                      setDraft((current) => ({
                        ...current,
                        mileageMax: value === CLEAR_SELECT_VALUE ? undefined : Number(value),
                      }))
                    }
                  >
                    <SelectTrigger className={selectTriggerClassName()}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CLEAR_SELECT_VALUE}>до 500 000 км</SelectItem>
                      {mileageOptions.map((value) => (
                        <SelectItem key={value} value={String(value)}>
                          до {value.toLocaleString('ru-RU')} км
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </Field>
              <Field label="Мощность от / до">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className={textInputClassName()}
                    inputMode="numeric"
                    value={draft.powerMin ?? ''}
                    onChange={(event) => setDraft((current) => ({ ...current, powerMin: event.target.value ? Number(event.target.value) : undefined }))}
                    placeholder="150"
                  />
                  <input
                    className={textInputClassName()}
                    inputMode="numeric"
                    value={draft.powerMax ?? ''}
                    onChange={(event) => setDraft((current) => ({ ...current, powerMax: event.target.value ? Number(event.target.value) : undefined }))}
                    placeholder="300"
                  />
                </div>
              </Field>
            </div>
          </SectionShell>

          <SectionShell>
            <SectionTitle
              eyebrow="Категории"
              title="Кузов, коробка, привод и цвет"
              icon={<Layers3 className="h-4 w-4" />}
            />

            <div className="space-y-4">
              <Field label="Кузов">
                <ChipGroup
                  values={facets.bodyTypes}
                  active={draft.bodyType}
                  onToggle={(value) => setDraft((current) => ({ ...current, bodyType: toggleArrayValue(current.bodyType, value) }))}
                />
              </Field>
              <Field label="Коробка">
                <ChipGroup
                  values={facets.transmissions}
                  active={draft.transmission}
                  onToggle={(value) => setDraft((current) => ({ ...current, transmission: toggleArrayValue(current.transmission, value) }))}
                />
              </Field>
              <Field label="Привод">
                <ChipGroup
                  values={facets.drives}
                  active={draft.drive}
                  onToggle={(value) => setDraft((current) => ({ ...current, drive: toggleArrayValue(current.drive, value) }))}
                />
              </Field>
              <Field label="Цвет">
                <ChipGroup
                  values={facets.colors}
                  active={draft.color}
                  onToggle={(value) => setDraft((current) => ({ ...current, color: toggleArrayValue(current.color, value) }))}
                />
              </Field>
            </div>
          </SectionShell>

          <SectionShell>
            <SectionTitle
              eyebrow="История и качество"
              title="Документы, аварийность и ликвидность"
              icon={<ShieldCheck className="h-4 w-4" />}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <CheckboxRow checked={Boolean(draft.ptsOriginal)} label="ПТС оригинал" onChange={(checked) => setDraft((current) => ({ ...current, ptsOriginal: checked || undefined }))} />
              <CheckboxRow checked={draft.avtotekaStatus === 'green'} label="Автотека зелёная" onChange={(checked) => setDraft((current) => ({ ...current, avtotekaStatus: checked ? 'green' : undefined }))} />
              <CheckboxRow checked={Boolean(draft.noAccident)} label="Без ДТП" onChange={(checked) => setDraft((current) => ({ ...current, noAccident: checked || undefined }))} />
              <CheckboxRow checked={Boolean(draft.noTaxi)} label="Не такси" onChange={(checked) => setDraft((current) => ({ ...current, noTaxi: checked || undefined }))} />
              <CheckboxRow checked={Boolean(draft.noCarsharing)} label="Не каршеринг" onChange={(checked) => setDraft((current) => ({ ...current, noCarsharing: checked || undefined }))} />
              <CheckboxRow checked={Boolean(draft.hasPhoto)} label="Только с фото" onChange={(checked) => setDraft((current) => ({ ...current, hasPhoto: checked || undefined }))} />
              <CheckboxRow checked={Boolean(draft.priceInHand)} label="Есть цена в руки" onChange={(checked) => setDraft((current) => ({ ...current, priceInHand: checked || undefined }))} />
              <CheckboxRow checked={Boolean(draft.noInvestment)} label="Без вложений" onChange={(checked) => setDraft((current) => ({ ...current, noInvestment: checked || undefined }))} />
            </div>
          </SectionShell>

          <SectionShell>
            <SectionTitle
              eyebrow="Продавец и размещение"
              title="Тип продавца и статус размещения"
              icon={<MapPin className="h-4 w-4" />}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Тип продавца">
                <ChipGroup
                  values={['broker', 'commission']}
                  active={draft.sellerType}
                  labels={{
                    broker: 'Подбор',
                    commission: 'Комиссия',
                  }}
                  onToggle={(value) => setDraft((current) => ({ ...current, sellerType: toggleArrayValue(current.sellerType, value) as SaleSearchFilters['sellerType'] }))}
                />
              </Field>

              <Field label="Статус размещения">
                <ChipGroup
                  values={['pre_resources', 'on_resources', 'not_listed']}
                  active={draft.resourceStatus}
                  labels={{
                    pre_resources: 'До ресурсов',
                    on_resources: 'На ресурсах',
                    not_listed: 'Не размещено',
                  }}
                  onToggle={(value) => setDraft((current) => ({ ...current, resourceStatus: toggleArrayValue(current.resourceStatus, value) as SaleSearchFilters['resourceStatus'] }))}
                />
              </Field>
            </div>
          </SectionShell>

          {canSaveSearch ? (
            <SectionShell>
              <SectionTitle
                eyebrow="Автоматизация"
                title="Сохранить текущий поиск"
                icon={<Save className="h-4 w-4" />}
              />

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <Field label="Название">
                  <input
                    className={textInputClassName()}
                    value={searchName}
                    onChange={(event) => setSearchName(event.target.value)}
                    placeholder="Например, Camry до 3 млн"
                  />
                </Field>

                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-2xl"
                  disabled={!draftHasFilters || isSavingSearch}
                  onClick={() => onSaveSearch?.({ ...draft, page: 1 }, searchName)}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSavingSearch ? 'Сохраняем...' : 'Сохранить поиск'}
                </Button>
              </div>
            </SectionShell>
          ) : null}
          </div>
        </div>

        <SheetFooter className="shrink-0 border-t border-border bg-[var(--surface-soft-strong)] px-4 py-4 backdrop-blur-md shadow-[var(--shadow-surface)] dark:bg-[var(--surface-soft-strong)] sm:px-6">
          <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {activeFilterCount > 0 ? `Готово к применению: ${activeFilterCount} фильтров.` : 'Фильтры не выбраны, будет базовая выдача.'}
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button
                type="button"
                variant="ghost"
                className="h-11 rounded-2xl"
                onClick={() => {
                  onReset();
                  onOpenChange(false);
                }}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Сбросить
              </Button>
              <Button
                type="button"
                className="h-11 rounded-2xl bg-teal-dark px-5 text-white hover:bg-teal-medium dark:bg-teal-accent dark:text-[#09090B] dark:hover:bg-seafoam"
                onClick={() => {
                  onApply({ ...draft, page: 1 });
                  onOpenChange(false);
                }}
              >
                Применить фильтры
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
