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

test('registration plate field uses responsive segment sizing for narrow mobile screens', () => {
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

  assert.match(markup, /grid-cols-\[minmax\(0,1fr\)_clamp\(78px,23vw,100px\)\]/u);
  assert.match(markup, /grid-cols-\[1\.45fr_3\.25fr_2\.55fr\]/u);
  assert.match(markup, /text-\[clamp\(1\.85rem,8\.4vw,2\.35rem\)\]/u);
  assert.doesNotMatch(markup, /w-\[3\.2ch\]/u);
  assert.doesNotMatch(markup, /min-\[390px\]:px-3/u);
});
