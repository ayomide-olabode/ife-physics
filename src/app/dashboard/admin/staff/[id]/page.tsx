import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataTable } from '@/components/dashboard/DataTable';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { getStaffById } from '@/server/queries/adminStaff';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { formatDate } from '@/lib/format-date';
import { formatFullName } from '@/lib/name';
import { StaffInviteControls } from '@/components/admin/StaffInviteControls';
import { StaffStatusManager } from '@/components/admin/StaffStatusManager';
import { StaffPublicVisibilityManager } from '@/components/admin/StaffPublicVisibilityManager';
import { DeleteStaffButton } from '@/components/admin/DeleteStaffButton';

export default async function AdminStaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const staff = await getStaffById(id);

  if (!staff) {
    notFound();
  }

  const leadershipRows = staff.leadershipTerms.map((term) => [
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

  const fullName = formatFullName({
    firstName: staff.firstName,
    middleName: staff.middleName,
    lastName: staff.lastName,
  });
  const hasName = Boolean(fullName);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <BackToParent href="/dashboard/admin/staff" label="Back to Staff" />
          <div className="flex items-center gap-3">
            <PageHeader
              title={fullName || staff.institutionalEmail}
              description="Manage this staff record."
              actions={
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-base font-medium ${
                    staff.staffStatus === 'ACTIVE'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500'
                  }`}
                >
                  {staff.staffStatus.replace(/_/g, ' ')}
                </span>
              }
            />
            {!hasName && (
              <span className="inline-flex items-center rounded-sm bg-destructive/10 px-2 py-1 text-sm font-medium text-destructive mt-1">
                PROFILE INCOMPLETE
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h3 className="text-base font-medium text-muted-foreground">Staff Details</h3>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-base">Staff ID:</span>
              <span className="text-base font-medium">{staff.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base">Type:</span>
              <span className="text-base font-medium">{staff.staffType.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base">Record Created:</span>
              <span className="text-base font-medium">{formatDate(staff.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base">Public Profile:</span>
              <span className="text-base font-medium">
                {staff.isPublicProfile ? 'Visible' : 'Hidden'}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-medium text-muted-foreground">User System Access</h3>
            {!staff.user && (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/dashboard/admin/users/new?staffId=${staff.id}`}>
                  <Plus className="h-4 w-4" />
                  Create user shell
                </Link>
              </Button>
            )}
          </div>

          {staff.user ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-base">Account Status:</span>
                <span className="text-base font-medium">
                  {staff.user.passwordHash === '' ? (
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
                <span className="text-base">Super Admin:</span>
                <span className="text-base font-medium">
                  {staff.user.isSuperAdmin ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-base">Last Login:</span>
                <span className="text-base font-medium text-muted-foreground">
                  {staff.user.lastLoginAt ? formatDate(staff.user.lastLoginAt) : 'Never'}
                </span>
              </div>
              {staff.user.passwordHash === '' ? (
                <div className="pt-2">
                  <StaffInviteControls staffId={staff.id} />
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-base text-muted-foreground">
              No system user account has been provisioned for this staff record yet.
            </p>
          )}
        </div>

        <StaffStatusManager staffId={staff.id} currentStatus={staff.staffStatus} />
        <StaffPublicVisibilityManager
          staffId={staff.id}
          currentIsPublicProfile={staff.isPublicProfile}
        />

        <div className="rounded-lg border border-destructive p-4 space-y-3">
          <h3 className="text-base font-medium text-destructive">Danger Zone</h3>
          <p className="text-base text-muted-foreground">
            Delete this staff record and its linked user account from the system.
          </p>
          <DeleteStaffButton
            staffId={staff.id}
            staffDisplayName={fullName || staff.institutionalEmail}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Leadership Terms</h2>
        <DataTable
          headers={['Role', 'Programme', 'Start Date', 'End Date']}
          rows={leadershipRows}
          emptyState={
            <EmptyState
              title="No leadership terms yet"
              description="This staff member has no leadership terms recorded."
            />
          }
        />
      </div>
    </div>
  );
}
