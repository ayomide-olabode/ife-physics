import { RefHeader } from '@/components/public/header/RefHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { BackToTopButton } from '@/components/public/BackToTopButton';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RefHeader />
      <main className="min-h-screen">{children}</main>
      <PublicFooter />
      <BackToTopButton />
    </>
  );
}
