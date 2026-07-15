'use client';

import type { CategoryAttributeSchema } from '@turkiye-pazaryeri/types';
import { useTranslations } from 'next-intl';
import { translateAttributeLabel, translateAttributeOption } from '@/lib/catalog';
import { DESCRIPTION_MAX } from '@/lib/post-listing';

export function DetailsStep({
  title,
  description,
  attributes,
  attributeSchema,
  fieldErrors,
  onTitleChange,
  onDescriptionChange,
  onAttributeChange,
  onBlurField,
}: {
  title: string;
  description: string;
  attributes: Record<string, unknown>;
  attributeSchema: CategoryAttributeSchema | null;
  fieldErrors: Record<string, string>;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onAttributeChange: (key: string, value: unknown) => void;
  onBlurField: (key: string) => void;
}) {
  const t = useTranslations('postListing');
  const tCommon = useTranslations('common');
  const tAll = useTranslations();

  function renderAttributeField(key: string, field: CategoryAttributeSchema['fields'][string]) {
    const label = translateAttributeLabel(key, tAll, field.label ?? key);
    const value = attributes[key];
    const attrKey = `attributes.${key}`;
    const hasError = Boolean(fieldErrors[attrKey]);

    if (field.type === 'enum' && field.options) {
      return (
        <label key={key} className="block space-y-1.5">
          <span className="text-sm font-medium text-navy">
            {label}
            {field.required ? ` (${tCommon('required')})` : ''}
          </span>
          <select
            className="input-field text-sm"
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onAttributeChange(key, e.target.value)}
            onBlur={() => onBlurField(attrKey)}
            aria-invalid={hasError}
          >
            <option value="">{t('selectOption')}</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>
                {translateAttributeOption(opt, tAll)}
              </option>
            ))}
          </select>
          {hasError && <p className="text-sm text-red-600">{fieldErrors[attrKey]}</p>}
        </label>
      );
    }

    return (
      <label key={key} className="block space-y-1.5">
        <span className="text-sm font-medium text-navy">
          {label}
          {field.required ? ` (${tCommon('required')})` : ''}
        </span>
        <input
          type={field.type === 'number' ? 'number' : 'text'}
          className="input-field text-sm"
          value={value === undefined || value === null ? '' : String(value)}
          onChange={(e) => {
            const next =
              field.type === 'number'
                ? e.target.value === ''
                  ? undefined
                  : Number(e.target.value)
                : e.target.value;
            onAttributeChange(key, next);
          }}
          onBlur={() => onBlurField(attrKey)}
          aria-invalid={hasError}
        />
        {hasError && <p className="text-sm text-red-600">{fieldErrors[attrKey]}</p>}
      </label>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading text-xl font-semibold text-navy">{t('detailsStepTitle')}</h2>
        <p className="mt-1 text-sm text-neutral-500">{t('detailsStepHint')}</p>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-navy">{t('listingTitle')}</span>
        <input
          className="input-field text-sm"
          value={title}
          placeholder={t('titlePlaceholder')}
          onChange={(e) => onTitleChange(e.target.value)}
          onBlur={() => onBlurField('title')}
          aria-invalid={Boolean(fieldErrors.title)}
        />
        {fieldErrors.title && <p className="text-sm text-red-600">{fieldErrors.title}</p>}
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-navy">{t('description')}</span>
        <textarea
          className="input-field min-h-[9rem] resize-y text-sm"
          rows={6}
          value={description}
          placeholder={t('descriptionPlaceholder')}
          onChange={(e) => onDescriptionChange(e.target.value)}
          onBlur={() => onBlurField('description')}
          aria-invalid={Boolean(fieldErrors.description)}
        />
        <div className="flex items-center justify-between gap-2">
          {fieldErrors.description ? (
            <p className="text-sm text-red-600">{fieldErrors.description}</p>
          ) : (
            <span />
          )}
          <p className="text-xs text-neutral-400">
            {t('charCount', { count: description.length, max: DESCRIPTION_MAX })}
          </p>
        </div>
      </label>

      {attributeSchema?.fields && (
        <div className="space-y-4 border-t border-border pt-5">
          <h3 className="font-heading text-sm font-semibold text-navy">{t('categoryAttributes')}</h3>
          {Object.entries(attributeSchema.fields).map(([key, field]) =>
            renderAttributeField(key, field),
          )}
        </div>
      )}
    </div>
  );
}
