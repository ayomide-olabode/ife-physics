'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { setHistoryStatus } from '@/server/actions/history';
import { toastSuccess, toastError } from '@/lib/toast';
import { StatusBadge, type PublishStatus } from '@/components/dashboard/StatusBadge';
import { CheckCircle2, Archive, FileEdit } from 'lucide-react';

export function HistoryStatusActions({
  historyId,
  currentStatus,
}: {
  historyId: string;
  currentStatus: PublishStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<PublishStatus>(currentStatus);

  const handleStatusChange = (newStatus: PublishStatus) => {
    startTransition(async () => {
      try {
        await setHistoryStatus(historyId, newStatus);
        setStatus(newStatus);
        toastSuccess(`Status changed to ${newStatus}`);
        router.refresh();
      } catch (err: unknown) {
        toastError(err instanceof Error ? err.message : 'Failed to change status.');
      } finally {
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-base font-medium text-muted-foreground">Current Status</span>
        <StatusBadge status={status} />
      </div>

      <div className="space-y-2 pt-4">
        {status !== 'PUBLISHED' && (
          <Button
            className="w-full justify-start"
            variant="default"
            onClick={() => handleStatusChange('PUBLISHED')}
            disabled={isPending}
          >
            <CheckCircle2 className="h-4 w-4" />
            Publish Entry
          </Button>
        )}

        {status === 'PUBLISHED' && (
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={() => handleStatusChange('DRAFT')}
            disabled={isPending}
          >
            <FileEdit className="h-4 w-4" />
            Revert to Draft
          </Button>
        )}

        {status !== 'ARCHIVED' && (
          <Button
            className="w-full justify-start text-destructive"
            variant="outline"
            onClick={() => handleStatusChange('ARCHIVED')}
            disabled={isPending}
          >
            <Archive className="h-4 w-4" />
            Archive Entry
          </Button>
        )}
      </div>
    </div>
  );
}
