import test from 'node:test';
import assert from 'node:assert/strict';
import { selectBestGeneration } from '@/scripts/vehicle-catalog/import';

test('selectBestGeneration prefers the generation with the largest year overlap', () => {
  const generations = [
    {
      id: 'generation-second',
      modelId: 'model-rrs',
      slug: 'second',
      label: '2013-2022, Second generation',
      labelRu: '2013-2022, Second generation',
      productionStartYear: 2013,
      productionEndYear: 2022,
      lowConfidence: false,
    },
    {
      id: 'generation-third',
      modelId: 'model-rrs',
      slug: 'third',
      label: '2022-н.в., Third generation',
      labelRu: '2022-н.в., Third generation',
      productionStartYear: 2022,
      productionEndYear: undefined,
      lowConfidence: false,
    },
  ] as any[];

  const selected = selectBestGeneration(generations as any, {
    startYear: 2017,
    endYear: 2022,
    bodyTypeId: 'body_suv',
  });

  assert.equal(selected?.id, 'generation-second');
});
