'use client';

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import type { SaleData } from '@/lib/sale-form';
import {
  applyVehicleCatalogModificationSelection,
  applyVehicleCatalogSelection,
} from '@/lib/vehicle-catalog/form';
import type {
  VehicleCatalogModificationOption,
  VehicleCatalogOption,
  VehicleCatalogOptionsResponse,
} from '@/lib/vehicle-catalog/types';

type UseVehicleCatalogFormInput = {
  sale: SaleData;
  setSale: Dispatch<SetStateAction<SaleData>>;
  clearError: (name: string) => void;
};

type VehicleCatalogQueryState<TItem extends VehicleCatalogOption> = {
  items: TItem[];
  loading: boolean;
  error: string | null;
};

const catalogResponseCache = new Map<string, unknown>();
const catalogInflightCache = new Map<string, Promise<unknown>>();

function normalizeCatalogLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9а-яё]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/ё/g, 'е');
}

function buildCatalogUrl(pathname: string, params?: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value == null || value === '') {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

async function loadCatalogResponse<TItem extends VehicleCatalogOption>(url: string) {
  const cached = catalogResponseCache.get(url);
  if (cached) {
    return cached as VehicleCatalogOptionsResponse<TItem>;
  }

  const inflight = catalogInflightCache.get(url);
  if (inflight) {
    return (await inflight) as VehicleCatalogOptionsResponse<TItem>;
  }

  const request = fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })
    .then(async (response) => {
      const payload = (await response.json().catch(() => null)) as
        | VehicleCatalogOptionsResponse<TItem>
        | {
            error?: string;
          }
        | null;

      if (!response.ok) {
        throw new Error(payload && 'error' in payload && payload.error ? payload.error : 'Catalog request failed.');
      }

      const normalizedPayload = {
        items: payload && 'items' in payload && Array.isArray(payload.items) ? payload.items : [],
      } satisfies VehicleCatalogOptionsResponse<TItem>;

      catalogResponseCache.set(url, normalizedPayload);
      return normalizedPayload;
    })
    .finally(() => {
      catalogInflightCache.delete(url);
    });

  catalogInflightCache.set(url, request);
  return (await request) as VehicleCatalogOptionsResponse<TItem>;
}

function useVehicleCatalogQuery<TItem extends VehicleCatalogOption>(url: string | null): VehicleCatalogQueryState<TItem> {
  const [state, setState] = useState<VehicleCatalogQueryState<TItem>>({
    items: [],
    loading: Boolean(url),
    error: null,
  });

  useEffect(() => {
    let active = true;

    if (!url) {
      setState({
        items: [],
        loading: false,
        error: null,
      });
      return () => {
        active = false;
      };
    }

    const cached = catalogResponseCache.get(url) as VehicleCatalogOptionsResponse<TItem> | undefined;
    setState({
      items: cached?.items ?? [],
      loading: !cached,
      error: null,
    });

    void loadCatalogResponse<TItem>(url)
      .then((payload) => {
        if (!active) {
          return;
        }

        setState({
          items: payload.items,
          loading: false,
          error: null,
        });
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setState({
          items: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Не удалось загрузить каталог.',
        });
      });

    return () => {
      active = false;
    };
  }, [url]);

  return state;
}

function resolveOptionByLabel<TItem extends VehicleCatalogOption>(items: TItem[], value: string) {
  const normalizedValue = normalizeCatalogLabel(value);
  return items.find((item) => normalizeCatalogLabel(item.label) === normalizedValue);
}

function clearManualModificationIds(current: SaleData): SaleData {
  return {
    ...current,
    catalogModificationId: '',
    catalogTrimId: '',
    catalogEngineId: '',
  };
}

export function useVehicleCatalogForm(input: UseVehicleCatalogFormInput) {
  const { sale, setSale, clearError } = input;
  const brandUrl = useMemo(() => buildCatalogUrl('/api/vehicle-catalog/brands', { limit: 200 }), []);
  const modelUrl = useMemo(
    () =>
      sale.catalogBrandId
        ? buildCatalogUrl('/api/vehicle-catalog/models', {
            brandId: sale.catalogBrandId,
            limit: 300,
          })
        : null,
    [sale.catalogBrandId]
  );
  const yearUrl = useMemo(
    () =>
      sale.catalogModelId
        ? buildCatalogUrl('/api/vehicle-catalog/years', {
            modelId: sale.catalogModelId,
          })
        : null,
    [sale.catalogModelId]
  );
  const bodyUrl = useMemo(
    () =>
      sale.catalogModelId && sale.year
        ? buildCatalogUrl('/api/vehicle-catalog/bodies', {
            modelId: sale.catalogModelId,
            year: sale.year,
          })
        : null,
    [sale.catalogModelId, sale.year]
  );
  const generationUrl = useMemo(
    () =>
      sale.catalogModelId && sale.year
        ? buildCatalogUrl('/api/vehicle-catalog/generations', {
            modelId: sale.catalogModelId,
            year: sale.year,
            bodyTypeId: sale.catalogBodyTypeId || undefined,
          })
        : null,
    [sale.catalogBodyTypeId, sale.catalogModelId, sale.year]
  );
  const fuelUrl = useMemo(
    () =>
      sale.catalogGenerationId
        ? buildCatalogUrl('/api/vehicle-catalog/fuel-types', {
            generationId: sale.catalogGenerationId,
            year: sale.year || undefined,
            bodyTypeId: sale.catalogBodyTypeId || undefined,
          })
        : null,
    [sale.catalogBodyTypeId, sale.catalogGenerationId, sale.year]
  );
  const driveUrl = useMemo(
    () =>
      sale.catalogGenerationId
        ? buildCatalogUrl('/api/vehicle-catalog/drive-types', {
            generationId: sale.catalogGenerationId,
            fuelTypeId: sale.catalogFuelTypeId || undefined,
            year: sale.year || undefined,
            bodyTypeId: sale.catalogBodyTypeId || undefined,
          })
        : null,
    [
      sale.catalogBodyTypeId,
      sale.catalogFuelTypeId,
      sale.catalogGenerationId,
      sale.year,
    ]
  );
  const transmissionUrl = useMemo(
    () =>
      sale.catalogGenerationId
        ? buildCatalogUrl('/api/vehicle-catalog/transmissions', {
            generationId: sale.catalogGenerationId,
            fuelTypeId: sale.catalogFuelTypeId || undefined,
            driveTypeId: sale.catalogDriveTypeId || undefined,
            year: sale.year || undefined,
            bodyTypeId: sale.catalogBodyTypeId || undefined,
          })
        : null,
    [
      sale.catalogBodyTypeId,
      sale.catalogDriveTypeId,
      sale.catalogFuelTypeId,
      sale.catalogGenerationId,
      sale.year,
    ]
  );
  const modificationUrl = useMemo(
    () =>
      sale.catalogGenerationId
        ? buildCatalogUrl('/api/vehicle-catalog/modifications', {
            generationId: sale.catalogGenerationId,
            bodyTypeId: sale.catalogBodyTypeId || undefined,
            fuelTypeId: sale.catalogFuelTypeId || undefined,
            driveTypeId: sale.catalogDriveTypeId || undefined,
            transmissionId: sale.catalogTransmissionId || undefined,
            year: sale.year || undefined,
          })
        : null,
    [
      sale.catalogBodyTypeId,
      sale.catalogDriveTypeId,
      sale.catalogFuelTypeId,
      sale.catalogGenerationId,
      sale.catalogTransmissionId,
      sale.year,
    ]
  );

  const brands = useVehicleCatalogQuery(brandUrl);
  const models = useVehicleCatalogQuery(modelUrl);
  const years = useVehicleCatalogQuery(yearUrl);
  const bodies = useVehicleCatalogQuery(bodyUrl);
  const generations = useVehicleCatalogQuery(generationUrl);
  const fuelTypes = useVehicleCatalogQuery(fuelUrl);
  const driveTypes = useVehicleCatalogQuery(driveUrl);
  const transmissions = useVehicleCatalogQuery(transmissionUrl);
  const modifications = useVehicleCatalogQuery<VehicleCatalogModificationOption>(modificationUrl);

  useEffect(() => {
    if (!sale.make || sale.catalogBrandId || brands.items.length === 0) {
      return;
    }

    const matchedBrand = resolveOptionByLabel(brands.items, sale.make);
    if (!matchedBrand) {
      return;
    }

    setSale((current) => ({
      ...current,
      catalogBrandId: matchedBrand.id,
      make: matchedBrand.label,
    }));
  }, [brands.items, sale.catalogBrandId, sale.make, setSale]);

  useEffect(() => {
    if (!sale.model || sale.catalogModelId || models.items.length === 0) {
      return;
    }

    const matchedModel = resolveOptionByLabel(models.items, sale.model);
    if (!matchedModel) {
      return;
    }

    setSale((current) => ({
      ...current,
      catalogModelId: matchedModel.id,
      model: matchedModel.label,
    }));
  }, [models.items, sale.catalogModelId, sale.model, setSale]);

  useEffect(() => {
    if (!sale.bodyType || sale.catalogBodyTypeId || bodies.items.length === 0) {
      return;
    }

    const matchedBody = resolveOptionByLabel(bodies.items, sale.bodyType);
    if (!matchedBody) {
      return;
    }

    setSale((current) => ({
      ...current,
      catalogBodyTypeId: matchedBody.id,
      bodyType: matchedBody.label,
    }));
  }, [bodies.items, sale.bodyType, sale.catalogBodyTypeId, setSale]);

  useEffect(() => {
    if (!sale.generation || sale.catalogGenerationId || generations.items.length === 0) {
      return;
    }

    const matchedGeneration = resolveOptionByLabel(generations.items, sale.generation);
    if (!matchedGeneration) {
      return;
    }

    setSale((current) => ({
      ...current,
      catalogGenerationId: matchedGeneration.id,
      generation: matchedGeneration.label,
    }));
  }, [generations.items, sale.catalogGenerationId, sale.generation, setSale]);

  useEffect(() => {
    if (!sale.engine || sale.catalogFuelTypeId || fuelTypes.items.length === 0) {
      return;
    }

    const matchedFuelType = resolveOptionByLabel(fuelTypes.items, sale.engine);
    if (!matchedFuelType) {
      return;
    }

    setSale((current) => ({
      ...current,
      catalogFuelTypeId: matchedFuelType.id,
      engine: matchedFuelType.label,
    }));
  }, [fuelTypes.items, sale.catalogFuelTypeId, sale.engine, setSale]);

  useEffect(() => {
    if (!sale.drive || sale.catalogDriveTypeId || driveTypes.items.length === 0) {
      return;
    }

    const matchedDriveType = resolveOptionByLabel(driveTypes.items, sale.drive);
    if (!matchedDriveType) {
      return;
    }

    setSale((current) => ({
      ...current,
      catalogDriveTypeId: matchedDriveType.id,
      drive: matchedDriveType.label,
    }));
  }, [driveTypes.items, sale.catalogDriveTypeId, sale.drive, setSale]);

  useEffect(() => {
    if (!sale.transmission || sale.catalogTransmissionId || transmissions.items.length === 0) {
      return;
    }

    const matchedTransmission = resolveOptionByLabel(transmissions.items, sale.transmission);
    if (!matchedTransmission) {
      return;
    }

    setSale((current) => ({
      ...current,
      catalogTransmissionId: matchedTransmission.id,
      transmission: matchedTransmission.label,
    }));
  }, [sale.catalogTransmissionId, sale.transmission, setSale, transmissions.items]);

  const catalogError = [
    brands.error,
    models.error,
    years.error,
    bodies.error,
    generations.error,
    fuelTypes.error,
    driveTypes.error,
    transmissions.error,
    modifications.error,
  ].find(Boolean) ?? null;

  return {
    brands: brands.items,
    models: models.items,
    years: years.items,
    bodies: bodies.items,
    generations: generations.items,
    fuelTypes: fuelTypes.items,
    driveTypes: driveTypes.items,
    transmissions: transmissions.items,
    modifications: modifications.items,
    loadingStates: {
      brands: brands.loading,
      models: models.loading,
      years: years.loading,
      bodies: bodies.loading,
      generations: generations.loading,
      fuelTypes: fuelTypes.loading,
      driveTypes: driveTypes.loading,
      transmissions: transmissions.loading,
      modifications: modifications.loading,
    },
    catalogError,
    selectBrand: (value: string) => {
      clearError('sale.make');
      clearError('sale.model');
      const option = resolveOptionByLabel(brands.items, value);
      setSale((current) =>
        applyVehicleCatalogSelection(current, {
          level: 'brand',
          id: option?.id ?? '',
          label: option?.label ?? value,
        })
      );
    },
    selectModel: (value: string) => {
      clearError('sale.model');
      const option = resolveOptionByLabel(models.items, value);
      setSale((current) =>
        applyVehicleCatalogSelection(current, {
          level: 'model',
          id: option?.id ?? '',
          label: option?.label ?? value,
        })
      );
    },
    selectYear: (value: string) => {
      clearError('sale.year');
      setSale((current) =>
        applyVehicleCatalogSelection(current, {
          level: 'year',
          id: value,
          label: value,
        })
      );
    },
    selectBodyType: (value: string) => {
      clearError('sale.bodyType');
      const option = resolveOptionByLabel(bodies.items, value);
      setSale((current) =>
        applyVehicleCatalogSelection(current, {
          level: 'bodyType',
          id: option?.id ?? '',
          label: option?.label ?? value,
        })
      );
    },
    selectGeneration: (value: string) => {
      const option = resolveOptionByLabel(generations.items, value);
      setSale((current) =>
        applyVehicleCatalogSelection(current, {
          level: 'generation',
          id: option?.id ?? '',
          label: option?.label ?? value,
        })
      );
    },
    selectFuelType: (value: string) => {
      clearError('sale.engine');
      const option = resolveOptionByLabel(fuelTypes.items, value);
      setSale((current) =>
        clearManualModificationIds(
          applyVehicleCatalogSelection(current, {
            level: 'fuelType',
            id: option?.id ?? '',
            label: option?.label ?? value,
          })
        )
      );
    },
    selectDriveType: (value: string) => {
      const option = resolveOptionByLabel(driveTypes.items, value);
      setSale((current) =>
        clearManualModificationIds(
          applyVehicleCatalogSelection(current, {
            level: 'driveType',
            id: option?.id ?? '',
            label: option?.label ?? value,
          })
        )
      );
    },
    selectTransmission: (value: string) => {
      const option = resolveOptionByLabel(transmissions.items, value);
      setSale((current) =>
        clearManualModificationIds(
          applyVehicleCatalogSelection(current, {
            level: 'transmission',
            id: option?.id ?? '',
            label: option?.label ?? value,
          })
        )
      );
    },
    selectModification: (modificationId: string) => {
      if (!modificationId) {
        setSale((current) => clearManualModificationIds(current));
        return;
      }

      const option = modifications.items.find((item) => item.id === modificationId);
      if (!option) {
        return;
      }

      setSale((current) =>
        applyVehicleCatalogModificationSelection(current, {
          modificationId: option.id,
          engineId: option.engineId,
          trimId: option.trimId,
          fuelTypeId: option.fuelTypeId,
          transmissionId: option.transmissionId,
          driveTypeId: option.driveTypeId,
          fuelLabel: option.fuelLabel,
          transmissionLabel: option.transmissionLabel,
          driveLabel: option.driveLabel,
          trimLabel: option.trimLabel,
          powerHp: option.powerHp,
          engineVolumeL: option.engineVolumeL,
        })
      );
    },
  };
}
