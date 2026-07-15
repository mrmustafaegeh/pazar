'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { moveItem } from '@/lib/post-listing';

export function PhotosStep({
  images,
  uploadProgress,
  onImagesChange,
}: {
  images: File[];
  uploadProgress: Record<string, number>;
  onImagesChange: (files: File[]) => void;
}) {
  const t = useTranslations('postListing');
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const accepted = Array.from(files).filter((f) =>
        ['image/jpeg', 'image/png', 'image/webp'].includes(f.type),
      );
      if (accepted.length) onImagesChange([...images, ...accepted]);
    },
    [images, onImagesChange],
  );

  function removeAt(index: number) {
    onImagesChange(images.filter((_, i) => i !== index));
  }

  function handleDropReorder(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    onImagesChange(moveItem(images, dragIndex, targetIndex));
    setDragIndex(null);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading text-xl font-semibold text-navy">{t('imagesStepTitle')}</h2>
        <p className="mt-1 text-sm text-neutral-500">{t('imagesHint')}</p>
      </div>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
          dragOver ? 'border-navy bg-navy/5' : 'border-neutral-300 bg-neutral-50 hover:border-navy/40'
        }`}
      >
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-navy shadow-sm">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </span>
        <p className="text-sm font-medium text-navy">{t('dropzoneTitle')}</p>
        <p className="mt-1 text-xs text-neutral-500">{t('dropzoneHint')}</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((file, index) => {
            const preview = URL.createObjectURL(file);
            const progress = uploadProgress[file.name];
            return (
              <div
                key={`${file.name}-${index}`}
                draggable
                onDragStart={() => setDragIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDropReorder(index)}
                className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-neutral-100"
              >
                <Image src={preview} alt="" fill className="object-cover" sizes="160px" unoptimized />
                {index === 0 && (
                  <span className="absolute start-2 top-2 z-10 rounded bg-[#E8A33D] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-900">
                    {t('primaryPhoto')}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  className="absolute end-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label={t('removePhoto')}
                >
                  ✕
                </button>
                {progress !== undefined && progress < 100 && (
                  <div className="absolute inset-x-0 bottom-0 bg-white/90 p-2">
                    <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200">
                      <div className="h-full rounded-full bg-navy transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
