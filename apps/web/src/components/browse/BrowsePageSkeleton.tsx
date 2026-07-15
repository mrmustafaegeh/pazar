import { FeaturedListingSkeleton } from '@/components/FeaturedListings';

export function BrowsePageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-4 w-56 animate-pulse rounded bg-neutral-200" />

      <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 max-w-full animate-pulse rounded bg-neutral-200 md:h-9 md:w-64" />
          <div className="h-4 w-24 animate-pulse rounded bg-neutral-200" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-24 animate-pulse rounded-lg bg-neutral-200 lg:hidden" />
          <div className="h-10 w-28 animate-pulse rounded-lg bg-neutral-200 lg:hidden" />
          <div className="hidden h-10 w-44 animate-pulse rounded-lg bg-neutral-200 lg:block" />
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)] lg:gap-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4 rounded-xl border border-border bg-white p-5 shadow-sm">
            <div className="h-5 w-20 animate-pulse rounded bg-neutral-200" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2 border-t border-border pt-4 first:border-t-0 first:pt-0">
                <div className="h-4 w-24 animate-pulse rounded bg-neutral-200" />
                <div className="h-24 animate-pulse rounded-lg bg-neutral-100" />
              </div>
            ))}
            <div className="h-10 animate-pulse rounded-lg bg-neutral-200" />
          </div>
        </aside>

        <div className="min-w-0">
          <FeaturedListingSkeleton layout="sidebar" />
        </div>
      </div>
    </div>
  );
}
