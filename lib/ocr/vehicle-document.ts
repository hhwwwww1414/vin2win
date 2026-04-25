export type VehicleDocumentOcrFields = {
  vin?: string;
  brand?: string;
  model?: string;
  vehicleType?: string;
  year?: string;
  enginePowerHp?: string;
};

export type VehicleDocumentOcrWarning = {
  field?: keyof VehicleDocumentOcrFields;
  code: string;
  message: string;
};

export type VehicleDocumentOcrResult = {
  documentType: 'vehicle-document';
  fields: VehicleDocumentOcrFields;
  confidence: Partial<Record<keyof VehicleDocumentOcrFields, number>>;
  warnings: VehicleDocumentOcrWarning[];
  rawText?: string;
};
