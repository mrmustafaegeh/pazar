import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { CATEGORY_IMAGES } from '@/lib/post-listing';

interface CategoryCardProps {
  slug: string;
  name: string;
  browseLabel: string;
}

export function CategoryCard({ slug, name, browseLabel }: CategoryCardProps) {
  const image = CATEGORY_IMAGES[slug] ?? CATEGORY_IMAGES.elektronik;

  return (
    <Link
      href={`/kategori/${slug}`}
      className="group relative block overflow-hidden rounded-xl shadow-md transition-shadow duration-200 ease-out hover:shadow-lg"
    >
      <CategoryCardVisual image={image} name={name} subtitle={browseLabel} />
    </Link>
  );
}

export function SelectableCategoryCard({
  slug,
  name,
  browseLabel,
  selected,
  onSelect,
}: {
  slug: string;
  name: string;
  browseLabel: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const image = CATEGORY_IMAGES[slug] ?? CATEGORY_IMAGES.elektronik;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={name}
      className={`group relative block w-full cursor-pointer overflow-hidden rounded-xl text-start shadow-md transition-all duration-200 ease-out hover:shadow-lg ${
        selected ? 'ring-2 ring-navy ring-offset-2' : ''
      }`}
      aria-pressed={selected}
    >
      <CategoryCardVisual image={image} name={name} subtitle={browseLabel} />
      {selected && (
        <span className="absolute end-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-navy text-white shadow-sm">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}
    </button>
  );
}

function CategoryCardVisual({
  image,
  name,
  subtitle,
}: {
  image: string;
  name: string;
  subtitle: string;
}) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden">
      <Image
        src={image}
        alt=""
        fill
        className="object-cover transition-transform duration-200 ease-out group-hover:scale-105"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/25 to-transparent"
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 p-4 text-start text-white">
        <p className="font-heading text-lg font-bold leading-tight md:text-xl">{name}</p>
        <p className="mt-1 text-sm font-medium text-white/80">{subtitle}</p>
      </div>
    </div>
  );
}
