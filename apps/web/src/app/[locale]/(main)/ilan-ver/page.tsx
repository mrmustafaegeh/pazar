'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { createListingSchema, type CategoryAttributeSchema } from '@turkiye-pazaryeri/types';
import { PostListingNav } from '@/components/post-listing/PostListingNav';
import { PostListingStepper } from '@/components/post-listing/PostListingStepper';
import { CategoryStep } from '@/components/post-listing/steps/CategoryStep';
import { DetailsStep } from '@/components/post-listing/steps/DetailsStep';
import { PhotosStep } from '@/components/post-listing/steps/PhotosStep';
import { PriceLocationStep } from '@/components/post-listing/steps/PriceLocationStep';
import { ReviewStep } from '@/components/post-listing/steps/ReviewStep';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { translateCategory } from '@/lib/catalog';
import {
  DESCRIPTION_MIN,
  POST_LISTING_STEP_KEYS,
  TITLE_MIN,
} from '@/lib/post-listing';
import { collectFieldErrors, formatApiError } from '@/lib/validation';

const TOTAL_STEPS = POST_LISTING_STEP_KEYS.length;

type CategoryOption = { id: string; slug: string; name: string };
type PricingPlan = {
  tier: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  features: string[];
};

function buildPayload(form: {
  categoryId: string;
  title: string;
  description: string;
  price: string;
  city: string;
  district: string;
  negotiable: boolean;
  attributes: Record<string, unknown>;
}) {
  const attributes = { ...form.attributes };
  if (form.negotiable) attributes.negotiable = true;

  return {
    categoryId: form.categoryId,
    title: form.title,
    description: form.description,
    city: form.city || undefined,
    district: form.district || undefined,
    price: form.price ? Number(form.price) : undefined,
    attributes,
  };
}

export default function PostListingPage() {
  const router = useRouter();
  const t = useTranslations('postListing');
  const tErrors = useTranslations('errors');
  const tAll = useTranslations();

  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [attributeSchema, setAttributeSchema] = useState<CategoryAttributeSchema | null>(null);
  const [listingId, setListingId] = useState<string | null>(null);
  const [images, setImages] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [paymentsOn, setPaymentsOn] = useState(false);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [selectedTier, setSelectedTier] = useState('FREE');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentDone, setPaymentDone] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState<boolean | null>(null);
  const [verifyPhone, setVerifyPhone] = useState('+90');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyMessage, setVerifyMessage] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({
    categoryId: '',
    title: '',
    description: '',
    price: '',
    city: '',
    district: '',
    negotiable: false,
    attributes: {} as Record<string, unknown>,
  });

  const selectedCategory = categories.find((c) => c.id === form.categoryId);

  const update = useCallback((patch: Partial<typeof form>) => {
    setForm((f) => ({ ...f, ...patch }));
  }, []);

  const clearFieldError = useCallback((key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const markTouched = useCallback((key: string) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/giris');
      return;
    }
    api
      .me(token)
      .then((user) => {
        setPhoneVerified(user.phoneVerified);
        if (user.phone) setVerifyPhone(user.phone);
      })
      .catch(() => router.push('/giris'));
  }, [router]);

  useEffect(() => {
    api
      .getCategories()
      .then((cats) => setCategories(cats.map((c) => ({ id: c.id, slug: c.slug, name: c.name }))))
      .catch(() => {
        if (process.env.NODE_ENV !== 'production') {
          setCategories([
            { id: 'dev-vasita', slug: 'vasita', name: 'Vasıta' },
            { id: 'dev-emlak', slug: 'emlak', name: 'Emlak' },
            { id: 'dev-elektronik', slug: 'elektronik', name: 'Elektronik' },
            { id: 'dev-is', slug: 'is', name: 'İş İlanları' },
            { id: 'dev-hizmet', slug: 'hizmet', name: 'Hizmetler' },
            { id: 'dev-mobilya', slug: 'mobilya', name: 'Mobilya & Ev' },
          ]);
          return;
        }
        setError(tErrors('categoriesLoad'));
      });
    api.paymentsEnabled().then((r) => setPaymentsOn(r.enabled)).catch(() => setPaymentsOn(false));
    api.getPricing().then(setPlans).catch(() => setPlans([]));
  }, [tErrors]);

  useEffect(() => {
    const cat = categories.find((c) => c.id === form.categoryId);
    if (!cat) {
      setAttributeSchema(null);
      return;
    }
    api
      .getCategory(cat.slug)
      .then((detail) => {
        setAttributeSchema((detail.attributeSchema as CategoryAttributeSchema) ?? null);
        setForm((f) => ({ ...f, attributes: {} }));
      })
      .catch(() => {
        if (process.env.NODE_ENV !== 'production') {
          const devSchemas: Record<string, CategoryAttributeSchema> = {
            vasita: {
              fields: {
                year: { type: 'number', label: 'Yıl', required: true },
                brand: { type: 'string', label: 'Marka', required: true },
                mileage: { type: 'number', label: 'Kilometre', required: true },
              },
            },
            emlak: {
              fields: {
                roomCount: { type: 'string', label: 'Oda', required: true },
                sqm: { type: 'number', label: 'm²', required: true },
                listingType: { type: 'enum', label: 'Tip', required: true, options: ['satilik', 'kiralik'] },
              },
            },
          };
          setAttributeSchema(devSchemas[cat.slug] ?? null);
          return;
        }
        setAttributeSchema(null);
      });
  }, [form.categoryId, categories]);

  function handleApiError(err: unknown) {
    const message = err instanceof Error ? formatApiError(err.message, tAll) : tErrors('generic');
    if (
      err instanceof Error &&
      (err.message === 'Authentication required' || err.message === 'Refresh token cookie missing')
    ) {
      router.push('/giris');
    }
    return message;
  }

  function validateAttributes(): boolean {
    if (!attributeSchema?.fields) return true;
    let valid = true;
    const nextErrors: Record<string, string> = {};

    for (const [key, field] of Object.entries(attributeSchema.fields)) {
      if (!field.required) continue;
      const value = form.attributes[key];
      if (value === undefined || value === null || value === '') {
        nextErrors[`attributes.${key}`] = tAll('validation.required');
        valid = false;
      }
    }

    if (!valid) setFieldErrors((prev) => ({ ...prev, ...nextErrors }));
    return valid;
  }

  const isStepValid = useMemo(() => {
    if (step === 0) return Boolean(form.categoryId);
    if (step === 1) {
      const titleOk = form.title.trim().length >= TITLE_MIN;
      const descOk = form.description.trim().length >= DESCRIPTION_MIN;
      if (!titleOk || !descOk) return false;
      if (!attributeSchema?.fields) return true;
      return Object.entries(attributeSchema.fields).every(([key, field]) => {
        if (!field.required) return true;
        const value = form.attributes[key];
        return value !== undefined && value !== null && value !== '';
      });
    }
    return true;
  }, [step, form, attributeSchema]);

  function validateStep(currentStep: number, showAll = false): boolean {
    setError('');
    const nextErrors: Record<string, string> = {};

    if (currentStep === 0) {
      if (!form.categoryId) nextErrors.categoryId = tAll('validation.required');
    }

    if (currentStep === 1) {
      if (form.title.trim().length < TITLE_MIN) nextErrors.title = tAll('validation.required');
      if (form.description.trim().length < DESCRIPTION_MIN) {
        nextErrors.description = tAll('validation.required');
      }
      if (attributeSchema?.fields) {
        for (const [key, field] of Object.entries(attributeSchema.fields)) {
          if (!field.required) continue;
          const value = form.attributes[key];
          if (value === undefined || value === null || value === '') {
            nextErrors[`attributes.${key}`] = tAll('validation.required');
          }
        }
      }
    }

    if (currentStep === 3) {
      const result = createListingSchema.safeParse(buildPayload(form));
      if (!result.success) {
        Object.assign(nextErrors, collectFieldErrors(result.error, tAll));
      }
    }

    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      return false;
    }

    setFieldErrors({});
    return true;
  }

  async function sendPhoneVerification() {
    const token = getToken();
    if (!token) return router.push('/giris');
    setVerifyMessage('');
    setError('');
    try {
      await api.sendPhoneOtp(token, verifyPhone);
      setVerifyMessage(t('phoneVerifySent'));
    } catch (err) {
      setError(handleApiError(err));
    }
  }

  async function confirmPhoneVerification() {
    const token = getToken();
    if (!token) return router.push('/giris');
    setVerifyMessage('');
    setError('');
    try {
      await api.verifyPhone(token, verifyPhone, verifyCode);
      setPhoneVerified(true);
      setVerifyMessage(t('phoneVerifySuccess'));
    } catch (err) {
      setError(handleApiError(err));
    }
  }

  async function ensureDraft() {
    const token = getToken();
    if (!token) {
      router.push('/giris');
      throw new Error(tErrors('authRequired'));
    }
    if (phoneVerified === false) throw new Error(tErrors('phoneVerifyRequired'));
    if (listingId) return listingId;

    const payload = createListingSchema.parse(buildPayload(form));
    const listing = await api.createListing(token, payload);
    setListingId(listing.id);
    return listing.id;
  }

  async function uploadImagesWithProgress(id: string) {
    const token = getToken();
    if (!token) return;

    for (const file of images) {
      setUploadProgress((prev) => ({ ...prev, [file.name]: 10 }));
      await api.uploadListingImage(token, id, file);
      setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
    }
  }

  async function handlePackageCheckout() {
    const token = getToken();
    if (!token) throw new Error(tErrors('authRequired'));
    if (selectedTier === 'FREE' || !paymentsOn) {
      setPaymentDone(true);
      return;
    }

    const id = await ensureDraft();
    const checkout = await api.createCheckout(token, {
      listingId: id,
      pricingTier: selectedTier,
      idempotencyKey: `checkout-${id}-${selectedTier}`,
    });
    setPaymentId(checkout.id);

    if (process.env.NODE_ENV !== 'production') {
      await api.confirmPayment(token, checkout.id);
      setPaymentDone(true);
      return;
    }

    if (checkout.checkoutUrl) window.open(checkout.checkoutUrl, '_blank');
  }

  async function handleNext() {
    if (step === 0) markTouched('categoryId');
    if (!validateStep(step, true)) return;

    if (step === 3) {
      setLoading(true);
      try {
        await ensureDraft();
        setStep((s) => s + 1);
      } catch (e) {
        setError(handleApiError(e));
      } finally {
        setLoading(false);
      }
      return;
    }

    setStep((s) => s + 1);
  }

  async function handleSubmit() {
    setError('');
    setLoading(true);
    const token = getToken();
    if (!token) return router.push('/giris');

    try {
      if (paymentsOn && selectedTier !== 'FREE' && !paymentDone) {
        await handlePackageCheckout();
        if (!paymentDone) throw new Error(tErrors('paymentRequired'));
      }

      const id = await ensureDraft();
      if (images.length) await uploadImagesWithProgress(id);
      await api.submitListing(token, id);
      router.push('/ilan-ver/basarili');
    } catch (e) {
      setError(handleApiError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl pb-6">
      <h1 className="font-heading text-2xl font-bold text-navy md:text-3xl">{t('title')}</h1>

      {phoneVerified === false && (
        <section className="card mt-6 space-y-4 border border-amber-200 bg-amber-50/80">
          <h2 className="font-heading font-semibold text-navy">{t('phoneVerifyTitle')}</h2>
          <p className="text-sm text-neutral-600">{t('phoneVerifyBody')}</p>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-navy">{t('phone')}</span>
            <input
              type="tel"
              className="input-field text-sm"
              value={verifyPhone}
              onChange={(e) => setVerifyPhone(e.target.value)}
              placeholder={t('phonePlaceholder')}
            />
          </label>
          <button type="button" onClick={sendPhoneVerification} className="btn-secondary px-4 py-2 text-sm">
            {t('phoneVerifySend')}
          </button>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-navy">{t('phoneVerifyCode')}</span>
            <input
              className="input-field text-sm"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              maxLength={6}
            />
          </label>
          <button type="button" onClick={confirmPhoneVerification} className="btn-primary px-4 py-2 text-sm">
            {t('phoneVerifySubmit')}
          </button>
          {verifyMessage && (
            <p className="text-sm text-navy" role="status">
              {verifyMessage}
            </p>
          )}
        </section>
      )}

      <div className="mt-8">
        <PostListingStepper step={step} />
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="mt-8 rounded-xl border border-border bg-white p-5 shadow-sm sm:p-8">
        {step === 0 && (
          <CategoryStep
            categories={categories}
            selectedId={form.categoryId}
            onSelect={(id) => {
              update({ categoryId: id });
              clearFieldError('categoryId');
            }}
            error={touched.categoryId ? fieldErrors.categoryId : undefined}
          />
        )}

        {step === 1 && (
          <DetailsStep
            title={form.title}
            description={form.description}
            attributes={form.attributes}
            attributeSchema={attributeSchema}
            fieldErrors={fieldErrors}
            onTitleChange={(value) => {
              update({ title: value });
              clearFieldError('title');
            }}
            onDescriptionChange={(value) => {
              update({ description: value });
              clearFieldError('description');
            }}
            onAttributeChange={(key, value) => {
              update({ attributes: { ...form.attributes, [key]: value } });
              clearFieldError(`attributes.${key}`);
            }}
            onBlurField={(key) => {
              markTouched(key);
              if (key.startsWith('attributes.')) validateAttributes();
            }}
          />
        )}

        {step === 2 && (
          <PhotosStep images={images} uploadProgress={uploadProgress} onImagesChange={setImages} />
        )}

        {step === 3 && (
          <PriceLocationStep
            price={form.price}
            city={form.city}
            district={form.district}
            negotiable={form.negotiable}
            fieldErrors={fieldErrors}
            onPriceChange={(value) => {
              update({ price: value });
              clearFieldError('price');
            }}
            onCityChange={(value) => update({ city: value })}
            onDistrictChange={(value) => update({ district: value })}
            onNegotiableChange={(value) => update({ negotiable: value })}
            onBlurField={markTouched}
          />
        )}

        {step === 4 && selectedCategory && (
          <ReviewStep
            form={form}
            categorySlug={selectedCategory.slug}
            categoryName={selectedCategory.name}
            images={images}
            attributeSchema={attributeSchema}
            plans={plans}
            paymentsOn={paymentsOn}
            selectedTier={selectedTier}
            paymentDone={paymentDone}
            onEditStep={setStep}
            onSelectTier={(tier) => {
              setSelectedTier(tier);
              setPaymentDone(tier === 'FREE');
              setPaymentId(null);
            }}
          />
        )}
      </div>

      <PostListingNav
        step={step}
        loading={loading}
        canGoNext={isStepValid}
        isLastStep={step === TOTAL_STEPS - 1}
        onBack={() => setStep((s) => Math.max(0, s - 1))}
        onNext={handleNext}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
