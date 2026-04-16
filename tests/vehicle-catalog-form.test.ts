import test from 'node:test';
import assert from 'node:assert/strict';
import { saleDefaults } from '@/lib/sale-form';
import {
  applyVehicleCatalogModificationSelection,
  applyVehicleCatalogSelection,
} from '@/lib/vehicle-catalog/form';

test('applyVehicleCatalogSelection resets dependent levels when brand changes', () => {
  const current = {
    ...saleDefaults,
    make: 'Land Rover',
    model: 'Range Rover Sport',
    year: '2020',
    bodyType: 'Внедорожник',
    generation: 'II рестайлинг',
    engine: 'Бензин',
    transmission: 'АКПП',
    drive: 'Полный',
    trim: 'HSE Dynamic',
    catalogBrandId: 'brand-land-rover',
    catalogModelId: 'model-rr-sport',
    catalogBodyTypeId: 'body-suv',
    catalogGenerationId: 'generation-l494-facelift',
    catalogFuelTypeId: 'fuel-gasoline',
    catalogTransmissionId: 'transmission-automatic',
    catalogDriveTypeId: 'drive-awd',
    catalogModificationId: 'mod-rrs-2020',
  };

  const next = applyVehicleCatalogSelection(current, {
    level: 'brand',
    id: 'brand-bmw',
    label: 'BMW',
  });

  assert.equal(next.make, 'BMW');
  assert.equal(next.catalogBrandId, 'brand-bmw');
  assert.equal(next.model, '');
  assert.equal(next.catalogModelId, '');
  assert.equal(next.year, '');
  assert.equal(next.bodyType, '');
  assert.equal(next.generation, '');
  assert.equal(next.engine, '');
  assert.equal(next.catalogFuelTypeId, '');
  assert.equal(next.catalogModificationId, '');
  assert.equal(next.trim, '');
});

test('applyVehicleCatalogModificationSelection autofills engine, volume, power and trim snapshot fields', () => {
  const current = {
    ...saleDefaults,
    make: 'Land Rover',
    model: 'Range Rover Sport',
    catalogBrandId: 'brand-land-rover',
    catalogModelId: 'model-rr-sport',
    generation: 'II рестайлинг',
    catalogGenerationId: 'generation-l494-facelift',
    bodyType: 'Внедорожник',
    catalogBodyTypeId: 'body-suv',
  };

  const next = applyVehicleCatalogModificationSelection(current, {
    modificationId: 'mod-rrs-3-0-at',
    engineId: 'engine-3-0-gasoline',
    trimId: 'trim-hse-dynamic',
    fuelTypeId: 'fuel-gasoline',
    transmissionId: 'transmission-automatic',
    driveTypeId: 'drive-awd',
    fuelLabel: 'Бензин',
    transmissionLabel: 'АКПП',
    driveLabel: 'Полный',
    trimLabel: 'HSE Dynamic',
    powerHp: 400,
    engineVolumeL: 3,
  });

  assert.equal(next.catalogModificationId, 'mod-rrs-3-0-at');
  assert.equal(next.catalogEngineId, 'engine-3-0-gasoline');
  assert.equal(next.catalogTrimId, 'trim-hse-dynamic');
  assert.equal(next.catalogFuelTypeId, 'fuel-gasoline');
  assert.equal(next.catalogTransmissionId, 'transmission-automatic');
  assert.equal(next.catalogDriveTypeId, 'drive-awd');
  assert.equal(next.engine, 'Бензин');
  assert.equal(next.transmission, 'АКПП');
  assert.equal(next.drive, 'Полный');
  assert.equal(next.power, '400');
  assert.equal(next.engineDisplacementL, '3.0');
  assert.equal(next.trim, 'HSE Dynamic');
});
