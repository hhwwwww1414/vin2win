import test from 'node:test';
import assert from 'node:assert/strict';

function hasDatabaseEnv() {
  return Boolean(
    process.env.DATABASE_URL ||
      (process.env.POSTGRESQL_HOST &&
        process.env.POSTGRESQL_PORT &&
        process.env.POSTGRESQL_USER &&
        process.env.POSTGRESQL_PASSWORD &&
        process.env.POSTGRESQL_DBNAME)
  );
}

test('live catalog query chain resolves Land Rover Range Rover Sport 2020', async (t) => {
  if (!hasDatabaseEnv()) {
    t.skip('Database environment is not configured.');
    return;
  }

  process.env.S3_ENDPOINT ||= 'https://example.com';
  process.env.S3_BUCKET ||= 'test-bucket';
  process.env.S3_ACCESS_KEY ||= 'test-access-key';
  process.env.S3_SECRET_KEY ||= 'test-secret-key';
  process.env.S3_PUBLIC_URL ||= 'https://example.com/test-bucket';

  const catalog = require('../lib/server/vehicle-catalog.ts') as typeof import('../lib/server/vehicle-catalog');

  const brand = (await catalog.getVehicleCatalogBrands({ query: 'land rover', limit: 20 })).find(
    (item) => item.label === 'Land Rover'
  );
  assert.ok(brand, 'expected Land Rover brand in catalog');

  const model = (
    await catalog.getVehicleCatalogModels({
      brandId: brand.id,
      query: 'range rover sport',
      limit: 20,
    })
  ).find((item) => item.label === 'Range Rover Sport');
  assert.ok(model, 'expected Range Rover Sport model in catalog');

  const body = (await catalog.getVehicleCatalogBodies({ modelId: model.id, year: 2020 }))[0];
  assert.ok(body, 'expected at least one body option for 2020');

  const generation = (
    await catalog.getVehicleCatalogGenerations({
      modelId: model.id,
      year: 2020,
      bodyTypeId: body.id,
    })
  )[0];
  assert.ok(generation, 'expected at least one generation for 2020');
  assert.match(generation.label, /2013-2022/i);

  const fuel = (
    await catalog.getVehicleCatalogFuelTypes({
      generationId: generation.id,
      year: 2020,
      bodyTypeId: body.id,
    })
  )[0];
  assert.ok(fuel, 'expected at least one fuel option');

  const drive = (
    await catalog.getVehicleCatalogDriveTypes({
      generationId: generation.id,
      fuelTypeId: fuel.id,
      year: 2020,
      bodyTypeId: body.id,
    })
  )[0];
  assert.ok(drive, 'expected at least one drive option');

  const transmission = (
    await catalog.getVehicleCatalogTransmissions({
      generationId: generation.id,
      fuelTypeId: fuel.id,
      driveTypeId: drive.id,
      year: 2020,
      bodyTypeId: body.id,
    })
  )[0];
  assert.ok(transmission, 'expected at least one transmission option');

  const modifications = await catalog.getVehicleCatalogModifications({
    generationId: generation.id,
    fuelTypeId: fuel.id,
    driveTypeId: drive.id,
    transmissionId: transmission.id,
    year: 2020,
    bodyTypeId: body.id,
  });
  assert.ok(modifications.length > 0, 'expected at least one modification option');
});
