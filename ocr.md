# План внедрения OCR для ПТС, СТС и ЭПТС

## 1. Краткое описание цели

Нужно добавить в проект распознавание автомобильных документов, чтобы пользователь при создании или редактировании объявления мог загрузить фото/скан/PDF ПТС, СТС или ЭПТС, получить распознанные данные и применить их к форме объявления только после ручной проверки.

Целевая схема: пользователь загружает документ на frontend, backend отправляет файл в Yandex Vision OCR или извлекает текст из PDF, parser/normalizer приводит результат к единому JSON, frontend показывает найденные поля, подсвечивает сомнительные значения и даёт пользователю подтвердить автозаполнение.

## 2. Текущий контекст проекта

- Frontend: Next.js `16.2.0`, React `19.2.4`, TypeScript `5.7.3`, App Router. Основная пользовательская форма продажи находится в `app/listing/new/page.tsx`.
- UI: локальные компоненты в `components/ui/*`, `lucide-react`, Radix UI, Tailwind CSS через `styles/globals.css` и `app/globals.css`.
- Backend: Next.js Route Handlers в `app/api/**/route.ts`, runtime для файловых маршрутов уже выставляется как `nodejs`.
- База данных: Prisma `6.11.1` + PostgreSQL, схема в `prisma/schema.prisma`.
- Авторизация: cookie-сессии через `lib/server/auth.ts`, API обычно проверяют пользователя через `getSessionUser()`.
- Конфигурация: серверные env-переменные централизованы в `lib/server/env.ts`; публичный пример сейчас в `.env.example`. Next headers и `serverExternalPackages` находятся в `next.config.mjs`.
- Загрузка файлов уже есть:
  - `lib/server/multipart-form-data.ts` парсит `multipart/form-data` через `busboy`;
  - `app/api/listings/route.ts` принимает `photos` и `video`;
  - `app/api/account/listings/[id]/route.ts` принимает новые файлы при редактировании;
  - `app/api/account/seller-profile/route.ts` принимает avatar/cover;
  - `lib/server/s3.ts` загружает медиа в S3.
- Формы:
  - `app/listing/new/page.tsx` содержит создание, дублирование и редактирование объявления;
  - `lib/sale-form.ts` содержит `SaleData`, defaults, payload builder и merge для редактирования;
  - `hooks/use-vehicle-catalog-form.ts` связывает форму с каталогом авто;
  - `lib/vehicle-catalog/form.ts` сбрасывает зависимые поля и автозаполняет характеристики после выбора модификации.
- API для объявлений:
  - `POST /api/listings` в `app/api/listings/route.ts`;
  - `GET/PATCH /api/account/listings/[id]` в `app/api/account/listings/[id]/route.ts`;
  - каталог авто: `app/api/vehicle-catalog/*/route.ts`.
- Валидация форм:
  - клиентская, императивная: `validateSaleStep`, `validateSaleBeforeSubmit` в `app/listing/new/page.tsx`;
  - серверная, императивная: parse/normalize/validate helpers в `app/api/listings/route.ts` и `app/api/account/listings/[id]/route.ts`;
  - `zod` есть в зависимостях, но по найденному коду не используется для формы объявления.
- Потенциальное место для OCR-логов/результатов:
  - по умолчанию лучше не хранить raw scan/raw OCR;
  - если нужен аудит, добавить отдельную Prisma-модель в `prisma/schema.prisma` для metadata/status/warnings без полного текста документа;
  - временные файлы держать in-memory в route handler или во временной директории с удалением после обработки.
- Важное ограничение для сценария "сфотографировать документ": в `next.config.mjs` сейчас задан `Permissions-Policy: camera=(), microphone=(), geolocation=()`. Для полноценного `getUserMedia`-сценария камеру нужно разрешить. Если использовать только `<input type="file" capture="environment">`, это нужно отдельно проверить на целевых мобильных браузерах.

Файлы и папки, которые вероятно будут затронуты при реализации:

- `app/listing/new/page.tsx`
- `lib/sale-form.ts`
- `hooks/use-vehicle-catalog-form.ts`
- `app/api/ocr/vehicle-document/route.ts` (новый)
- `lib/server/ocr/*` (новая папка)
- `lib/ocr/*` или `lib/vehicle-document-ocr.ts` (новые общие типы, если нужны на frontend и backend)
- `lib/server/env.ts`
- `.env.example`
- `next.config.mjs`
- `prisma/schema.prisma` (только если нужно хранить OCR metadata или новые поля документов)
- `tests/*ocr*.test.ts`
- `tests/qa/*ocr*.spec.ts`

## 3. Пользовательский сценарий

1. Пользователь открывает форму создания или редактирования объявления в `app/listing/new/page.tsx`.
2. В блоке OCR выбирает тип документа: ПТС, СТС или ЭПТС.
3. Для СТС выбирает сторону: лицевая или обратная. Для полного распознавания СТС пользователь загружает обе стороны.
4. Загружает JPG/PNG/PDF или на мобильном устройстве фотографирует документ.
5. Видит предпросмотр файла: изображение для JPG/PNG, имя/размер и номер страниц для PDF, если это возможно определить.
6. Нажимает "Распознать".
7. Frontend отправляет `multipart/form-data` на backend endpoint.
8. Backend валидирует авторизацию, тип документа, сторону, mime-type и размер файла.
9. Backend вызывает Yandex Vision OCR или извлекает текст из PDF с текстовым слоем.
10. Parser/normalizer возвращает normalized JSON с полями, confidence и warnings.
11. Frontend показывает найденные значения отдельным review-блоком, не сохраняя объявление автоматически.
12. Пользователь проверяет значения, исправляет сомнительные поля и нажимает "Применить к форме".
13. Форма заполняется найденными данными. Поля с низкой уверенностью остаются подсвеченными до ручного изменения или подтверждения.
14. Пользователь вручную отправляет объявление как черновик или на модерацию через существующий submit flow.

## 4. Архитектура решения

Схема:

```text
frontend upload/review
  -> POST /api/ocr/vehicle-document
  -> backend validation/auth
  -> PDF text extraction или Yandex Vision OCR
  -> parser
  -> normalizer
  -> normalized JSON
  -> frontend review
  -> user confirmation
  -> existing sale form state
  -> existing /api/listings или /api/account/listings/[id]
```

Предполагаемый backend response:

```json
{
  "documentType": "pts",
  "fields": {
    "vin": "",
    "brand": "",
    "model": "",
    "year": "",
    "ptsNumber": "",
    "stsNumber": "",
    "eptsNumber": "",
    "issueDate": "",
    "ownerName": "",
    "engineNumber": "",
    "bodyNumber": "",
    "chassisNumber": "",
    "color": "",
    "enginePower": "",
    "engineVolume": ""
  },
  "confidence": {},
  "warnings": []
}
```

Рекомендуемое расширение ответа для frontend review:

```json
{
  "documentType": "sts",
  "side": "front",
  "fields": {},
  "confidence": {
    "vin": 0.96,
    "brand": 0.82
  },
  "warnings": [
    {
      "field": "model",
      "code": "LOW_CONFIDENCE",
      "message": "Модель распознана неуверенно, нужна ручная проверка."
    }
  ],
  "rawTextAvailable": false,
  "provider": "yandex-vision",
  "processingMode": "vehicle-registration-front"
}
```

Raw OCR text и полный provider response не нужно возвращать на frontend в production. Для отладки можно добавить server-only флаг, но по умолчанию он должен быть выключен.

## 5. Обработка разных типов документов

### ПТС

- Модель Yandex OCR: `page`.
- Входные форматы: JPG, PNG, PDF-скан. Для PDF с несколькими страницами MVP может ограничиться первой страницей или явно обрабатывать страницы постранично с предупреждением о стоимости.
- Основная стратегия: получить plain text, затем backend parser извлекает поля по label-based правилам и регулярным выражениям.
- Поля для извлечения:
  - VIN;
  - марка;
  - модель;
  - год выпуска;
  - номер ПТС;
  - дата выдачи;
  - номер двигателя;
  - номер кузова;
  - номер шасси;
  - цвет;
  - мощность двигателя;
  - рабочий объём двигателя;
  - владелец, если это нужно показывать в review.
- Возможные правила/regex:
  - VIN: `\b[A-HJ-NPR-Z0-9]{17}\b`;
  - номер ПТС рядом с `ПТС`, `Паспорт ТС`, `Паспорт транспортного средства`: `\b\d{2}\s?[А-ЯA-Z]{2}\s?\d{6}\b`;
  - год: `(19|20)\d{2}` рядом с `год выпуска`, `год изготовления`;
  - дата: `\b\d{2}[./-]\d{2}[./-]\d{4}\b`;
  - мощность: `(\d+(?:[.,]\d+)?)\s*(л\.?\s*с\.?|кВт)`;
  - объём: `(\d{3,5})\s*(см3|см³|куб)` или `(\d+(?:[.,]\d+)?)\s*л`;
  - номер двигателя/кузова/шасси искать по ближайшим labels: `двигател`, `кузов`, `шасси`, `рама`.
- Поля, требующие ручной проверки:
  - VIN, если есть символы `I/O/Q`, меньше/больше 17 символов или похожие OCR-замены `0/O`, `1/I`;
  - марка/модель, если не удалось сопоставить с `VehicleBrand`/`VehicleModel`;
  - номер двигателя, кузова и шасси, потому что OCR часто путает буквы и цифры;
  - владелец, потому что это персональные данные и поле может быть не нужно сохранять;
  - дата выдачи, если формат неоднозначен.

### СТС

- Модель для лицевой стороны: `vehicle-registration-front`.
- Модель для обратной стороны: `vehicle-registration-back`.
- Для frontend лучше сделать явный UX с двумя слотами: "СТС, лицевая сторона" и "СТС, обратная сторона".
- Backend endpoint может принимать одну сторону за запрос:
  - `documentType=sts`
  - `side=front | back`
  - `file`
- Если Yandex document model возвращает structured fields/entities, их нужно маппить напрямую. Если возвращает только текст или часть полей отсутствует, использовать fallback parser по raw text.
- Лицевая сторона обычно полезна для:
  - номер СТС;
  - госномер;
  - VIN;
  - марка/модель;
  - год выпуска;
  - цвет;
  - дата выдачи.
- Обратная сторона обычно полезна для:
  - VIN, если на лицевой стороне распознан неуверенно;
  - номер кузова;
  - номер шасси;
  - номер двигателя;
  - мощность;
  - объём двигателя;
  - владелец/регистрационные данные, если их решено показывать только в review.
- Объединение двух сторон:
  - frontend хранит промежуточный результат по `front` и `back`;
  - merger объединяет поля по приоритету confidence;
  - если одно поле пришло с обеих сторон и значения различаются, вернуть warning `CONFLICT`;
  - VIN считать ключевым полем: при конфликте не применять автоматически, только показывать пользователю выбор;
  - номер СТС брать с лицевой стороны, если confidence достаточный;
  - технические характеристики брать с обратной стороны, если они там структурнее.

### ЭПТС

- Сначала попытаться извлечь текст из PDF без OCR.
- Если PDF содержит текстовый слой, не отправлять его в Yandex OCR: это дешевле, быстрее и снижает передачу персональных данных третьей стороне.
- Если текстового слоя нет, это скан/фото или PDF с изображениями: использовать OCR `page`.
- Для JPG/PNG ЭПТС сразу использовать `page`.
- Поля для извлечения:
  - номер ЭПТС;
  - VIN;
  - марка;
  - модель;
  - год;
  - цвет;
  - двигатель, мощность, объём;
  - номер кузова;
  - номер шасси;
  - дата оформления/выдачи;
  - статус ЭПТС, если встречается в выписке;
  - владелец, только если это нужно для review и есть согласие.
- Возможные сложности:
  - разные форматы PDF-выписок;
  - таблицы и переносы строк;
  - несколько страниц;
  - разные названия labels: `ЭПТС`, `Электронный паспорт`, `Номер электронного паспорта`;
  - PDF может иметь текстовый слой, но текст может быть разбит на символы или колонки в неправильном порядке;
  - `pdf-lib` уже есть в проекте, но по текущему использованию он предназначен для генерации PDF в `lib/server/listing-proposal-pdf.tsx`, а не для надёжного извлечения текста. Для полноценного text-layer extraction может потребоваться отдельная библиотека или сервис на этапе реализации.

## 6. Backend-план

Создать endpoint:

```text
POST /api/ocr/vehicle-document
```

Предлагаемый файл:

```text
app/api/ocr/vehicle-document/route.ts
```

Параметры `multipart/form-data`:

- `documentType`: `pts | sts | epts`;
- `side?`: `front | back`, обязательно для `documentType=sts`;
- `file`: JPG, PNG или PDF.

Backend flow:

1. Выставить `export const runtime = 'nodejs'`, как в `app/api/listings/route.ts`.
2. Проверить авторизацию через `getSessionUser()` из `lib/server/auth.ts`.
3. Прочитать `formData` через `parseMultipartRequest()` из `lib/server/multipart-form-data.ts`.
4. Провалидировать `documentType`, `side`, наличие `file`.
5. Разрешить mime-types:
   - `image/jpeg`;
   - `image/png`;
   - `application/pdf`.
6. Ограничить размер файла. Рекомендация для OCR: начать с `10 MB` на файл, вынести в env `OCR_MAX_FILE_SIZE_MB`.
7. Для СТС запретить PDF на первом этапе, если Yandex document model ожидает изображение. Если PDF всё же нужен, сначала конвертировать страницу в изображение; это отдельное решение и, вероятно, отдельная зависимость.
8. Для ЭПТС PDF:
   - попытаться извлечь текстовый слой;
   - если текст достаточно содержательный, не вызывать OCR;
   - иначе отправить файл/страницы в `page`.
9. Для ПТС:
   - отправить изображение или PDF-страницу в OCR `page`;
   - если PDF многостраничный, обработать страницы постранично или вернуть warning о поддержанной первой странице в MVP.
10. Для СТС:
   - `side=front` отправить в `vehicle-registration-front`;
   - `side=back` отправить в `vehicle-registration-back`.
11. Нормализовать provider response в единый `VehicleDocumentOcrResult`.
12. Не писать raw file/raw OCR/raw персональные данные в `console.log`, `console.warn`, `console.error`.
13. Вернуть frontend только normalized fields, confidence, warnings, processing metadata.

Где хранить API-ключ Yandex:

- только на backend, через `lib/server/env.ts`;
- не использовать `NEXT_PUBLIC_*`;
- добавить в `.env.example` пустые значения без секретов.

Рекомендуемые env-переменные:

```text
YANDEX_OCR_API_KEY=
YANDEX_CLOUD_FOLDER_ID=
YANDEX_VISION_OCR_ENDPOINT=
OCR_MAX_FILE_SIZE_MB=10
OCR_STORE_RAW_RESULTS=false
OCR_LOG_PROVIDER_PAYLOADS=false
OCR_TIMEOUT_MS=30000
```

Если вместо API key используется IAM token, заменить или дополнить:

```text
YANDEX_IAM_TOKEN=
```

Отключение логирования персональных данных:

- не логировать `file.name`, если в нём может быть ФИО или VIN;
- логировать только request id, user id, documentType, side, file size, mime-type, duration, provider status;
- raw OCR и raw text держать в памяти только на время обработки;
- флаг `OCR_LOG_PROVIDER_PAYLOADS` по умолчанию `false`;
- при ошибках возвращать пользователю безопасное сообщение без provider payload.

Обработка ошибок OCR:

- `400`: неправильный documentType/side/mime-type/размер;
- `401`: нет авторизации;
- `413`: файл больше лимита;
- `422`: OCR отработал, но ключевые поля не найдены;
- `429`: лимит Yandex или локальный rate limit;
- `502`: Yandex недоступен или вернул некорректный ответ;
- `504`: timeout OCR;
- все ошибки должны возвращать `{ "error": "...", "warnings": [] }` без raw данных.

Предлагаемые backend-модули:

- `lib/server/ocr/yandex-vision.ts` - HTTP-клиент Yandex OCR, выбор модели, timeout, ошибки;
- `lib/server/ocr/vehicle-document-parser.ts` - parser для ПТС/СТС/ЭПТС;
- `lib/server/ocr/vehicle-document-normalizer.ts` - нормализация VIN, дат, чисел, документов;
- `lib/server/ocr/pdf-text.ts` - извлечение text layer из ЭПТС PDF;
- `lib/server/ocr/types.ts` или `lib/ocr/vehicle-document.ts` - типы запроса/ответа.

## 7. Frontend-план

Основное место интеграции: `app/listing/new/page.tsx`.

Рекомендуется не раздувать этот файл ещё сильнее, а вынести OCR UI в новый компонент:

```text
components/listing/vehicle-document-ocr-panel.tsx
```

Общие типы можно вынести в:

```text
lib/ocr/vehicle-document.ts
```

Что добавить в UX:

- блок "Заполнить по документу" на первом шаге формы продажи, рядом с VIN/марка/модель/год или перед характеристиками;
- выбор типа документа: ПТС / СТС / ЭПТС;
- для СТС переключатель стороны: лицевая / обратная;
- file input с `accept="image/jpeg,image/png,application/pdf"`;
- отдельную кнопку или режим "Сфотографировать" для mobile capture;
- предпросмотр изображения через object URL;
- для PDF - карточку с именем, размером и предупреждением, что многостраничные PDF могут обрабатываться постранично;
- статусы:
  - файл выбран;
  - загрузка;
  - распознавание;
  - найдено;
  - нужна проверка;
  - ошибка;
- review-таблицу найденных полей:
  - поле;
  - найденное значение;
  - confidence;
  - действие: применить/пропустить/исправить;
- подсветку low-confidence:
  - например, `confidence < 0.8` или warning по полю;
  - в форме можно использовать существующий `fieldErrors`-подход, но лучше отдельное состояние `ocrFieldWarnings`, чтобы не смешивать OCR-предупреждения и validation errors;
- кнопку "Применить к форме";
- кнопку "Очистить результат OCR";
- предупреждение и checkbox согласия на обработку персональных данных перед отправкой в OCR.

Как применять результат к текущей форме:

- Сопоставлять OCR fields с существующим `SaleData`:
  - `vin` -> `sale.vin`;
  - `brand` -> `sale.make`;
  - `model` -> `sale.model`;
  - `year` -> `sale.year`;
  - `color` -> `sale.color`;
  - `enginePower` -> `sale.power`;
  - `engineVolume` -> `sale.engineDisplacementL`;
  - `ptsNumber/eptsNumber` пока некуда сохранять в текущей форме;
  - `stsNumber`, `issueDate`, `ownerName`, `engineNumber`, `bodyNumber`, `chassisNumber` пока не имеют полей в `SaleData`.
- После применения `brand/model/year` дать `hooks/use-vehicle-catalog-form.ts` подобрать `catalogBrandId`, `catalogModelId`, зависимые варианты и не ломать существующий catalog flow.
- Не вызывать submit автоматически. OCR только заполняет draft state.
- Если поле уже заполнено пользователем, показывать diff и не перезаписывать без подтверждения.
- Для СТС фронт и бэк хранить отдельно, затем показывать объединённый результат.

Особое внимание:

- `app/listing/new/page.tsx` сейчас обслуживает sale/wanted/create/edit/duplicate/draft restore. OCR нужно показывать только для `scenario === 'sale'`.
- В local draft (`LISTING_DRAFT_STORAGE_KEY`) не стоит сохранять raw OCR или файлы. Можно сохранять только применённые значения формы.
- Для camera capture нужно решить, достаточно ли native file capture или нужен live camera UI. Для live camera UI потребуется изменить `next.config.mjs`, потому что сейчас камера запрещена через Permissions Policy.

## 8. Парсинг и нормализация

Нужен отдельный слой parser/normalizer, чтобы route handler не содержал бизнес-правила распознавания.

Поля и рекомендации:

- VIN:
  - uppercase;
  - убрать пробелы, дефисы и переносы;
  - проверить длину 17 символов;
  - запретить `I`, `O`, `Q`;
  - regex: `\b[A-HJ-NPR-Z0-9]{17}\b`;
  - при сомнении вернуть warning.
- Госномер:
  - использовать существующие правила из `lib/registration-plate.ts`;
  - латинские look-alike буквы привести к допустимым кириллическим;
  - регион оставить отдельным полем `plateRegion`;
  - при неполном номере не применять автоматически.
- Номер ПТС:
  - искать рядом с labels `ПТС`, `Паспорт ТС`, `Паспорт транспортного средства`;
  - убрать пробелы для canonical value, но display value можно оставить группированным;
  - сомнительные буквы/цифры пометить warning.
- Номер СТС:
  - искать structured field из `vehicle-registration-front`;
  - fallback regex рядом с `СТС`, `Свидетельство о регистрации`;
  - не путать с номером ПТС.
- Номер ЭПТС:
  - искать рядом с `ЭПТС`, `Электронный паспорт`, `Номер электронного паспорта`;
  - проверить длину и цифровой формат по выбранному правилу после проверки реальных выписок.
- Марка:
  - trim, collapse spaces;
  - сопоставить с каталогом `VehicleBrand` через `lib/server/vehicle-catalog.ts` или frontend catalog hook;
  - если нет точного совпадения, оставить raw value и warning.
- Модель:
  - trim, collapse spaces;
  - сопоставить внутри выбранной марки;
  - учитывать сложные модели с пробелами и дефисами.
- Год:
  - число;
  - допустимый диапазон как в форме: `1900` - `MAX_LISTING_YEAR` в `app/listing/new/page.tsx`;
  - при нескольких годах выбирать ближайший к label `год выпуска`.
- Цвет:
  - привести к одному из `DEFAULT_VEHICLE_COLORS` из `lib/vehicle-metadata.ts`, если возможно;
  - иначе оставить raw value и warning.
- Номер двигателя:
  - искать по labels `двигатель`, `номер двигателя`;
  - не применять к существующей форме без отдельного поля.
- Номер кузова:
  - искать по labels `кузов`, `номер кузова`;
  - часто совпадает или конфликтует с VIN, нужна ручная проверка.
- Номер шасси:
  - искать по labels `шасси`, `рама`;
  - значения `отсутствует`/`не установлено` нормализовать отдельно.
- Мощность:
  - привести к числу в л.с.;
  - если OCR дал кВт и л.с., предпочесть л.с.;
  - если только кВт, конвертацию делать только после подтверждения правила.
- Объём двигателя:
  - `см3` привести к литрам с одним десятичным знаком для `sale.engineDisplacementL`;
  - `1598 см3` -> `1.6`;
  - `2,0 л` -> `2.0`.
- Дата выдачи:
  - привести к ISO `YYYY-MM-DD`;
  - если дата невозможна или неоднозначна, оставить raw value и warning.
- Владелец:
  - персональные данные;
  - по умолчанию показывать только в review и не сохранять в объявление;
  - если будет сохранение, нужна явная модель, политика хранения и согласие.

Общие правила:

- Все normalized fields возвращать как строки, если они нужны форме, и как числа, если они нужны backend-моделям.
- Для каждого поля возвращать confidence, если provider его даёт; если поле найдено regex-парсером, confidence задавать эвристически.
- Сомнительные поля не применять автоматически, а добавлять в `warnings`.
- При конфликте двух источников не выбирать молча: вернуть оба значения в warning/diff.

## 9. Безопасность и персональные данные

- Не отправлять Yandex OCR API key на frontend.
- Не использовать `NEXT_PUBLIC_*` для OCR-секретов.
- Не писать сканы, PDF, raw OCR text, ФИО владельца, VIN и номера документов в обычные логи.
- Использовать HTTPS на production.
- Требовать авторизацию на `POST /api/ocr/vehicle-document`.
- Добавить согласие на обработку персональных данных перед отправкой документа на OCR.
- Временно хранить файлы только при необходимости:
  - предпочтительно in-memory;
  - если временный файл нужен, удалять в `finally`;
  - не загружать документы в публичный S3 bucket.
- Ограничить размер файла и типы mime.
- Добавить rate limiting на пользователя/IP, чтобы не получить неконтролируемые расходы.
- Возвращать frontend только нормализованные поля, confidence и warnings.
- Если появится таблица OCR-аудита, хранить минимум:
  - userId;
  - documentType;
  - side;
  - provider;
  - status;
  - duration;
  - warnings codes;
  - timestamps;
  - без raw scan/raw text по умолчанию.
- Добавить настройку отключения логирования запросов к OCR-провайдеру: `OCR_LOG_PROVIDER_PAYLOADS=false`.
- Проверить текст privacy policy/user agreement перед production, потому что документы автомобиля и ФИО владельца являются чувствительными пользовательскими данными.

## 10. Стоимость и ограничения

- СТС распознаётся дороже, потому что используются специализированные документные модели `vehicle-registration-front` и `vehicle-registration-back`.
- ПТС и fallback для ЭПТС через обычный OCR `page` должны быть дешевле, но качество парсинга зависит от layout и качества фото.
- PDF тарифицируется постранично, если отправлять его в OCR.
- Для ЭПТС текстовый PDF можно обрабатывать без OCR, что снижает стоимость и уменьшает передачу данных во внешний сервис.
- Многостраничные PDF нужно ограничить или явно показывать пользователю стоимость/количество страниц.
- Плохие фото, блики, обрезанные края и низкое разрешение будут давать low-confidence и warnings.

TODO: проверить актуальные тарифы Yandex Vision OCR перед запуском.

## 11. Этапы внедрения

Этап 1 - технический прототип:

- создать `POST /api/ocr/vehicle-document`;
- принять `documentType`, `side`, `file`;
- валидировать авторизацию, размер, mime-type;
- вызвать Yandex OCR для `page` и моделей СТС;
- для ЭПТС PDF попробовать text-layer extraction;
- вернуть raw text только в dev/prototype режиме, без записи в логи.

Этап 2 - парсинг:

- реализовать parser/normalizer для VIN;
- год;
- марка;
- модель;
- номера документов;
- цвет;
- мощность;
- объём двигателя;
- warnings и confidence;
- unit tests на реальные обезличенные OCR fixtures.

Этап 3 - frontend:

- добавить OCR panel в `app/listing/new/page.tsx` или вынести в `components/listing/vehicle-document-ocr-panel.tsx`;
- добавить загрузку и предпросмотр;
- добавить выбор ПТС/СТС/ЭПТС и side для СТС;
- отправлять multipart на backend;
- показывать статус распознавания;
- показывать review/diff;
- применять только после подтверждения пользователя;
- подсвечивать low-confidence поля.

Этап 4 - безопасность:

- добавить env в `lib/server/env.ts` и `.env.example`;
- выключить raw/provider logging по умолчанию;
- не сохранять файлы и raw OCR;
- удалить временные файлы после обработки;
- добавить согласие на обработку персональных данных;
- добавить rate limiting или хотя бы server-side throttling;
- проверить `Permissions-Policy` в `next.config.mjs` для camera сценария.

Этап 5 - тестирование:

- тестовые ПТС;
- тестовые СТС лицевая/обратная;
- тестовые ЭПТС PDF с текстовым слоем;
- PDF без текстового слоя;
- сканы и фото плохого качества;
- ошибки OCR provider;
- timeout;
- файл больше лимита;
- неподдерживаемый mime-type;
- конфликт VIN между двумя сторонами СТС;
- автозаполнение формы без автоматического сохранения.

## 12. Список файлов, которые вероятно нужно будет изменить

| Файл/папка | Зачем нужен | Что изменить | Риск |
|---|---|---|---|
| `app/listing/new/page.tsx` | Основная форма создания/редактирования объявления | Добавить OCR panel, состояние распознавания, применение найденных полей к `sale`, review/diff, low-confidence подсветку | high |
| `components/listing/vehicle-document-ocr-panel.tsx` | Новый изолированный UI для загрузки/предпросмотра/OCR review | Создать компонент, чтобы не раздувать `app/listing/new/page.tsx` | medium |
| `lib/sale-form.ts` | Тип `SaleData`, defaults, payload формы | При необходимости добавить UI-only OCR metadata или новые поля, если решено сохранять номера документов | medium |
| `hooks/use-vehicle-catalog-form.ts` | Автосопоставление марки/модели/характеристик с каталогом | Убедиться, что OCR-filled `make/model/year` корректно резолвятся в catalog ids; возможно добавить явный helper применения OCR | medium |
| `lib/vehicle-catalog/form.ts` | Сброс зависимых полей формы | Проверить, не сбрасывает ли OCR-применение уже распознанные поля в неправильном порядке | medium |
| `app/api/ocr/vehicle-document/route.ts` | Новый backend endpoint OCR | Создать route handler с auth, multipart, validation, вызовом OCR, parser и JSON response | high |
| `lib/server/ocr/yandex-vision.ts` | Интеграция с Yandex Vision OCR | Создать server-only клиент, выбор модели `page`, `vehicle-registration-front`, `vehicle-registration-back`, timeout и safe errors | high |
| `lib/server/ocr/vehicle-document-parser.ts` | Извлечение полей из raw OCR/structured response | Создать parser для ПТС, СТС, ЭПТС | high |
| `lib/server/ocr/vehicle-document-normalizer.ts` | Единые правила нормализации | Создать нормализацию VIN, дат, номеров, мощности, объёма, warnings | medium |
| `lib/server/ocr/pdf-text.ts` | ЭПТС PDF text layer | Создать слой извлечения текста из PDF; подтвердить библиотеку/подход, потому что текущий `pdf-lib` используется для генерации PDF | high |
| `lib/ocr/vehicle-document.ts` | Общие типы frontend/backend | Создать shared types для request state, response, fields, warnings | low |
| `lib/server/env.ts` | Server env config | Добавить OCR/Yandex env, размер файла, timeout, флаги logging/storage | medium |
| `.env.example` | Документация env | Добавить пустые OCR/Yandex переменные без секретов | low |
| `next.config.mjs` | Headers и server package config | Проверить/изменить `Permissions-Policy` для camera; возможно добавить external package для PDF extraction | medium |
| `prisma/schema.prisma` | DB schema | Менять только если нужно хранить OCR audit или новые поля документов в объявлении | high |
| `lib/server/multipart-form-data.ts` | Общий multipart parser | Скорее переиспользовать без изменений; возможно добавить parser limits, если решено централизовать file-size ограничения | medium |
| `lib/server/s3.ts` | Хранилище файлов | Не использовать для OCR по умолчанию; менять только если появится private temporary storage | medium |
| `tests/ocr-vehicle-document-parser.test.ts` | Unit tests parser | Создать тесты нормализации и regex/parser cases | medium |
| `tests/multipart-form-data.test.ts` | Существующие multipart tests | Добавить кейс PDF/JPG upload для OCR route только если расширяется общий parser | low |
| `tests/sale-form.test.ts` | Tests формы и payload | Добавить тесты применения OCR fields, если helper будет вынесен из компонента | medium |
| `tests/qa/listing-vehicle-document-ocr.spec.ts` | E2E проверки формы | Проверить upload, mock OCR response, review, применение к форме, отсутствие autosubmit | medium |

## 13. Риски и вопросы

Непонятные части проекта:

- Нет отдельной модели или формы для номеров ПТС/СТС/ЭПТС, даты выдачи, владельца, номера двигателя, кузова и шасси. Текущая `SaleListing` хранит `vin`, `plateNumber`, `plateRegion`, `ptsType`, базовые характеристики, но не хранит номера документов.
- Не найден существующий OCR/provider abstraction.
- Не найден механизм rate limiting.
- Не найден централизованный logger с redaction.
- Не найден готовый PDF text extraction. `pdf-lib` есть, но используется для генерации PDF, не для чтения текста.

Решения, которые нужно подтвердить:

- Нужно ли сохранять номера ПТС/СТС/ЭПТС в БД или только показывать их в review?
- Нужно ли сохранять `ownerName`, если это персональные данные предыдущего/текущего владельца?
- Нужен ли OCR в редактировании существующих объявлений или только при создании?
- Нужен ли полноценный camera UI через `getUserMedia`, или достаточно file input с mobile capture?
- Нужно ли хранить OCR audit metadata в Prisma?
- Обрабатывать ли многостраничные PDF ЭПТС целиком в MVP или ограничиться первой/выбранной страницей?
- Какой credential mode Yandex использовать: API key или IAM token?
- Нужна ли админская диагностика OCR без raw персональных данных?

Технические риски:

- `app/listing/new/page.tsx` большой и уже содержит много сценариев; прямое добавление OCR повысит риск регрессий.
- Автозаполнение `make/model/year` может конфликтовать с catalog flow и сбросом зависимых полей.
- OCR может спутать похожие символы VIN и номеров документов.
- СТС front/back могут дать конфликтующие значения.
- PDF ЭПТС может иметь нестабильный порядок текста, особенно в таблицах.
- Camera сценарий может не работать из-за текущего `Permissions-Policy`.
- Отправка документов во внешний OCR-provider требует явного согласия и аккуратного логирования.
- Без rate limiting можно получить неконтролируемые расходы.

Данные, которые могут распознаваться неточно:

- VIN;
- госномер и регион;
- номер ПТС/СТС/ЭПТС;
- номер двигателя;
- номер кузова;
- номер шасси;
- мощность и объём;
- цвет;
- марка/модель в редких или импортных написаниях;
- даты;
- ФИО владельца.

Где нужна ручная проверка пользователем:

- перед применением OCR result к форме;
- перед перезаписью уже заполненного поля;
- при confidence ниже порога;
- при conflict между ПТС/СТС/ЭПТС или сторонами СТС;
- при любом VIN warning;
- перед финальным сохранением объявления.

## 14. Финальный чеклист

- [ ] Создать shared type для `documentType`, `side`, OCR fields, confidence и warnings.
- [ ] Добавить server env для Yandex OCR и OCR flags в `lib/server/env.ts`.
- [ ] Обновить `.env.example` без секретов.
- [ ] Создать `POST /api/ocr/vehicle-document`.
- [ ] Подключить `getSessionUser()` к OCR endpoint.
- [ ] Валидировать `documentType`, `side`, `file`, mime-type и размер.
- [ ] Реализовать Yandex Vision OCR client.
- [ ] Подключить модель `page` для ПТС.
- [ ] Подключить `vehicle-registration-front` для лицевой стороны СТС.
- [ ] Подключить `vehicle-registration-back` для обратной стороны СТС.
- [ ] Реализовать ЭПТС PDF text-layer extraction.
- [ ] Добавить fallback OCR `page` для ЭПТС без текстового слоя.
- [ ] Реализовать parser/normalizer для VIN.
- [ ] Реализовать parser/normalizer для госномера.
- [ ] Реализовать parser/normalizer для ПТС/СТС/ЭПТС номеров.
- [ ] Реализовать parser/normalizer для марки, модели и года.
- [ ] Реализовать parser/normalizer для цвета, мощности и объёма двигателя.
- [ ] Реализовать warnings для low confidence и conflicts.
- [ ] Не логировать raw OCR, scans, VIN, ФИО и номера документов.
- [ ] Добавить согласие на обработку персональных данных на frontend.
- [ ] Добавить OCR upload/review UI в форму продажи.
- [ ] Запретить автоматическое сохранение без подтверждения пользователя.
- [ ] Подсвечивать low-confidence поля после применения.
- [ ] Проверить `Permissions-Policy` для camera сценария.
- [ ] Решить, нужны ли новые поля в `SaleListing` или отдельная OCR audit model.
- [ ] Добавить unit tests parser/normalizer.
- [ ] Добавить tests для OCR route с mock provider.
- [ ] Добавить QA сценарий формы с mock OCR response.
- [ ] Проверить ПТС, СТС front/back, ЭПТС text PDF, ЭПТС scan PDF и плохие фото.
- [ ] TODO: проверить актуальные тарифы Yandex Vision OCR перед запуском.
