import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildListingProposalSummary,
  getListingProposalDownloadFilename,
} from '@/lib/listing-proposal';
import { createListingProposalPdf } from '@/lib/server/listing-proposal-pdf';
import type { SaleListing } from '@/lib/types';

const listing: SaleListing = {
  id: 'proposal-listing-1',
  type: 'sale',
  make: 'Toyota',
  model: 'Camry',
  generation: 'XV70',
  year: 2022,
  price: 3150000,
  city: 'Москва',
  inspectionCity: 'Москва',
  images: [],
  engine: '2.5 л / бензин',
  power: 200,
  transmission: 'Автомат',
  drive: 'Передний',
  bodyType: 'Седан',
  mileage: 42000,
  owners: 1,
  ptsOriginal: true,
  ptsType: 'original',
  avtotekaStatus: 'green',
  paintCount: 0,
  accident: false,
  taxi: false,
  carsharing: false,
  keysCount: 2,
  wheelSet: true,
  glassOriginal: true,
  needsInvestment: false,
  resourceStatus: 'not_listed',
  sellerType: 'owner',
  color: 'Чёрный',
  steering: 'Левый',
  vin: 'JTNB11HK202000001',
  description:
    'Camry в хорошем состоянии, полностью обслужена, без нареканий по технике и кузову.',
  viewCount: 18,
  createdAt: '2026-04-16T10:00:00.000Z',
  seller: {
    id: 'seller-1',
    name: 'vin2win',
    type: 'company',
    verified: true,
    onPlatformSince: 'март 2026',
  },
};

test('listing proposal summary keeps only client-facing fields and stable filename', () => {
  const summary = buildListingProposalSummary(listing, new Date('2026-04-24T12:00:00.000Z'));

  assert.equal(
    getListingProposalDownloadFilename(listing),
    'vin2win-proposal-2022-proposal-listing-1.pdf'
  );
  assert.equal(summary.title, 'Toyota Camry, 2022');
  assert.equal(summary.locationLabel, 'Москва');
  assert.ok(summary.highlights.includes('Без окрасов'));
  assert.ok(summary.highlights.includes('Зелёная автотека'));
  assert.ok(summary.highlights.includes('2 ключа'));
  assert.match(summary.footerNote, /VIN-отчёт/u);
  assert.equal(summary.facts.find((fact) => fact.label === 'Окрасы')?.value, 'Без окрасов');
  assert.equal(summary.facts.find((fact) => fact.label === 'Автотека')?.value, 'Зелёная');
});

test('listing proposal pdf generator returns a pdf document buffer', async () => {
  const pdfBytes = await createListingProposalPdf(listing, {
    origin: 'https://vin2win.ru',
    now: new Date('2026-04-24T12:00:00.000Z'),
  });

  assert.ok(pdfBytes.length > 1024);
  assert.equal(Buffer.from(pdfBytes).subarray(0, 5).toString('utf8'), '%PDF-');
});
