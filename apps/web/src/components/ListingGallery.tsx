'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface Props {
  images: string[];
  title: string;
}

export function ListingGallery({ images, title }: Props) {
  const t = useTranslations('listing');
  const [activeIndex, setActiveIndex] = useState(0);
  const showThumbnails = images.length > 1;

  const counterText = (current: number, total: number) =>
    t('imageCounter', { current, total });

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-100 shadow-sm">
        {images.map((src, index) => (
          <Image
            key={`${src}-${index}`}
            src={src}
            alt={title}
            fill
            priority={index === 0}
            className={`object-cover transition-opacity duration-200 ease-out ${
              index === activeIndex ? 'opacity-100' : 'opacity-0'
            }`}
            sizes="(max-width: 1024px) 100vw, 60vw"
          />
        ))}
        {images.length > 1 && (
          <span className="absolute end-3 top-3 rounded-md bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {counterText(activeIndex + 1, images.length)}
          </span>
        )}
      </div>

      {showThumbnails && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.slice(0, 6).map((src, index) => (
            <button
              key={`thumb-${src}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                index === activeIndex ? 'border-navy' : 'border-transparent opacity-80 hover:opacity-100'
              }`}
              aria-label={counterText(index + 1, images.length)}
              aria-current={index === activeIndex ? 'true' : undefined}
            >
              <Image src={src} alt="" fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
