'use client';

import { startTransition, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@prisma/client';
import { Button } from '@/components/ui/button';

type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: UserRole;
  saleCount: number;
  wantedCount: number;
  createdAt: string;
  isActive: boolean;
  sellerVerified: boolean;
  activeSessionCount: number;
  lastSeenAt?: string | null;
};

type UserDraftState = {
  role: UserRole;
  isActive: boolean;
  sellerVerified: boolean;
};

const roles: UserRole[] = ['USER', 'MODERATOR', 'ADMIN'];

export function UserRoleTable({
  users,
  currentUserId,
}: {
  users: AdminUserRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkRole, setBulkRole] = useState<'UNCHANGED' | UserRole>('UNCHANGED');
  const [bulkActive, setBulkActive] = useState<'UNCHANGED' | 'ACTIVE' | 'INACTIVE'>('UNCHANGED');
  const [bulkSellerVerified, setBulkSellerVerified] = useState<'UNCHANGED' | 'VERIFIED' | 'UNVERIFIED'>('UNCHANGED');
  const [draft, setDraft] = useState<Record<string, UserDraftState>>(
    Object.fromEntries(
      users.map((user) => [
        user.id,
        {
          role: user.role,
          isActive: user.isActive,
          sellerVerified: user.sellerVerified,
        },
      ])
    )
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(
      Object.fromEntries(
        users.map((user) => [
          user.id,
          {
            role: user.role,
            isActive: user.isActive,
            sellerVerified: user.sellerVerified,
          },
        ])
      )
    );
    setSelectedIds((current) => current.filter((id) => users.some((user) => user.id === id)));
  }, [users]);

  const allSelected = useMemo(() => users.length > 0 && selectedIds.length === users.length, [selectedIds.length, users.length]);

  const toggleSelection = (userId: string) => {
    setSelectedIds((current) => (current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]));
  };

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : users.map((user) => user.id));
  };

  const refresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const updateUser = async (userId: string) => {
    setError(null);
    setPendingKey(`${userId}:save`);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draft[userId]),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Не удалось обновить настройки пользователя.');
      }

      refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось обновить настройки пользователя.');
    } finally {
      setPendingKey(null);
    }
  };

  const revokeSessions = async (userId: string) => {
    setError(null);
    setPendingKey(`${userId}:sessions`);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'revokeSessions',
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Не удалось завершить активные сессии.');
      }

      refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось завершить активные сессии.');
    } finally {
      setPendingKey(null);
    }
  };

  const applyBulkUpdate = async () => {
    if (!selectedIds.length) {
      setError('Select at least one user.');
      return;
    }

    if (bulkRole === 'UNCHANGED' && bulkActive === 'UNCHANGED' && bulkSellerVerified === 'UNCHANGED') {
      setError('Choose at least one bulk change.');
      return;
    }

    setError(null);
    setPendingKey('bulk:update');

    try {
      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          userIds: selectedIds,
          role: bulkRole === 'UNCHANGED' ? undefined : bulkRole,
          isActive: bulkActive === 'UNCHANGED' ? undefined : bulkActive === 'ACTIVE',
          sellerVerified: bulkSellerVerified === 'UNCHANGED' ? undefined : bulkSellerVerified === 'VERIFIED',
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Не удалось выполнить массовое действие для пользователей.');
      }

      setSelectedIds([]);
      setBulkRole('UNCHANGED');
      setBulkActive('UNCHANGED');
      setBulkSellerVerified('UNCHANGED');
      refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось выполнить массовое действие для пользователей.');
    } finally {
      setPendingKey(null);
    }
  };

  const applyBulkSessionReset = async () => {
    if (!selectedIds.length) {
      setError('Select at least one user.');
      return;
    }

    setError(null);
    setPendingKey('bulk:sessions');

    try {
      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'revokeSessions',
          userIds: selectedIds,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Не удалось завершить выбранные сессии.');
      }

      setSelectedIds([]);
      refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось завершить выбранные сессии.');
    } finally {
      setPendingKey(null);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-border/70 bg-card/92 p-6 shadow-[0_18px_48px_rgba(8,15,27,0.12)] dark:bg-surface-elevated/92">
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-accent/55 to-transparent"
        aria-hidden="true"
      />
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-foreground">Пользователи и доступ</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Админ управляет ролями, активностью аккаунта, seller verification и может массово применять действия к нескольким пользователям.
        </p>
      </div>

      <div className="mb-5 rounded-[26px] border border-border/70 bg-background/60 p-4 shadow-[0_12px_28px_rgba(8,15,27,0.06)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
              <span>Выбрать все</span>
            </label>
            <span className="text-sm text-muted-foreground">Выбрано: {selectedIds.length}</span>
          </div>
          <div className="grid gap-3 md:grid-cols-5 xl:min-w-[920px]">
            <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-teal-accent/60 focus:ring-2 focus:ring-teal-accent/30" value={bulkRole} onChange={(event) => setBulkRole(event.target.value as 'UNCHANGED' | UserRole)}>
              <option value="UNCHANGED">Роль: без изменений</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  Роль: {role}
                </option>
              ))}
            </select>
            <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-teal-accent/60 focus:ring-2 focus:ring-teal-accent/30" value={bulkActive} onChange={(event) => setBulkActive(event.target.value as 'UNCHANGED' | 'ACTIVE' | 'INACTIVE')}>
              <option value="UNCHANGED">Аккаунт: без изменений</option>
              <option value="ACTIVE">Активировать</option>
              <option value="INACTIVE">Деактивировать</option>
            </select>
            <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-teal-accent/60 focus:ring-2 focus:ring-teal-accent/30" value={bulkSellerVerified} onChange={(event) => setBulkSellerVerified(event.target.value as 'UNCHANGED' | 'VERIFIED' | 'UNVERIFIED')}>
              <option value="UNCHANGED">Seller: без изменений</option>
              <option value="VERIFIED">Подтвердить</option>
              <option value="UNVERIFIED">Снять подтверждение</option>
            </select>
            <Button variant="outline" disabled={pendingKey === 'bulk:update'} onClick={applyBulkUpdate}>
              {pendingKey === 'bulk:update' ? 'Применяем...' : 'Применить'}
            </Button>
            <Button variant="outline" disabled={pendingKey === 'bulk:sessions'} onClick={applyBulkSessionReset}>
              {pendingKey === 'bulk:sessions' ? 'Сбрасываем...' : 'Сбросить сессии'}
            </Button>
          </div>
        </div>
      </div>

      {error ? <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}

      <div className="space-y-3">
        {users.map((user) => {
          const isSavePending = pendingKey === `${user.id}:save`;
          const isSessionsPending = pendingKey === `${user.id}:sessions`;
          const userState = draft[user.id];
          return (
            <div
              key={user.id}
              className="grid gap-4 rounded-[26px] border border-border/70 bg-background/60 p-4 shadow-[0_12px_28px_rgba(8,15,27,0.06)] xl:grid-cols-[auto_1.1fr_0.9fr_1.1fr_auto] xl:items-center"
            >
              <div className="pt-1">
                <input type="checkbox" checked={selectedIds.includes(user.id)} onChange={() => toggleSelection(user.id)} />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-foreground">{user.name}</h3>
                  {user.id === currentUserId ? (
                    <span className="rounded-full border border-teal-accent/30 bg-teal-accent/10 px-2 py-0.5 text-[11px] font-medium text-teal-accent">
                      Это вы
                    </span>
                  ) : null}
                  {!user.isActive ? (
                    <span className="rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                      Деактивирован
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
                {user.phone ? <p className="text-sm text-muted-foreground">{user.phone}</p> : null}
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Продажи: {user.saleCount}</p>
                <p>Подбор: {user.wantedCount}</p>
                <p>С {user.createdAt}</p>
                <p>{user.lastSeenAt ? `Последняя активность: ${user.lastSeenAt}` : 'Нет активных сессий'}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Роль</span>
                  <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-teal-accent/60 focus:ring-2 focus:ring-teal-accent/30" value={userState.role} onChange={(event) => setDraft((current) => ({ ...current, [user.id]: { ...current[user.id], role: event.target.value as UserRole } }))}>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Аккаунт</span>
                  <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-teal-accent/60 focus:ring-2 focus:ring-teal-accent/30" value={userState.isActive ? 'active' : 'inactive'} onChange={(event) => setDraft((current) => ({ ...current, [user.id]: { ...current[user.id], isActive: event.target.value === 'active' } }))}>
                    <option value="active">Активен</option>
                    <option value="inactive">Деактивирован</option>
                  </select>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Seller</span>
                  <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-teal-accent/60 focus:ring-2 focus:ring-teal-accent/30" value={userState.sellerVerified ? 'verified' : 'unverified'} onChange={(event) => setDraft((current) => ({ ...current, [user.id]: { ...current[user.id], sellerVerified: event.target.value === 'verified' } }))}>
                    <option value="verified">Проверен</option>
                    <option value="unverified">Не проверен</option>
                  </select>
                </label>
              </div>

              <div className="flex flex-col items-stretch gap-2 xl:items-end">
                <div className="text-right text-xs text-muted-foreground">
                  Активных сессий: {user.activeSessionCount}
                </div>
                <Button type="button" variant="outline" disabled={isSessionsPending} onClick={() => revokeSessions(user.id)}>
                  {isSessionsPending ? 'Сбрасываем...' : 'Сбросить сессии'}
                </Button>
                <Button type="button" disabled={isSavePending} onClick={() => updateUser(user.id)} className="bg-teal-dark text-white hover:bg-teal-medium dark:bg-teal-accent dark:text-[#09090B] dark:hover:bg-seafoam">
                  {isSavePending ? 'Сохраняем...' : 'Сохранить'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
