'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { StatusBadge, type PublishStatus } from '@/components/dashboard/StatusBadge';
import { DataTable } from '@/components/dashboard/DataTable';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { deleteSpotlight } from '@/server/actions/spotlight';
import { toastSuccess, toastError } from '@/lib/toast';
import { formatDate } from '@/lib/format-date';

type ListItem = {
  id: string;
  title: string;
  date: Date | null;
  imageUrl: string | null;
  status: PublishStatus;
};

type PaginationInfo = {
  page: number;
  totalPages: number;
  total: number;
};

export function SpotlightListClient({
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
      const res = await deleteSpotlight(deleteTarget);
      if (res.success) {
        toastSuccess('Deleted.');
        router.refresh();
      } else {
        toastError(res.error || 'Failed to delete.');
      }
      setDeleteTarget(null);
    });
  };

  const headers = ['Image', 'Date', 'Title', 'Status', 'Actions'];
  const rows = items.map((item) => [
    <div key={`img-${item.id}`} className="w-12 h-12 relative rounded overflow-hidden bg-muted">
      {item.imageUrl ? (
        <Image src={item.imageUrl} alt={item.title} fill className="object-cover" sizes="48px" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
          No img
        </div>
      )}
    </div>,
    <span key={`date-${item.id}`} className="text-base text-muted-foreground whitespace-nowrap">
      {formatDate(item.date)}
    </span>,
    <span key={`t-${item.id}`} className="font-medium text-primary line-clamp-2 max-w-sm">
      {item.title}
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
            title="No spotlight items yet"
            description="Create your first spotlight feature to get started."
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
