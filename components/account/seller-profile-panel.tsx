'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { SellerProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { buildSellerProfileAboutText, buildSellerProfileImageStyles, buildSellerProfileInitials } from '@/lib/seller-profile';
import { SellerProfileEditor } from './seller-profile-editor';

interface AccountSellerProfilePanelProps {
  sellerProfile?: SellerProfile | null;
}

function AvatarPreview({ sellerProfile }: { sellerProfile?: SellerProfile | null }) {
  const avatarStyle = buildSellerProfileImageStyles({
    cropX: sellerProfile?.avatarCropX,
    cropY: sellerProfile?.avatarCropY,
    zoom: sellerProfile?.avatarZoom,
  });

  if (sellerProfile?.avatarUrl) {
    return (
      <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-background shadow-[0_16px_32px_rgba(15,23,42,0.16)]">
        <Image
          src={sellerProfile.avatarUrl}
          alt={sellerProfile.name}
          fill
          unoptimized
          className="object-cover"
          style={avatarStyle}
        />
      </div>
    );
  }

  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-[linear-gradient(135deg,rgba(129,216,208,0.24),rgba(45,90,90,0.9))] text-lg font-semibold text-white shadow-[0_16px_32px_rgba(15,23,42,0.16)]">
      {buildSellerProfileInitials(sellerProfile?.name ?? 'Seller Profile')}
    </div>
  );
}

export function AccountSellerProfilePanel({ sellerProfile }: AccountSellerProfilePanelProps) {
  const [profile, setProfile] = useState<SellerProfile | null | undefined>(sellerProfile);
  const about = buildSellerProfileAboutText({
    about: profile?.about,
    name: profile?.name ?? 'Профиль продавца',
  });
  const coverStyle = buildSellerProfileImageStyles({
    cropX: profile?.coverCropX,
    cropY: profile?.coverCropY,
  });

  return (
    <section className="overflow-hidden rounded-[32px] border border-border/70 bg-card shadow-[0_20px_48px_rgba(15,23,42,0.08)]">
      <div className="relative h-36 overflow-hidden bg-[linear-gradient(135deg,#163435_0%,#2D5A5A_44%,#5C9E99_100%)] sm:h-44">
        {profile?.coverUrl ? (
          <Image
            src={profile.coverUrl}
            alt={profile.name}
            fill
            unoptimized
            className="object-cover"
            style={coverStyle}
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,18,22,0.12),rgba(15,18,22,0.44))]" aria-hidden="true" />
      </div>

      <div className="relative px-6 pb-6">
        <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <AvatarPreview sellerProfile={profile} />
            <div className="pb-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Профиль продавца</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                {profile?.name ?? 'Заполните профиль продавца'}
              </h2>
            </div>
          </div>
          <SellerProfileEditor sellerProfile={profile} onSaved={setProfile}>
            <Button className="bg-teal-dark text-white hover:bg-teal-medium">Редактировать профиль</Button>
          </SellerProfileEditor>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {profile?.verified ? (
            <span className="rounded-full border border-success/20 bg-success/10 px-3 py-1 text-xs font-medium text-success">
              Проверенный продавец
            </span>
          ) : null}
          {profile?.phone ? (
            <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
              {profile.phone}
            </span>
          ) : null}
          {profile?.onPlatformSince ? (
            <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
              На платформе с {profile.onPlatformSince}
            </span>
          ) : null}
        </div>

        <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">{about}</p>
      </div>
    </section>
  );
}
