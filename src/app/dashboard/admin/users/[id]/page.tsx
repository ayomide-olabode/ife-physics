import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataTable } from '@/components/dashboard/DataTable';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { RoleAssignmentManager } from '@/components/admin/RoleAssignmentManager';
import { getUserById } from '@/server/queries/adminUsers';
import { listResearchGroupOptions } from '@/server/queries/researchGroupOptions';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { formatDate } from '@/lib/format-date';
import { formatFullName } from '@/lib/name';

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, researchGroups] = await Promise.all([getUserById(id), listResearchGroupOptions()]);

  if (!user) {
    notFound();
  }

  const leadershipRows = user.staff.leadershipTerms.map((term) => [
    <span key="role" className="font-medium text-base">
      {term.role}
    </span>,
    <span key="programme" className="text-base">
      {term.programmeCode || '-'}
    </span>,
    <span key="start" className="text-base">
      {formatDate(term.startDate)}
    </span>,
    <span key="end" className="text-base">
      {term.endDate ? formatDate(term.endDate) : 'Present'}
    </span>,
  ]);

  const fullName =
    formatFullName({
      firstName: user.staff.firstName,
      middleName: user.staff.middleName,
      lastName: user.staff.lastName,
    }) || user.staff.institutionalEmail;

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <BackToParent href="/dashboard/admin/users" label="Back to Users" />
        <PageHeader
          title={fullName}
          description="Manage this user account."
          actions={
            user.isSuperAdmin && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-base font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-500">
                Super Admin
              </span>
            )
          }
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h3 className="text-base font-medium text-muted-foreground">Account Details</h3>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-base">User ID:</span>
              <span className="text-base font-medium">{user.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base">Staff ID:</span>
              <span className="text-base font-medium">{user.staff.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base">Account Status:</span>
              <span className="text-base font-medium">
                {user.passwordHash === '' ? (
                  <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-sm font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">
                    INVITED
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-500">
                    ACTIVE
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-base">Joined:</span>
              <span className="text-base font-medium">{formatDate(user.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base">Last Login:</span>
              <span className="text-base font-medium">
                {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Role Assignments</h2>
        <RoleAssignmentManager
          userId={user.id}
          assignments={user.roleAssignments}
          researchGroups={researchGroups}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Leadership Terms</h2>
        <DataTable
          headers={['Role', 'Programme', 'Start Date', 'End Date']}
          rows={leadershipRows}
          emptyState={
            <EmptyState
              title="No leadership terms yet"
              description="This user has no leadership terms recorded."
            />
          }
        />
      </div>
    </div>
  );
}
