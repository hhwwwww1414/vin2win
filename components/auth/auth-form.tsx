'use client';

import { startTransition, useId, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { PasswordField } from '@/components/auth/password-field';
import { MarketplaceHeader } from '@/components/marketplace/header';
import { TelegramLoginButton } from '@/components/auth/telegram-login-button';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Mode = 'login' | 'register';

const inputClass =
  'w-full rounded-2xl border border-border/80 bg-background/75 px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-teal-accent/60 focus:ring-2 focus:ring-teal-accent/30 dark:bg-background/10';

const LEGAL_ACCEPTANCE_ERROR = 'Подтвердите согласие с политикой конфиденциальности и пользовательским соглашением.';

function parseString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fieldId = useId();

  const nextPath = searchParams.get('next') || '/account';
  const alternateHref =
    mode === 'login'
      ? `/register?next=${encodeURIComponent(nextPath)}`
      : `/login?next=${encodeURIComponent(nextPath)}`;
  const isRegister = mode === 'register';

  const submit = async () => {
    setError(null);

    if (isRegister && !acceptedLegal) {
      setError(LEGAL_ACCEPTANCE_ERROR);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        mode === 'login' ? '/api/auth/login' : '/api/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            phone,
            email,
            password,
            acceptedLegal,
            nextPath,
          }),
        }
      );

      const payload = (await response.json().catch(() => null)) as
        | {
            error?: string;
            nextPath?: string;
          }
        | null;

      if (!response.ok) {
        throw new Error(parseString(payload?.error) || 'Authentication failed.');
      }

      startTransition(() => {
        router.push(parseString(payload?.nextPath) || '/account');
        router.refresh();
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Authentication failed.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const introCards = [
    {
      title: 'Личный кабинет',
      description: 'объявления, запросы и рабочие сценарии закреплены за вашим аккаунтом',
    },
    {
      title: 'Роли и модерация',
      description: 'единая точка входа для пользователя, модератора и администратора',
    },
    {
      title: 'B2B-контур',
      description: 'карточки и коммуникация остаются в профессиональном контексте рынка',
    },
  ];

  const introSection = (
    <div>
      <div className="inline-flex items-center gap-2 rounded-full border border-teal-accent/20 bg-[var(--accent-bg-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-accent">
        <ShieldCheck className="h-3.5 w-3.5" />
        Secure access
      </div>
      <h1 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.7rem] lg:leading-[1.05]">
        {mode === 'login'
          ? 'Вход в рабочий кабинет vin2win'
          : 'Регистрация профессионального аккаунта vin2win'}
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
        {mode === 'login'
          ? 'Войдите в кабинет, чтобы публиковать объявления, вести запросы на подбор и работать с marketplace-инструментами без розничного шума.'
          : 'После регистрации вы получите личный кабинет, привязанный seller profile и базовый пользовательский доступ к рабочим сценариям платформы.'}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground dark:bg-background/10">
          Email + пароль
        </span>
        <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground dark:bg-background/10">
          Telegram login
        </span>
        <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground dark:bg-background/10">
          Role-aware access
        </span>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
        {introCards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-border/70 bg-background/70 p-4 backdrop-blur dark:bg-background/10"
          >
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <Sparkles className="h-4 w-4 text-teal-accent" />
              {card.title}
            </div>
            <p className="mt-3 text-sm leading-6 text-foreground">{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const legalConsentBlock = (
    <div
      className={cn(
        'rounded-[24px] border border-border/70 bg-background/60 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] dark:bg-background/10',
        isRegister && error === LEGAL_ACCEPTANCE_ERROR && 'border-destructive/40 bg-destructive/5'
      )}
    >
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-teal-accent" />
        {mode === 'login' ? 'Согласие для Telegram' : 'Согласие с документами'}
      </div>
      <label htmlFor={`${fieldId}-legal`} className="flex items-start gap-3">
        <input
          id={`${fieldId}-legal`}
          type="checkbox"
          checked={acceptedLegal}
          onChange={(event) => {
            setAcceptedLegal(event.target.checked);
            if (event.target.checked && error === LEGAL_ACCEPTANCE_ERROR) {
              setError(null);
            }
          }}
          className="mt-1 h-4 w-4 rounded border-border/80 text-teal-accent focus:ring-2 focus:ring-teal-accent/30"
        />
        <span className="text-sm leading-6 text-foreground">
          Я принимаю{' '}
          <Link href="/privacy-policy" className="font-medium text-teal-accent transition-opacity hover:opacity-80">
            политику конфиденциальности
          </Link>{' '}
          и{' '}
          <Link href="/user-agreement" className="font-medium text-teal-accent transition-opacity hover:opacity-80">
            пользовательское соглашение
          </Link>
          .
        </span>
      </label>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        {mode === 'login' ? 'Нужно только для входа через Telegram.' : 'Обязательное подтверждение для создания аккаунта.'}
      </p>
    </div>
  );

  const formSection = (
    <section className="rounded-[28px] border border-border/70 bg-background/80 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.14)] backdrop-blur dark:bg-background/10 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            {mode === 'login' ? 'Вход' : 'Создание аккаунта'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === 'login'
              ? 'Используйте email и пароль, чтобы продолжить.'
              : 'Заполните профиль и сразу получите рабочий кабинет.'}
          </p>
        </div>
        <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground dark:bg-background/10">
          {mode === 'login' ? 'Secure login' : 'Onboarding'}
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {isRegister ? (
          <>
            <label htmlFor={`${fieldId}-name`} className="block space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Имя</span>
              <input
                id={`${fieldId}-name`}
                className={inputClass}
                autoComplete="name"
                suppressHydrationWarning
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Иван Петров"
              />
            </label>
            <label htmlFor={`${fieldId}-phone`} className="block space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">Телефон</span>
              <input
                id={`${fieldId}-phone`}
                type="tel"
                className={inputClass}
                autoComplete="tel"
                suppressHydrationWarning
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+7 999 123-45-67"
              />
            </label>
          </>
        ) : null}

        <label htmlFor={`${fieldId}-email`} className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Email</span>
          <input
            id={`${fieldId}-email`}
            type="email"
            className={inputClass}
            autoComplete="email"
            suppressHydrationWarning
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@vin2win.ru"
          />
        </label>

        <label htmlFor={`${fieldId}-password`} className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Пароль</span>
          <PasswordField
            id={`${fieldId}-password`}
            className={inputClass}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            suppressHydrationWarning
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            visible={passwordVisible}
            onToggleVisibility={() => setPasswordVisible((current) => !current)}
            placeholder="Не менее 7 символов"
          />
        </label>

        {isRegister ? legalConsentBlock : null}

        {mode === 'login' ? (
          <div className="text-right">
            <Link
              href="mailto:admin@vin2win.ru?subject=%D0%92%D0%BE%D1%81%D1%81%D1%82%D0%B0%D0%BD%D0%BE%D0%B2%D0%BB%D0%B5%D0%BD%D0%B8%D0%B5%20%D0%BF%D0%B0%D1%80%D0%BE%D0%BB%D1%8F"
              className="text-sm font-medium text-teal-accent transition-opacity hover:opacity-80"
            >
              Забыли пароль?
            </Link>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <Button
          type="button"
          disabled={isSubmitting}
          onClick={submit}
          className={cn(
            'h-12 w-full rounded-2xl bg-teal-dark text-white shadow-[0_12px_24px_rgba(13,148,136,0.22)] hover:bg-teal-medium dark:bg-teal-accent dark:text-[#09090B] dark:hover:bg-seafoam',
            isSubmitting && 'opacity-80'
          )}
        >
          {isSubmitting
            ? 'Проверяем данные...'
            : mode === 'login'
              ? 'Войти'
              : 'Создать аккаунт'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        {mode === 'login' ? (
          <>
            <div className="relative my-1">
              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border/70" aria-hidden="true" />
              <div className="relative mx-auto w-fit rounded-full border border-border/70 bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground dark:bg-background/10">
                или через Telegram
              </div>
            </div>
            {legalConsentBlock}
            <TelegramLoginButton nextPath={nextPath} disabled={!acceptedLegal} />
          </>
        ) : null}
      </div>

      <p className="mt-5 text-sm text-muted-foreground">
        {mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
        <Link
          href={alternateHref}
          className="font-medium text-teal-accent transition-opacity hover:opacity-80"
        >
          {mode === 'login' ? 'Зарегистрироваться' : 'Войти'}
        </Link>
      </p>
    </section>
  );

  return (
    <div className="min-h-full">
      <MarketplaceHeader />
      <main id="page-main" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <section className="relative overflow-hidden rounded-[34px] border border-border/70 bg-card/92 shadow-[0_20px_55px_rgba(0,0,0,0.14)] dark:bg-surface-elevated/92">
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_28%)]"
            aria-hidden="true"
          />
          <div
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/60 to-transparent"
            aria-hidden="true"
          />
          <div className="relative grid gap-8 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
            {introSection}
            {formSection}
          </div>
        </section>
      </main>
    </div>
  );
}
