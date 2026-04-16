# Импорт автомобильного каталога

## Цель

Собрать воспроизводимый pipeline, который:

- не использует сырые внешние данные напрямую в production;
- сохраняет source provenance;
- нормализует бренд, модель, поколение, модификацию и силовую установку под рынок РФ;
- позволяет безопасно переимпортировать каталог без потери объявлений.

## Источники

- `vendor/vehicle-data/car-api`
  - основной источник брендов, моделей и поколений;
- `vendor/vehicle-data/open-vehicle-db`
  - покрытие годов выпуска, кузовов и model aliases;
- `vendor/vehicle-data/automobile-models-and-specs`
  - двигатели, мощность, объем, привод, коробка, текст модификаций;
- `vehicles.csv.zip`
  - дополнительный источник powertrain-данных и global aliases.

## Структура pipeline

### 1. Source snapshot

Сырые источники лежат в репозитории и не читаются приложением напрямую.

### 2. Import run

Каждый запуск импорта создает записи в:

- `VehicleCatalogImportRun`
- `VehicleCatalogRawRecord`

Это дает:

- трассировку происхождения записи;
- dry run и статистику;
- возможность сравнивать новые и старые загрузки.

### 3. Canonical normalization

Нормализация выполняется в `scripts/vehicle-catalog/import.ts`.

Ключевые правила:

- бренды схлопываются по normalized name и alias-ам;
- модели схлопываются по `brand + normalized model name`;
- поколения берутся в первую очередь из `car-api`;
- модификации собираются из связки generation + body + engine + drive + transmission + trim;
- русские label-ы для кузова, топлива, коробки и привода строятся на этапе импорта;
- неоднозначные записи сохраняются с `lowConfidence = true`.

### 4. Production load

Загрузка выполняется полным rebuild каталога:

- staging/history сохраняется;
- текущие `SaleListing` не удаляются и не переписываются в raw-полях;
- после rebuild выполняется отдельный backfill `catalog*Id` в объявлениях.

## Реализованные команды

- `npm run vehicle-catalog:import:dry-run`
  - читает источники, строит canonical stats, но не пишет production-таблицы;
- `npm run vehicle-catalog:import`
  - полный импорт каталога;
- `npm run vehicle-catalog:import:update`
  - alias для полного импорта;
- `npm run vehicle-catalog:backfill-sale-listings`
  - пытается сопоставить старые объявления с новым каталогом;
- `npm run vehicle-catalog:report`
  - печатает объем каталога, покрытие объявлений и последние import runs.

## Порядок запуска

1. Применить миграцию каталога.
2. Выполнить `npm run vehicle-catalog:import:dry-run`.
3. Выполнить `npm run vehicle-catalog:import:update`.
4. Выполнить `npm run vehicle-catalog:backfill-sale-listings`.
5. Выполнить `npm run vehicle-catalog:report`.

## Качество данных

Реализованные защитные меры:

- чистка битых source title-ов вроде `2023LAND ROVER ...` и `22025 BMW ...`;
- выбор поколения по максимальному overlap диапазонов лет, а не по последнему пересечению;
- server-side narrowing по canonical generation range;
- сохранение raw payload и source mappings для дальнейшей ручной корректировки.

## Состояние каталога на 16 апреля 2026

После последнего полного импорта:

- `brands`: `165`
- `models`: `4540`
- `generations`: `5898`
- `engines`: `9285`
- `trims`: `1211`
- `modifications`: `29350`
- `rawRecords`: `51701`

Покрытие текущих объявлений после backfill:

- всего объявлений: `19`
- найден бренд: `16`
- найдена модель: `9`
- найдено поколение: `9`
- найдена модификация: `2`

## Ограничения

- часть кузовов из внешних источников еще шумная, особенно в `open-vehicle-db`;
- покрытие для локальных и нишевых брендов РФ и КНР неполное;
- не каждая модификация reliably привязывается к trim.

## Rollback

Схема и миграция additive.

Практический rollback:

1. Переключить UI и API обратно на raw-поля формы.
2. Не использовать `catalog*Id` при чтении/записи.
3. При необходимости перестать запускать import/backfill команды.

Hard rollback возможен отдельной SQL-миграцией на удаление новых catalog tables и nullable `catalog*Id` полей, но для текущего проекта он не обязателен, потому что старые raw-поля `SaleListing` сохранены и остаются источником правды для legacy-объявлений.
