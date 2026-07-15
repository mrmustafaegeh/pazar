'use client';

import Image from 'next/image';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import { SearchBar } from './SearchBar';
import { CountUp } from './motion/CountUp';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=2400&q=90&auto=format&fit=crop';

const EASE = [0.22, 1, 0.36, 1] as const;

export function HeroSection() {
  const t = useTranslations('home');
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);

  const stats = [
    { label: t('stats.listings'), value: t('stats.listingsValue') },
    { label: t('stats.sellers'), value: t('stats.sellersValue') },
    { label: t('stats.cities'), value: t('stats.citiesValue') },
  ] as const;

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative -mx-4 overflow-hidden rounded-b-[1.75rem] shadow-[0_24px_48px_-24px_rgba(18,41,75,0.45)] md:rounded-b-[2.25rem] lg:rounded-b-[2.75rem]"
    >
      {/* Background — extends behind sticky header */}
      <div className="absolute inset-0 -top-16 min-h-[calc(78vh+4rem)] lg:min-h-[calc(88vh+4rem)]">
        <motion.div className="absolute inset-0 will-change-transform" style={{ y: reduced ? 0 : imageY }}>
          <Image
            src={HERO_IMAGE}
            alt=""
            fill
            priority
            className="object-cover object-[center_30%]"
            sizes="100vw"
            quality={90}
          />
        </motion.div>

        {/* Single cohesive overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-navy/92 via-navy/72 to-navy/35 rtl:bg-gradient-to-bl"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_20%,rgba(232,163,61,0.12),transparent)]"
          aria-hidden
        />
      </div>

      {/* Content */}
      <div className="relative mx-auto min-h-[78vh] max-w-7xl px-4 py-12 md:px-8 md:py-16 lg:min-h-[88vh] lg:px-12 lg:py-20">
        <div className="grid h-full items-center gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Copy + search */}
          <div className="space-y-7 lg:col-span-7 lg:space-y-8">
            <motion.span
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm"
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
              {t('heroBadge')}
            </motion.span>

            <motion.div
              className="space-y-4"
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08, ease: EASE }}
            >
              <h1 className="font-heading text-[2rem] font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.06]">
                {t('heroTitle')}
              </h1>
              <span className="block h-1 w-14 rounded-full bg-accent" aria-hidden />
              <p className="max-w-lg text-base leading-relaxed text-white/85 sm:text-lg lg:text-xl">
                {t('heroSubtitle')}
              </p>
            </motion.div>

            <motion.div
              className="max-w-xl"
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.16, ease: EASE }}
            >
              <SearchBar variant="hero" showPopular />
            </motion.div>

            {/* Mobile stats row */}
            <motion.div
              className="grid grid-cols-3 gap-2 sm:gap-3 lg:hidden"
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.24, ease: EASE }}
            >
              {stats.map((stat) => (
                <StatTile key={stat.label} label={stat.label} value={stat.value} compact />
              ))}
            </motion.div>
          </div>

          {/* Desktop stats panel */}
          <motion.aside
            className="hidden lg:col-span-5 lg:block"
            initial={reduced ? false : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
          >
            <div className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-xl backdrop-blur-md">
              <p className="text-xs font-bold uppercase tracking-widest text-white/60">{t('heroCardLabel')}</p>
              <p className="mt-1 font-heading text-3xl font-extrabold text-white">{t('heroCardValue')}</p>

              <div className="my-6 h-px bg-white/15" aria-hidden />

              <dl className="space-y-5">
                {stats.map((stat) => (
                  <StatTile key={stat.label} label={stat.label} value={stat.value} />
                ))}
              </dl>
            </div>
          </motion.aside>
        </div>
      </div>
    </section>
  );
}

function StatTile({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="rounded-xl border border-white/20 bg-white/10 px-2.5 py-3 text-center backdrop-blur-sm">
        <p className="text-[10px] font-bold uppercase tracking-wide text-white/65">{label}</p>
        <p className="mt-1 font-heading text-lg font-bold text-white">
          <CountUp value={value} />
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-sm font-medium text-white/75">{label}</dt>
      <dd className="font-heading text-2xl font-bold text-white">
        <CountUp value={value} />
      </dd>
    </div>
  );
}
