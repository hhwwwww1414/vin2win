export type VehicleCatalogOption = {
  id: string;
  label: string;
  hint?: string;
};

export type VehicleCatalogModificationOption = VehicleCatalogOption & {
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

export type VehicleCatalogOptionsResponse<TItem extends VehicleCatalogOption = VehicleCatalogOption> = {
  items: TItem[];
};
