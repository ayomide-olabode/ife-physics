'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { deleteStaff } from '@/server/actions/adminStaff';

export function DeleteStaffButton({
  staffId,
  staffDisplayName,
}: {
  staffId: string;
  staffDisplayName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteStaff({ staffId });
      toast.success('Staff record deleted.');
      router.push('/dashboard/admin/staff');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete staff record.');
      throw error;
    }
  };

  return (
    <>
      <Button type="button" variant="destructive" onClick={() => setOpen(true)}>
        Delete Staff Record
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete staff record?"
        description={`This will permanently delete ${staffDisplayName} and any linked user account and profile data. This action cannot be undone.`}
        confirmText="Delete Staff"
        cancelText="Cancel"
        destructive
        onConfirm={handleDelete}
      />
    </>
  );
}
