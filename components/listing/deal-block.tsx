'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { CheckCircle, FileText, MapPin, MessageCircle, Phone, Shield } from 'lucide-react';
import { ListingBenefitBadge } from '@/components/marketplace/listing-benefit-badge';
import { Button } from '@/components/ui/button';
import type { SaleListing } from '@/lib/types';
import { formatPrice } from '@/lib/marketplace-data';
import { cn } from '@/lib/utils';

const MOBILE_DEAL_BLOCK_BOTTOM_BUFFER_PX = 260;

function normalizePhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('8') && digits.length === 11) return `7${digits.slice(1)}`;
  if (digits.length === 10) return `7${digits}`;
  return digits;
}

function getContactHref(contact: string): string {
  const trimmed = contact.trim();
  if (trimmed.startsWith('tg/@')) return `https://t.me/${trimmed.slice(4)}`;
  if (trimmed.startsWith('@')) return `https://t.me/${trimmed.slice(1)}`;
  return `tel:${trimmed.replace(/\D/g, '')}`;
}

function isMessengerContact(contact: string): boolean {
  const trimmed = contact.trim();
  return trimmed.startsWith('@') || trimmed.startsWith('tg/@');
}

const SELLER_LABELS: Record<string, string> = {
  owner: 'Собственник',
  flip: 'Перепродажа',
  broker: 'Подбор',
  commission: 'Комиссия',
};

const RESOURCE_LABELS: Record<string, string> = {
  not_listed: 'Не на ресурсах',
  on_resources: 'На ресурсах',
  pre_resources: 'До ресурсов',
};

const RESOURCE_COLORS: Record<string, string> = {
  not_listed: 'text-muted-foreground',
  on_resources: 'text-teal-accent',
  pre_resources: 'text-warning',
};

const RESOURCE_BADGE_STYLES: Record<string, string> = {
  not_listed: 'border-border/70 bg-background/70 text-muted-foreground dark:bg-background/10',
  on_resources: 'border-teal-accent/20 bg-[var(--accent-bg-soft)] text-teal-accent',
  pre_resources: 'border-warning/25 bg-warning/10 text-warning',
};

interface DealBlockProps {
  listing: SaleListing;
  className?: string;
}

export function DealBlock({ listing, className }: DealBlockProps) {
  const [showPhone, setShowPhone] = useState(false);
  const [hideMobileDealBlock, setHideMobileDealBlock] = useState(false);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    function updateMobileDealBlockVisibility() {
      const viewportBottom = window.scrollY + window.innerHeight;
      const documentBottom = document.documentElement.scrollHeight;
      const distanceToBottom = documentBottom - viewportBottom;

      setHideMobileDealBlock(distanceToBottom <= MOBILE_DEAL_BLOCK_BOTTOM_BUFFER_PX);
    }

    function scheduleUpdate() {
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = window.requestAnimationFrame(() => {
        rafIdRef.current = null;
        updateMobileDealBlockVisibility();
      });
    }

    scheduleUpdate();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
      }

      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, []);

  const legalClean =
    listing.ptsOriginal &&
    !listing.accident &&
    (listing.avtotekaStatus === 'green' || !listing.avtotekaStatus);

  const sellerLabel = SELLER_LABELS[listing.sellerType] ?? listing.sellerType;
  const resourceLabel = RESOURCE_LABELS[listing.resourceStatus] ?? listing.resourceStatus;
  const resourceColor = RESOURCE_COLORS[listing.resourceStatus] ?? 'text-muted-foreground';
  const resourceBadgeStyle =
    RESOURCE_BADGE_STYLES[listing.resourceStatus] ?? RESOURCE_BADGE_STYLES.not_listed;
  const priceInHandLabel =
    listing.priceInHand != null ? formatPrice(listing.priceInHand) : 'Не указано';
  const priceOnResourcesLabel =
    listing.priceOnResources != null ? formatPrice(listing.priceOnResources) : 'Не указано';
  const sellerProfileHref = `/seller/${listing.seller.id}`;

  const actionButtons = (
    <>
      {listing.seller.phone ? (
        showPhone ? (
          <>
            <Button
              className="h-11 w-full rounded-2xl bg-teal-dark font-semibold text-white shadow-[0_12px_24px_rgba(13,148,136,0.22)] hover:opacity-90 dark:bg-teal-accent dark:text-[#070809]"
              asChild
            >
              <a
                href={getContactHref(listing.seller.phone)}
                target={isMessengerContact(listing.seller.phone) ? '_blank' : undefined}
                rel={isMessengerContact(listing.seller.phone) ? 'noopener noreferrer' : undefined}
              >
                {isMessengerContact(listing.seller.phone) ? (
                  <MessageCircle className="mr-2 h-4 w-4" />
                ) : (
                  <Phone className="mr-2 h-4 w-4" />
                )}
                {listing.seller.phone}
              </a>
            </Button>
            {!isMessengerContact(listing.seller.phone) ? (
              <Button
                variant="outline"
                className="h-11 w-full rounded-2xl border-border/80 bg-background/70 dark:bg-background/10"
                asChild
              >
                <a
                  href={`https://wa.me/${normalizePhoneForWhatsApp(listing.seller.phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Написать в мессенджер
                </a>
              </Button>
            ) : null}
          </>
        ) : (
          <Button
            className="h-11 w-full rounded-2xl bg-teal-dark font-semibold text-white shadow-[0_12px_24px_rgba(13,148,136,0.22)] hover:opacity-90 dark:bg-teal-accent dark:text-[#070809]"
            onClick={() => setShowPhone(true)}
          >
            <Phone className="mr-2 h-4 w-4" />
            Показать контакт
          </Button>
        )
      ) : (
        <Button className="h-11 w-full rounded-2xl" disabled>
          <Phone className="mr-2 h-4 w-4" />
          Контакт не указан
        </Button>
      )}
      {listing.reportUrl ? (
        <Button
          variant="outline"
          className="h-11 w-full rounded-2xl border-border/80 bg-background/70 dark:bg-background/10"
          asChild
        >
          <a href={listing.reportUrl} target="_blank" rel="noopener noreferrer">
            <FileText className="mr-2 h-4 w-4" />
            Отчёт / VIN
          </a>
        </Button>
      ) : null}
    </>
  );

  const sellerProfileLink = (
    <Link
      href={sellerProfileHref}
      className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-xs text-muted-foreground transition-colors hover:border-teal-accent/35 hover:text-foreground dark:bg-background/10"
      aria-label={`Открыть профиль продавца ${listing.seller.name}`}
    >
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Профиль продавца
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-foreground">{listing.seller.name}</p>
      </div>
      {listing.seller.verified ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-success/20 bg-success/10 px-2.5 py-1 font-medium text-success">
          <CheckCircle className="h-3 w-3" />
          Верифицирован
        </span>
      ) : null}
    </Link>
  );

  return (
    <>
      <div className={cn('hidden lg:sticky lg:top-20 lg:block', className)}>
        <div className="overflow-hidden rounded-[28px] border border-border/70 bg-card/92 shadow-[0_18px_45px_rgba(15,23,42,0.14)] dark:bg-surface-elevated/92">
          <div
            className="h-px bg-gradient-to-r from-transparent via-teal-accent/60 to-transparent"
            aria-hidden="true"
          />
          <div className="p-5">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-foreground dark:bg-background/10">
                {sellerLabel}
              </span>
              <span
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium',
                  resourceBadgeStyle
                )}
              >
                {resourceLabel}
              </span>
            </div>

            <div className="mt-4 overflow-hidden rounded-[24px] border border-border/70 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_40%),linear-gradient(180deg,rgba(15,23,42,0.08),rgba(15,23,42,0))] p-4 dark:bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.16),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Цена сделки
                  </p>
                  <div className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-foreground">
                    {formatPrice(listing.price)}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-background/75 px-3 py-3 dark:bg-background/10">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    В руки
                  </p>
                  <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
                    {priceInHandLabel}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/75 px-3 py-3 dark:bg-background/10">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    На ресурсах
                  </p>
                  <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
                    {priceOnResourcesLabel}
                  </p>
                </div>
              </div>
              {listing.potentialBenefit ? (
                <div className="mt-3">
                  <ListingBenefitBadge amount={listing.potentialBenefit} variant="detail" />
                </div>
              ) : null}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-background/65 px-3 py-3 dark:bg-background/10">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-teal-accent" />
                  Осмотр
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">{listing.city}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/65 px-3 py-3 dark:bg-background/10">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <Shield className="h-3.5 w-3.5 text-teal-accent" />
                  Юр. чистота
                </div>
                <p
                  className={cn(
                    'mt-2 flex items-center gap-1.5 text-sm font-semibold',
                    legalClean ? 'text-success' : 'text-foreground'
                  )}
                >
                  {legalClean ? <CheckCircle className="h-3.5 w-3.5" /> : null}
                  {legalClean ? 'Чисто' : 'Уточнить'}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-[24px] border border-border/70 bg-background/70 p-4 dark:bg-background/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Связь по лоту</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {showPhone
                      ? 'Контакт уже раскрыт, можно звонить или писать сразу.'
                      : 'Откройте контакт и перейдите к прямой коммуникации без лишних шагов.'}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/80 p-2 text-teal-accent dark:bg-surface-elevated/80">
                  <Phone className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-4 space-y-2">{actionButtons}</div>
            </div>

            <div className="mt-4">{sellerProfileLink}</div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/96 px-4 py-3 shadow-[0_-12px_30px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all duration-200 lg:hidden',
          hideMobileDealBlock
            ? 'pointer-events-none translate-y-6 opacity-0'
            : 'pointer-events-auto translate-y-0 opacity-100',
          className
        )}
        data-mobile-deal-block="true"
        data-hidden-near-bottom={hideMobileDealBlock ? 'true' : 'false'}
      >
        <div className="mx-auto max-w-7xl rounded-[24px] border border-border/70 bg-card/90 p-3 shadow-[0_10px_24px_rgba(0,0,0,0.16)] dark:bg-surface-elevated/90">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-lg font-semibold tabular-nums text-foreground">
                  {formatPrice(listing.price)}
                </div>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span>{sellerLabel}</span>
                <span className={resourceColor}>{resourceLabel}</span>
                <span>{listing.city}</span>
              </div>
              {listing.potentialBenefit ? (
                <div className="mt-2">
                  <ListingBenefitBadge amount={listing.potentialBenefit} variant="detail" />
                </div>
              ) : null}
            </div>
          </div>
          <div className="mt-3 space-y-2">{actionButtons}</div>
          <div className="mt-3">{sellerProfileLink}</div>
        </div>
      </div>
    </>
  );
}
