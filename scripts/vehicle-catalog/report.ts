import { createCatalogPrismaClient } from './common';

async function run() {
  const prisma = createCatalogPrismaClient();

  const [
    brandCount,
    modelCount,
    generationCount,
    engineCount,
    trimCount,
    modificationCount,
    rawRecordCount,
    importRuns,
    saleListingCount,
    mappedBrandCount,
    mappedModelCount,
    mappedGenerationCount,
    mappedModificationCount,
  ] = await Promise.all([
    prisma.vehicleBrand.count(),
    prisma.vehicleModel.count(),
    prisma.vehicleGeneration.count(),
    prisma.vehicleEngine.count(),
    prisma.vehicleTrim.count(),
    prisma.vehicleModification.count(),
    prisma.vehicleCatalogRawRecord.count(),
    prisma.vehicleCatalogImportRun.findMany({
      orderBy: {
        startedAt: 'desc',
      },
      take: 10,
      include: {
        source: true,
      },
    }),
    prisma.saleListing.count(),
    prisma.saleListing.count({
      where: {
        catalogBrandId: {
          not: null,
        },
      },
    }),
    prisma.saleListing.count({
      where: {
        catalogModelId: {
          not: null,
        },
      },
    }),
    prisma.saleListing.count({
      where: {
        catalogGenerationId: {
          not: null,
        },
      },
    }),
    prisma.saleListing.count({
      where: {
        catalogModificationId: {
          not: null,
        },
      },
    }),
  ]);

  console.log(
    JSON.stringify(
      {
        catalog: {
          brands: brandCount,
          models: modelCount,
          generations: generationCount,
          engines: engineCount,
          trims: trimCount,
          modifications: modificationCount,
          rawRecords: rawRecordCount,
        },
        saleListingCoverage: {
          total: saleListingCount,
          brand: mappedBrandCount,
          model: mappedModelCount,
          generation: mappedGenerationCount,
          modification: mappedModificationCount,
        },
        recentImports: importRuns.map((run) => ({
          id: run.id,
          source: run.source.name,
          status: run.status,
          mode: run.mode,
          startedAt: run.startedAt.toISOString(),
          finishedAt: run.finishedAt?.toISOString(),
          stats: run.stats,
        })),
      },
      null,
      2
    )
  );

  await prisma.$disconnect();
}

void run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
