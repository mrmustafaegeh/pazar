import type { ListingStatus } from '@/lib/status';

const STYLES: Record<ListingStatus | 'ACTIVE' | 'SUSPENDED' | 'VERIFIED', string> = {
  PENDING: 'bg-amber-50 text-amber-800 ring-amber-200',
  APPROVED: 'bg-green-50 text-green-800 ring-green-200',
  REJECTED: 'bg-red-50 text-red-800 ring-red-200',
  DRAFT: 'bg-neutral-100 text-neutral-700 ring-neutral-200',
  EXPIRED: 'bg-neutral-100 text-neutral-600 ring-neutral-200',
  ACTIVE: 'bg-green-50 text-green-800 ring-green-200',
  SUSPENDED: 'bg-red-50 text-red-800 ring-red-200',
  VERIFIED: 'bg-green-50 text-green-800 ring-green-200',
};

export function StatusBadge({
  status,
  label,
}: {
  status: ListingStatus | 'ACTIVE' | 'SUSPENDED' | 'VERIFIED';
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${STYLES[status]}`}
    >
      {label}
    </span>
  );
}
