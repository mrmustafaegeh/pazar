'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { getToken, onAuthChanged } from '@/lib/auth';

interface Props {
  sellerId: string;
  listingId?: string;
  className?: string;
  label?: string;
}

export function MessageSellerButton({
  sellerId,
  listingId,
  className = 'btn-primary px-4 py-2 text-sm',
  label,
}: Props) {
  const t = useTranslations('seller');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function loadUser() {
      const token = getToken();
      if (!token) {
        if (!cancelled) {
          setCurrentUserId(null);
          setReady(true);
        }
        return;
      }

      api
        .me(token)
        .then((user) => {
          if (!cancelled) setCurrentUserId((user as { id: string }).id);
        })
        .catch(() => {
          if (!cancelled) setCurrentUserId(null);
        })
        .finally(() => {
          if (!cancelled) setReady(true);
        });
    }

    loadUser();
    const unsubscribe = onAuthChanged(loadUser);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  if (!ready || currentUserId === sellerId) return null;

  const href = listingId
    ? `/mesajlar?listing=${listingId}&seller=${sellerId}`
    : `/mesajlar?seller=${sellerId}`;

  return (
    <Link href={href} className={className}>
      {label ?? t('messageSeller')}
    </Link>
  );
}
