import { PageHeader } from '@/components/dashboard/PageHeader';
import { CreateStaffForm } from '@/components/dashboard/CreateStaffForm';
import { BackToParent } from '@/components/dashboard/BackToParent';

export default function NewStaffPage() {
  return (
    <div className="space-y-6">
      <BackToParent href="/dashboard/admin/staff" label="Back to Staff" />
      <PageHeader
        title="Add New Staff"
        description="Create a staff record."
      />
      <div className="rounded-lg border p-8 bg-card">
        <CreateStaffForm />
      </div>
    </div>
  );
}
