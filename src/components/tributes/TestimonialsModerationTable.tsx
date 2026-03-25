'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TestimonialStatus } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/dashboard/DataTable';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { formatDate } from '@/lib/format-date';
import { toastError, toastSuccess } from '@/lib/toast';
import { approveTestimonial, declineTestimonial } from '@/server/actions/testimonialsAdmin';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FieldLabel } from '@/components/forms/FieldLabel';

type TestimonialRow = {
  id: string;
  name: string;
  relationship: string;
  tributeHtml: string;
  submittedAt: Date;
  status: TestimonialStatus;
};

interface TestimonialsModerationTableProps {
  staffId: string;
  items: TestimonialRow[];
  total: number;
  page: number;
  pageSize: number;
  status?: TestimonialStatus;
}

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function getStatusBadgeClass(status: TestimonialStatus): string {
  if (status === 'APPROVED') {
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500';
  }
  if (status === 'DECLINED') {
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500';
  }
  return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500';
}

export function TestimonialsModerationTable({
  staffId,
  items,
  total,
  page,
  pageSize,
  status,
}: TestimonialsModerationTableProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [declineTarget, setDeclineTarget] = useState<TestimonialRow | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  const hasNextPage = page * pageSize < total;
  const hasPrevPage = page > 1;

  const statusQuery = useMemo(() => {
    return status ? `&status=${encodeURIComponent(status)}` : '';
  }, [status]);

  async function handleApprove(id: string) {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await approveTestimonial(id);
      if (!res.success) {
        toastError(res.error || 'Failed to approve tribute.');
        return;
      }
      toastSuccess('Tribute approved.');
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  function openDeclineModal(row: TestimonialRow) {
    if (isSubmitting) return;
    setDeclineTarget(row);
    setDeclineReason('');
    setDeclineModalOpen(true);
  }

  async function submitDecline(e: FormEvent) {
    e.preventDefault();
    if (!declineTarget || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await declineTestimonial(declineTarget.id, declineReason || undefined);
      if (!res.success) {
        toastError(res.error || 'Failed to decline tribute.');
        return;
      }
      toastSuccess('Tribute declined.');
      setDeclineModalOpen(false);
      setDeclineTarget(null);
      setDeclineReason('');
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  const rows = items.map((row) => [
    <div key="name" className="text-base">
      <p className="font-medium text-foreground">{row.name}</p>
      <p className="text-muted-foreground">{row.relationship}</p>
    </div>,
    <div key="tribute" className="text-base text-muted-foreground max-w-xl">
      <p className="line-clamp-3">{stripHtml(row.tributeHtml)}</p>
    </div>,
    <span key="submittedAt" className="text-base">
      {formatDate(row.submittedAt)}
    </span>,
    <span
      key="status"
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-sm font-medium ${getStatusBadgeClass(row.status)}`}
    >
      {row.status}
    </span>,
    <div key="actions" className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => openDeclineModal(row)}
        disabled={isSubmitting}
      >
        Decline
      </Button>
      <Button
        type="button"
        size="sm"
        onClick={() => handleApprove(row.id)}
        disabled={isSubmitting || row.status === 'APPROVED'}
      >
        Approve
      </Button>
    </div>,
  ]);

  return (
    <>
      <DataTable
        headers={['Contributor', 'Tribute', 'Submitted', 'Status', 'Actions']}
        rows={rows}
        emptyState={
          <EmptyState
            title="No tributes yet"
            description="Submitted tributes for this staff member will appear here."
          />
        }
        footer={
          total > pageSize ? (
            <div className="flex items-center justify-between pt-4 text-base text-muted-foreground">
              <div>
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}{' '}
                tributes
              </div>
              <div className="flex gap-2">
                {hasPrevPage ? (
                  <Link
                    href={`/dashboard/content/tributes/${staffId}?page=${page - 1}${statusQuery}`}
                    className="rounded-md border px-3 py-1 hover:bg-muted"
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="cursor-not-allowed rounded-md border px-3 py-1 opacity-50">
                    Previous
                  </span>
                )}
                {hasNextPage ? (
                  <Link
                    href={`/dashboard/content/tributes/${staffId}?page=${page + 1}${statusQuery}`}
                    className="rounded-md border px-3 py-1 hover:bg-muted"
                  >
                    Next
                  </Link>
                ) : (
                  <span className="cursor-not-allowed rounded-md border px-3 py-1 opacity-50">
                    Next
                  </span>
                )}
              </div>
            </div>
          ) : null
        }
      />

      <Dialog open={declineModalOpen} onOpenChange={setDeclineModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Tribute</DialogTitle>
            <DialogDescription>
              Decline this tribute. You can optionally add a reason for moderation records.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitDecline} className="space-y-4">
            <div className="space-y-2">
              <FieldLabel htmlFor="declineReason">Reason (Optional)</FieldLabel>
              <textarea
                id="declineReason"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                rows={4}
                maxLength={500}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Optional explanation..."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDeclineModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isSubmitting}>
                {isSubmitting ? 'Declining...' : 'Decline'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
