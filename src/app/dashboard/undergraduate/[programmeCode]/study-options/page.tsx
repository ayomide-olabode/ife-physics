import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ programmeCode: string }>;
}

export default async function RedirectStudyOptionsList({ params }: PageProps) {
  const resolvedParams = await params;
  return redirect(
    `/dashboard/undergraduate/${resolvedParams.programmeCode.toLowerCase()}/overview`,
  );
}
