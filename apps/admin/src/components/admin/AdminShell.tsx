'use client';

import { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { ToastProvider } from './Toast';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </ToastProvider>
  );
}
