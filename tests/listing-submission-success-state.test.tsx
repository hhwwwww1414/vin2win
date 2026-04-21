import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';

import { ListingSubmissionSuccessState } from '@/components/listing/listing-submission-success-state';

test('listing submission success state renders the animated success mark', () => {
  const markup = renderToStaticMarkup(
    <ListingSubmissionSuccessState
      title="Объявление отправлено на модерацию"
      description="После проверки оно появится в ленте."
      primaryHref="/listing/1"
      primaryLabel="Открыть запись"
      secondaryAction={<button type="button">Подать ещё</button>}
      reducedMotion={false}
    />
  );

  assert.match(markup, /data-success-check-animation=\"true\"/);
  assert.match(markup, /Объявление отправлено на модерацию/u);
  assert.doesNotMatch(markup, /bg-success\/15/);
});
