'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProgrammeCode, ProgramLevel } from '@prisma/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toastSuccess, toastError } from '@/lib/toast';
import { unlinkStudyOptionFromProgram } from '@/server/actions/programStudyOptions';

interface Props {
  programmeCode: ProgrammeCode;
  level: ProgramLevel;
  programStudyOptionId: string;
}

export function ProgramStudyOptionUnlinkButton({
  programmeCode,
  level,
  programStudyOptionId,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUnlink = async () => {
    setIsDeleting(true);
    const res = await unlinkStudyOptionFromProgram({
      programmeCode,
      level,
      programStudyOptionId,
    });
    if (res.success) {
      toastSuccess('Study option unlinked from programme successfully.');
      setOpen(false);
      router.refresh();
      if (level === 'POSTGRADUATE') {
        router.push(`/dashboard/postgraduate/${programmeCode.toLowerCase()}/overview`);
      } else {
        router.push(`/dashboard/undergraduate/${programmeCode.toLowerCase()}/study-options`);
      }
    } else {
      toastError(res.error || 'Failed to unlink study option.');
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Unlink
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure you want to unlink this study option?</DialogTitle>
          <DialogDescription>
            This will remove the study option from this programme. The study option and its course
            mappings will remain in the global bucket.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleUnlink} disabled={isDeleting}>
            {isDeleting ? 'Unlinking...' : 'Unlink'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
