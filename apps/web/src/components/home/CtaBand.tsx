'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import { ctaReveal } from '@/lib/motion';

export function CtaBand({
  title,
  subtitle,
  buttonLabel,
  href,
}: {
  title: string;
  subtitle: string;
  buttonLabel: string;
  href: string;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.section
      className="relative overflow-hidden rounded-2xl bg-navy"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={reduced ? { hidden: { opacity: 0 }, visible: { opacity: 1 } } : ctaReveal}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative px-8 py-14 text-center md:px-16 md:py-20 md:text-start">
        <h2 className="font-heading text-3xl font-extrabold text-white md:text-4xl">{title}</h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/85 md:mx-0">{subtitle}</p>
        <Link
          href={href}
          className="mt-10 inline-flex rounded-xl bg-white px-10 py-4 font-heading font-bold text-navy shadow-sm transition-all duration-200 hover:-translate-y-px hover:bg-white/95 hover:shadow-md"
        >
          {buttonLabel}
        </Link>
      </div>
    </motion.section>
  );
}
