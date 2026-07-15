'use client';

import { usePathname } from '@/i18n/navigation';

export function MainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <main
      className={`mx-auto w-full max-w-7xl flex-1 px-4 ${
        isHome ? 'pb-6 pt-0 md:pb-10' : 'py-6 md:py-10'
      }`}
    >
      {children}
    </main>
  );
}
