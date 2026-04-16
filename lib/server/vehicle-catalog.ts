import { prisma } from '@/lib/server/prisma';
import { createVehicleModificationLabel } from '@/lib/vehicle-catalog/normalization';
import type {
  VehicleCatalogModificationOption,
  VehicleCatalogOption,
} from '@/lib/vehicle-catalog/types';

const CURRENT_YEAR = new Date().getFullYear();
const MAX_OPTION_LIMIT = 200;

function normalizeLookupValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9а-яё]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/ё/g, 'е');
}

function uniqueById<TItem extends { id: string }>(items: TItem[]) {
  const seen = new Set<string>();
  const unique: TItem[] = [];

  for (const item of items) {
    if (seen.has(item.id)) {
      continue;
    }

    seen.add(item.id);
    unique.push(item);
  }

  return unique;
}

function clampLimit(limit?: number) {
  if (!limit || !Number.isFinite(limit)) {
    return 50;
  }

  return Math.max(1, Math.min(MAX_OPTION_LIMIT, Math.trunc(limit)));
}

function includesQuery(query: string, values: string[]) {
  if (!query) {
    return true;
  }

  return values.some((value) => normalizeLookupValue(value).includes(query));
}

function isYearWithinRange(year: number, startYear?: number | null, endYear?: number | null) {
  const normalizedStartYear = startYear ?? 1900;
  const normalizedEndYear = endYear ?? CURRENT_YEAR + 1;
  return year >= normalizedStartYear && year <= normalizedEndYear;
}

function expandYearRange(startYear?: number | null, endYear?: number | null) {
  if (!startYear) {
    return [];
  }

  const maxYear = Math.min(endYear ?? CURRENT_YEAR + 1, CURRENT_YEAR + 1);
  if (startYear > maxYear) {
    return [];
  }

  const years: number[] = [];
  for (let year = startYear; year <= maxYear; year += 1) {
    years.push(year);
  }

  return years;
}

function formatYearLabel(startYear?: number | null, endYear?: number | null) {
  if (!startYear && !endYear) {
    return undefined;
  }

  const start = startYear ? String(startYear) : '...';
  const end = endYear ? String(endYear) : 'н.в.';
  return `${start}-${end}`;
}

function sortOptions(items: VehicleCatalogOption[]) {
  return [...items].sort((left, right) => left.label.localeCompare(right.label, 'ru'));
}

export async function getVehicleCatalogBrands(input?: {
  query?: string;
  limit?: number;
}): Promise<VehicleCatalogOption[]> {
  const query = normalizeLookupValue(input?.query ?? '');
  const limit = clampLimit(input?.limit);

  const brands = await prisma.vehicleBrand.findMany({
    include: {
      aliases: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return brands
    .filter((brand) =>
      includesQuery(query, [
        brand.name,
        brand.nameRu ?? '',
        brand.nameOriginal ?? '',
        ...brand.aliases.map((alias) => alias.alias),
      ])
    )
    .slice(0, limit)
    .map((brand) => ({
      id: brand.id,
      label: brand.nameRu ?? brand.name,
      hint: brand.nameRu && brand.nameRu !== brand.name ? brand.name : undefined,
    }));
}

export async function getVehicleCatalogModels(input: {
  brandId: string;
  query?: string;
  limit?: number;
}): Promise<VehicleCatalogOption[]> {
  const query = normalizeLookupValue(input.query ?? '');
  const limit = clampLimit(input.limit);

  const models = await prisma.vehicleModel.findMany({
    where: {
      brandId: input.brandId,
    },
    include: {
      aliases: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return models
    .filter((model) =>
      includesQuery(query, [
        model.name,
        model.nameRu ?? '',
        model.nameOriginal ?? '',
        ...model.aliases.map((alias) => alias.alias),
      ])
    )
    .slice(0, limit)
    .map((model) => ({
      id: model.id,
      label: model.nameRu ?? model.name,
      hint:
        model.productionStartYear || model.productionEndYear
          ? formatYearLabel(model.productionStartYear, model.productionEndYear)
          : undefined,
    }));
}

export async function getVehicleCatalogYears(input: {
  modelId: string;
}): Promise<VehicleCatalogOption[]> {
  const [model, generations, modifications] = await Promise.all([
    prisma.vehicleModel.findUnique({
      where: {
        id: input.modelId,
      },
      select: {
        productionStartYear: true,
        productionEndYear: true,
      },
    }),
    prisma.vehicleGeneration.findMany({
      where: {
        modelId: input.modelId,
      },
      select: {
        productionStartYear: true,
        productionEndYear: true,
      },
    }),
    prisma.vehicleModification.findMany({
      where: {
        generation: {
          modelId: input.modelId,
        },
      },
      select: {
        productionStartYear: true,
        productionEndYear: true,
      },
    }),
  ]);

  const yearSet = new Set<number>();

  for (const range of [model, ...generations, ...modifications]) {
    for (const year of expandYearRange(range?.productionStartYear, range?.productionEndYear)) {
      yearSet.add(year);
    }
  }

  return Array.from(yearSet)
    .sort((left, right) => right - left)
    .map((year) => ({
      id: String(year),
      label: String(year),
    }));
}

export async function getVehicleCatalogBodies(input: {
  modelId: string;
  year: number;
}): Promise<VehicleCatalogOption[]> {
  const modifications = await prisma.vehicleModification.findMany({
    where: {
      generation: {
        modelId: input.modelId,
      },
    },
    select: {
      productionStartYear: true,
      productionEndYear: true,
      bodyType: {
        select: {
          id: true,
          labelRu: true,
          label: true,
        },
      },
      generation: {
        select: {
          productionStartYear: true,
          productionEndYear: true,
        },
      },
    },
  });

  const items = modifications
    .filter((modification) => {
      if (
        !isYearWithinRange(
          input.year,
          modification.generation.productionStartYear,
          modification.generation.productionEndYear
        )
      ) {
        return false;
      }

      const startYear = modification.productionStartYear ?? modification.generation.productionStartYear;
      const endYear = modification.productionEndYear ?? modification.generation.productionEndYear;
      return isYearWithinRange(input.year, startYear, endYear);
    })
    .map((modification) => ({
      id: modification.bodyType.id,
      label: modification.bodyType.labelRu || modification.bodyType.label,
    }));

  return sortOptions(uniqueById(items));
}

export async function getVehicleCatalogGenerations(input: {
  modelId: string;
  year: number;
  bodyTypeId?: string;
}): Promise<VehicleCatalogOption[]> {
  const generations = await prisma.vehicleGeneration.findMany({
    where: {
      modelId: input.modelId,
    },
    include: {
      modifications: {
        select: {
          bodyTypeId: true,
          productionStartYear: true,
          productionEndYear: true,
        },
      },
    },
    orderBy: [
      {
        productionStartYear: 'desc',
      },
      {
        labelRu: 'asc',
      },
    ],
  });

  const items = generations
    .filter((generation) => {
      if (
        !isYearWithinRange(
          input.year,
          generation.productionStartYear,
          generation.productionEndYear
        )
      ) {
        return false;
      }

      if (!input.bodyTypeId) {
        return true;
      }

      if (!generation.bodyTypeId || generation.bodyTypeId === input.bodyTypeId) {
        return true;
      }

      return generation.modifications.some((modification) => {
        if (modification.bodyTypeId !== input.bodyTypeId) {
          return false;
        }

        return isYearWithinRange(
          input.year,
          modification.productionStartYear ?? generation.productionStartYear,
          modification.productionEndYear ?? generation.productionEndYear
        );
      });
    })
    .map((generation) => ({
      id: generation.id,
      label: generation.labelRu || generation.label,
      hint: formatYearLabel(generation.productionStartYear, generation.productionEndYear),
    }));

  return uniqueById(items);
}

export async function getVehicleCatalogFuelTypes(input: {
  generationId: string;
  year?: number;
  bodyTypeId?: string;
}): Promise<VehicleCatalogOption[]> {
  const modifications = await prisma.vehicleModification.findMany({
    where: {
      generationId: input.generationId,
      engineId: {
        not: null,
      },
    },
    select: {
      bodyTypeId: true,
      productionStartYear: true,
      productionEndYear: true,
      generation: {
        select: {
          productionStartYear: true,
          productionEndYear: true,
        },
      },
      engine: {
        select: {
          fuelType: {
            select: {
              id: true,
              labelRu: true,
              label: true,
            },
          },
        },
      },
    },
  });

  const items = modifications
    .filter((modification) => {
      if (input.bodyTypeId && modification.bodyTypeId !== input.bodyTypeId) {
        return false;
      }

      if (!input.year) {
        return true;
      }

      return isYearWithinRange(
        input.year,
        modification.productionStartYear ?? modification.generation.productionStartYear,
        modification.productionEndYear ?? modification.generation.productionEndYear
      );
    })
    .flatMap((modification) => {
      if (!modification.engine) {
        return [];
      }

      return [
        {
          id: modification.engine.fuelType.id,
          label: modification.engine.fuelType.labelRu || modification.engine.fuelType.label,
        },
      ];
    });

  return sortOptions(uniqueById(items));
}

export async function getVehicleCatalogDriveTypes(input: {
  generationId: string;
  fuelTypeId?: string;
  year?: number;
  bodyTypeId?: string;
}): Promise<VehicleCatalogOption[]> {
  const modifications = await prisma.vehicleModification.findMany({
    where: {
      generationId: input.generationId,
      driveTypeId: {
        not: null,
      },
    },
    select: {
      bodyTypeId: true,
      productionStartYear: true,
      productionEndYear: true,
      generation: {
        select: {
          productionStartYear: true,
          productionEndYear: true,
        },
      },
      driveType: {
        select: {
          id: true,
          labelRu: true,
          label: true,
        },
      },
      engine: {
        select: {
          fuelTypeId: true,
        },
      },
    },
  });

  const items = modifications
    .filter((modification) => {
      if (input.bodyTypeId && modification.bodyTypeId !== input.bodyTypeId) {
        return false;
      }

      if (input.fuelTypeId && modification.engine?.fuelTypeId !== input.fuelTypeId) {
        return false;
      }

      if (!input.year) {
        return true;
      }

      return isYearWithinRange(
        input.year,
        modification.productionStartYear ?? modification.generation.productionStartYear,
        modification.productionEndYear ?? modification.generation.productionEndYear
      );
    })
    .flatMap((modification) => {
      if (!modification.driveType) {
        return [];
      }

      return [
        {
          id: modification.driveType.id,
          label: modification.driveType.labelRu || modification.driveType.label,
        },
      ];
    });

  return sortOptions(uniqueById(items));
}

export async function getVehicleCatalogTransmissions(input: {
  generationId: string;
  fuelTypeId?: string;
  driveTypeId?: string;
  year?: number;
  bodyTypeId?: string;
}): Promise<VehicleCatalogOption[]> {
  const modifications = await prisma.vehicleModification.findMany({
    where: {
      generationId: input.generationId,
      transmissionId: {
        not: null,
      },
    },
    select: {
      bodyTypeId: true,
      driveTypeId: true,
      productionStartYear: true,
      productionEndYear: true,
      generation: {
        select: {
          productionStartYear: true,
          productionEndYear: true,
        },
      },
      transmission: {
        select: {
          id: true,
          labelRu: true,
          label: true,
        },
      },
      engine: {
        select: {
          fuelTypeId: true,
        },
      },
    },
  });

  const items = modifications
    .filter((modification) => {
      if (input.bodyTypeId && modification.bodyTypeId !== input.bodyTypeId) {
        return false;
      }

      if (input.fuelTypeId && modification.engine?.fuelTypeId !== input.fuelTypeId) {
        return false;
      }

      if (input.driveTypeId && modification.driveTypeId !== input.driveTypeId) {
        return false;
      }

      if (!input.year) {
        return true;
      }

      return isYearWithinRange(
        input.year,
        modification.productionStartYear ?? modification.generation.productionStartYear,
        modification.productionEndYear ?? modification.generation.productionEndYear
      );
    })
    .flatMap((modification) => {
      if (!modification.transmission) {
        return [];
      }

      return [
        {
          id: modification.transmission.id,
          label: modification.transmission.labelRu || modification.transmission.label,
        },
      ];
    });

  return sortOptions(uniqueById(items));
}

export async function getVehicleCatalogModifications(input: {
  generationId: string;
  year?: number;
  bodyTypeId?: string;
  fuelTypeId?: string;
  driveTypeId?: string;
  transmissionId?: string;
}): Promise<VehicleCatalogModificationOption[]> {
  const modifications = await prisma.vehicleModification.findMany({
    where: {
      generationId: input.generationId,
    },
    include: {
      engine: {
        include: {
          fuelType: true,
        },
      },
      driveType: true,
      transmission: true,
      trim: true,
      generation: {
        select: {
          productionStartYear: true,
          productionEndYear: true,
        },
      },
    },
    orderBy: [
      {
        powerHp: 'asc',
      },
      {
        engineVolumeL: 'asc',
      },
      {
        label: 'asc',
      },
    ],
  });

  return modifications
    .filter((modification) => {
      if (input.bodyTypeId && modification.bodyTypeId !== input.bodyTypeId) {
        return false;
      }

      if (input.fuelTypeId && modification.engine?.fuelTypeId !== input.fuelTypeId) {
        return false;
      }

      if (input.driveTypeId && modification.driveTypeId !== input.driveTypeId) {
        return false;
      }

      if (input.transmissionId && modification.transmissionId !== input.transmissionId) {
        return false;
      }

      if (!input.year) {
        return true;
      }

      return isYearWithinRange(
        input.year,
        modification.productionStartYear ?? modification.generation.productionStartYear,
        modification.productionEndYear ?? modification.generation.productionEndYear
      );
    })
    .map((modification) => {
      const fuelLabel = modification.engine?.fuelType.labelRu || modification.engine?.fuelType.label || '';
      const transmissionLabel = modification.transmission?.labelRu || modification.transmission?.label || '';
      const driveLabel = modification.driveType?.labelRu || modification.driveType?.label || '';
      const trimLabel = modification.trim?.nameRu || modification.trim?.name || undefined;

      return {
        id: modification.id,
        label:
          modification.label ||
          createVehicleModificationLabel({
            powerHp: modification.powerHp ?? modification.engine?.powerHp ?? undefined,
            engineVolumeL:
              modification.engineVolumeL ?? modification.engine?.displacementL ?? undefined,
            fuelLabel,
            driveLabel,
            transmissionLabel,
          }),
        hint: trimLabel,
        engineId: modification.engineId ?? '',
        trimId: modification.trimId ?? undefined,
        fuelTypeId: modification.engine?.fuelTypeId ?? '',
        transmissionId: modification.transmissionId ?? '',
        driveTypeId: modification.driveTypeId ?? '',
        fuelLabel,
        transmissionLabel,
        driveLabel,
        trimLabel,
        powerHp: modification.powerHp ?? modification.engine?.powerHp ?? undefined,
        engineVolumeL:
          modification.engineVolumeL ?? modification.engine?.displacementL ?? undefined,
      } satisfies VehicleCatalogModificationOption;
    });
}
