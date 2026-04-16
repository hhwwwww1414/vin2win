import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createVehicleModificationLabel,
  normalizeVehicleBodyType,
  normalizeVehicleDriveType,
  normalizeVehicleFuelType,
  normalizeVehicleTransmission,
  parseSourceYearRange,
} from '@/lib/vehicle-catalog/normalization';
import { cleanAutoTitle, normalizeAutomobileModelTitle } from '@/scripts/vehicle-catalog/import';

test('parseSourceYearRange extracts inclusive years from automobile source titles', () => {
  assert.deepEqual(
    parseSourceYearRange('AC Aceca 1998-2000 Photos, engines & full specs'),
    { startYear: 1998, endYear: 2000 }
  );
});

test('normalizeVehicleFuelType translates common global fuel labels into RU-facing catalog values', () => {
  assert.deepEqual(normalizeVehicleFuelType('Gasoline'), {
    code: 'gasoline',
    label: 'Бензин',
  });
  assert.deepEqual(normalizeVehicleFuelType('Diesel'), {
    code: 'diesel',
    label: 'Дизель',
  });
  assert.deepEqual(normalizeVehicleFuelType('Plug-in Hybrid'), {
    code: 'hybrid',
    label: 'Гибрид',
  });
});

test('normalizeVehicleTransmission and drive type convert source labels into catalog options', () => {
  assert.deepEqual(normalizeVehicleTransmission('6-Speed Manual'), {
    code: 'manual',
    label: 'МКПП',
  });
  assert.deepEqual(normalizeVehicleTransmission('Automatic 8-spd'), {
    code: 'automatic',
    label: 'АКПП',
  });
  assert.deepEqual(normalizeVehicleDriveType('Rear Wheel Drive'), {
    code: 'rwd',
    label: 'Задний',
  });
  assert.deepEqual(normalizeVehicleDriveType('All Wheel Drive'), {
    code: 'awd',
    label: 'Полный',
  });
});

test('normalizeVehicleBodyType maps source body labels into RF-facing dictionary labels', () => {
  assert.deepEqual(normalizeVehicleBodyType('Sport Utility Vehicle (SUV)/Multi-Purpose Vehicle (MPV)'), {
    code: 'suv',
    label: 'Внедорожник',
  });
  assert.deepEqual(normalizeVehicleBodyType('wagon'), {
    code: 'wagon',
    label: 'Универсал',
  });
});

test('createVehicleModificationLabel renders human readable text for selectors', () => {
  assert.equal(
    createVehicleModificationLabel({
      powerHp: 249,
      engineVolumeL: 3,
      fuelLabel: 'Дизель',
      driveLabel: 'Полный',
      transmissionLabel: 'АКПП',
    }),
    '249 л.с. 3.0 дизель, полный привод, АКПП'
  );
});
