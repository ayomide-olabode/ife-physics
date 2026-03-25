import Image from 'next/image';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { AddNewButton } from '@/components/dashboard/AddNewButton';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { formatDate } from '@/lib/format-date';
import { formatFullName } from '@/lib/name';
import { getCurrentHodTerm, listPastHodTerms } from '@/server/queries/leadershipTerms';

export default async function AdminLeadershipPage() {
  const [currentHod, pastHods] = await Promise.all([getCurrentHodTerm(), listPastHodTerms()]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Leadership"
        description="Manage Head of Department terms."
        actions={<AddNewButton href="/dashboard/admin/leadership/new" label="Update HOD" />}
      />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Current HOD</h2>
        {currentHod ? (
          <article className="rounded-md border bg-card p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative h-24 w-24 overflow-hidden rounded-md bg-muted">
                {currentHod.staff.profileImageUrl ? (
                  <Image
                    src={currentHod.staff.profileImageUrl}
                    alt={formatFullName(currentHod.staff) || currentHod.staff.institutionalEmail}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : null}
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">
                  {formatFullName(currentHod.staff) || currentHod.staff.institutionalEmail}
                </h3>
                <p className="text-base text-muted-foreground">
                  Start: {formatDate(currentHod.startDate)}
                  {currentHod.endDate ? ` • End: ${formatDate(currentHod.endDate)}` : ' • Ongoing'}
                </p>
              </div>
            </div>
          </article>
        ) : (
          <EmptyState title="No current HOD" description="Use Update HOD to assign a term." />
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Past HODs</h2>
        {pastHods.length === 0 ? (
          <EmptyState title="No past HOD records" description="Past terms will appear here." />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {pastHods.map((term) => (
              <article key={term.id} className="rounded-md border bg-card p-4">
                <h3 className="font-semibold">
                  {formatFullName(term.staff) || term.staff.institutionalEmail}
                </h3>
                <p className="text-base text-muted-foreground">
                  {formatDate(term.startDate)} -{' '}
                  {term.endDate ? formatDate(term.endDate) : 'Present'}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
