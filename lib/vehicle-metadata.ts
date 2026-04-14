type VehicleColorDefinition = {
  key: string;
  label: string;
  swatch: string;
  borderColor?: string;
};

function normalizeVehicleColorKey(value: string) {
  return value.trim().toLowerCase().replace(/ё/g, 'е');
}

function buildEngineDisplacementOptions() {
  const values: string[] = [];

  for (let value = 0.1; value <= 8.0001; value += 0.1) {
    values.push(value.toFixed(1));
  }

  for (let value = 8.5; value <= 10.0001; value += 0.5) {
    values.push(value.toFixed(1));
  }

  return values;
}

const VEHICLE_COLOR_DEFINITIONS: VehicleColorDefinition[] = [
  {
    key: 'белый',
    label: 'Белый',
    swatch: 'linear-gradient(135deg, #ffffff 0%, #f4f4f5 100%)',
    borderColor: 'rgba(15, 23, 42, 0.12)',
  },
  {
    key: 'черный',
    label: 'Чёрный',
    swatch: 'linear-gradient(135deg, #1f2937 0%, #000000 100%)',
  },
  {
    key: 'коричневый',
    label: 'Коричневый',
    swatch: 'linear-gradient(135deg, #8b5a2b 0%, #b86a08 100%)',
  },
  {
    key: 'фиолетовый',
    label: 'Фиолетовый',
    swatch: 'linear-gradient(135deg, #6d28d9 0%, #9333ea 100%)',
  },
  {
    key: 'зеленый',
    label: 'Зелёный',
    swatch: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
  },
  {
    key: 'серый',
    label: 'Серый',
    swatch: 'linear-gradient(135deg, #8c97a7 0%, #d1d5db 100%)',
  },
  {
    key: 'серебристый',
    label: 'Серебристый',
    swatch: 'linear-gradient(135deg, #9ca3af 0%, #f3f4f6 100%)',
  },
  {
    key: 'синий',
    label: 'Синий',
    swatch: 'linear-gradient(135deg, #1d4ed8 0%, #38bdf8 100%)',
  },
  {
    key: 'голубой',
    label: 'Голубой',
    swatch: 'linear-gradient(135deg, #38bdf8 0%, #7dd3fc 100%)',
  },
  {
    key: 'бежевый',
    label: 'Бежевый',
    swatch: 'linear-gradient(135deg, #fde68a 0%, #fef3c7 100%)',
  },
  {
    key: 'золотистый',
    label: 'Золотистый',
    swatch: 'linear-gradient(135deg, #fbbf24 0%, #facc15 100%)',
  },
  {
    key: 'желтый',
    label: 'Жёлтый',
    swatch: 'linear-gradient(135deg, #fde047 0%, #facc15 100%)',
  },
  {
    key: 'красный',
    label: 'Красный',
    swatch: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  },
  {
    key: 'бордовый',
    label: 'Бордовый',
    swatch: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
  },
  {
    key: 'оранжевый',
    label: 'Оранжевый',
    swatch: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
  },
  {
    key: 'розовый',
    label: 'Розовый',
    swatch: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)',
  },
  {
    key: 'графит',
    label: 'Графит',
    swatch: 'linear-gradient(135deg, #4b5563 0%, #9ca3af 100%)',
  },
];

const VEHICLE_COLOR_ORDER = new Map(
  VEHICLE_COLOR_DEFINITIONS.map((definition, index) => [definition.key, index])
);
const VEHICLE_COLOR_LOOKUP = new Map(
  VEHICLE_COLOR_DEFINITIONS.map((definition) => [definition.key, definition])
);

export const VEHICLE_ENGINE_DISPLACEMENT_OPTIONS = buildEngineDisplacementOptions();
export const DEFAULT_VEHICLE_COLORS = VEHICLE_COLOR_DEFINITIONS.map(
  (definition) => definition.label
);

export function formatEngineDisplacementOptionLabel(value: number | string) {
  const numericValue =
    typeof value === 'number' ? value : Number(String(value).trim().replace(',', '.'));

  if (!Number.isFinite(numericValue)) {
    return String(value);
  }

  return numericValue.toLocaleString('ru-RU', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function getVehicleColorMeta(value: string) {
  const normalizedKey = normalizeVehicleColorKey(value);
  const definition = VEHICLE_COLOR_LOOKUP.get(normalizedKey);

  if (definition) {
    return {
      value,
      label: definition.label,
      swatch: definition.swatch,
      borderColor: definition.borderColor ?? 'rgba(255, 255, 255, 0.16)',
      known: true,
    };
  }

  return {
    value,
    label: value,
    swatch: 'linear-gradient(135deg, #94a3b8 0%, #cbd5e1 100%)',
    borderColor: 'rgba(15, 23, 42, 0.14)',
    known: false,
  };
}

export function orderVehicleColors(values: string[]) {
  return [...new Set(values.filter(Boolean))]
    .sort((left, right) => {
      const leftOrder = VEHICLE_COLOR_ORDER.get(normalizeVehicleColorKey(left));
      const rightOrder = VEHICLE_COLOR_ORDER.get(normalizeVehicleColorKey(right));

      if (leftOrder !== undefined && rightOrder !== undefined) {
        return leftOrder - rightOrder;
      }

      if (leftOrder !== undefined) {
        return -1;
      }

      if (rightOrder !== undefined) {
        return 1;
      }

      return left.localeCompare(right, 'ru');
    });
}
