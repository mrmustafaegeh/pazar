'use client';

import { useEffect, useRef, useState } from 'react';

export type HeaderDropdownOption = {
  value: string;
  label: string;
  short?: string;
};

export function HeaderDropdown({
  ariaLabel,
  value,
  options,
  onChange,
  variant = 'compact',
}: {
  ariaLabel: string;
  value: string;
  options: HeaderDropdownOption[];
  onChange: (value: string) => void;
  variant?: 'compact' | 'full';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function select(next: string) {
    onChange(next);
    setOpen(false);
  }

  const triggerLabel = current?.short ?? current?.label ?? value;

  return (
    <div className={`relative ${variant === 'full' ? 'w-full' : ''}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md text-sm font-medium text-navy transition-colors hover:text-navy/80 ${
          variant === 'full'
            ? 'w-full justify-between rounded-lg border border-border bg-white px-3 py-2.5 shadow-sm hover:border-navy/20'
            : 'px-2 py-1.5'
        }`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
      >
        <span>{triggerLabel}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className={`absolute z-50 mt-1 overflow-hidden rounded-lg border border-border bg-white py-1 shadow-lg ${
            variant === 'full' ? 'inset-x-0' : 'end-0 min-w-[9.5rem]'
          }`}
        >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => select(option.value)}
                className={`flex w-full cursor-pointer items-center justify-between px-3 py-2 text-start text-sm transition-colors ${
                  selected
                    ? 'bg-navy/8 font-semibold text-navy'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <span>{option.label}</span>
                {selected && (
                  <svg className="h-4 w-4 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
