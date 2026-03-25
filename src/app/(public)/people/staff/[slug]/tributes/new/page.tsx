import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { formatPublicStaffName } from '@/lib/publicName';
import { getPublicStaffBySlug } from '@/server/public/queries/peoplePublic';
import { PublicTributeSubmissionForm } from '@/components/public/tributes/PublicTributeSubmissionForm';

export default async function PublicTributeSubmissionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const staff = await getPublicStaffBySlug(slug);

  if (!staff) {
    notFound();
  }

  const isInMemoriam = staff.isInMemoriam || staff.staffStatus === 'IN_MEMORIAM';
  if (!isInMemoriam) {
    notFound();
  }

  const name =
    formatPublicStaffName({
      firstName: staff.firstName,
      middleName: staff.middleName,
      lastName: staff.lastName,
    }) || staff.institutionalEmail;

  return (
    <main className="container mx-auto max-w-4xl space-y-8 px-4 py-12">
      <section className="space-y-3">
        <Link href={`/people/staff/${slug}?tab=tributes`}>
          <Button variant="outline" size="sm">
            Back to tributes
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Submit a Tribute</h1>
        <p className="text-muted-foreground">
          Share your remembrance for <span className="font-medium text-foreground">{name}</span>.
          Kindly note that all tributes will be moderated for appropriate content, thank you.
        </p>
      </section>

      <PublicTributeSubmissionForm staffSlug={slug} />
    </main>
  );
}
