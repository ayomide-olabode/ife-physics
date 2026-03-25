import { requireAnyAcademicLevelAccess } from '@/lib/guards';

export default async function PostgraduateLayout({ children }: { children: React.ReactNode }) {
  await requireAnyAcademicLevelAccess('POSTGRADUATE');

  return <>{children}</>;
}
