# Архитектура каталога автомобилей

## Цель

Построить нормализованный автомобильный каталог под рынок РФ, который:

- не ломает существующие объявления;
- поддерживает зависимые селекты формы;
- хранит source provenance;
- поддерживает alias-ы и частичный fallback;
- позволяет повторяемый импорт и обновление.

## Архитектурный подход

Используется трехслойная модель:

1. `source layer`
2. `staging layer`
3. `canonical catalog layer`

Отдельно от каталога сохраняется `listing compatibility layer` для `SaleListing`.

## Слои данных

### 1. Source layer

Сырые данные хранятся в репозитории:

- `vendor/vehicle-data/open-vehicle-db`
- `vendor/vehicle-data/automobile-models-and-specs`
- `vendor/vehicle-data/car-api`
- `vehicles.csv`

Эти файлы не используются напрямую приложением.

### 2. Staging layer

Staging хранит импорт по source run:

- какой источник
- какой record type
- какой source external id
- исходный payload
- checksum
- служебные поля run-а

Назначение:

- воспроизводимость импорта;
- трассировка происхождения;
- dry-run/reporting;
- безопасная дедупликация.

### 3. Canonical catalog layer

Канонический каталог содержит очищенные сущности:

- бренды
- модели
- кузова
- поколения
- моторы
- коробки
- приводы
- модификации
- комплектации
- alias-ы
- source mapping

Это единственный слой, который используется API формы.

## Каноническая схема

### Справочники

- `VehicleCatalogSource`
  - справочник источников
- `VehicleBodyType`
  - канонические кузова с русскими и английскими label-ами
- `VehicleFuelType`
  - канонические типы топлива
- `VehicleTransmission`
  - канонические коробки
- `VehicleDriveType`
  - канонические приводы

### Иерархия

- `VehicleBrand`
- `VehicleBrandAlias`
- `VehicleModel`
- `VehicleModelAlias`
- `VehicleGeneration`
- `VehicleEngine`
- `VehicleTrim`
- `VehicleModification`

### Service tables

- `VehicleCatalogImportRun`
- `VehicleCatalogRawRecord`
- `VehicleSourceMapping`

## Модель связей

### Brand

- 1 бренд -> N моделей
- есть alias-ы:
  - кириллица
  - латиница
  - транслитерация
  - market-specific spelling

### Model

- 1 модель -> N поколений
- модель хранит:
  - `name`
  - `nameRu`
  - `slug`
  - `normalizedName`
  - `productionStartYear`
  - `productionEndYear`

### Generation

- 1 поколение относится к 1 модели
- поколение хранит:
  - label для РФ-интерфейса
  - диапазон выпуска
  - признак рестайлинга
  - generation code / platform code
  - `lowConfidence`, если поколение собрано эвристически

### Modification

- 1 модификация относится к 1 поколению
- модификация связывает:
  - кузов
  - двигатель
  - привод
  - коробку
  - комплектацию
  - диапазон лет
- модификация хранит display label для UI:
  - `249 л.с. 3.0 дизель, полный привод, АКПП`

### Engine

- хранит:
  - тип топлива
  - объем в литрах
  - мощность в л.с.
  - цилиндры
  - engine code
  - raw source label

## Раскладка по источникам

### car-api

Используется как основной источник:

- брендов
- моделей
- поколений
- диапазонов выпуска поколений

### open-vehicle-db

Используется как источник:

- year/style coverage
- вариантов кузовов
- дополнительных alias-ов моделей

### automobile-models-and-specs

Используется как основной источник:

- двигателей
- мощности
- объема
- привода
- коробки
- текстов модификаций

### EPA vehicles.csv

Используется как дополнительный источник:

- доп. вариантов powertrain
- fuel/displacement/cylinders normalization
- alias coverage для global names

## Нормализация

## Правила склейки

### Brand merge

- match по normalized slug
- потом по alias
- потом по ручной map-таблице для известных отличий

Примеры:

- `Mercedes-Benz` <- `Mercedes-AMG` как related alias, но не всегда одна и та же brand identity
- `Lada (ВАЗ)` <- `LADA`, `VAZ`, `ВАЗ`
- `Land Rover` и `Range Rover` не склеиваются в бренд, но используются в model alias rules

### Model merge

- match по brand + normalized model name
- match по alias и baseModel
- поддержка ручных правил для:
  - `G-Class 400 d` -> `G-Class`
  - `Huracan EVO` -> family `Huracan`
  - `Range Rover Sport` -> отдельная модель, а не `Range Rover`

### Generation merge

- primary source: `car-api`
- если generation отсутствует:
  - создается fallback generation по диапазону лет
  - ставится `lowConfidence = true`

### Modification merge

- primary source: `automobile-models-and-specs`
- fallback source: `open-vehicle-db`/`vehicles.csv`
- совпадение строится по:
  - brand
  - model
  - overlapping years
  - fuel / displacement / power / drive / transmission

## РФ-адаптация

Для UI и каталога задаются русские label-ы:

- кузова:
  - sedan -> `Седан`
  - hatchback -> `Хэтчбек`
  - wagon -> `Универсал`
  - suv -> `Внедорожник`
  - crossover -> `Кроссовер`
- топливо:
  - gasoline -> `Бензин`
  - diesel -> `Дизель`
  - hybrid -> `Гибрид`
  - electric -> `Электро`
  - lpg/cng -> `ГБО`
- коробки:
  - automatic -> `АКПП`
  - manual -> `МКПП`
  - robot/dct -> `Робот`
  - cvt -> `Вариатор`
- привод:
  - fwd -> `Передний`
  - rwd -> `Задний`
  - awd/4wd -> `Полный`

При невозможности надежной локализации хранится:

- оригинальное имя
- `lowConfidence = true`

## Совместимость с объявлениями

`SaleListing` сохраняет существующие raw string поля.

Дополнительно получает nullable-ссылки на каталог:

- `catalogBrandId`
- `catalogModelId`
- `catalogBodyTypeId`
- `catalogGenerationId`
- `catalogEngineId`
- `catalogTransmissionId`
- `catalogDriveTypeId`
- `catalogModificationId`
- `catalogTrimId`

### Запись нового объявления

При создании нового объявления:

- форма выбирает значения из каталога;
- API сохраняет и `catalog*Id`, и raw snapshot-поля;
- raw snapshot нужен для:
  - обратной совместимости;
  - SEO/рендера;
  - fallback на чтении.

### Чтение старого объявления

- если есть `catalog*Id`, UI использует каталог;
- если нет `catalog*Id`, UI использует raw snapshot.

## API каталога

Планируемые endpoints:

- `GET /api/vehicle-catalog/brands`
- `GET /api/vehicle-catalog/models?brandId=...`
- `GET /api/vehicle-catalog/years?brandId=...&modelId=...`
- `GET /api/vehicle-catalog/bodies?brandId=...&modelId=...&year=...`
- `GET /api/vehicle-catalog/generations?brandId=...&modelId=...&year=...&bodyTypeId=...`
- `GET /api/vehicle-catalog/fuel-types?generationId=...`
- `GET /api/vehicle-catalog/drives?generationId=...&fuelTypeId=...`
- `GET /api/vehicle-catalog/transmissions?generationId=...&fuelTypeId=...&driveTypeId=...`
- `GET /api/vehicle-catalog/modifications?...`

## Индексация

Критичные индексы:

- `VehicleBrand.slug`
- `VehicleBrand.normalizedName`
- `VehicleBrandAlias.normalizedAlias`
- `VehicleModel(brandId, slug)`
- `VehicleModelAlias(modelId, normalizedAlias)`
- `VehicleGeneration(modelId, productionStartYear, productionEndYear)`
- `VehicleModification(generationId, bodyTypeId, productionStartYear, productionEndYear)`
- `VehicleModification(generationId, engineId, driveTypeId, transmissionId)`
- `VehicleSourceMapping(sourceId, entityType, externalId)`
- `SaleListing(catalogBrandId, catalogModelId, year)`

## Импорт и обновление

Pipeline делится на шаги:

1. download/refresh sources
2. stage raw records
3. normalize and merge
4. load canonical tables
5. build coverage report
6. optional backfill for existing listings

Поддерживаемые режимы:

- `initial`
- `refresh`
- `dry-run`
- `report`

## Rollback plan

Rollback делится на два уровня:

### Схема

- удалить только новые каталожные таблицы и новые nullable FK-поля
- не трогать старые raw-поля `SaleListing`

### Данные

- backfill старых объявлений обратим удалением `catalog*Id`
- сами raw-поля объявлений остаются нетронутыми

## Ограничение текущей итерации

В этой итерации внедряется sale-side каталог и зависимые селекты формы продажи. Каталог для wanted-сценария пока остается raw/fallback, но проектируется совместимо с последующим расширением.
