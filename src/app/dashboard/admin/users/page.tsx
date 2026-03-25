import Link from 'next/link';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { DataTable } from '@/components/dashboard/DataTable';
import { AddNewButton } from '@/components/dashboard/AddNewButton';
import { listUsers } from '@/server/queries/adminUsers';
import { listResearchGroupOptions } from '@/server/queries/researchGroupOptions';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format-date';
import { formatFullName } from '@/lib/name';

const DEGREE_SCOPE_LABELS = {
  GENERAL: 'General',
  UNDERGRADUATE: 'UG',
  POSTGRADUATE: 'PG',
} as const;

const PROGRAMME_SCOPE_LABELS = {
  GENERAL: 'General',
  PHY: 'Physics',
  EPH: 'Engineering Physics',
  SLT: 'Science Laboratory Technology',
} as const;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}) {
  const params = await searchParams;
  const q = params.q || '';
  const page = parseInt(params.page || '1', 10);
  const pageSize = parseInt(params.pageSize || '20', 10);

  const [{ items: users, total }, researchGroups] = await Promise.all([
    listUsers({ q, page, pageSize }),
    listResearchGroupOptions(),
  ]);
  const researchGroupLookup = new Map(
    researchGroups.map((group) => [group.id, group.abbreviation || group.name]),
  );

  const hasNextPage = page * pageSize < total;
  const hasPrevPage = page > 1;

  const rows = users.map((user) => {
    const roleLabels = user.roleAssignments.map((assignment) => {
      if (assignment.role === 'EDITOR') {
        return 'EDITOR';
      }

      if (assignment.role === 'RESEARCH_LEAD') {
        if (assignment.scopeId) {
          const groupName = researchGroupLookup.get(assignment.scopeId);
          if (groupName) {
            return `Research Lead - ${groupName}`;
          }
        }
        return 'Research Lead (scoped)';
      }

      if (
        assignment.role === 'ACADEMIC_COORDINATOR' &&
        assignment.degreeScope &&
        assignment.programmeScope
      ) {
        const degree = DEGREE_SCOPE_LABELS[assignment.degreeScope];
        const programme = PROGRAMME_SCOPE_LABELS[assignment.programmeScope];
        return `${degree} Coordinator - ${programme}`;
      }

      return assignment.role;
    });
    const uniqueRoleLabels = Array.from(new Set(roleLabels));

    return [
      <div key="name" className="text-base">
        <p className="font-medium text-foreground">
          {formatFullName({
            firstName: user.staff.firstName,
            middleName: user.staff.middleName,
            lastName: user.staff.lastName,
          }) || user.staff.institutionalEmail}
        </p>
        {user.isSuperAdmin && (
          <span className="mt-1 inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-sm font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-500">
            SUPER_ADMIN
          </span>
        )}
      </div>,
      <div key="email" className="text-base text-muted-foreground">
        {user.staff.institutionalEmail}
      </div>,
      <span key="roles" className="text-base flex flex-wrap gap-1">
        {uniqueRoleLabels.length > 0 ? (
          uniqueRoleLabels.map((label) => (
            <span
              key={label}
              className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-sm font-medium text-foreground"
            >
              {label}
            </span>
          ))
        ) : (
          <span className="text-muted-foreground">No roles</span>
        )}
      </span>,
      <span key="lastLogin" className="text-base">
        {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
      </span>,
      <Link
        key="actions"
        href={`/dashboard/admin/users/${user.id}`}
        className="text-base font-medium text-primary hover:underline"
      >
        View Details
      </Link>,
    ];
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage user accounts and roles."
        actions={
          <div className="flex items-center gap-4">
            <form method="GET" action="/dashboard/admin/users" className="flex items-center gap-2">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search users..."
                className="h-9 w-64 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-base file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Button type="submit" variant="secondary" size="sm">
                Search
              </Button>
            </form>
            <AddNewButton href="/dashboard/admin/users/new" />
          </div>
        }
      />
      <DataTable
        headers={['Name', 'Email', 'Roles', 'Last Login', 'Actions']}
        rows={rows}
        emptyState={
          <EmptyState
            title="No users yet"
            description={q ? `No users matched "${q}".` : 'Add a user to get started.'}
          />
        }
        footer={
          total > pageSize ? (
            <div className="flex items-center justify-between text-base text-muted-foreground pt-4">
              <div>
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}{' '}
                users
              </div>
              <div className="flex gap-2">
                {hasPrevPage ? (
                  <Link
                    href={`/dashboard/admin/users?page=${page - 1}&pageSize=${pageSize}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
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
                    href={`/dashboard/admin/users?page=${page + 1}&pageSize=${pageSize}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
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
          ) : null
        }
      />
    </div>
  );
}
