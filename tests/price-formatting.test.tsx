import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { FormattedNumberInput } from '@/components/ui/formatted-number-input';
import {
  formatGroupedNumber,
  formatPrice,
  parseFormattedInteger,
  stripToDigits,
} from '@/lib/price-formatting';

test('formatGroupedNumber uses regular spaces for thousands grouping', () => {
  assert.equal(formatGroupedNumber(11500000), '11 500 000');
});

test('formatPrice appends ruble sign after grouped number', () => {
  assert.equal(formatPrice(11500000), '11 500 000 ₽');
});

test('formatted integer helpers strip non-digits and parse formatted values', () => {
  assert.equal(stripToDigits('11 500 000 ₽'), '11500000');
  assert.equal(parseFormattedInteger('11 500 000 ₽'), 11500000);
  assert.equal(parseFormattedInteger(''), undefined);
});

test('formatted number input renders grouped display value with numeric keyboard hint', () => {
  const markup = renderToStaticMarkup(
    <FormattedNumberInput value="11500000" onValueChange={() => undefined} aria-label="Цена" />,
  );

  assert.match(markup, /value="11 500 000"/);
  assert.match(markup, /inputmode="numeric"/i);
  assert.match(markup, /type="text"/);
});
