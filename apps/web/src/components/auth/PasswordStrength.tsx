'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

type Strength = 0 | 1 | 2 | 3;

function scorePassword(password: string): Strength {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  return Math.min(score, 3) as Strength;
}

const BAR_CLASS: Record<Strength, string> = {
  0: 'bg-neutral-200',
  1: 'bg-red-500',
  2: 'bg-[#E8A33D]',
  3: 'bg-green-600',
};

export function PasswordStrength({ password }: { password: string }) {
  const t = useTranslations('auth.register');
  const strength = useMemo(() => scorePassword(password), [password]);

  if (!password) return null;

  const labels = [t('strengthWeak'), t('strengthFair'), t('strengthGood'), t('strengthStrong')];

  return (
    <div className="mt-2 space-y-1.5" aria-live="polite">
      <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-200">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${BAR_CLASS[strength]}`}
          style={{ width: strength === 0 ? '0%' : `${(strength / 3) * 100}%` }}
        />
      </div>
      <p className="text-xs text-neutral-500">{labels[strength]}</p>
    </div>
  );
}
