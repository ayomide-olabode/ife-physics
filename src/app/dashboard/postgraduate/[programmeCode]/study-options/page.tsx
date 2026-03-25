import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ programmeCode: string }>;
}

export default async function RedirectPostgraduateStudyOptionsList({ params }: PageProps) {
  const resolvedParams = await params;
  return redirect(`/dashboard/postgraduate/${resolvedParams.programmeCode.toLowerCase()}/overview`);
}
