import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ReactElement, ReactNode } from 'react';
import { ImageResponse } from 'next/og';
import { PDFArray, PDFDocument, PDFName, PDFString } from 'pdf-lib';
import {
  buildListingProposalSummary,
  collectListingProposalGalleryImages,
  type ListingProposalFact,
  type ListingProposalTone,
} from '@/lib/listing-proposal';
import type { SaleListing } from '@/lib/types';

/* eslint-disable @next/next/no-img-element */

const A4_IMAGE_WIDTH = 1240;
const A4_IMAGE_HEIGHT = 1754;
const A4_PDF_WIDTH = 595.28;
const A4_PDF_HEIGHT = 841.89;
const GALLERY_PAGE_SIZE = 4;
const SUMMARY_HEADER_HEIGHT = 138;
const SUMMARY_ROW_TOP = 56 + SUMMARY_HEADER_HEIGHT + 30;
const SUMMARY_RIGHT_COLUMN_X = 68 + 720 + 24;
const SUMMARY_MEDIA_CARD_TOP = SUMMARY_ROW_TOP + 190 + 18 + 236 + 18;
const SUMMARY_MEDIA_CARD_BUTTON_X = SUMMARY_RIGHT_COLUMN_X + 24;
const SUMMARY_MEDIA_CARD_BUTTON_WIDTH = 312;
const SUMMARY_MEDIA_CARD_VIDEO_BUTTON_TOP = SUMMARY_MEDIA_CARD_TOP + 132;
const SUMMARY_MEDIA_CARD_REPORT_BUTTON_TOP = SUMMARY_MEDIA_CARD_TOP + 208;
const SUMMARY_MEDIA_CARD_BUTTON_HEIGHT = 58;

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

type LoadedProposalImage = {
  dataUrl: string;
  label: string;
  sourceUrl: string;
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

function chunkArray<T>(items: T[], chunkSize: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

function getTonePalette(tone: ListingProposalTone = 'neutral') {
  switch (tone) {
    case 'positive':
      return {
        border: 'rgba(110, 231, 164, 0.28)',
        background: 'rgba(45, 122, 74, 0.16)',
        text: '#DCFCE7',
      };
    case 'warning':
      return {
        border: 'rgba(245, 158, 11, 0.28)',
        background: 'rgba(217, 119, 6, 0.16)',
        text: '#FDE68A',
      };
    default:
      return {
        border: 'rgba(148, 163, 184, 0.18)',
        background: 'rgba(255, 255, 255, 0.04)',
        text: '#F8FAFC',
      };
  }
}

function PageFrame({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        background:
          'radial-gradient(circle at top left, rgba(125, 211, 252, 0.14), transparent 28%), linear-gradient(180deg, #0B1118 0%, #111827 48%, #0B1118 100%)',
        color: '#FFFFFF',
        padding: '56px 68px',
        fontFamily: 'Manrope',
      }}
    >
      {children}
    </div>
  );
}

function Header({
  title,
  subtitle,
  rightLabel,
  rightValue,
}: {
  title: string;
  subtitle: string;
  rightLabel: string;
  rightValue: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        height: SUMMARY_HEADER_HEIGHT,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: 760,
        }}
      >
        <div
          style={{
            display: 'flex',
            color: 'rgba(226, 232, 240, 0.68)',
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          Подборка по автомобилю
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 14,
            fontSize: 58,
            fontWeight: 700,
            lineHeight: 1.04,
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 12,
            fontSize: 24,
            fontWeight: 500,
            color: 'rgba(226, 232, 240, 0.78)',
          }}
        >
          {subtitle}
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
            color: 'rgba(226, 232, 240, 0.62)',
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          {rightLabel}
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 12,
            borderRadius: 999,
            border: '1px solid rgba(148, 163, 184, 0.18)',
            background: 'rgba(255, 255, 255, 0.06)',
            padding: '14px 22px',
            color: '#F8FAFC',
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          {rightValue}
        </div>
      </div>
    </div>
  );
}

function Card({
  children,
  width,
  height,
  accent = false,
}: {
  children: React.ReactNode;
  width?: number;
  height?: number;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width,
        height,
        borderRadius: 32,
        border: accent
          ? '1px solid rgba(125, 211, 252, 0.18)'
          : '1px solid rgba(255, 255, 255, 0.08)',
        background: accent
          ? '#172230'
          : 'rgba(255, 255, 255, 0.04)',
        padding: 24,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div
      style={{
        display: 'flex',
        color: 'rgba(226, 232, 240, 0.62)',
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </div>
  );
}

function MetaChip({ children }: { children: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        borderRadius: 999,
        border: '1px solid rgba(125, 211, 252, 0.18)',
        background: 'rgba(125, 211, 252, 0.08)',
        color: '#E0F2FE',
        fontSize: 20,
        fontWeight: 700,
        lineHeight: 1.2,
        padding: '10px 16px',
      }}
    >
      {children}
    </div>
  );
}

function FactRow({
  label,
  value,
  tone,
}: ListingProposalFact) {
  const palette = getTonePalette(tone);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '48%',
        minHeight: 88,
        borderRadius: 22,
        border: `1px solid ${palette.border}`,
        background: palette.background,
        padding: '16px 18px',
      }}
    >
      <div
        style={{
          display: 'flex',
          color: 'rgba(226, 232, 240, 0.58)',
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: 'flex',
          marginTop: 10,
          color: palette.text,
          fontSize: 24,
          fontWeight: 700,
          lineHeight: 1.25,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function KeyValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        paddingBottom: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          color: 'rgba(226, 232, 240, 0.56)',
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: 'flex',
          marginTop: 8,
          color: '#F8FAFC',
          fontSize: 22,
          fontWeight: 700,
          lineHeight: 1.25,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function MediaLink({
  label,
}: {
  label: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        border: '1px solid rgba(125, 211, 252, 0.18)',
        background: 'rgba(125, 211, 252, 0.08)',
        height: SUMMARY_MEDIA_CARD_BUTTON_HEIGHT,
        padding: '0 16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          color: '#E0F2FE',
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
    </div>
  );
}

function HeroImagePlaceholder({ title }: { title: string }) {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        alignItems: 'flex-end',
        borderRadius: 28,
        background:
          'radial-gradient(circle at top left, rgba(125, 211, 252, 0.24), transparent 30%), linear-gradient(135deg, rgba(30, 41, 59, 1), rgba(15, 23, 42, 1))',
        padding: 30,
      }}
    >
      <div
        style={{
          display: 'flex',
          maxWidth: 520,
          color: '#FFFFFF',
          fontSize: 52,
          fontWeight: 700,
          lineHeight: 1.04,
        }}
      >
        {title}
      </div>
    </div>
  );
}

function GalleryImageCard({
  image,
}: {
  image: LoadedProposalImage;
}) {
  return (
    <Card width={540} height={600}>
      <div
        style={{
          display: 'flex',
          height: 482,
          width: '100%',
          overflow: 'hidden',
          borderRadius: 24,
        }}
      >
        <img
          src={image.dataUrl}
          alt={image.label}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          marginTop: 18,
          color: 'rgba(226, 232, 240, 0.62)',
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {image.label}
      </div>
      <div
        style={{
          display: 'flex',
          marginTop: 10,
          color: '#F8FAFC',
          fontSize: 24,
          fontWeight: 700,
          lineHeight: 1.2,
        }}
      >
        {image.sourceUrl}
      </div>
    </Card>
  );
}

function SummaryPage({
  summary,
  heroImageDataUrl,
  galleryCount,
  videoUrl,
  reportUrl,
}: {
  summary: ReturnType<typeof buildListingProposalSummary>;
  heroImageDataUrl?: string;
  galleryCount: number;
  reportUrl?: string;
  videoUrl?: string;
}) {
  const primaryFacts = summary.facts.slice(0, 8);

  return (
    <PageFrame>
      <Header
        title="Коммерческое предложение"
        subtitle={summary.generatedAtLabel}
        rightLabel="Автомобиль"
        rightValue={summary.title}
      />

      <div
        style={{
          display: 'flex',
          gap: 24,
          marginTop: 30,
        }}
      >
        <Card width={720} height={720}>
          <div
            style={{
              display: 'flex',
              height: 470,
              width: '100%',
              overflow: 'hidden',
              borderRadius: 28,
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
                }}
              />
            ) : (
              <HeroImagePlaceholder title={summary.title} />
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
                color: '#F8FAFC',
                fontSize: 44,
                fontWeight: 700,
                lineHeight: 1.06,
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
              <MetaChip>{summary.locationLabel}</MetaChip>
              <MetaChip>{summary.facts.find((fact) => fact.label === 'Кузов')?.value ?? 'Автомобиль'}</MetaChip>
              {summary.facts.find((fact) => fact.label === 'Пробег')?.value ? (
                <MetaChip>{summary.facts.find((fact) => fact.label === 'Пробег')?.value ?? ''}</MetaChip>
              ) : null}
            </div>
          </div>
        </Card>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            width: 360,
          }}
        >
          <Card width={360} height={190} accent>
            <SectionTitle>Цена по объявлению</SectionTitle>
            <div
              style={{
                display: 'flex',
                marginTop: 18,
                color: '#F8FAFC',
                fontSize: 46,
                fontWeight: 700,
                lineHeight: 1.08,
              }}
            >
              {summary.priceLabel}
            </div>
            <div
              style={{
                display: 'flex',
                marginTop: 10,
                color: '#CBD5E1',
                fontSize: 20,
                fontWeight: 600,
              }}
            >
              Осмотр: {summary.locationLabel}
            </div>
          </Card>

          <Card width={360} height={236}>
            <SectionTitle>Основные данные</SectionTitle>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                marginTop: 18,
              }}
            >
              <KeyValue label="Год выпуска" value={summary.facts[0]?.value ?? '—'} />
              <KeyValue label="Двигатель" value={summary.facts[2]?.value ?? '—'} />
              <KeyValue label="Коробка" value={summary.facts[4]?.value ?? '—'} />
            </div>
          </Card>

          <Card width={360} height={258}>
            <SectionTitle>Материалы</SectionTitle>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                marginTop: 18,
              }}
            >
              <KeyValue label="Фотографии" value={`${galleryCount}`} />
              {videoUrl ? <MediaLink label="Открыть видео" /> : null}
              {reportUrl ? <MediaLink label="Открыть VIN-отчёт" /> : null}
              {!videoUrl && !reportUrl ? (
                <div
                  style={{
                    display: 'flex',
                    color: '#CBD5E1',
                    fontSize: 18,
                    fontWeight: 600,
                    lineHeight: 1.35,
                  }}
                >
                  Дополнительные ссылки к объявлению отсутствуют.
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 24,
          marginTop: 24,
        }}
      >
        <Card width={720} height={692}>
          <SectionTitle>Ключевые параметры</SectionTitle>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              gap: 16,
              marginTop: 22,
            }}
          >
            {primaryFacts.map((fact) => (
              <FactRow
                key={fact.label}
                label={fact.label}
                value={fact.value}
                tone={fact.tone}
              />
            ))}
          </div>
        </Card>

        <Card width={360} height={692}>
          <SectionTitle>Комментарий по объявлению</SectionTitle>
          <div
            style={{
              display: 'flex',
              marginTop: 18,
              color: '#F8FAFC',
              fontSize: 30,
              fontWeight: 700,
              lineHeight: 1.3,
            }}
          >
            {summary.lead}
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 18,
              color: '#CBD5E1',
              fontSize: 22,
              fontWeight: 500,
              lineHeight: 1.45,
            }}
          >
            {summary.description}
          </div>

          <div
            style={{
              display: 'flex',
              height: 1,
              background: 'rgba(255, 255, 255, 0.08)',
              marginTop: 22,
            }}
          />

          <div
            style={{
              display: 'flex',
              marginTop: 22,
              color: 'rgba(226, 232, 240, 0.62)',
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            Коротко о плюсах
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              marginTop: 16,
            }}
          >
            {summary.highlights.map((highlight) => (
              <MetaChip key={highlight}>{highlight}</MetaChip>
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 20,
              color: '#94A3B8',
              fontSize: 18,
              fontWeight: 500,
              lineHeight: 1.4,
            }}
          >
            {summary.footerNote}
          </div>
        </Card>
      </div>
    </PageFrame>
  );
}

function GalleryPage({
  title,
  images,
  pageIndex,
  pageCount,
}: {
  title: string;
  images: LoadedProposalImage[];
  pageCount: number;
  pageIndex: number;
}) {
  return (
    <PageFrame>
      <Header
        title="Фотографии автомобиля"
        subtitle={title}
        rightLabel="Страница"
        rightValue={`${pageIndex + 1} / ${pageCount}`}
      />

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          rowGap: 24,
          marginTop: 30,
        }}
      >
        {images.map((image) => (
          <GalleryImageCard key={`${image.label}-${image.sourceUrl}`} image={image} />
        ))}
      </div>
    </PageFrame>
  );
}

function resolveAssetUrl(assetUrl: string, origin: string) {
  return new URL(assetUrl, origin).toString();
}

function toAbsoluteOptionalUrl(assetUrl: string | undefined, origin: string) {
  if (!assetUrl) {
    return undefined;
  }

  try {
    return resolveAssetUrl(assetUrl, origin);
  } catch {
    return assetUrl;
  }
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

async function loadGalleryImages(listing: SaleListing, origin: string) {
  const galleryImages = collectListingProposalGalleryImages(listing);
  const loadedImages = await Promise.all(
    galleryImages.map(async (image) => {
      const dataUrl = await loadImageAsDataUrl(image.url, origin);
      if (!dataUrl) {
        return null;
      }

      return {
        dataUrl,
        label: image.label,
        sourceUrl: toAbsoluteOptionalUrl(image.url, origin) ?? image.url,
      } satisfies LoadedProposalImage;
    })
  );

  return loadedImages.filter((image): image is LoadedProposalImage => Boolean(image));
}

async function renderProposalPage(
  page: ReactElement,
  fonts: LoadedProposalFonts
) {
  const image = new ImageResponse(page, {
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
  });

  return image.arrayBuffer();
}

async function appendPngPage(pdfDocument: PDFDocument, pngBytes: ArrayBuffer) {
  const page = pdfDocument.addPage([A4_PDF_WIDTH, A4_PDF_HEIGHT]);
  const image = await pdfDocument.embedPng(pngBytes);

  page.drawImage(image, {
    x: 0,
    y: 0,
    width: A4_PDF_WIDTH,
    height: A4_PDF_HEIGHT,
  });

  return page;
}

function addUriLinkAnnotation(
  pdfDocument: PDFDocument,
  page: Awaited<ReturnType<typeof appendPngPage>>,
  rect: {
    height: number;
    width: number;
    x: number;
    yTop: number;
  },
  uri: string
) {
  const scaleX = A4_PDF_WIDTH / A4_IMAGE_WIDTH;
  const scaleY = A4_PDF_HEIGHT / A4_IMAGE_HEIGHT;
  const x = rect.x * scaleX;
  const y = A4_PDF_HEIGHT - (rect.yTop + rect.height) * scaleY;
  const width = rect.width * scaleX;
  const height = rect.height * scaleY;

  const annotation = pdfDocument.context.obj({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: [x, y, x + width, y + height],
    Border: [0, 0, 0],
    A: {
      Type: 'Action',
      S: 'URI',
      URI: PDFString.of(uri),
    },
  });

  const existingAnnotations = page.node.lookupMaybe(PDFName.of('Annots'), PDFArray);

  if (existingAnnotations) {
    existingAnnotations.push(annotation);
    return;
  }

  page.node.set(PDFName.of('Annots'), pdfDocument.context.obj([annotation]));
}

export async function createListingProposalPdf(
  listing: SaleListing,
  options: {
    origin: string;
    now?: Date;
  }
) {
  const generatedAt = options.now ?? new Date();
  const summary = buildListingProposalSummary(listing, generatedAt);
  const [fonts, loadedGalleryImages] = await Promise.all([
    loadProposalFonts(),
    loadGalleryImages(listing, options.origin),
  ]);

  const absoluteVideoUrl = toAbsoluteOptionalUrl(listing.videoUrl, options.origin);
  const absoluteReportUrl = toAbsoluteOptionalUrl(listing.reportUrl, options.origin);
  const galleryCount = collectListingProposalGalleryImages(listing).length;
  const summaryPageBytes = await renderProposalPage(
    <SummaryPage
      summary={summary}
      heroImageDataUrl={loadedGalleryImages[0]?.dataUrl}
      galleryCount={galleryCount}
      reportUrl={absoluteReportUrl}
      videoUrl={absoluteVideoUrl}
    />,
    fonts
  );

  const pdfDocument = await PDFDocument.create();
  pdfDocument.setTitle(summary.title);
  pdfDocument.setSubject('Коммерческое предложение по автомобилю');
  pdfDocument.setCreator('PDF generator');
  pdfDocument.setProducer('PDF generator');
  pdfDocument.setCreationDate(generatedAt);

  const summaryPage = await appendPngPage(pdfDocument, summaryPageBytes);

  if (absoluteVideoUrl) {
    addUriLinkAnnotation(
      pdfDocument,
      summaryPage,
      {
        x: SUMMARY_MEDIA_CARD_BUTTON_X,
        yTop: SUMMARY_MEDIA_CARD_VIDEO_BUTTON_TOP,
        width: SUMMARY_MEDIA_CARD_BUTTON_WIDTH,
        height: SUMMARY_MEDIA_CARD_BUTTON_HEIGHT,
      },
      absoluteVideoUrl
    );
  }

  if (absoluteReportUrl) {
    addUriLinkAnnotation(
      pdfDocument,
      summaryPage,
      {
        x: SUMMARY_MEDIA_CARD_BUTTON_X,
        yTop: SUMMARY_MEDIA_CARD_REPORT_BUTTON_TOP,
        width: SUMMARY_MEDIA_CARD_BUTTON_WIDTH,
        height: SUMMARY_MEDIA_CARD_BUTTON_HEIGHT,
      },
      absoluteReportUrl
    );
  }

  if (loadedGalleryImages.length > 1) {
    const galleryChunks = chunkArray(loadedGalleryImages, GALLERY_PAGE_SIZE);

    for (const [pageIndex, images] of galleryChunks.entries()) {
      const galleryPageBytes = await renderProposalPage(
        <GalleryPage
          title={summary.title}
          images={images}
          pageIndex={pageIndex}
          pageCount={galleryChunks.length}
        />,
        fonts
      );

      await appendPngPage(pdfDocument, galleryPageBytes);
    }
  }

  return pdfDocument.save();
}
