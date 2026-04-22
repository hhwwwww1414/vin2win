'use client';

import { useEffect, useState } from 'react';
import { Bell, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  detectBrowserPushSupport,
  fetchBrowserPushVapidPublicKey,
  getPushSubscriptionErrorMessage,
  requestBrowserPushPermissionAndSubscribe,
  type BrowserPushSupportResult,
} from '@/lib/push/browser';

interface ChatPushSetupProps {
  className?: string;
}

export function ChatPushSetup({ className }: ChatPushSetupProps) {
  const [support, setSupport] = useState<BrowserPushSupportResult | null>(null);
  const [vapidPublicKey, setVapidPublicKey] = useState<string | undefined>(undefined);
  const [pushConfigResolved, setPushConfigResolved] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [chatPushEnabled, setChatPushEnabled] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadPushConfig() {
      try {
        const publicKey = await fetchBrowserPushVapidPublicKey();
        if (!active) {
          return;
        }

        setVapidPublicKey(publicKey);
        setSupport(detectBrowserPushSupport(publicKey));
      } catch {
        if (!active) {
          return;
        }

        setVapidPublicKey(undefined);
        setSupport(detectBrowserPushSupport());
      } finally {
        if (active) {
          setPushConfigResolved(true);
        }
      }
    }

    void loadPushConfig();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadState() {
      try {
        const response = await fetch('/api/account/notification-settings', {
          cache: 'no-store',
        });
        const payload = (await response.json().catch(() => null)) as
          | {
              browserPushEnabled?: boolean;
              chatPushEnabled?: boolean;
              pushSubscriptionCount?: number;
            }
          | null;

        if (!active) {
          return;
        }

        setPushSubscribed((payload?.pushSubscriptionCount ?? 0) > 0);
        setChatPushEnabled(Boolean(payload?.browserPushEnabled) && Boolean(payload?.chatPushEnabled));
      } catch {
        if (active) {
          setPushSubscribed(false);
          setChatPushEnabled(false);
        }
      }
    }

    void loadState();
    return () => {
      active = false;
    };
  }, []);

  if (!pushConfigResolved || !support) {
    return null;
  }

  if (support.state === 'unsupported') {
    return null;
  }

  if (pushSubscribed && chatPushEnabled && support.permission === 'granted') {
    return null;
  }

  const enablePush = async () => {
    if (!vapidPublicKey) {
      setError('На сервере не настроен публичный VAPID-ключ для web push.');
      return;
    }

    setPending(true);
    setError(null);

    try {
      await requestBrowserPushPermissionAndSubscribe({
        vapidPublicKey,
        enableChatPush: true,
      });
      setSupport(detectBrowserPushSupport(vapidPublicKey));
      setPushSubscribed(true);
      setChatPushEnabled(true);
      window.dispatchEvent(
        new CustomEvent('vin2win:chat-settings-updated', {
          detail: {
            chatPushEnabled: true,
          },
        }),
      );
      toast({
        title: 'Push для чатов включён',
        description: 'Новые сообщения будут приходить даже когда вкладка скрыта или сайт закрыт.',
      });
    } catch (caughtError) {
      setSupport(detectBrowserPushSupport(vapidPublicKey));
      setError(getPushSubscriptionErrorMessage(caughtError));
    } finally {
      setPending(false);
    }
  };

  return (
    <section
      className={cn(
        'rounded-[28px] border border-border/70 bg-card/92 p-4 shadow-[0_18px_48px_rgba(8,15,27,0.12)] dark:bg-surface-elevated/92',
        className,
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {support.requiresStandaloneInstall ? (
              <Smartphone className="h-4 w-4 text-teal-accent" />
            ) : (
              <Bell className="h-4 w-4 text-teal-accent" />
            )}
            <h2 className="text-base font-semibold text-foreground">Уведомления по чатам</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{support.message}</p>
          {support.permission === 'denied' ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Разрешение уже заблокировано браузером. Откройте настройки сайта и вручную включите уведомления.
            </p>
          ) : null}
          {support.requiresStandaloneInstall ? (
            <p className="mt-2 text-xs text-muted-foreground">
              На iPhone: откройте сайт в Safari, выберите Share, затем Add to Home Screen, запустите установленный ярлык и только после этого включите push.
            </p>
          ) : null}
          {error ? (
            <p className="mt-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        {support.canRequestPermission ? (
          <Button
            type="button"
            onClick={() => void enablePush()}
            disabled={pending}
            className="shrink-0 rounded-2xl bg-teal-dark text-white hover:bg-teal-medium dark:bg-teal-accent dark:text-[#09090B] dark:hover:bg-seafoam"
          >
            {pending ? 'Подключаем...' : 'Включить push для чатов'}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
