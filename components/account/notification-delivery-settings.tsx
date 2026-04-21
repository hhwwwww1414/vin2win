'use client';

import { startTransition, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import {
  detectBrowserPushSupport,
  fetchBrowserPushVapidPublicKey,
  getPushSubscriptionErrorMessage,
  requestBrowserPushPermissionAndSubscribe,
  type BrowserPushSupportResult,
} from '@/lib/push/browser';

type NotificationDeliverySettingsProps = {
  emailEnabled: boolean;
  telegramEnabled: boolean;
  browserPushEnabled: boolean;
  chatSoundEnabled: boolean;
  chatPushEnabled: boolean;
  telegramChatId?: string | null;
  hasPushSubscription: boolean;
  lastPushSuccessAt?: string | null;
};

function getPermissionLabel(permission: string) {
  switch (permission) {
    case 'granted':
      return 'разрешено';
    case 'denied':
      return 'заблокировано';
    default:
      return 'ожидает подтверждения';
  }
}

export function NotificationDeliverySettings({
  emailEnabled,
  telegramEnabled,
  browserPushEnabled,
  chatSoundEnabled,
  chatPushEnabled,
  telegramChatId,
  hasPushSubscription,
  lastPushSuccessAt,
}: NotificationDeliverySettingsProps) {
  const router = useRouter();
  const [draft, setDraft] = useState({
    emailEnabled,
    telegramEnabled,
    browserPushEnabled,
    chatSoundEnabled,
    chatPushEnabled,
    telegramChatId: telegramChatId ?? '',
  });
  const [pushSubscribed, setPushSubscribed] = useState(hasPushSubscription);
  const [permissionState, setPermissionState] = useState<string>('default');
  const [pushSupport, setPushSupport] = useState<BrowserPushSupportResult | null>(null);
  const [vapidPublicKey, setVapidPublicKey] = useState<string | undefined>(undefined);
  const [pushConfigResolved, setPushConfigResolved] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastDeliveredPush, setLastDeliveredPush] = useState<string | null>(
    lastPushSuccessAt ?? null,
  );
  const telegramBotUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  useEffect(() => {
    setDraft({
      emailEnabled,
      telegramEnabled,
      browserPushEnabled,
      chatSoundEnabled,
      chatPushEnabled,
      telegramChatId: telegramChatId ?? '',
    });
    setPushSubscribed(hasPushSubscription);
    setLastDeliveredPush(lastPushSuccessAt ?? null);
  }, [
    browserPushEnabled,
    chatPushEnabled,
    chatSoundEnabled,
    emailEnabled,
    hasPushSubscription,
    lastPushSuccessAt,
    telegramChatId,
    telegramEnabled,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let active = true;

    async function loadPushConfig() {
      try {
        const publicKey = await fetchBrowserPushVapidPublicKey();
        if (!active) {
          return;
        }

        const nextSupport = detectBrowserPushSupport(publicKey);
        setVapidPublicKey(publicKey);
        setPushSupport(nextSupport);
        setPermissionState(nextSupport.permission === 'unsupported' ? 'default' : nextSupport.permission);
      } catch {
        if (!active) {
          return;
        }

        const nextSupport = detectBrowserPushSupport();
        setVapidPublicKey(undefined);
        setPushSupport(nextSupport);
        setPermissionState(nextSupport.permission === 'unsupported' ? 'default' : nextSupport.permission);
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
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const handleMessage = (event: MessageEvent<{ type?: string; payload?: { title?: string; body?: string } }>) => {
      if (event.data?.type !== 'vin2win-push-received') {
        return;
      }

      toast({
        title: event.data.payload?.title ?? 'Новое уведомление vin2win',
        description:
          event.data.payload?.body ?? 'Получено новое системное уведомление.',
      });
      setLastDeliveredPush(
        new Intl.DateTimeFormat('ru-RU', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date()),
      );
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  const canUseBrowserPush = Boolean(pushSupport?.canRequestPermission);
  const browserPushStatusMessage =
    pushSupport?.message ?? 'Браузерные уведомления временно недоступны.';

  const saveSettings = useCallback(async () => {
    setError(null);
    setPendingKey('settings');

    try {
      const response = await fetch('/api/account/notification-settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailNotificationsEnabled: draft.emailEnabled,
          telegramNotificationsEnabled: draft.telegramEnabled,
          browserPushEnabled: draft.browserPushEnabled,
          chatSoundEnabled: draft.chatSoundEnabled,
          chatPushEnabled: draft.chatPushEnabled,
          telegramChatId: draft.telegramChatId.trim() || null,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Не удалось сохранить настройки уведомлений.');
      }

      startTransition(() => {
        router.refresh();
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('vin2win:chat-settings-updated', {
            detail: {
              chatSoundEnabled: draft.chatSoundEnabled,
            },
          }),
        );
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Не удалось сохранить настройки уведомлений.',
      );
    } finally {
      setPendingKey(null);
    }
  }, [draft, router]);

  const subscribeBrowserPush = useCallback(async () => {
    if (!canUseBrowserPush || !vapidPublicKey) {
      setError(
        pushConfigResolved
          ? browserPushStatusMessage
          : 'Браузерные уведомления временно недоступны.',
      );
      return;
    }

    setError(null);
    setPendingKey('push');

    try {
      const { permission } = await requestBrowserPushPermissionAndSubscribe({
        vapidPublicKey,
      });

      setPermissionState(permission);
      setPushSupport(detectBrowserPushSupport(vapidPublicKey));
      setPushSubscribed(true);
      setDraft((current) => ({
        ...current,
        browserPushEnabled: true,
      }));
      toast({
        title: 'Браузерные уведомления подключены',
        description:
          'Канал оповещений активирован. Можно отправить контрольное уведомление.',
      });

      startTransition(() => {
        router.refresh();
      });
    } catch (submitError) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermissionState(Notification.permission);
      }
      setPushSupport(detectBrowserPushSupport(vapidPublicKey));
      setError(getPushSubscriptionErrorMessage(submitError));
    } finally {
      setPendingKey(null);
    }
  }, [browserPushStatusMessage, canUseBrowserPush, pushConfigResolved, router, vapidPublicKey]);

  const sendTestBrowserPush = useCallback(async () => {
    setError(null);
    setPendingKey('test-push');

    try {
      const response = await fetch('/api/account/push-subscriptions/test', {
        method: 'POST',
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Не удалось отправить контрольное уведомление.');
      }

      toast({
        title: 'Контрольное уведомление отправлено',
        description:
          'Проверьте системное уведомление и сообщение в открытой вкладке.',
      });

      startTransition(() => {
        router.refresh();
      });
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : 'Не удалось отправить контрольное уведомление.';
      setError(message);
      toast({
        title: 'Контрольное уведомление не отправлено',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setPendingKey(null);
    }
  }, [router]);

  const unsubscribeBrowserPush = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    setError(null);
    setPendingKey('push');

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch('/api/account/push-subscriptions', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        });

        await subscription.unsubscribe();
      }

      await fetch('/api/account/notification-settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          browserPushEnabled: false,
        }),
      });

      setPushSubscribed(false);
      setDraft((current) => ({
        ...current,
        browserPushEnabled: false,
      }));

      startTransition(() => {
        router.refresh();
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Не удалось отключить браузерные уведомления.',
      );
    } finally {
      setPendingKey(null);
    }
  }, [router]);

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-border/70 bg-card/92 p-6 shadow-[0_18px_48px_rgba(8,15,27,0.12)] dark:bg-surface-elevated/92">
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/55 to-transparent"
        aria-hidden="true"
      />
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-foreground">Каналы оповещений</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Настройте рабочие каналы оповещений, чтобы не пропускать публикацию карточек,
          комментарии модератора и изменения по аккаунту.
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="rounded-[24px] border border-border/70 bg-background/60 p-4 shadow-[0_12px_28px_rgba(8,15,27,0.06)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-medium text-foreground">Email</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Оперативные уведомления на основной email аккаунта.
              </p>
            </div>
            <Switch
              checked={draft.emailEnabled}
              onCheckedChange={(checked) =>
                setDraft((current) => ({ ...current, emailEnabled: checked }))
              }
            />
          </div>
        </label>

        <label className="rounded-[24px] border border-border/70 bg-background/60 p-4 shadow-[0_12px_28px_rgba(8,15,27,0.06)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-medium text-foreground">Telegram</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Подключите Telegram, чтобы получать решения модерации и обновления по
                объявлениям в мессенджере.
              </p>
            </div>
            <Switch
              checked={draft.telegramEnabled}
              onCheckedChange={(checked) =>
                setDraft((current) => ({ ...current, telegramEnabled: checked }))
              }
            />
          </div>
          <input
            value={draft.telegramChatId}
            onChange={(event) =>
              setDraft((current) => ({ ...current, telegramChatId: event.target.value }))
            }
            className="mt-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-teal-accent/60 focus:ring-2 focus:ring-teal-accent/30"
            placeholder="Например: 123456789"
          />
          {telegramBotUsername ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Бот:{' '}
              <Link
                href={`https://t.me/${telegramBotUsername}`}
                className="text-teal-accent hover:underline"
              >
                {telegramBotUsername}
              </Link>
            </p>
          ) : null}
        </label>

        <label className="rounded-[24px] border border-border/70 bg-background/60 p-4 shadow-[0_12px_28px_rgba(8,15,27,0.06)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-medium text-foreground">Звук новых сообщений</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Работает при открытой вкладке и после взаимодействия со страницей. При
                полностью закрытом сайте звук контролирует уже браузерное push-уведомление.
              </p>
            </div>
            <Switch
              checked={draft.chatSoundEnabled}
              onCheckedChange={(checked) =>
                setDraft((current) => ({ ...current, chatSoundEnabled: checked }))
              }
            />
          </div>
        </label>

        <label className="rounded-[24px] border border-border/70 bg-background/60 p-4 shadow-[0_12px_28px_rgba(8,15,27,0.06)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-medium text-foreground">Push для чатов</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Отдельный канал для новых сообщений, если вкладка скрыта, браузер в фоне
                или сайт не открыт.
              </p>
            </div>
            <Switch
              checked={draft.chatPushEnabled}
              onCheckedChange={(checked) =>
                setDraft((current) => ({ ...current, chatPushEnabled: checked }))
              }
            />
          </div>
        </label>
      </div>

      <div className="mt-4 rounded-[24px] border border-border/70 bg-background/60 p-4 shadow-[0_12px_28px_rgba(8,15,27,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="font-medium text-foreground">Браузерные уведомления</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Статус: {pushSubscribed ? 'канал активен' : 'канал не подключён'}
              {permissionState
                ? ` • разрешение браузера: ${getPermissionLabel(permissionState)}`
                : ''}
            </p>
            {lastDeliveredPush ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Последняя успешная доставка: {lastDeliveredPush}
              </p>
            ) : null}
            {pushConfigResolved && !canUseBrowserPush ? (
              <p className="mt-2 text-xs text-muted-foreground">{browserPushStatusMessage}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {pushSubscribed ? (
              <>
                <Button
                  variant="outline"
                  disabled={pendingKey === 'test-push'}
                  onClick={sendTestBrowserPush}
                >
                  {pendingKey === 'test-push'
                    ? 'Отправляем...'
                    : 'Контрольное уведомление'}
                </Button>
                <Button
                  variant="outline"
                  disabled={pendingKey === 'push'}
                  onClick={unsubscribeBrowserPush}
                >
                  {pendingKey === 'push'
                    ? 'Отключаем...'
                    : 'Отключить уведомления'}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                disabled={!pushConfigResolved || !canUseBrowserPush || pendingKey === 'push'}
                onClick={subscribeBrowserPush}
              >
                {pendingKey === 'push'
                  ? 'Подключаем...'
                  : 'Подключить уведомления'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Button
          type="button"
          disabled={pendingKey === 'settings'}
          onClick={saveSettings}
          className="bg-teal-dark text-white hover:bg-teal-medium dark:bg-teal-accent dark:text-[#09090B] dark:hover:bg-seafoam"
        >
          {pendingKey === 'settings' ? 'Сохраняем...' : 'Сохранить настройки'}
        </Button>
      </div>
    </section>
  );
}
