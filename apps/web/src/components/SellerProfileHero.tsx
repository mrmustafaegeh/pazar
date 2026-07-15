'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MessageSellerButton } from '@/components/MessageSellerButton';
import { api } from '@/lib/api';
import { getToken, onAuthChanged } from '@/lib/auth';

function SellerAvatar({ id }: { id: string }) {
  const initials = id.slice(-2).toUpperCase();
  return (
    <span
      className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-2 border-white/40 bg-white/15 text-3xl font-extrabold text-white backdrop-blur-md"
      style={{ boxShadow: 'var(--shadow-brutal-sm)' }}
    >
      {initials}
    </span>
  );
}

interface Props {
  sellerId: string;
  memberDate: string;
  listingCount: number;
  phoneVerified: boolean;
}

export function SellerProfileHero({ sellerId, memberDate, listingCount, phoneVerified }: Props) {
  const t = useTranslations('seller');
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function loadUser() {
      const token = getToken();
      if (!token) {
        if (!cancelled) setIsOwnProfile(false);
        return;
      }

      api
        .me(token)
        .then((user) => {
          if (!cancelled) setIsOwnProfile((user as { id: string }).id === sellerId);
        })
        .catch(() => {
          if (!cancelled) setIsOwnProfile(false);
        });
    }

    loadUser();
    const unsubscribe = onAuthChanged(loadUser);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [sellerId]);

  return (
    <section className="mesh-panel bg-gradient-to-br from-primary via-[#6d28d9] to-accent text-white">
      <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-15" />
      <div className="relative px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <SellerAvatar id={sellerId} />
            <div>
              {isOwnProfile && (
                <span className="badge-pill mb-2 border-white/40 bg-white/15 text-white">
                  {t('myProfile')}
                </span>
              )}
              <h1 className="font-heading text-2xl font-extrabold md:text-3xl">{t('title')}</h1>
              <p className="mt-1 text-sm text-white/80">{t('memberSince', { date: memberDate })}</p>
              <p className="mt-1 font-mono text-xs text-white/55">
                {t('sellerId')}: {sellerId.slice(0, 8)}…
              </p>
            </div>
          </div>

          <MessageSellerButton
            sellerId={sellerId}
            className="inline-flex items-center justify-center rounded-2xl border-2 border-foreground bg-white px-6 py-3 text-sm font-bold text-primary shadow-brutal-sm transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5"
          />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { value: listingCount, label: t('activeListings', { count: listingCount }) },
            { value: memberDate, label: t('memberSince', { date: memberDate }), small: true },
            {
              value: phoneVerified ? t('verified') : t('notVerified'),
              verified: phoneVerified,
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-2xl border-2 border-white/25 bg-white/10 px-4 py-4 backdrop-blur-md"
            >
              {stat.verified !== undefined ? (
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {stat.verified && (
                    <svg className="h-5 w-5 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  )}
                  {stat.value}
                </div>
              ) : (
                <>
                  {!stat.small && <p className="font-heading text-2xl font-extrabold">{stat.value}</p>}
                  {stat.small && <p className="text-sm font-medium text-white/90">{stat.value}</p>}
                  {stat.label && <p className="mt-1 text-sm text-white/75">{stat.label}</p>}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
