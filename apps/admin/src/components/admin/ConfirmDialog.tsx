'use client';

import { useTranslations } from 'next-intl';

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations('common');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-pointer bg-neutral-900/40"
        onClick={onCancel}
        aria-label={cancelLabel ?? t('cancel')}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        className="relative w-full max-w-md rounded-lg border border-border bg-white p-5 shadow-lg"
      >
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && <p className="mt-2 text-sm text-neutral-600">{description}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
            {cancelLabel ?? t('cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={destructive ? 'btn-danger-outline bg-destructive text-white hover:bg-destructive/90' : 'btn-primary'}
          >
            {confirmLabel ?? t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
