'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

declare global {
  interface Window {
    onVin2winTelegramAuth?: (user: Record<string, string>) => void;
  }
}

const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

export function TelegramLoginButton({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!TELEGRAM_BOT_USERNAME || !containerRef.current) {
      return;
    }

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
    script.setAttribute('data-telegram-login', TELEGRAM_BOT_USERNAME);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-userpic', 'false');
    script.setAttribute('data-radius', '12');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-lang', 'ru');
    script.setAttribute('data-onauth', 'window.onVin2winTelegramAuth(user)');

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(script);

    return () => {
      delete window.onVin2winTelegramAuth;
    };
  }, [nextPath, router]);

  if (!TELEGRAM_BOT_USERNAME) {
    return null;
  }

  return (
    <div className="mt-4 rounded-2xl border border-border/70 bg-background/50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-teal-accent" />
        <span className="text-sm font-medium text-foreground">Войти через Telegram</span>
      </div>
      <div ref={containerRef} className="min-h-11" />
      {loading ? <p className="mt-2 text-xs text-muted-foreground">Подтверждаем вход через Telegram...</p> : null}
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-3 w-full justify-center text-xs text-muted-foreground"
        onClick={() => window.location.reload()}
      >
        Обновить Telegram-виджет
      </Button>
    </div>
  );
}
