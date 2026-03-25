import Link from 'next/link';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { BackToParent } from '@/components/dashboard/BackToParent';
import { CreateUserForm } from '@/components/dashboard/CreateUserForm';

export default function CreateUserPage() {
  return (
    <div className="space-y-6">
      <div className="mb-4">
        <BackToParent href="/dashboard/admin/users" label="Back to Users" />
        <PageHeader
          title="Create User"
          description="Create a user account."
          actions={
            <Button size="sm" variant="outline" asChild>
              <Link href="/dashboard/admin/staff/new">
                <Plus className="h-4 w-4" />
                Create New Staff
              </Link>
            </Button>
          }
        />
      </div>

      <CreateUserForm />
    </div>
  );
}
