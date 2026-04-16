import type { SaleData } from '@/lib/sale-form';

type VehicleCatalogSelectionLevel =
  | 'brand'
  | 'model'
  | 'year'
  | 'bodyType'
  | 'generation'
  | 'fuelType'
  | 'driveType'
  | 'transmission';

type VehicleCatalogSelection = {
  level: VehicleCatalogSelectionLevel;
  id: string;
  label: string;
};

type VehicleCatalogModificationSelection = {
  modificationId: string;
  engineId: string;
  trimId?: string;
  fuelTypeId: string;
  transmissionId: string;
  driveTypeId: string;
  fuelLabel: string;
  transmissionLabel: string;
  driveLabel: string;
  trimLabel?: string;
  powerHp?: number;
  engineVolumeL?: number;
};

function withClearedFields(current: SaleData, fields: Array<keyof SaleData>) {
  const next = { ...current };

  for (const field of fields) {
    (next as Record<string, unknown>)[field] = '';
  }

  return next;
}

export function applyVehicleCatalogSelection(current: SaleData, selection: VehicleCatalogSelection): SaleData {
  switch (selection.level) {
    case 'brand': {
      const next = withClearedFields(current, [
        'model',
        'catalogModelId',
        'year',
        'bodyType',
        'catalogBodyTypeId',
        'generation',
        'catalogGenerationId',
        'engine',
        'catalogFuelTypeId',
        'engineDisplacementL',
        'catalogEngineId',
        'power',
        'transmission',
        'catalogTransmissionId',
        'drive',
        'catalogDriveTypeId',
        'trim',
        'catalogModificationId',
        'catalogTrimId',
      ]);
      next.make = selection.label;
      next.catalogBrandId = selection.id;
      return next;
    }
    case 'model': {
      const next = withClearedFields(current, [
        'year',
        'bodyType',
        'catalogBodyTypeId',
        'generation',
        'catalogGenerationId',
        'engine',
        'catalogFuelTypeId',
        'engineDisplacementL',
        'catalogEngineId',
        'power',
        'transmission',
        'catalogTransmissionId',
        'drive',
        'catalogDriveTypeId',
        'trim',
        'catalogModificationId',
        'catalogTrimId',
      ]);
      next.model = selection.label;
      next.catalogModelId = selection.id;
      return next;
    }
    case 'year': {
      const next = withClearedFields(current, [
        'bodyType',
        'catalogBodyTypeId',
        'generation',
        'catalogGenerationId',
        'engine',
        'catalogFuelTypeId',
        'engineDisplacementL',
        'catalogEngineId',
        'power',
        'transmission',
        'catalogTransmissionId',
        'drive',
        'catalogDriveTypeId',
        'trim',
        'catalogModificationId',
        'catalogTrimId',
      ]);
      next.year = selection.label;
      return next;
    }
    case 'bodyType': {
      const next = withClearedFields(current, [
        'generation',
        'catalogGenerationId',
        'engine',
        'catalogFuelTypeId',
        'engineDisplacementL',
        'catalogEngineId',
        'power',
        'transmission',
        'catalogTransmissionId',
        'drive',
        'catalogDriveTypeId',
        'trim',
        'catalogModificationId',
        'catalogTrimId',
      ]);
      next.bodyType = selection.label;
      next.catalogBodyTypeId = selection.id;
      return next;
    }
    case 'generation': {
      const next = withClearedFields(current, [
        'engine',
        'catalogFuelTypeId',
        'engineDisplacementL',
        'catalogEngineId',
        'power',
        'transmission',
        'catalogTransmissionId',
        'drive',
        'catalogDriveTypeId',
        'trim',
        'catalogModificationId',
        'catalogTrimId',
      ]);
      next.generation = selection.label;
      next.catalogGenerationId = selection.id;
      return next;
    }
    case 'fuelType': {
      const next = withClearedFields(current, [
        'engineDisplacementL',
        'catalogEngineId',
        'power',
        'transmission',
        'catalogTransmissionId',
        'drive',
        'catalogDriveTypeId',
        'trim',
        'catalogModificationId',
        'catalogTrimId',
      ]);
      next.engine = selection.label;
      next.catalogFuelTypeId = selection.id;
      return next;
    }
    case 'driveType': {
      const next = withClearedFields(current, [
        'transmission',
        'catalogTransmissionId',
        'trim',
        'catalogModificationId',
        'catalogTrimId',
      ]);
      next.drive = selection.label;
      next.catalogDriveTypeId = selection.id;
      return next;
    }
    case 'transmission': {
      const next = withClearedFields(current, ['trim', 'catalogModificationId', 'catalogTrimId']);
      next.transmission = selection.label;
      next.catalogTransmissionId = selection.id;
      return next;
    }
    default:
      return current;
  }
}

export function applyVehicleCatalogModificationSelection(
  current: SaleData,
  selection: VehicleCatalogModificationSelection
): SaleData {
  return {
    ...current,
    catalogModificationId: selection.modificationId,
    catalogEngineId: selection.engineId,
    catalogTrimId: selection.trimId ?? '',
    catalogFuelTypeId: selection.fuelTypeId,
    catalogTransmissionId: selection.transmissionId,
    catalogDriveTypeId: selection.driveTypeId,
    engine: selection.fuelLabel,
    transmission: selection.transmissionLabel,
    drive: selection.driveLabel,
    power: selection.powerHp != null ? String(selection.powerHp) : current.power,
    engineDisplacementL:
      selection.engineVolumeL != null
        ? selection.engineVolumeL.toLocaleString('en-US', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })
        : current.engineDisplacementL,
    trim: selection.trimLabel ?? current.trim,
  };
}
