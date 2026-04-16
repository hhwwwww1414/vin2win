# Интеграция формы подачи объявления

## Что изменено

Форма продажи в `app/listing/new/page.tsx` переведена с локального статического каталога на серверный зависимый каталог автомобилей.

Новый сценарий выбора:

- марка
- модель
- год
- кузов
- поколение
- тип топлива
- привод
- коробка
- модификация

После выбора модификации форма автоматически подставляет:

- тип топлива;
- привод;
- коробку;
- мощность;
- объем двигателя;
- комплектацию, если она есть в каталоге.

## Клиентская интеграция

Основной клиентский слой:

- `hooks/use-vehicle-catalog-form.ts`

Хук:

- загружает следующую ступень селекторов только по мере выбора;
- кэширует ответы по URL;
- восстанавливает `catalog*Id` по label, если открывается старое или дублируемое объявление;
- сбрасывает нижележащие зависимости при изменении верхнего уровня.

Логика сброса вынесена в:

- `lib/vehicle-catalog/form.ts`

## API каталога

Реализованы специализированные endpoints:

- `GET /api/vehicle-catalog/brands`
- `GET /api/vehicle-catalog/models`
- `GET /api/vehicle-catalog/years`
- `GET /api/vehicle-catalog/bodies`
- `GET /api/vehicle-catalog/generations`
- `GET /api/vehicle-catalog/fuel-types`
- `GET /api/vehicle-catalog/drive-types`
- `GET /api/vehicle-catalog/transmissions`
- `GET /api/vehicle-catalog/modifications`

Серверный query layer:

- `lib/server/vehicle-catalog.ts`

Особенности:

- нет универсального endpoint-а `отдай всё`;
- filtering идет на сервере;
- form-friendly выдача возвращает только текстовые варианты для текущего шага;
- generation narrowing теперь опирается на canonical year range поколения, чтобы не показывать `2022-н.в.` для машины `2020` года.

## Совместимость с текущими объявлениями

`SaleListing` не теряет старые raw-поля.

Дополнительно сохраняются nullable catalog references:

- `catalogBrandId`
- `catalogModelId`
- `catalogBodyTypeId`
- `catalogGenerationId`
- `catalogFuelTypeId`
- `catalogEngineId`
- `catalogTransmissionId`
- `catalogDriveTypeId`
- `catalogModificationId`
- `catalogTrimId`

При записи нового объявления:

- форма отправляет и raw snapshot, и `catalog*Id`;
- backend сохраняет оба слоя.

При чтении старого объявления:

- если `catalog*Id` есть, форма использует каталог;
- если `catalog*Id` нет, форма открывается с raw fallback и пытается восстановить связи по label-ам.

## Backend-изменения

Изменены:

- `app/api/listings/route.ts`
- `app/api/account/listings/[id]/route.ts`
- `lib/server/marketplace.ts`
- `lib/sale-form.ts`
- `lib/types.ts`

Что это дает:

- форма умеет сохранять и редактировать объявления с catalog ids;
- старые объявления не ломаются;
- новая логика остается совместимой с legacy read/edit flow.

## Проверка

Добавлены тесты трех уровней:

- unit:
  - нормализация source title-ов;
  - выбор правильного поколения по overlap лет;
  - reset/autofill логика формы;
- integration:
  - live DB chain `Land Rover -> Range Rover Sport -> 2020`;
- UI:
  - Playwright spec `tests/qa/listing-vehicle-catalog.spec.ts`
  - проверяет автоподстановку модификации и сброс зависимых полей после смены топлива;
  - прогнан на `chromium-desktop` и `chromium-mobile`.

## Известные ограничения

- часть кузовов все еще шумная на уровне источников и может требовать дополнительной ручной чистки;
- не для всех старых объявлений удалось восстановить `catalogModelId` и `catalogGenerationId`;
- текущий UI остается текстовым и не использует изображения поколений, кузовов или модификаций.

## Дальнейшие шаги

- добавить ручной moderation flow для `lowConfidence` записей каталога;
- улучшить RF-specific alias map для локальных брендов и китайских марок;
- при необходимости вынести cache layer каталога в server cache / edge cache для high-traffic режима.
