'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PublishStatus } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { setLegacyItemStatus } from '@/server/actions/legacyGallery';
import { toastError, toastSuccess } from '@/lib/toast';
import { Loader2 } from 'lucide-react';

export function LegacyGalleryStatusActions({
  itemId,
  currentStatus,
}: {
  itemId: string;
  currentStatus: PublishStatus;
}) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: PublishStatus) => {
    setIsUpdating(true);
    try {
      await setLegacyItemStatus(itemId, newStatus);
      toastSuccess(`Item status changed to ${newStatus}`);
      router.refresh();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to change status.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {currentStatus === PublishStatus.DRAFT && (
        <Button
          size="sm"
          onClick={() => handleStatusChange(PublishStatus.PUBLISHED)}
          disabled={isUpdating}
        >
          {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
          Publish
        </Button>
      )}

      {currentStatus === PublishStatus.PUBLISHED && (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleStatusChange(PublishStatus.DRAFT)}
            disabled={isUpdating}
          >
            {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
            Unpublish to Draft
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleStatusChange(PublishStatus.ARCHIVED)}
            disabled={isUpdating}
          >
            {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
            Archive
          </Button>
        </>
      )}

      {currentStatus === PublishStatus.ARCHIVED && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleStatusChange(PublishStatus.PUBLISHED)}
          disabled={isUpdating}
        >
          {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
          Restore & Publish
        </Button>
      )}
    </div>
  );
}
