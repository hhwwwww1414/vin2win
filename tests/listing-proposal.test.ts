import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildListingProposalSummary,
  collectListingProposalGalleryImages,
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
  images: ['/cars/camry/front.jpg', '/cars/camry/rear.jpg'],
  interiorImages: ['/cars/camry/interior.jpg'],
  videoUrl: '/cars/camry/video.mp4',
  reportUrl: '/cars/camry/report.pdf',
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
    name: 'Продавец не должен попасть в PDF',
    type: 'company',
    verified: true,
    onPlatformSince: 'март 2026',
  },
};

test('listing proposal summary stays generic and excludes platform branding', () => {
  const summary = buildListingProposalSummary(listing, new Date('2026-04-24T12:00:00.000Z'));
  const galleryImages = collectListingProposalGalleryImages(listing);

  assert.equal(
    getListingProposalDownloadFilename(listing),
    'commercial-proposal-2022-proposal-listing-1.pdf'
  );
  assert.equal(summary.title, 'Toyota Camry, 2022');
  assert.equal(summary.subtitle, 'Коммерческое предложение');
  assert.equal(summary.locationLabel, 'Москва');
  assert.equal(galleryImages.length, 3);
  assert.equal(galleryImages[0]?.label, 'Фото 1');
  assert.equal(galleryImages[2]?.label, 'Салон 1');
  assert.ok(summary.highlights.includes('Без окрасов'));
  assert.ok(summary.highlights.includes('Зелёная автотека'));
  assert.ok(summary.highlights.includes('2 ключа'));
  assert.doesNotMatch(summary.subtitle, /vin2win/i);
  assert.doesNotMatch(summary.footerNote, /vin2win/i);
  assert.doesNotMatch(summary.lead, /vin2win/i);
  assert.doesNotMatch(summary.description, /vin2win/i);
  assert.doesNotMatch(summary.lead, /клиент/u);
  assert.doesNotMatch(summary.lead, /быстрого показа/u);
  assert.doesNotMatch(summary.lead, /собрал|собрали/u);
  assert.doesNotMatch(summary.description, /Продавец не должен попасть в PDF/u);
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
