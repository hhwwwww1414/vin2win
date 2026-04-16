function normalizeInput(value: string) {
  return value.trim().toLowerCase().replace(/ё/g, 'е');
}

function formatEngineVolume(value: number) {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function parseSourceYearRange(value: string) {
  const match = value.match(/\b(19\d{2}|20\d{2}|21\d{2})\s*[-–]\s*(19\d{2}|20\d{2}|21\d{2}|present|null)\b/i);
  if (!match) {
    return { startYear: undefined, endYear: undefined };
  }

  const startYear = Number(match[1]);
  const endYear = /present|null/i.test(match[2]) ? undefined : Number(match[2]);

  return {
    startYear: Number.isFinite(startYear) ? startYear : undefined,
    endYear: Number.isFinite(endYear ?? Number.NaN) ? endYear : undefined,
  };
}

export function normalizeVehicleFuelType(value: string) {
  const normalized = normalizeInput(value);

  if (/(diesel|tdi|dci|cdi)/i.test(normalized)) {
    return { code: 'diesel', label: 'Дизель' };
  }

  if (/(hybrid|phev|plug-in hybrid|mhev)/i.test(normalized)) {
    return { code: 'hybrid', label: 'Гибрид' };
  }

  if (/(electric|bev|ev)/i.test(normalized)) {
    return { code: 'electric', label: 'Электро' };
  }

  if (/(lpg|cng|gbo|газ)/i.test(normalized)) {
    return { code: 'lpg', label: 'ГБО' };
  }

  return { code: 'gasoline', label: 'Бензин' };
}

export function normalizeVehicleTransmission(value: string) {
  const normalized = normalizeInput(value);

  if (/(manual|мкп|stick|6mt|5mt)/i.test(normalized)) {
    return { code: 'manual', label: 'МКПП' };
  }

  if (/(cvt|variator|вариатор)/i.test(normalized)) {
    return { code: 'cvt', label: 'Вариатор' };
  }

  if (/(robot|dct|dual clutch|робот)/i.test(normalized)) {
    return { code: 'robot', label: 'Робот' };
  }

  return { code: 'automatic', label: 'АКПП' };
}

export function normalizeVehicleDriveType(value: string) {
  const normalized = normalizeInput(value);

  if (/(rear|rwd|зад)/i.test(normalized)) {
    return { code: 'rwd', label: 'Задний' };
  }

  if (/(all wheel|awd|4wd|4x4|полный)/i.test(normalized)) {
    return { code: 'awd', label: 'Полный' };
  }

  return { code: 'fwd', label: 'Передний' };
}

export function normalizeVehicleBodyType(value: string) {
  const normalized = normalizeInput(value);

  if (/(suv|sport utility vehicle|внедорожник)/i.test(normalized)) {
    return { code: 'suv', label: 'Внедорожник' };
  }

  if (/(wagon|estate|универсал)/i.test(normalized)) {
    return { code: 'wagon', label: 'Универсал' };
  }

  if (/(liftback|лифтбек)/i.test(normalized)) {
    return { code: 'liftback', label: 'Лифтбек' };
  }

  if (/(hatchback|хэтчбек)/i.test(normalized)) {
    return { code: 'hatchback', label: 'Хэтчбек' };
  }

  if (/(sedan|седан)/i.test(normalized)) {
    return { code: 'sedan', label: 'Седан' };
  }

  if (/(coupe|купе)/i.test(normalized)) {
    return { code: 'coupe', label: 'Купе' };
  }

  if (/(pickup|пикап)/i.test(normalized)) {
    return { code: 'pickup', label: 'Пикап' };
  }

  if (/(van|minivan|минивэн|mpv)/i.test(normalized)) {
    return { code: 'minivan', label: 'Минивэн' };
  }

  if (/(crossover|кроссовер)/i.test(normalized)) {
    return { code: 'crossover', label: 'Кроссовер' };
  }

  return { code: 'sedan', label: 'Седан' };
}

export function createVehicleModificationLabel(input: {
  powerHp?: number;
  engineVolumeL?: number;
  fuelLabel?: string;
  driveLabel?: string;
  transmissionLabel?: string;
}) {
  const segments: string[] = [];
  const header = [
    input.powerHp ? `${input.powerHp} л.с.` : null,
    input.engineVolumeL ? formatEngineVolume(input.engineVolumeL) : null,
    input.fuelLabel ? input.fuelLabel.toLowerCase() : null,
  ]
    .filter(Boolean)
    .join(' ');

  if (header) {
    segments.push(header);
  }

  if (input.driveLabel) {
    segments.push(`${input.driveLabel.toLowerCase()} привод`);
  }

  if (input.transmissionLabel) {
    segments.push(input.transmissionLabel);
  }

  return segments.join(', ').trim();
}
