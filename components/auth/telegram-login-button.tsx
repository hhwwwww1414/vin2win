'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    onVin2winTelegramAuth?: (user: Record<string, string>) => void;
  }
}

const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

type TelegramLoginButtonProps = {
  nextPath: string;
  disabled?: boolean;
};

export function TelegramLoginButton({ nextPath, disabled = false }: TelegramLoginButtonProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const isConfigured = Boolean(TELEGRAM_BOT_USERNAME);

  useEffect(() => {
    const container = containerRef.current;
    setIsWidgetReady(false);

    if (!isConfigured || disabled || !container) {
      if (container) {
        container.innerHTML = '';
      }
      return;
    }

    let intervalId: number | null = null;

    const applyWidgetFrameStyles = () => {
      const iframe = container.querySelector('iframe');
      if (!(iframe instanceof HTMLIFrameElement)) {
        return false;
      }

      iframe.style.position = 'absolute';
      iframe.style.inset = '0';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.opacity = '0';
      iframe.style.cursor = 'pointer';
      iframe.style.zIndex = '20';
      iframe.style.border = '0';
      iframe.style.margin = '0';
      setIsWidgetReady(true);
      return true;
    };

    window.onVin2winTelegramAuth = async (user) => {
      setError(null);
      setLoading(true);

      try {
        const response = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            telegram: user,
            nextPath,
          }),
        });

        const payload = (await response.json().catch(() => null)) as { error?: string; nextPath?: string } | null;
        if (!response.ok) {
          throw new Error(payload?.error ?? 'Не удалось выполнить вход через Telegram.');
        }

        router.push(payload?.nextPath ?? '/account');
        router.refresh();
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Не удалось выполнить вход через Telegram.');
      } finally {
        setLoading(false);
      }
    };

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', TELEGRAM_BOT_USERNAME!);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-userpic', 'false');
    script.setAttribute('data-radius', '20');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-lang', 'ru');
    script.setAttribute('data-onauth', 'window.onVin2winTelegramAuth(user)');

    container.innerHTML = '';
    container.appendChild(script);

    intervalId = window.setInterval(() => {
      if (applyWidgetFrameStyles() && intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    }, 100);

    return () => {
      delete window.onVin2winTelegramAuth;
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
      setIsWidgetReady(false);
      container.innerHTML = '';
    };
  }, [disabled, isConfigured, nextPath, router]);

  const isInteractive = isConfigured && !disabled && isWidgetReady;

  return (
    <div data-testid="telegram-login-panel" className="rounded-[24px] border border-border/70 bg-background/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] dark:bg-background/10">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        <MessageCircle className="h-3.5 w-3.5 text-teal-accent" />
        Telegram login
      </div>

      <div className="relative">
        <button
          type="button"
          disabled={!isInteractive}
          className={cn(
            'flex h-14 w-full items-center justify-center gap-3 rounded-[20px] border border-teal-accent/25 bg-[linear-gradient(135deg,#0f766e_0%,#159d93_45%,#56a9ea_100%)] px-5 text-base font-semibold text-white shadow-[0_18px_35px_rgba(21,157,147,0.24)] transition-[transform,opacity,box-shadow] hover:-translate-y-0.5 hover:opacity-95',
            'disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0'
          )}
        >
          <Send className="h-4 w-4" />
          Войти через Telegram
        </button>

        {isConfigured && !disabled ? (
          <div
            ref={containerRef}
            className={cn(
              'absolute inset-0 overflow-hidden rounded-[20px] transition-opacity',
              isWidgetReady ? 'opacity-100' : 'pointer-events-none opacity-0'
            )}
          />
        ) : null}
      </div>

      {disabled ? <p className="mt-3 text-xs leading-5 text-muted-foreground">Подтвердите согласие с документами, чтобы открыть Telegram login.</p> : null}
      {!disabled && isConfigured && !isWidgetReady && !loading ? <p className="mt-3 text-xs leading-5 text-muted-foreground">Подключаем Telegram widget...</p> : null}
      {loading ? <p className="mt-3 text-xs leading-5 text-muted-foreground">Подтверждаем вход через Telegram...</p> : null}
      {error ? <p className="mt-3 text-xs leading-5 text-destructive">{error}</p> : null}
      {!isConfigured ? <p className="mt-3 text-xs leading-5 text-muted-foreground">Добавьте `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` в публичное окружение и пересоберите приложение.</p> : null}
    </div>
  );
}
