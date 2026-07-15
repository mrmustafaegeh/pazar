import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function SuccessPage() {
  const t = await getTranslations('postListing');
  const tNav = await getTranslations('nav');

  return (
    <div className="mx-auto max-w-lg py-8 text-center">
      <div className="rounded-2xl border border-border bg-white p-8 shadow-sm sm:p-10">
        <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-navy text-white">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <h1 className="font-heading text-2xl font-bold text-navy">{t('successTitle')}</h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">{t('successBody')}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className="btn-primary px-6 py-2.5 text-sm">
            {tNav('home')}
          </Link>
          <Link href="/ilan-ver" className="btn-secondary px-6 py-2.5 text-sm">
            {t('myListingsLink')}
          </Link>
        </div>
      </div>
    </div>
  );
}
