import { Header, Footer } from '@/components/Header';
import { MainShell } from '@/components/MainShell';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <MainShell>{children}</MainShell>
      <Footer />
    </>
  );
}
