'use client';

import { useTranslations } from 'next-intl';

const REJECT_REASON_KEYS = [
  'inappropriate',
  'wrongCategory',
  'duplicate',
  'missingInfo',
  'fraud',
  'other',
] as const;

export type RejectReasonKey = (typeof REJECT_REASON_KEYS)[number];

export function RejectDialog({
  open,
  title,
  loading,
  reasonKey,
  note,
  onReasonKeyChange,
  onNoteChange,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  loading?: boolean;
  reasonKey: RejectReasonKey;
  note: string;
  onReasonKeyChange: (key: RejectReasonKey) => void;
  onNoteChange: (note: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations('moderation');
  const tCommon = useTranslations('common');

  if (!open) return null;

  const canConfirm = reasonKey !== 'other' || note.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 cursor-pointer bg-neutral-900/40" onClick={onCancel} aria-label={tCommon('cancel')} />
      <div role="alertdialog" aria-modal="true" className="relative w-full max-w-md rounded-lg border border-border bg-white p-5 shadow-lg">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm text-neutral-600">{t('rejectReasonHint')}</p>

        <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-neutral-500">{t('rejectReasonLabel')}</label>
        <select
          className="select-field mt-2 w-full"
          value={reasonKey}
          onChange={(e) => onReasonKeyChange(e.target.value as RejectReasonKey)}
        >
          {REJECT_REASON_KEYS.map((key) => (
            <option key={key} value={key}>
              {t(`rejectReasons.${key}`)}
            </option>
          ))}
        </select>

        <textarea
          className="input-field mt-3"
          rows={2}
          placeholder={t('rejectNotePlaceholder')}
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
        />

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
            {tCommon('cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || !canConfirm}
            className="rounded-lg border border-destructive bg-destructive px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-destructive/90 disabled:opacity-50"
          >
            {t('reject')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function buildRejectReason(
  reasonKey: RejectReasonKey,
  note: string,
  translate: (key: string) => string,
) {
  const base = translate(`rejectReasons.${reasonKey}`);
  if (reasonKey === 'other') return note.trim();
  return note.trim() ? `${base}: ${note.trim()}` : base;
}
