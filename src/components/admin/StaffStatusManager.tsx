'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { StaffStatus } from '@prisma/client';
import { toast } from 'sonner';
import { updateStaffStatus } from '@/server/actions/adminStaff';
import { STAFF_STATUS_OPTIONS } from '@/lib/options';
import { Button } from '@/components/ui/button';
import { FieldLabel } from '@/components/forms/FieldLabel';

export function StaffStatusManager({
  staffId,
  currentStatus,
}: {
  staffId: string;
  currentStatus: StaffStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [nextStatus, setNextStatus] = useState<StaffStatus>(currentStatus);
  const hasChanged = nextStatus !== currentStatus;

  const onSubmit = () => {
    if (!hasChanged) return;

    startTransition(async () => {
      try {
        const result = await updateStaffStatus({ staffId, staffStatus: nextStatus });
        if (result.unchanged) {
          toast.info('No status change detected.');
          return;
        }
        toast.success('Staff status updated.');
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to update staff status.');
      }
    });
  };

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <h3 className="text-base font-medium text-muted-foreground">Lifecycle Status</h3>
      <div className="space-y-2">
        <FieldLabel htmlFor="staff-status">Staff Status</FieldLabel>
        <select
          id="staff-status"
          value={nextStatus}
          onChange={(e) => setNextStatus(e.target.value as StaffStatus)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {STAFF_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <Button type="button" size="sm" onClick={onSubmit} disabled={isPending || !hasChanged}>
        {isPending ? 'Updating...' : 'Update Status'}
      </Button>
    </div>
  );
}
