'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

function parseStatValue(value: string): { prefix: string; target: number; suffix: string } {
  const match = value.match(/^(\+?)(\d+)(.*)$/);
  if (!match) return { prefix: '', target: 0, suffix: value };
  return { prefix: match[1] ?? '', target: Number(match[2]), suffix: match[3] ?? '' };
}

export function CountUp({
  value,
  className = '',
  duration = 1.2,
}: {
  value: string;
  className?: string;
  duration?: number;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const { prefix, target, suffix } = parseStatValue(value);
  const [display, setDisplay] = useState(reduced ? value : `${prefix}0${suffix}`);

  useEffect(() => {
    if (!inView || reduced) {
      setDisplay(value);
      return;
    }

    let start: number | null = null;
    let frame = 0;

    function tick(ts: number) {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / (duration * 1000), 1);
      const eased = 1 - (1 - progress) ** 3;
      const current = Math.round(target * eased);
      setDisplay(`${prefix}${current}${suffix}`);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduced, value, prefix, target, suffix, duration]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}

export function MotionCountUp({
  value,
  className = '',
}: {
  value: string;
  className?: string;
}) {
  return <CountUp value={value} className={className} />;
}
