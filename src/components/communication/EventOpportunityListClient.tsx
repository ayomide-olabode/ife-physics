'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { StatusBadge, type PublishStatus } from '@/components/dashboard/StatusBadge';
import { DataTable } from '@/components/dashboard/DataTable';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { deleteEventOpportunity } from '@/server/actions/eventsOpportunities';
import { toastSuccess, toastError } from '@/lib/toast';
import { formatDate } from '@/lib/format-date';

const CATEGORY_LABELS: Record<string, string> = {
  SEMINAR: 'Seminar',
  LECTURE: 'Lecture',
  COLLOQUIUM: 'Colloquium',
  WORKSHOP: 'Workshop',
  TRAINING: 'Training',
  THESIS_DEFENSE: 'Thesis Defense',
  CONFERENCE: 'Conference',
  SYMPOSIUM: 'Symposium',
  SCHOOL: 'School',
  MEETING: 'Meeting',
  SOCIAL: 'Social',
  OUTREACH: 'Outreach',
  COMPETITION: 'Competition',
  GRANT: 'Grant',
  FUNDING: 'Funding',
  FELLOWSHIP: 'Fellowship',
  SCHOLARSHIP: 'Scholarship',
  JOBS: 'Jobs',
  INTERNSHIPS: 'Internships',
  EXCHANGE: 'Exchange',
  COLLABORATION: 'Collaboration',
};

type ListItem = {
  id: string;
  title: string;
  type: string;
  eventCategory: string | null;
  opportunityCategory: string | null;
  startDate: Date | null;
  endDate: Date | null;
  deadline: Date | null;
  status: PublishStatus;
};

type PaginationInfo = {
  page: number;
  totalPages: number;
  total: number;
};

export function EventOpportunityListClient({
  items,
  pagination,
  basePath,
}: {
  items: ListItem[];
  pagination: PaginationInfo;
  basePath: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await deleteEventOpportunity(deleteTarget);
      if (res.success) {
        toastSuccess('Deleted.');
        router.refresh();
      } else {
        toastError(res.error || 'Failed to delete.');
      }
      setDeleteTarget(null);
    });
  };

  const categoryLabel = (item: ListItem) => {
    const cat = item.eventCategory || item.opportunityCategory;
    return cat ? CATEGORY_LABELS[cat] || cat : '—';
  };

  const headers = ['Title', 'Type', 'Category', 'Dates', 'Deadline', 'Status', 'Actions'];
  const rows = items.map((item) => [
    <Link
      key={`t-${item.id}`}
      href={`${basePath}/${item.id}`}
      className="font-medium text-primary hover:underline"
    >
      {item.title}
    </Link>,
    <span
      key={`t-${item.id}`}
      className="inline-flex items-center rounded-full px-2 py-0.5 text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
    >
      {item.type === 'EVENT' ? 'Event' : 'Opportunity'}
    </span>,
    <span key={`c-${item.id}`} className="text-base">
      {categoryLabel(item)}
    </span>,
    <span key={`d-${item.id}`} className="text-base text-muted-foreground">
      {formatDate(item.startDate)}
      {item.endDate ? ` – ${formatDate(item.endDate)}` : ''}
    </span>,
    <span key={`dl-${item.id}`} className="text-base text-muted-foreground">
      {formatDate(item.deadline)}
    </span>,
    <StatusBadge key={`s-${item.id}`} status={item.status} />,
    <div key={`a-${item.id}`} className="flex items-center gap-2">
      <Link
        href={`${basePath}/${item.id}`}
        className="text-base text-blue-600 hover:text-blue-800 font-medium"
      >
        Edit
      </Link>
      <span className="text-muted-foreground">|</span>
      <button
        type="button"
        onClick={() => setDeleteTarget(item.id)}
        className="text-base text-destructive hover:text-red-800 font-medium"
      >
        Delete
      </button>
    </div>,
  ]);

  return (
    <>
      <DataTable
        headers={headers}
        rows={rows}
        emptyState={
          <EmptyState
            title="No events or opportunities yet"
            description="Create your first item to get started."
          />
        }
        footer={
          pagination.totalPages > 1 && (
            <div className="flex items-center justify-between text-base text-muted-foreground">
              <span>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <div className="flex gap-2">
                {pagination.page > 1 && (
                  <Link href={`${basePath}?page=${pagination.page - 1}`}>
                    <Button variant="outline" size="sm">
                      Previous
                    </Button>
                  </Link>
                )}
                {pagination.page < pagination.totalPages && (
                  <Link href={`${basePath}?page=${pagination.page + 1}`}>
                    <Button variant="outline" size="sm">
                      Next
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )
        }
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Item"
        description="Are you sure you want to delete this item?"
        confirmText="Delete"
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}
