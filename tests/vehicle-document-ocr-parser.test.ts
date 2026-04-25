import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseVehicleDocumentOcrText,
  extractYandexOcrText,
} from '@/lib/server/ocr/vehicle-document-parser';

test('parseVehicleDocumentOcrText extracts primary vehicle fields from registration certificate text', () => {
  const text = [
    'СВИДЕТЕЛЬСТВО О РЕГИСТРАЦИИ ТС',
    'Регистрационный знак M372OE178',
    'Идентификационный номер (VIN)',
    'XTH53110011025824',
    'Марка, модель',
    'ГАЗ 3110',
    'GAZ 3110',
    'Тип ТС',
    'СЕДАН',
    'Год выпуска ТС',
    '2001',
    'Мощность двигателя, кВт/л. с.',
    '96.0/131',
  ].join('\n');

  const result = parseVehicleDocumentOcrText(text);

  assert.equal(result.fields.vin, 'XTH53110011025824');
  assert.equal(result.fields.brand, 'ГАЗ');
  assert.equal(result.fields.model, '3110');
  assert.equal(result.fields.vehicleType, 'Седан');
  assert.equal(result.fields.year, '2001');
  assert.equal(result.fields.enginePowerHp, '131');
});

test('extractYandexOcrText flattens textAnnotation block lines from Yandex OCR response', () => {
  const response = {
    result: {
      textAnnotation: {
        blocks: [
          {
            lines: [
              {
                text: 'Марка, модель',
                words: [],
              },
              {
                words: [{ text: 'TOYOTA' }, { text: 'CAMRY' }],
              },
            ],
          },
        ],
      },
    },
  };

  assert.equal(extractYandexOcrText(response), 'Марка, модель\nTOYOTA CAMRY');
});

test('extractYandexOcrText preserves fullText line breaks from Yandex OCR response', () => {
  const response = {
    result: {
      textAnnotation: {
        fullText: [
          'Марка, модель',
          '2834DJ',
          '2834DJ',
          'Тип ТС Грузовой бортовой',
          'Мощность двигателя, кВт/л. с. 78.6/106',
        ].join('\n'),
      },
    },
  };

  assert.equal(
    extractYandexOcrText(response),
    [
      'Марка, модель',
      '2834DJ',
      '2834DJ',
      'Тип ТС Грузовой бортовой',
      'Мощность двигателя, кВт/л. с. 78.6/106',
    ].join('\n')
  );
});

test('parseVehicleDocumentOcrText extracts STS fields when brand and model values are split across lines', () => {
  const text = [
    'СВИДЕТЕЛЬСТВО О РЕГИСТРАЦИИ ТС',
    'Идентификационный номер (VIN)',
    'XU42834DJG0000288',
    'Марка, модель',
    '2834DJ',
    '2834DJ',
    'Тип ТС Грузовой бортовой',
    'Категория ТС (ABCD, прицеп) B',
    'Год выпуска ТС 2015',
    'Мощность двигателя, кВт/л. с. 78.6/106',
  ].join('\n');

  const result = parseVehicleDocumentOcrText(text);

  assert.equal(result.fields.vin, 'XU42834DJG0000288');
  assert.equal(result.fields.brand, '2834DJ');
  assert.equal(result.fields.model, '2834DJ');
  assert.equal(result.fields.vehicleType, 'Грузовой бортовой');
  assert.equal(result.fields.year, '2015');
  assert.equal(result.fields.enginePowerHp, '106');
});

test('parseVehicleDocumentOcrText extracts numbered PTS fields without using labels as values', () => {
  const text = [
    'ПАСПОРТ ТРАНСПОРТНОГО СРЕДСТВА',
    '1. Идентификационный номер (VIN)',
    'XTA 210100 D3199217',
    '2. Марка, модель ТС',
    'LADA 219010 LADA GRANTA',
    '3. Наименование (тип ТС)',
    'Легковой-седан',
    '5. Год изготовления ТС',
    '2013',
    '10. Мощность двигателя, л.с. (кВт) 87,0 (64,0)',
  ].join('\n');

  const result = parseVehicleDocumentOcrText(text);

  assert.equal(result.fields.vin, 'XTA210100D3199217');
  assert.equal(result.fields.brand, 'LADA');
  assert.equal(result.fields.model, 'GRANTA');
  assert.equal(result.fields.vehicleType, 'Седан');
  assert.equal(result.fields.year, '2013');
  assert.equal(result.fields.enginePowerHp, '87');
});
