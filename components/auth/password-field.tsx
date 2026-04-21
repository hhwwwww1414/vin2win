'use client';

import type { ChangeEventHandler } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { cn } from '@/lib/utils';

type PasswordFieldProps = {
  id: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  autoComplete: 'current-password' | 'new-password';
  visible: boolean;
  onToggleVisibility: () => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  suppressHydrationWarning?: boolean;
};

export function PasswordField({
  id,
  value,
  onChange,
  autoComplete,
  visible,
  onToggleVisibility,
  className,
  placeholder,
  disabled = false,
  suppressHydrationWarning = false,
}: PasswordFieldProps) {
  const visibilityLabel = visible ? 'Скрыть пароль' : 'Показать пароль';

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        className={cn(className, 'pr-12')}
        autoComplete={autoComplete}
        suppressHydrationWarning={suppressHydrationWarning}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
      />
      <button
        type="button"
        aria-label={visibilityLabel}
        aria-pressed={visible}
        onClick={onToggleVisibility}
        disabled={disabled}
        className="absolute inset-y-0 right-3 flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-accent/30 disabled:pointer-events-none disabled:opacity-50"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
