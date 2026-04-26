import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { VehicleDocumentOcrPanel } from '@/components/listing/vehicle-document-ocr-panel';

test('vehicle document OCR panel renders upload controls without applying fields automatically', () => {
  const markup = renderToStaticMarkup(<VehicleDocumentOcrPanel onApply={() => undefined} />);

  assert.match(markup, /data-vehicle-document-ocr-panel="true"/);
  assert.match(markup, /accept="image\/jpeg,image\/png"/);
  assert.doesNotMatch(markup, /data-ocr-auto-apply="true"/);
});

test('vehicle document OCR panel does not force mobile camera capture', () => {
  const markup = renderToStaticMarkup(<VehicleDocumentOcrPanel onApply={() => undefined} />);

  assert.doesNotMatch(markup, /\bcapture=/);
});
