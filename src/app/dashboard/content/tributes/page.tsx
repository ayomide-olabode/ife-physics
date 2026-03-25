import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/dashboard/DataTable';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { MarkInMemoriamModal } from '@/components/tributes/MarkInMemoriamModal';
import { requireTributesAccess } from '@/lib/guards';
import { formatDate } from '@/lib/format-date';
import { formatFullName } from '@/lib/name';
import { listInMemoriamStaff } from '@/server/queries/tributesAdmin';

export default async function TributesDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireTributesAccess();

  const params = await searchParams;
  const q = params.q || '';
  const parsedPage = parseInt(params.page || '1', 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const pageSize = 10;

  const { items, total } = await listInMemoriamStaff({ q, page, pageSize });
  const hasNextPage = page * pageSize < total;
  const hasPrevPage = page > 1;

  const rows = items.map((staff) => {
    const fullName = formatFullName({
      firstName: staff.firstName,
      middleName: staff.middleName,
      lastName: staff.lastName,
    });

    const displayName = [staff.title, fullName].filter(Boolean).join(' ').trim() || 'Unnamed staff';

    return [
      <div key="name" className="text-base font-medium">
        {displayName}
      </div>,
      <span key="deathDate" className="text-base">
        {formatDate(staff.dateOfDeath)}
      </span>,
      <span
        key="status"
        className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-sm font-medium text-gray-800 dark:bg-gray-800/50 dark:text-gray-300"
      >
        In Memoriam
      </span>,
      <Link
        key="actions"
        href={`/dashboard/content/tributes/${staff.id}`}
        className="text-base font-medium text-primary hover:underline"
      >
        View
      </Link>,
    ];
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tributes"
        description="Manage tribute records."
        actions={
          <div className="flex items-center gap-4">
            <form
              method="GET"
              action="/dashboard/content/tributes"
              className="flex items-center gap-2"
            >
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search by name or email..."
                className="h-9 w-64 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <Button type="submit" variant="secondary" size="sm">
                Search
              </Button>
            </form>
            <MarkInMemoriamModal />
          </div>
        }
      />

      <DataTable
        headers={['Name', 'Date of Death', 'Status', 'Actions']}
        rows={rows}
        emptyState={
          <EmptyState
            title="No in-memoriam staff yet"
            description={
              q ? `No in-memoriam staff matched "${q}".` : 'Use “Add New” to mark a staff member.'
            }
          />
        }
        footer={
          total > pageSize ? (
            <div className="flex items-center justify-between pt-4 text-base text-muted-foreground">
              <div>
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}{' '}
                staff records
              </div>
              <div className="flex gap-2">
                {hasPrevPage ? (
                  <Link
                    href={`/dashboard/content/tributes?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                    className="rounded-md border px-3 py-1 hover:bg-muted"
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="cursor-not-allowed rounded-md border px-3 py-1 opacity-50">
                    Previous
                  </span>
                )}
                {hasNextPage ? (
                  <Link
                    href={`/dashboard/content/tributes?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                    className="rounded-md border px-3 py-1 hover:bg-muted"
                  >
                    Next
                  </Link>
                ) : (
                  <span className="cursor-not-allowed rounded-md border px-3 py-1 opacity-50">
                    Next
                  </span>
                )}
              </div>
            </div>
          ) : null
        }
      />
    </div>
  );
}
