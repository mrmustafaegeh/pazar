import { AuthGuard } from '@/components/AuthGuard';
import { AdminShell } from '@/components/admin/AdminShell';
import { Suspense } from 'react';

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-neutral-500">...</div>}>
      <AuthGuard>
        <AdminShell>{children}</AdminShell>
      </AuthGuard>
    </Suspense>
  );
}
