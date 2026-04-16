import {
  normalizeVehicleDriveType,
  normalizeVehicleFuelType,
  normalizeVehicleTransmission,
} from '@/lib/vehicle-catalog/normalization';
import type { Prisma } from '@prisma/client';
import { createCatalogPrismaClient, normalizeCatalogText } from './common';

function detectFuelCode(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  return normalizeVehicleFuelType(value).code;
}

function detectDriveCode(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  return normalizeVehicleDriveType(value).code;
}

function detectTransmissionCode(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  return normalizeVehicleTransmission(value).code;
}

function isYearWithinRange(year: number, startYear?: number | null, endYear?: number | null) {
  const normalizedStartYear = startYear ?? 1900;
  const normalizedEndYear = endYear ?? new Date().getFullYear() + 1;
  return year >= normalizedStartYear && year <= normalizedEndYear;
}

async function run() {
  const prisma = createCatalogPrismaClient();
  type VehicleModelWithAliases = Prisma.VehicleModelGetPayload<{
    include: {
      aliases: true;
    };
  }>;
  type VehicleModificationWithRelations = Prisma.VehicleModificationGetPayload<{
    include: {
      engine: true;
      trim: true;
    };
  }>;

  const [brands, bodyTypes, fuelTypes, driveTypes, transmissions, saleListings] = await Promise.all([
    prisma.vehicleBrand.findMany({
      include: {
        aliases: true,
      },
    }),
    prisma.vehicleBodyType.findMany(),
    prisma.vehicleFuelType.findMany(),
    prisma.vehicleDriveType.findMany(),
    prisma.vehicleTransmission.findMany(),
    prisma.saleListing.findMany({
      select: {
        id: true,
        make: true,
        model: true,
        generation: true,
        year: true,
        bodyType: true,
        engine: true,
        engineDisplacementL: true,
        power: true,
        transmission: true,
        drive: true,
        trim: true,
        catalogBrandId: true,
        catalogModelId: true,
        catalogGenerationId: true,
        catalogBodyTypeId: true,
        catalogFuelTypeId: true,
        catalogEngineId: true,
        catalogTransmissionId: true,
        catalogDriveTypeId: true,
        catalogModificationId: true,
        catalogTrimId: true,
      },
    }),
  ]);

  const brandByLookup = new Map<string, (typeof brands)[number]>();
  for (const brand of brands) {
    brandByLookup.set(normalizeCatalogText(brand.name), brand);
    if (brand.nameRu) {
      brandByLookup.set(normalizeCatalogText(brand.nameRu), brand);
    }
    for (const alias of brand.aliases) {
      brandByLookup.set(alias.normalizedAlias, brand);
    }
  }

  const bodyTypeByLookup = new Map<string, (typeof bodyTypes)[number]>();
  for (const bodyType of bodyTypes) {
    bodyTypeByLookup.set(normalizeCatalogText(bodyType.labelRu), bodyType);
    bodyTypeByLookup.set(normalizeCatalogText(bodyType.label), bodyType);
  }

  const fuelTypeByCode = new Map(fuelTypes.map((item) => [item.code, item] as const));
  const driveTypeByCode = new Map(driveTypes.map((item) => [item.code, item] as const));
  const transmissionByCode = new Map(transmissions.map((item) => [item.code, item] as const));

  const modelCache = new Map<string, VehicleModelWithAliases[]>();
  const generationCache = new Map<string, Awaited<ReturnType<typeof prisma.vehicleGeneration.findMany>>>();
  const modificationCache = new Map<string, VehicleModificationWithRelations[]>();

  async function getModelsForBrand(brandId: string) {
    const cached = modelCache.get(brandId);
    if (cached) {
      return cached;
    }

    const items = await prisma.vehicleModel.findMany({
      where: {
        brandId,
      },
      include: {
        aliases: true,
      },
    });
    modelCache.set(brandId, items);
    return items;
  }

  async function getGenerationsForModel(modelId: string) {
    const cached = generationCache.get(modelId);
    if (cached) {
      return cached;
    }

    const items = await prisma.vehicleGeneration.findMany({
      where: {
        modelId,
      },
    });
    generationCache.set(modelId, items);
    return items;
  }

  async function getModificationsForGeneration(generationId: string) {
    const cached = modificationCache.get(generationId);
    if (cached) {
      return cached;
    }

    const items = await prisma.vehicleModification.findMany({
      where: {
        generationId,
      },
      include: {
        engine: true,
        trim: true,
      },
    });
    modificationCache.set(generationId, items);
    return items;
  }

  const stats = {
    total: saleListings.length,
    updated: 0,
    brandMatched: 0,
    modelMatched: 0,
    generationMatched: 0,
    modificationMatched: 0,
  };

  for (const listing of saleListings) {
    const brand =
      brandByLookup.get(normalizeCatalogText(listing.make)) ??
      (listing.catalogBrandId
        ? brands.find((item) => item.id === listing.catalogBrandId)
        : undefined);

    if (!brand) {
      continue;
    }

    stats.brandMatched += 1;
    const models = await getModelsForBrand(brand.id);
    const model =
      models.find((item) => normalizeCatalogText(item.name) === normalizeCatalogText(listing.model)) ??
      models.find((item) => item.aliases.some((alias) => alias.normalizedAlias === normalizeCatalogText(listing.model)));

    if (!model) {
      if (listing.catalogBrandId !== brand.id) {
        await prisma.saleListing.update({
          where: { id: listing.id },
          data: {
            catalogBrandId: brand.id,
          },
        });
        stats.updated += 1;
      }
      continue;
    }

    stats.modelMatched += 1;
    const bodyType = bodyTypeByLookup.get(normalizeCatalogText(listing.bodyType));
    const fuelType = fuelTypeByCode.get(detectFuelCode(listing.engine) ?? '');
    const driveType = driveTypeByCode.get(detectDriveCode(listing.drive) ?? '');
    const transmission = transmissionByCode.get(detectTransmissionCode(listing.transmission) ?? '');

    const generations = await getGenerationsForModel(model.id);
    const generation =
      generations.find((item) =>
        [item.label, item.labelRu, item.generationName, item.generationCode]
          .filter(Boolean)
          .some((value) => normalizeCatalogText(String(value)) === normalizeCatalogText(listing.generation ?? ''))
      ) ??
      generations.find(
        (item) =>
          isYearWithinRange(listing.year, item.productionStartYear, item.productionEndYear) &&
          (!bodyType || !item.bodyTypeId || item.bodyTypeId === bodyType.id)
      );

    if (generation) {
      stats.generationMatched += 1;
    }

    let modification:
      | Awaited<ReturnType<typeof prisma.vehicleModification.findMany>>[number]
      | undefined;

    if (generation) {
      const modifications = await getModificationsForGeneration(generation.id);
      modification = modifications.find((item) => {
        if (!isYearWithinRange(listing.year, item.productionStartYear ?? generation.productionStartYear, item.productionEndYear ?? generation.productionEndYear)) {
          return false;
        }

        if (bodyType && item.bodyTypeId !== bodyType.id) {
          return false;
        }

        if (fuelType && item.engine?.fuelTypeId && item.engine.fuelTypeId !== fuelType.id) {
          return false;
        }

        if (driveType && item.driveTypeId && item.driveTypeId !== driveType.id) {
          return false;
        }

        if (transmission && item.transmissionId && item.transmissionId !== transmission.id) {
          return false;
        }

        if (listing.power && item.powerHp && Math.abs(item.powerHp - listing.power) > 5) {
          return false;
        }

        if (listing.engineDisplacementL && item.engineVolumeL && Math.abs(item.engineVolumeL - listing.engineDisplacementL) > 0.2) {
          return false;
        }

        if (listing.trim && item.trim?.name && normalizeCatalogText(item.trim.name) !== normalizeCatalogText(listing.trim)) {
          return false;
        }

        return true;
      });
    }

    if (modification) {
      stats.modificationMatched += 1;
    }

    const nextData = {
      catalogBrandId: brand.id,
      catalogModelId: model.id,
      catalogGenerationId: generation?.id ?? null,
      catalogBodyTypeId: bodyType?.id ?? null,
      catalogFuelTypeId: fuelType?.id ?? null,
      catalogEngineId: modification?.engineId ?? null,
      catalogTransmissionId: transmission?.id ?? modification?.transmissionId ?? null,
      catalogDriveTypeId: driveType?.id ?? modification?.driveTypeId ?? null,
      catalogModificationId: modification?.id ?? null,
      catalogTrimId: modification?.trimId ?? null,
    };

    const hasChanges =
      listing.catalogBrandId !== nextData.catalogBrandId ||
      listing.catalogModelId !== nextData.catalogModelId ||
      listing.catalogGenerationId !== nextData.catalogGenerationId ||
      listing.catalogBodyTypeId !== nextData.catalogBodyTypeId ||
      listing.catalogFuelTypeId !== nextData.catalogFuelTypeId ||
      listing.catalogEngineId !== nextData.catalogEngineId ||
      listing.catalogTransmissionId !== nextData.catalogTransmissionId ||
      listing.catalogDriveTypeId !== nextData.catalogDriveTypeId ||
      listing.catalogModificationId !== nextData.catalogModificationId ||
      listing.catalogTrimId !== nextData.catalogTrimId;

    if (!hasChanges) {
      continue;
    }

    await prisma.saleListing.update({
      where: {
        id: listing.id,
      },
      data: nextData,
    });
    stats.updated += 1;
  }

  console.log(JSON.stringify(stats, null, 2));
  await prisma.$disconnect();
}

void run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
