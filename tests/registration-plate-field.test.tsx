import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import { RegistrationPlateField } from '@/components/listing/registration-plate-field';

test('registration plate field renders a nomerogram-style plate with region input and rus badge', () => {
  const markup = renderToStaticMarkup(
    <RegistrationPlateField
      value="А777АА"
      region="777"
      unregistered={false}
      onChange={() => {}}
      onRegionChange={() => {}}
      onUnregisteredChange={() => {}}
    />
  );

  assert.doesNotMatch(markup, /<select/u);
  assert.match(markup, /placeholder="777"/u);
  assert.match(markup, /src="\/plate-rus\.svg"/u);
  assert.match(markup, /rounded-\[6px\]/u);
  assert.match(markup, /border-2/u);
  assert.match(markup, /border-black/u);
  assert.match(markup, /bg-white/u);
});
