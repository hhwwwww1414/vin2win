import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { PDFDocument } from 'pdf-lib';
import {
  buildListingProposalSummary,
  type ListingProposalFact,
  type ListingProposalTone,
} from '@/lib/listing-proposal';
import type { SaleListing } from '@/lib/types';

/* eslint-disable @next/next/no-img-element */

const A4_IMAGE_WIDTH = 1240;
const A4_IMAGE_HEIGHT = 1754;
const A4_PDF_WIDTH = 595.28;
const A4_PDF_HEIGHT = 841.89;

const MANROPE_REGULAR_PATH = join(
  process.cwd(),
  'assets',
  'fonts',
  'manrope-cyrillic-500-normal.woff'
);
const MANROPE_BOLD_PATH = join(
  process.cwd(),
  'assets',
  'fonts',
  'manrope-cyrillic-700-normal.woff'
);

type LoadedProposalFonts = {
  regular: ArrayBuffer;
  bold: ArrayBuffer;
};

let cachedFontsPromise: Promise<LoadedProposalFonts> | null = null;

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return Uint8Array.from(buffer).buffer;
}

async function loadProposalFonts() {
  if (!cachedFontsPromise) {
    cachedFontsPromise = Promise.all([
      readFile(MANROPE_REGULAR_PATH),
      readFile(MANROPE_BOLD_PATH),
    ]).then(([regular, bold]) => ({
      regular: toArrayBuffer(regular),
      bold: toArrayBuffer(bold),
    }));
  }

  return cachedFontsPromise;
}

function getTonePalette(tone: ListingProposalTone = 'neutral') {
  switch (tone) {
    case 'positive':
      return {
        border: 'rgba(110, 231, 164, 0.28)',
        background: 'rgba(45, 122, 74, 0.16)',
        text: '#DDF8E7',
      };
    case 'warning':
      return {
        border: 'rgba(244, 196, 48, 0.24)',
        background: 'rgba(212, 160, 23, 0.16)',
        text: '#FFF1C2',
      };
    default:
      return {
        border: 'rgba(129, 216, 208, 0.18)',
        background: 'rgba(129, 216, 208, 0.08)',
        text: '#E8FAF7',
      };
  }
}

function ProposalChip({
  children,
  tone,
}: {
  children: string;
  tone?: ListingProposalTone;
}) {
  const palette = getTonePalette(tone);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        borderRadius: 999,
        border: `1px solid ${palette.border}`,
        background: palette.background,
        color: palette.text,
        fontSize: 22,
        fontWeight: 700,
        lineHeight: 1.2,
        padding: '12px 18px',
      }}
    >
      {children}
    </div>
  );
}

function ProposalFactCard({ fact }: { fact: ListingProposalFact }) {
  const palette = getTonePalette(fact.tone);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '48.5%',
        minHeight: 118,
        borderRadius: 24,
        border: `1px solid ${palette.border}`,
        background:
          fact.tone && fact.tone !== 'neutral'
            ? palette.background
            : 'rgba(255,255,255,0.04)',
        padding: '20px 22px',
      }}
    >
      <div
        style={{
          color: 'rgba(232, 240, 245, 0.62)',
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {fact.label}
      </div>
      <div
        style={{
          color: fact.tone && fact.tone !== 'neutral' ? palette.text : '#F7FBFC',
          fontSize: 30,
          fontWeight: 700,
          lineHeight: 1.2,
          marginTop: 12,
        }}
      >
        {fact.value}
      </div>
    </div>
  );
}

function ProposalImagePlaceholder({ title }: { title: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        width: '100%',
        borderRadius: 28,
        background:
          'radial-gradient(circle at top left, rgba(129,216,208,0.38), transparent 32%), linear-gradient(135deg, rgba(45,90,90,0.92), rgba(15,18,22,0.98))',
        padding: '36px',
        color: '#FFFFFF',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: 'rgba(255,255,255,0.82)',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: '#81D8D0',
            }}
          />
          vin2win selection
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 62,
            lineHeight: 1.02,
            fontWeight: 700,
            maxWidth: 520,
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
}

function ListingProposalPage({
  listing,
  heroImageDataUrl,
  generatedAt,
}: {
  listing: SaleListing;
  heroImageDataUrl?: string;
  generatedAt: Date;
}) {
  const summary = buildListingProposalSummary(listing, generatedAt);
  const highlights =
    summary.highlights.length > 0 ? summary.highlights : ['Проверка и осмотр доступны по запросу'];

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        background:
          'radial-gradient(circle at top left, rgba(129,216,208,0.22), transparent 28%), linear-gradient(180deg, #0F1216 0%, #131920 52%, #0E1418 100%)',
        color: '#FFFFFF',
        padding: '64px 68px',
        fontFamily: 'Manrope',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              color: '#DDF8F4',
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                background: '#81D8D0',
                boxShadow: '0 0 0 8px rgba(129,216,208,0.12)',
              }}
            />
            vin2win
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 58,
              fontWeight: 700,
              lineHeight: 1.04,
              marginTop: 18,
            }}
          >
            Коммерческое предложение
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 24,
              fontWeight: 500,
              color: 'rgba(236, 244, 248, 0.72)',
              marginTop: 12,
            }}
          >
            {summary.subtitle}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
          }}
        >
          <div
            style={{
              display: 'flex',
              color: 'rgba(236, 244, 248, 0.62)',
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Сформировано
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 12,
              borderRadius: 999,
              border: '1px solid rgba(129,216,208,0.24)',
              background: 'rgba(129,216,208,0.1)',
              padding: '14px 22px',
              color: '#E8FAF7',
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            {summary.generatedAtLabel}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          height: 1,
          background: 'linear-gradient(90deg, rgba(129,216,208,0.24), rgba(129,216,208,0), rgba(129,216,208,0.24))',
          marginTop: 28,
        }}
      />

      <div
        style={{
          display: 'flex',
          gap: 28,
          marginTop: 34,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            borderRadius: 34,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)',
            padding: 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '100%',
              height: 640,
            }}
          >
            {heroImageDataUrl ? (
              <img
                src={heroImageDataUrl}
                alt={summary.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 28,
                }}
              />
            ) : (
              <ProposalImagePlaceholder title={summary.title} />
            )}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: 22,
            }}
          >
            <div
              style={{
                display: 'flex',
                color: 'rgba(232, 240, 245, 0.62)',
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Лот vin2win
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 42,
                fontWeight: 700,
                lineHeight: 1.05,
                marginTop: 12,
              }}
            >
              {summary.title}
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                marginTop: 16,
              }}
            >
              {listing.generation ? <ProposalChip>{listing.generation}</ProposalChip> : null}
              <ProposalChip>{listing.bodyType}</ProposalChip>
              <ProposalChip>{summary.locationLabel}</ProposalChip>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 360,
            gap: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 34,
              border: '1px solid rgba(129,216,208,0.22)',
              background:
                'radial-gradient(circle at top left, rgba(129,216,208,0.18), transparent 38%), rgba(16,20,24,0.96)',
              padding: '28px 28px 30px',
            }}
          >
            <div
              style={{
                display: 'flex',
                color: 'rgba(232, 240, 245, 0.62)',
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Цена по объявлению
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 56,
                fontWeight: 700,
                lineHeight: 1.02,
                marginTop: 18,
              }}
            >
              {summary.priceLabel}
            </div>
            <div
              style={{
                display: 'flex',
                marginTop: 24,
                borderRadius: 24,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                padding: '16px 18px',
                color: '#F2F8FA',
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              Осмотр: {summary.locationLabel}
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                marginTop: 18,
              }}
            >
              {listing.seller.verified ? (
                <ProposalChip tone="positive">Проверенный профиль</ProposalChip>
              ) : (
                <ProposalChip>Источник vin2win</ProposalChip>
              )}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 34,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.04)',
              padding: '28px 28px 30px',
            }}
          >
            <div
              style={{
                display: 'flex',
                color: 'rgba(232, 240, 245, 0.62)',
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Почему обратить внимание
            </div>
            <div
              style={{
                display: 'flex',
                color: '#F6FBFD',
                fontSize: 28,
                fontWeight: 700,
                lineHeight: 1.35,
                marginTop: 16,
              }}
            >
              {summary.lead}
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                marginTop: 20,
              }}
            >
              {highlights.map((highlight) => (
                <ProposalChip key={highlight}>{highlight}</ProposalChip>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 28,
          marginTop: 28,
          flex: 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            borderRadius: 34,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)',
            padding: '28px 28px 30px',
          }}
        >
          <div
            style={{
              display: 'flex',
              color: 'rgba(232, 240, 245, 0.62)',
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Ключевые параметры
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 20,
              marginTop: 22,
            }}
          >
            {summary.facts.map((fact) => (
              <ProposalFactCard key={fact.label} fact={fact} />
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 360,
            borderRadius: 34,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)',
            padding: '28px 28px 30px',
          }}
        >
          <div
            style={{
              display: 'flex',
              color: 'rgba(232, 240, 245, 0.62)',
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Комментарий по объявлению
          </div>
          <div
            style={{
              display: 'flex',
              color: '#F7FBFC',
              fontSize: 26,
              fontWeight: 500,
              lineHeight: 1.48,
              marginTop: 18,
            }}
          >
            {summary.description}
          </div>
          <div
            style={{
              display: 'flex',
              height: 1,
              background: 'rgba(255,255,255,0.08)',
              marginTop: 22,
            }}
          />
          <div
            style={{
              display: 'flex',
              color: 'rgba(232, 240, 245, 0.62)',
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginTop: 22,
            }}
          >
            Доступно по запросу
          </div>
          <div
            style={{
              display: 'flex',
              color: '#E8FAF7',
              fontSize: 24,
              fontWeight: 700,
              lineHeight: 1.4,
              marginTop: 14,
            }}
          >
            Осмотр, дополнительные фото, видео и проверка документов организуются через vin2win.
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          marginTop: 26,
          paddingTop: 24,
          borderTop: '1px solid rgba(129,216,208,0.12)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flex: 1,
            color: 'rgba(236, 244, 248, 0.74)',
            fontSize: 22,
            fontWeight: 500,
            lineHeight: 1.4,
          }}
        >
          {summary.footerNote}
        </div>
        <div
          style={{
            display: 'flex',
            borderRadius: 999,
            border: '1px solid rgba(129,216,208,0.22)',
            background: 'rgba(129,216,208,0.08)',
            padding: '12px 18px',
            color: '#E8FAF7',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
        >
          vin2win.ru
        </div>
      </div>
    </div>
  );
}

function resolveAssetUrl(assetUrl: string, origin: string) {
  return new URL(assetUrl, origin).toString();
}

async function loadImageAsDataUrl(assetUrl: string | undefined, origin: string) {
  if (!assetUrl) {
    return undefined;
  }

  try {
    const response = await fetch(resolveAssetUrl(assetUrl, origin));
    if (!response.ok) {
      return undefined;
    }

    const contentType = response.headers.get('content-type') ?? 'image/jpeg';
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    return `data:${contentType};base64,${imageBuffer.toString('base64')}`;
  } catch {
    return undefined;
  }
}

export async function createListingProposalPdf(
  listing: SaleListing,
  options: {
    origin: string;
    now?: Date;
  }
) {
  const generatedAt = options.now ?? new Date();
  const [fonts, heroImageDataUrl] = await Promise.all([
    loadProposalFonts(),
    loadImageAsDataUrl(listing.images[0], options.origin),
  ]);

  const previewImage = new ImageResponse(
    <ListingProposalPage
      listing={listing}
      heroImageDataUrl={heroImageDataUrl}
      generatedAt={generatedAt}
    />,
    {
      width: A4_IMAGE_WIDTH,
      height: A4_IMAGE_HEIGHT,
      fonts: [
        {
          name: 'Manrope',
          data: fonts.regular,
          style: 'normal',
          weight: 500,
        },
        {
          name: 'Manrope',
          data: fonts.bold,
          style: 'normal',
          weight: 700,
        },
      ],
    }
  );

  const pngBytes = await previewImage.arrayBuffer();
  const pdfDocument = await PDFDocument.create();
  pdfDocument.setTitle(buildListingProposalSummary(listing, generatedAt).title);
  pdfDocument.setSubject('Коммерческое предложение vin2win');
  pdfDocument.setCreator('vin2win');
  pdfDocument.setProducer('vin2win');
  pdfDocument.setCreationDate(generatedAt);

  const page = pdfDocument.addPage([A4_PDF_WIDTH, A4_PDF_HEIGHT]);
  const proposalImage = await pdfDocument.embedPng(pngBytes);

  page.drawImage(proposalImage, {
    x: 0,
    y: 0,
    width: A4_PDF_WIDTH,
    height: A4_PDF_HEIGHT,
  });

  return pdfDocument.save();
}
