import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import { AudienceSection } from '@/components/landing/audience-section';

test('audience selector tabs fit inside the mobile viewport', () => {
  const markup = renderToStaticMarkup(<AudienceSection />);

  assert.match(
    markup,
    /data-audience-tab-list="true"[^>]*class="[^"]*w-full[^"]*max-w-full[^"]*grid-cols-3/u,
  );
  assert.match(
    markup,
    /data-audience-tab="true"[^>]*class="[^"]*min-w-0[^"]*justify-center[^"]*text-\[11px\]/u,
  );
  assert.match(markup, /class="[^"]*hidden[^"]*sm:block"[^>]*data-audience-tab-icon="true"/u);
  assert.doesNotMatch(markup, /overflow-x-auto/u);
});
