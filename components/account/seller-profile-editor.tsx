'use client';

import { type CSSProperties, type PropsWithChildren, useEffect, useState } from 'react';
import type { SellerProfile } from '@/lib/types';
import { buildSellerProfileAboutText, buildSellerProfileImageStyles, buildSellerProfileInitials } from '@/lib/seller-profile';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface SellerProfileEditorProps extends PropsWithChildren {
  sellerProfile?: SellerProfile | null;
  onSaved?: (sellerProfile: SellerProfile) => void;
}

interface SellerProfileFormState {
  name: string;
  phone: string;
  about: string;
  avatarCropX: number;
  avatarCropY: number;
  avatarZoom: number;
  coverCropX: number;
  coverCropY: number;
}

function createInitialState(sellerProfile?: SellerProfile | null): SellerProfileFormState {
  return {
    name: sellerProfile?.name ?? '',
    phone: sellerProfile?.phone ?? '',
    about: sellerProfile?.about ?? '',
    avatarCropX: sellerProfile?.avatarCropX ?? 50,
    avatarCropY: sellerProfile?.avatarCropY ?? 50,
    avatarZoom: sellerProfile?.avatarZoom ?? 1,
    coverCropX: sellerProfile?.coverCropX ?? 50,
    coverCropY: sellerProfile?.coverCropY ?? 50,
  };
}

function FilePreview({
  src,
  alt,
  className,
  style,
}: {
  src?: string;
  alt: string;
  className: string;
  style?: CSSProperties;
}) {
  if (!src) {
    return null;
  }

  return <img src={src} alt={alt} className={className} style={style} />;
}

export function SellerProfileEditor({ sellerProfile, onSaved, children }: SellerProfileEditorProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<SellerProfileFormState>(() => createInitialState(sellerProfile));
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | undefined>(sellerProfile?.avatarUrl);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | undefined>(sellerProfile?.coverUrl);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm(createInitialState(sellerProfile));
      setAvatarFile(null);
      setCoverFile(null);
      setAvatarPreviewUrl(sellerProfile?.avatarUrl);
      setCoverPreviewUrl(sellerProfile?.coverUrl);
      setError(null);
    }
  }, [open, sellerProfile]);

  function updateField<K extends keyof SellerProfileFormState>(field: K, value: SellerProfileFormState[K]) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updatePreviewUrl(file: File | null, currentUrl: string | undefined, setUrl: (value: string | undefined) => void) {
    if (!file) {
      setUrl(currentUrl);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
  }

  async function handleSubmit() {
    try {
      setSaving(true);
      setError(null);

      const payload = new FormData();
      payload.set('name', form.name);
      payload.set('phone', form.phone);
      payload.set('about', form.about);
      payload.set('avatarCropX', String(form.avatarCropX));
      payload.set('avatarCropY', String(form.avatarCropY));
      payload.set('avatarZoom', String(form.avatarZoom));
      payload.set('coverCropX', String(form.coverCropX));
      payload.set('coverCropY', String(form.coverCropY));

      if (avatarFile) {
        payload.set('avatar', avatarFile);
      }

      if (coverFile) {
        payload.set('cover', coverFile);
      }

      const response = await fetch('/api/account/seller-profile', {
        method: 'PUT',
        body: payload,
      });
      const result = (await response.json()) as { error?: string; sellerProfile?: SellerProfile };

      if (!response.ok || !result.sellerProfile) {
        throw new Error(result.error || 'Не удалось сохранить профиль продавца.');
      }

      onSaved?.(result.sellerProfile);
      setOpen(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось сохранить профиль продавца.');
    } finally {
      setSaving(false);
    }
  }

  const avatarStyle = buildSellerProfileImageStyles({
    cropX: form.avatarCropX,
    cropY: form.avatarCropY,
    zoom: form.avatarZoom,
  });
  const coverStyle = buildSellerProfileImageStyles({
    cropX: form.coverCropX,
    cropY: form.coverCropY,
  });
  const aboutPreview = buildSellerProfileAboutText({
    about: form.about,
    name: form.name || sellerProfile?.name || 'Профиль продавца',
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex max-h-[min(92vh,960px)] w-[min(1120px,calc(100vw-2rem))] max-w-none flex-col overflow-hidden border-border/70 bg-card p-0 shadow-[0_28px_80px_rgba(0,0,0,0.32)]">
        <DialogHeader className="shrink-0 border-b border-border/70 px-5 py-5 sm:px-6">
          <DialogTitle>Редактировать профиль</DialogTitle>
          <DialogDescription>
            Что попадет в круг аватара, то же будет показано и на публичной странице продавца.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="seller-profile-name">Имя</Label>
                <Input
                  id="seller-profile-name"
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="seller-profile-phone">Телефон</Label>
                <Input
                  id="seller-profile-phone"
                  value={form.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="seller-profile-about">Кратко о себе</Label>
                <Textarea
                  id="seller-profile-about"
                  value={form.about}
                  onChange={(event) => updateField('about', event.target.value)}
                  rows={5}
                />
              </div>

              <div className="grid gap-4 rounded-3xl border border-border/70 bg-background/60 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Аватар</p>
                    <p className="text-xs text-muted-foreground">
                      Загрузите фото и выставьте область, которая попадет в круг.
                    </p>
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setAvatarFile(file);
                      updatePreviewUrl(file, sellerProfile?.avatarUrl, setAvatarPreviewUrl);
                    }}
                    className="w-full sm:max-w-[220px]"
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="avatar-crop-x">Позиция X</Label>
                    <Input
                      id="avatar-crop-x"
                      type="range"
                      min="0"
                      max="100"
                      value={String(form.avatarCropX)}
                      onChange={(event) => updateField('avatarCropX', Number(event.target.value))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="avatar-crop-y">Позиция Y</Label>
                    <Input
                      id="avatar-crop-y"
                      type="range"
                      min="0"
                      max="100"
                      value={String(form.avatarCropY)}
                      onChange={(event) => updateField('avatarCropY', Number(event.target.value))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="avatar-zoom">Масштаб</Label>
                    <Input
                      id="avatar-zoom"
                      type="range"
                      min="1"
                      max="2.5"
                      step="0.05"
                      value={String(form.avatarZoom)}
                      onChange={(event) => updateField('avatarZoom', Number(event.target.value))}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 rounded-3xl border border-border/70 bg-background/60 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Обложка</p>
                    <p className="text-xs text-muted-foreground">
                      Выберите акцентную часть изображения для hero-шапки.
                    </p>
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setCoverFile(file);
                      updatePreviewUrl(file, sellerProfile?.coverUrl, setCoverPreviewUrl);
                    }}
                    className="w-full sm:max-w-[220px]"
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="cover-crop-x">Позиция X</Label>
                    <Input
                      id="cover-crop-x"
                      type="range"
                      min="0"
                      max="100"
                      value={String(form.coverCropX)}
                      onChange={(event) => updateField('coverCropX', Number(event.target.value))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cover-crop-y">Позиция Y</Label>
                    <Input
                      id="cover-crop-y"
                      type="range"
                      min="0"
                      max="100"
                      value={String(form.coverCropY)}
                      onChange={(event) => updateField('coverCropY', Number(event.target.value))}
                    />
                  </div>
                </div>
              </div>

              {error ? (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}
            </div>
          </div>

          <aside className="hidden min-h-0 border-t border-border/70 bg-background/35 px-5 py-5 lg:block lg:overflow-y-auto lg:border-t-0 lg:border-l lg:px-6">
            <div className="grid gap-4 lg:sticky lg:top-0">
              <div className="overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-[0_14px_36px_rgba(15,23,42,0.08)]">
                <div className="relative h-44 overflow-hidden bg-[linear-gradient(135deg,#163435_0%,#2D5A5A_44%,#5C9E99_100%)]">
                  <FilePreview
                    src={coverPreviewUrl}
                    alt="Предпросмотр обложки"
                    className="h-full w-full object-cover"
                    style={coverStyle}
                  />
                  <div
                    className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,18,22,0.12),rgba(15,18,22,0.5))]"
                    aria-hidden="true"
                  />
                </div>
                <div className="relative px-5 pb-5">
                  <div className="-mt-10 flex items-end gap-4">
                    <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-[4px] border-white bg-[linear-gradient(135deg,rgba(129,216,208,0.28),rgba(45,90,90,0.9))] text-xl font-semibold text-white shadow-[0_18px_36px_rgba(15,23,42,0.16)]">
                      {avatarPreviewUrl ? (
                        <FilePreview
                          src={avatarPreviewUrl}
                          alt="Предпросмотр аватара"
                          className="h-full w-full object-cover"
                          style={avatarStyle}
                        />
                      ) : (
                        buildSellerProfileInitials(form.name || sellerProfile?.name || 'SP')
                      )}
                    </div>
                    <div className="pb-1">
                      <p className="text-sm font-semibold text-foreground">{form.name || 'Имя продавца'}</p>
                      {form.phone ? <p className="mt-1 text-xs text-muted-foreground">{form.phone}</p> : null}
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">{aboutPreview}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <DialogFooter className="shrink-0 border-t border-border/70 px-5 py-4 sm:px-6">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Отмена
          </Button>
          <Button
            type="button"
            className="bg-teal-dark text-white hover:bg-teal-medium"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Сохраняем…' : 'Сохранить профиль'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
