const STAT_COLORS = ['primary', 'accent', 'secondary', 'destructive'] as const;

export function StatCard({
  label,
  value,
  hint,
  index = 0,
}: {
  label: string;
  value: string | number;
  hint?: string;
  index?: number;
}) {
  const color = STAT_COLORS[index % STAT_COLORS.length];

  return (
    <div className="admin-stat group">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">{label}</p>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-${color}/10 text-${color}`}
          style={{
            backgroundColor: `color-mix(in srgb, var(--color-${color}) 12%, transparent)`,
            color: `var(--color-${color})`,
          }}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </span>
      </div>
      <p className="mt-3 font-heading text-3xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-foreground/50">{hint}</p>}
    </div>
  );
}
