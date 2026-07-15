'use client';

import { useEffect, useRef, useState } from 'react';

export function OtpInput({
  value,
  onChange,
  onComplete,
  error,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
}) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const [flashError, setFlashError] = useState(false);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '');

  useEffect(() => {
    if (error) {
      setFlashError(true);
      const timer = window.setTimeout(() => setFlashError(false), 600);
      inputsRef.current[0]?.focus();
      return () => window.clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (value.length === 6) onComplete?.(value);
  }, [value, onComplete]);

  function updateDigit(index: number, digit: string) {
    const next = [...digits];
    next[index] = digit;
    onChange(next.join('').slice(0, 6));
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, '').slice(-1);
    updateDigit(index, digit);
    if (digit && index < 5) inputsRef.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, key: string) {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, 5);
    inputsRef.current[focusIndex]?.focus();
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e.key)}
          className={`h-12 w-10 rounded-lg border bg-white text-center text-lg font-semibold text-navy transition-colors focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20 sm:h-14 sm:w-12 ${
            flashError || error ? 'border-red-600' : 'border-neutral-300'
          }`}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  );
}
