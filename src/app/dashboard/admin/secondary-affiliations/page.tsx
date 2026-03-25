import Link from 'next/link';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { DataTable } from '@/components/dashboard/DataTable';
import { AddNewButton } from '@/components/dashboard/AddNewButton';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format-date';
import { listSecondaryAffiliations } from '@/server/queries/adminSecondaryAffiliations';
import { requireAuth, requireSuperAdmin } from '@/lib/guards';

export default async function SecondaryAffiliationsIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}) {
  const session = await requireAuth();
  await requireSuperAdmin(session);

  const params = await searchParams;
  const q = params.q || '';
  const page = parseInt(params.page || '1', 10);
  const pageSize = parseInt(params.pageSize || '20', 10);

  const { items, total, totalPages } = await listSecondaryAffiliations({ q, page, pageSize });
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const rows = items.map((item: (typeof items)[number]) => [
    <Link
      key="name"
      href={`/dashboard/admin/secondary-affiliations/${item.id}`}
      className="text-base font-medium text-primary hover:underline"
    >
      {item.name}
    </Link>,
    <span key="acronym" className="text-base text-muted-foreground">
      {item.acronym || '-'}
    </span>,
    <span key="updatedAt" className="text-base">
      {formatDate(item.updatedAt)}
    </span>,
    <Link
      key="action"
      href={`/dashboard/admin/secondary-affiliations/${item.id}`}
      className="text-base font-medium text-primary hover:underline"
    >
      Edit
    </Link>,
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Secondary Affiliations"
        description="Manage secondary affiliations."
        actions={
          <div className="flex items-center gap-4">
            <form
              method="GET"
              action="/dashboard/admin/secondary-affiliations"
              className="flex items-center gap-2"
            >
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search affiliations..."
                className="h-9 w-64 rounded-none border border-input bg-transparent px-3 py-1 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <Button type="submit" variant="secondary" size="sm" className="rounded-none">
                Search
              </Button>
            </form>
            <AddNewButton href="/dashboard/admin/secondary-affiliations/new" label="Add New" />
          </div>
        }
      />

      <DataTable
        headers={['Name', 'Acronym', 'Last Updated', 'Actions']}
        rows={rows}
        emptyState={
          <EmptyState
            title="No secondary affiliations found"
            description={
              q
                ? `No affiliations matched "${q}".`
                : 'Create your first secondary affiliation to get started.'
            }
            action={
              <AddNewButton href="/dashboard/admin/secondary-affiliations/new" label="Add New" />
            }
          />
        }
        footer={
          total > pageSize ? (
            <div className="flex items-center justify-between text-base text-muted-foreground pt-4">
              <div>
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}{' '}
                affiliations
              </div>
              <div className="flex gap-2">
                {hasPrevPage ? (
                  <Link
                    href={`/dashboard/admin/secondary-affiliations?page=${page - 1}&pageSize=${pageSize}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                    className="rounded-none border px-3 py-1 hover:bg-muted"
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="rounded-none border px-3 py-1 opacity-50 cursor-not-allowed">
                    Previous
                  </span>
                )}
                {hasNextPage ? (
                  <Link
                    href={`/dashboard/admin/secondary-affiliations?page=${page + 1}&pageSize=${pageSize}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                    className="rounded-none border px-3 py-1 hover:bg-muted"
                  >
                    Next
                  </Link>
                ) : (
                  <span className="rounded-none border px-3 py-1 opacity-50 cursor-not-allowed">
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
