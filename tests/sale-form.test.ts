import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSaleSubmissionPayload,
  mergeSaleFormWithEditableListing,
  saleDefaults,
} from '@/lib/sale-form';

test('buildSaleSubmissionPayload excludes removed ui-only flags and preserves region plus plate data', () => {
  const payload = buildSaleSubmissionPayload(
    {
      ...saleDefaults,
      sellerName: 'Иван',
      contact: '+7 999 000-00-00',
      make: 'BMW',
      model: 'X5',
      year: '2022',
      region: 'Московская область',
      city: 'Москва',
      plateNumber: 'М192ММ',
      plateRegion: '192',
      plateUnregistered: false,
      price: '4500000',
      bodyType: 'SUV',
      catalogBrandId: 'brand-bmw',
      catalogModelId: 'model-x5',
      catalogFuelTypeId: 'fuel-gasoline',
      catalogTransmissionId: 'transmission-automatic',
      engine: 'Бензин',
      transmission: 'АКПП',
      drive: 'Полный',
      description: 'Тест',
    },
    'PENDING'
  );

  assert.equal(payload.initialStatus, 'PENDING');
  assert.equal(payload.region, 'Московская область');
  assert.equal(payload.plateNumber, 'М192ММ');
  assert.equal(payload.plateRegion, '192');
  assert.equal(payload.plateUnregistered, false);
  assert.equal(payload.catalogBrandId, 'brand-bmw');
  assert.equal(payload.catalogModelId, 'model-x5');
  assert.equal(payload.catalogFuelTypeId, 'fuel-gasoline');
  assert.equal(payload.catalogTransmissionId, 'transmission-automatic');
  assert.ok(!('noRestrictions' in payload));
  assert.ok(!('techOk' in payload));
});

test('mergeSaleFormWithEditableListing keeps vin, investment note, region and plate data from stored listing data', () => {
  const merged = mergeSaleFormWithEditableListing(saleDefaults, {
    make: 'Audi',
    model: 'A6',
    catalogBrandId: 'brand-audi',
    catalogModelId: 'model-a6',
    catalogGenerationId: 'generation-c8',
    year: 2021,
    region: 'Ленинградская область',
    city: 'Санкт-Петербург',
    price: 3200000,
    bodyType: 'Седан',
    engine: 'Бензин',
    transmission: 'АКПП',
    drive: 'Полный',
    mileage: 72000,
    steering: 'Левый',
    color: 'Черный',
    owners: 2,
    paintCount: 1,
    paintedElements: 'Капот, Дверь',
    taxi: false,
    carsharing: false,
    avtotekaStatus: 'green',
    needsInvestment: true,
    conditionNote: 'Заменить лобовое стекло',
    wheelSet: true,
    extraTires: false,
    glassOriginal: true,
    sellerType: 'broker',
    resourceStatus: 'not_listed',
    description: 'Описание',
    sellerName: 'Петр',
    contact: '+7 999 111-22-33',
    vin: 'WAUZZZ4F1AN000001',
    plateNumber: 'М192ММ',
    plateRegion: '192',
    plateUnregistered: true,
    videoUrl: 'https://example.com/video.mp4',
  });

  assert.equal(merged.vin, 'WAUZZZ4F1AN000001');
  assert.equal(merged.catalogBrandId, 'brand-audi');
  assert.equal(merged.catalogModelId, 'model-a6');
  assert.equal(merged.catalogGenerationId, 'generation-c8');
  assert.equal(merged.region, 'Ленинградская область');
  assert.equal(merged.plateNumber, 'М192ММ');
  assert.equal(merged.plateRegion, '192');
  assert.equal(merged.plateUnregistered, true);
  assert.equal(merged.investmentNote, 'Заменить лобовое стекло');
  assert.equal(merged.noInvestment, false);
  assert.equal(merged.notTaxi, true);
  assert.equal(merged.notCarsharing, true);
});

test('saleDefaults start with empty transmission and drive while keeping readable steering', () => {
  assert.equal(saleDefaults.transmission, '');
  assert.equal(saleDefaults.drive, '');
  assert.equal(saleDefaults.steering, 'Левый');
});
