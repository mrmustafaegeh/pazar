'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useInView, useReducedMotion } from 'framer-motion';

export type TrustItem = {
  key: string;
  eyebrow: string;
  title: string;
  description: string;
};

const TRUST_IMAGES: Record<string, string> = {
  trustModeration:
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1600&q=90&auto=format&fit=crop',
  trustVerified:
    'https://images.unsplash.com/photo-1633265486064-086b219458ec?w=1600&q=90&auto=format&fit=crop',
  trustSupport:
    'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=2400&q=95&auto=format&fit=crop',
};

function TrustIcon({ itemKey }: { itemKey: string }) {
  const className = 'h-5 w-5 shrink-0 text-navy';

  if (itemKey === 'trustModeration') {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    );
  }

  if (itemKey === 'trustVerified') {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  }

  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function TrustRow({ item, index }: { item: TrustItem; index: number }) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();
  const imageOnEnd = index % 2 === 0;

  return (
    <motion.li
      ref={ref}
      className={`flex flex-col gap-8 md:items-center md:gap-12 lg:gap-16 ${
        imageOnEnd ? 'md:flex-row' : 'md:flex-row-reverse'
      }`}
      initial={reduced ? false : { opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: reduced ? 1 : 0, y: reduced ? 0 : 24 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="order-1 w-full md:order-none md:w-1/2">
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-neutral-100 shadow-lg">
          <Image src={TRUST_IMAGES[item.key]} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" quality={95} />
        </div>
      </div>

      <div className="order-2 w-full md:order-none md:w-2/5">
        <div className="flex flex-col justify-center md:py-4">
          <p className="mb-4 flex items-center gap-2 text-sm font-medium text-navy">
            <TrustIcon itemKey={item.key} />
            <span>{item.eyebrow}</span>
          </p>
          <h3 className="font-heading text-2xl font-semibold leading-snug text-navy md:text-[1.65rem]">
            {item.title}
          </h3>
          <p className="mt-4 text-[15px] leading-relaxed text-gray-600 md:text-base">{item.description}</p>
        </div>
      </div>
    </motion.li>
  );
}

export function TrustSection({ items }: { items: TrustItem[] }) {
  return (
    <ul className="flex flex-col gap-20 md:gap-24 lg:gap-[6.25rem]">
      {items.map((item, index) => (
        <TrustRow key={item.key} item={item} index={index} />
      ))}
    </ul>
  );
}
