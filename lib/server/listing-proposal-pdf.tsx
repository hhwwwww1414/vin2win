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

const FRAME_PADDING_TOP = 56;
const FRAME_PADDING_X = 68;
const SUMMARY_HEADER_HEIGHT = 220;
const SUMMARY_CONTENT_TOP = FRAME_PADDING_TOP + SUMMARY_HEADER_HEIGHT + 30;
const SUMMARY_LEFT_CARD_WIDTH = 720;
const SUMMARY_RIGHT_COLUMN_WIDTH = 360;
const SUMMARY_RIGHT_COLUMN_X = FRAME_PADDING_X + SUMMARY_LEFT_CARD_WIDTH + 24;
const SUMMARY_PRICE_CARD_HEIGHT = 196;
const SUMMARY_FACTS_CARD_HEIGHT = 244;
const SUMMARY_MATERIALS_CARD_TOP =
  SUMMARY_CONTENT_TOP + SUMMARY_PRICE_CARD_HEIGHT + 18 + SUMMARY_FACTS_CARD_HEIGHT + 18;
const SUMMARY_MATERIALS_BUTTON_X = SUMMARY_RIGHT_COLUMN_X + 24;
const SUMMARY_MATERIALS_BUTTON_TOP = SUMMARY_MATERIALS_CARD_TOP + 152;
const SUMMARY_MATERIALS_BUTTON_WIDTH = 312;
const SUMMARY_MATERIALS_BUTTON_HEIGHT = 58;
const SUMMARY_MATERIALS_BUTTON_GAP = 14;

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
};

type ProposalMediaLink = {
  label: string;
  url: string;
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
        padding: `${FRAME_PADDING_TOP}px ${FRAME_PADDING_X}px`,
        fontFamily: 'Manrope',
      }}
    >
      {children}
    </div>
  );
}

function PageHeader({
  eyebrow,
  title,
  subtitle,
  rightLabel,
  rightValue,
  height,
  titleSize = 58,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  rightLabel?: string;
  rightValue?: string;
  height: number;
  titleSize?: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        height,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: rightValue ? 760 : '100%',
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
          {eyebrow}
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 18,
            color: '#F8FAFC',
            fontSize: titleSize,
            fontWeight: 700,
            lineHeight: 1.04,
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              display: 'flex',
              marginTop: 14,
              color: 'rgba(226, 232, 240, 0.82)',
              fontSize: 24,
              fontWeight: 500,
              lineHeight: 1.3,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>

      {rightValue ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            width: 240,
          }}
        >
          {rightLabel ? (
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
          ) : null}
          <div
            style={{
              display: 'flex',
              marginTop: 12,
              width: '100%',
              justifyContent: 'center',
              borderRadius: 999,
              border: '1px solid rgba(148, 163, 184, 0.18)',
              background: 'rgba(255, 255, 255, 0.06)',
              padding: '14px 18px',
              color: '#F8FAFC',
              fontSize: 21,
              fontWeight: 700,
              lineHeight: 1.2,
              textAlign: 'center',
            }}
          >
            {rightValue}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Card({
  children,
  width,
  height,
  accent = false,
}: {
  children: ReactNode;
  width?: number;
  height?: number;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 32,
        border: accent
          ? '1px solid rgba(125, 211, 252, 0.18)'
          : '1px solid rgba(255, 255, 255, 0.08)',
        background: accent ? '#172230' : 'rgba(255, 255, 255, 0.04)',
        padding: 24,
        overflow: 'hidden',
        ...(width ? { width } : {}),
        ...(height ? { height } : {}),
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
  width = 338,
}: ListingProposalFact & { width?: number }) {
  const palette = getTonePalette(tone);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width,
        minHeight: 120,
        borderRadius: 22,
        border: `1px solid ${palette.border}`,
        background: palette.background,
        padding: '18px 20px',
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
          marginTop: 12,
          color: palette.text,
          fontSize: 28,
          fontWeight: 700,
          lineHeight: 1.2,
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

function MediaLink({ label }: { label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        border: '1px solid rgba(125, 211, 252, 0.18)',
        background: 'rgba(125, 211, 252, 0.08)',
        height: SUMMARY_MATERIALS_BUTTON_HEIGHT,
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
    <Card width={540} height={588}>
      <div
        style={{
          display: 'flex',
          height: 492,
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
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {image.label}
      </div>
    </Card>
  );
}

function SummaryPage({
  summary,
  heroImageDataUrl,
  galleryCount,
  mediaLinks,
}: {
  summary: ReturnType<typeof buildListingProposalSummary>;
  heroImageDataUrl?: string;
  galleryCount: number;
  mediaLinks: ProposalMediaLink[];
}) {
  const overviewFacts = [
    summary.facts[0],
    summary.facts[2],
    summary.facts[4],
    summary.facts[5],
  ].filter(Boolean);
  const mileageFact = summary.facts.find((fact) => fact.label === 'Пробег');
  const bodyTypeFact = summary.facts.find((fact) => fact.label === 'Кузов');

  return (
    <PageFrame>
      <PageHeader
        eyebrow="Автомобиль в продаже"
        title={summary.subtitle}
        subtitle={summary.title}
        rightLabel="Дата"
        rightValue={summary.generatedAtLabel}
        height={SUMMARY_HEADER_HEIGHT}
      />

      <div
        style={{
          display: 'flex',
          gap: 24,
          marginTop: 30,
        }}
      >
        <Card width={SUMMARY_LEFT_CARD_WIDTH} height={752}>
          <div
            style={{
              display: 'flex',
              height: 468,
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
                fontSize: 42,
                fontWeight: 700,
                lineHeight: 1.08,
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
              {bodyTypeFact?.value ? <MetaChip>{bodyTypeFact.value}</MetaChip> : null}
              {mileageFact?.value ? <MetaChip>{mileageFact.value}</MetaChip> : null}
            </div>
          </div>
        </Card>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            width: SUMMARY_RIGHT_COLUMN_WIDTH,
          }}
        >
          <Card width={SUMMARY_RIGHT_COLUMN_WIDTH} height={SUMMARY_PRICE_CARD_HEIGHT} accent>
            <SectionTitle>Цена по объявлению</SectionTitle>
            <div
              style={{
                display: 'flex',
                marginTop: 18,
                color: '#F8FAFC',
                fontSize: 44,
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

          <Card width={SUMMARY_RIGHT_COLUMN_WIDTH} height={SUMMARY_FACTS_CARD_HEIGHT}>
            <SectionTitle>Основные данные</SectionTitle>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                marginTop: 18,
              }}
            >
              {overviewFacts.map((fact) => (
                <KeyValue key={fact.label} label={fact.label} value={fact.value} />
              ))}
            </div>
          </Card>

          <Card width={SUMMARY_RIGHT_COLUMN_WIDTH} height={276}>
            <SectionTitle>Материалы</SectionTitle>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                marginTop: 18,
              }}
            >
              <KeyValue label="Фотографии" value={`${galleryCount}`} />
              {mediaLinks.length ? (
                mediaLinks.map((mediaLink) => (
                  <MediaLink key={mediaLink.label} label={mediaLink.label} />
                ))
              ) : (
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
              )}
            </div>
          </Card>
        </div>
      </div>
    </PageFrame>
  );
}

function DetailsPage({
  summary,
}: {
  summary: ReturnType<typeof buildListingProposalSummary>;
}) {
  return (
    <PageFrame>
      <PageHeader
        eyebrow="Описание автомобиля"
        title={summary.title}
        subtitle="Ключевые данные по состоянию, комплектации и истории эксплуатации."
        rightLabel="Город осмотра"
        rightValue={summary.locationLabel}
        height={188}
        titleSize={50}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          marginTop: 30,
        }}
      >
        <Card height={304}>
          <SectionTitle>Описание</SectionTitle>
          <div
            style={{
              display: 'flex',
              marginTop: 18,
              color: '#F8FAFC',
              fontSize: 34,
              fontWeight: 700,
              lineHeight: 1.28,
            }}
          >
            {summary.lead}
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 18,
              color: '#CBD5E1',
              fontSize: 24,
              fontWeight: 500,
              lineHeight: 1.42,
            }}
          >
            {summary.description}
          </div>
        </Card>

        <Card height={156} accent>
          <SectionTitle>Преимущества</SectionTitle>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              marginTop: 20,
            }}
          >
            {summary.highlights.map((highlight) => (
              <MetaChip key={highlight}>{highlight}</MetaChip>
            ))}
          </div>
        </Card>

        <Card height={742}>
          <SectionTitle>Ключевые параметры</SectionTitle>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              marginTop: 22,
            }}
          >
            {summary.facts.map((fact) => (
              <FactRow
                key={fact.label}
                label={fact.label}
                value={fact.value}
                tone={fact.tone}
              />
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 22,
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
      <PageHeader
        eyebrow="Фотографии автомобиля"
        title={title}
        subtitle="Все доступные фотографии по объявлению."
        rightLabel="Страница"
        rightValue={`${pageIndex + 1} / ${pageCount}`}
        height={184}
        titleSize={52}
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
          <GalleryImageCard key={`${image.label}-${image.dataUrl.slice(0, 24)}`} image={image} />
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
      } satisfies LoadedProposalImage;
    })
  );

  return loadedImages.filter((image): image is LoadedProposalImage => Boolean(image));
}

async function renderProposalPage(page: ReactElement, fonts: LoadedProposalFonts) {
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

  const mediaLinks: ProposalMediaLink[] = [];
  const absoluteVideoUrl = toAbsoluteOptionalUrl(listing.videoUrl, options.origin);
  const absoluteReportUrl = toAbsoluteOptionalUrl(listing.reportUrl, options.origin);

  if (absoluteVideoUrl) {
    mediaLinks.push({ label: 'Открыть видео', url: absoluteVideoUrl });
  }

  if (absoluteReportUrl) {
    mediaLinks.push({ label: 'Открыть VIN-отчёт', url: absoluteReportUrl });
  }

  const galleryCount = collectListingProposalGalleryImages(listing).length;
  const summaryPageBytes = await renderProposalPage(
    <SummaryPage
      summary={summary}
      heroImageDataUrl={loadedGalleryImages[0]?.dataUrl}
      galleryCount={galleryCount}
      mediaLinks={mediaLinks}
    />,
    fonts
  );
  const detailsPageBytes = await renderProposalPage(<DetailsPage summary={summary} />, fonts);

  const pdfDocument = await PDFDocument.create();
  pdfDocument.setTitle(summary.title);
  pdfDocument.setSubject('Коммерческое предложение по автомобилю');
  pdfDocument.setCreator('PDF generator');
  pdfDocument.setProducer('PDF generator');
  pdfDocument.setCreationDate(generatedAt);

  const summaryPage = await appendPngPage(pdfDocument, summaryPageBytes);

  mediaLinks.forEach((mediaLink, index) => {
    addUriLinkAnnotation(
      pdfDocument,
      summaryPage,
      {
        x: SUMMARY_MATERIALS_BUTTON_X,
        yTop:
          SUMMARY_MATERIALS_BUTTON_TOP +
          index * (SUMMARY_MATERIALS_BUTTON_HEIGHT + SUMMARY_MATERIALS_BUTTON_GAP),
        width: SUMMARY_MATERIALS_BUTTON_WIDTH,
        height: SUMMARY_MATERIALS_BUTTON_HEIGHT,
      },
      mediaLink.url
    );
  });

  await appendPngPage(pdfDocument, detailsPageBytes);

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
