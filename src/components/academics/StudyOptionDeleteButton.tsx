'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ProgrammeCode } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { toastSuccess, toastError } from '@/lib/toast';
import { deleteStudyOption } from '@/server/actions/undergraduateStudyOptions';

interface StudyOptionDeleteButtonProps {
  programmeCode: ProgrammeCode;
  studyOptionId: string;
}

export function StudyOptionDeleteButton({
  programmeCode,
  studyOptionId,
}: StudyOptionDeleteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      try {
        const res = await deleteStudyOption(programmeCode, studyOptionId);
        if (res.success) {
          toastSuccess('Study option deleted.');
          router.push(`/dashboard/undergraduate/${programmeCode.toLowerCase()}/study-options`);
        } else {
          toastError(res.error || 'Failed to delete.');
        }
      } catch {
        toastError('An unexpected error occurred.');
      } finally {
        setConfirming(false);
      }
    });
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
        <Button variant="destructive" size="sm" disabled={isPending} onClick={handleDelete}>
          {isPending ? 'Deleting…' : 'Confirm Delete'}
        </Button>
      </div>
    );
  }

  return (
    <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}>
      Delete
    </Button>
  );
}
