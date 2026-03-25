import { requireAnyAcademicLevelAccess } from '@/lib/guards';

export default async function UndergraduateLayout({ children }: { children: React.ReactNode }) {
  await requireAnyAcademicLevelAccess('UNDERGRADUATE');

  return <>{children}</>;
}
