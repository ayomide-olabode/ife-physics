import Link from 'next/link';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { DataTable } from '@/components/dashboard/DataTable';
import { AddNewButton } from '@/components/dashboard/AddNewButton';
import { listStaff } from '@/server/queries/adminStaff';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format-date';
import { formatFullName } from '@/lib/name';

export default async function AdminStaffPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}) {
  const params = await searchParams;
  const q = params.q || '';
  const page = parseInt(params.page || '1', 10);
  const pageSize = parseInt(params.pageSize || '20', 10);

  const { items: staffMembers, total } = await listStaff({ q, page, pageSize });

  const hasNextPage = page * pageSize < total;
  const hasPrevPage = page > 1;

  const rows = staffMembers.map((staff) => [
    <div key="name" className="text-base font-medium">
      {formatFullName({
        firstName: staff.firstName,
        middleName: staff.middleName,
        lastName: staff.lastName,
      }) || staff.institutionalEmail}
    </div>,
    <div key="email" className="text-base text-muted-foreground">
      {staff.institutionalEmail}
    </div>,
    <span key="type" className="text-base">
      {staff.staffType.replace(/_/g, ' ')}
    </span>,
    <span key="status" className="text-base">
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-sm font-medium ${
          staff.staffStatus === 'ACTIVE'
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500'
            : staff.staffStatus === 'FORMER' || staff.staffStatus === 'RETIRED'
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400'
        }`}
      >
        {staff.staffStatus.replace(/_/g, ' ')}
      </span>
    </span>,
    <span key="joined" className="text-base">
      {formatDate(staff.createdAt)}
    </span>,
    <Link
      key="actions"
      href={`/dashboard/admin/staff/${staff.id}`}
      className="text-base font-medium text-primary hover:underline"
    >
      View Details
    </Link>,
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Records"
        description="Manage staff records."
        actions={
          <div className="flex items-center gap-4">
            <form method="GET" action="/dashboard/admin/staff" className="flex items-center gap-2">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search staff..."
                className="h-9 w-64 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-base file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button type="submit" variant="secondary" size="sm">
                Search
              </Button>
            </form>
            <AddNewButton href="/dashboard/admin/staff/new" label="Add Staff" />
          </div>
        }
      />
      <DataTable
        headers={['Name', 'Email', 'Type', 'Status', 'Record Created', 'Actions']}
        rows={rows}
        emptyState={
          <EmptyState
            title="No staff records yet"
            description={
              q ? `No staff matched "${q}".` : 'Add your first staff record to get started.'
            }
          />
        }
        footer={
          total > pageSize ? (
            <div className="flex items-center justify-between text-base text-muted-foreground pt-4">
              <div>
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}{' '}
                staff records
              </div>
              <div className="flex gap-2">
                {hasPrevPage ? (
                  <Link
                    href={`/dashboard/admin/staff?page=${page - 1}&pageSize=${pageSize}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                    className="rounded-md border px-3 py-1 hover:bg-muted"
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="rounded-md border px-3 py-1 opacity-50 cursor-not-allowed">
                    Previous
                  </span>
                )}
                {hasNextPage ? (
                  <Link
                    href={`/dashboard/admin/staff?page=${page + 1}&pageSize=${pageSize}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
                    className="rounded-md border px-3 py-1 hover:bg-muted"
                  >
                    Next
                  </Link>
                ) : (
                  <span className="rounded-md border px-3 py-1 opacity-50 cursor-not-allowed">
                    Next
                  </span>
                )}
              </div>
            </div>
          ) : undefined
        }
      />
    </div>
  );
}
