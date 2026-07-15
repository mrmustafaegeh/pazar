'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api';
import { getToken, isAdminRole } from '@/lib/auth';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const t = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const preview = process.env.NODE_ENV === 'development' && searchParams.get('preview') === '1';

  useEffect(() => {
    if (preview) {
      setReady(true);
      return;
    }

    const token = getToken();
    if (!token) {
      router.replace('/giris');
      return;
    }

    api
      .me(token)
      .then((user) => {
        if (!isAdminRole(user.roles)) {
          clearAndRedirect();
          return;
        }
        setReady(true);
      })
      .catch(clearAndRedirect);

    function clearAndRedirect() {
      localStorage.removeItem('admin_access_token');
      router.replace('/giris');
    }
  }, [router, preview]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-foreground/60">
        {t('loading')}
      </div>
    );
  }

  return <>{children}</>;
}
