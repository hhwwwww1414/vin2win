import assert from 'node:assert/strict';
import test from 'node:test';
import { getSaleListingFormModeCopy } from '@/lib/sale-form';

test('sale listing form copy switches to edit actions for owner edit mode', () => {
  const copy = getSaleListingFormModeCopy({
    isEditMode: true,
    submittedStatus: null,
  });

  assert.equal(copy.heading, 'Редактирование объявления');
  assert.equal(copy.primaryActionLabel, 'Сохранить изменения');
  assert.equal(copy.secondaryActionLabel, 'Сохранить как черновик');
});

test('sale listing form success copy reflects resubmission after edit', () => {
  const copy = getSaleListingFormModeCopy({
    isEditMode: true,
    submittedStatus: 'PENDING',
  });

  assert.equal(copy.successTitle, 'Объявление отправлено на повторную модерацию');
  assert.match(copy.successDescription, /снова пройдет проверку/i);
});
