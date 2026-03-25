'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { StatusBadge, type PublishStatus } from '@/components/dashboard/StatusBadge';
import { DataTable } from '@/components/dashboard/DataTable';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { deleteNews, toggleFeaturedNews } from '@/server/actions/news';
import { toastSuccess, toastError } from '@/lib/toast';
import { Star } from 'lucide-react';
import { formatDate } from '@/lib/format-date';

type NewsItem = {
  id: string;
  title: string;
  slug: string;
  status: PublishStatus;
  date: Date;
  isFeatured: boolean;
};

type PaginationInfo = {
  page: number;
  totalPages: number;
  total: number;
};

export function NewsListClient({
  items,
  pagination,
}: {
  items: NewsItem[];
  pagination: PaginationInfo;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleToggleFeatured = (id: string) => {
    startTransition(async () => {
      const res = await toggleFeaturedNews(id);
      if (res.success) {
        toastSuccess('Featured status toggled.');
        router.refresh();
      } else {
        toastError(res.error || 'Failed to toggle featured.');
      }
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await deleteNews(deleteTarget);
    if (res.success) {
      toastSuccess('Article deleted.');
      router.refresh();
    } else {
      toastError(res.error || 'Failed to delete article.');
    }
    setDeleteTarget(null);
  };

  const headers = ['Title', 'Status', 'Date', 'Featured', 'Actions'];
  const rows = items.map((item) => [
    <Link
      key={`t-${item.id}`}
      href={`/dashboard/communication/news/${item.id}`}
      className="font-medium text-primary hover:underline"
    >
      {item.title}
    </Link>,
    <StatusBadge key={`s-${item.id}`} status={item.status} />,
    <span key={`d-${item.id}`} className="text-base text-muted-foreground">
      {formatDate(item.date)}
    </span>,
    <button
      key={`f-${item.id}`}
      type="button"
      onClick={() => handleToggleFeatured(item.id)}
      disabled={isPending}
      className="text-muted-foreground hover:text-yellow-500"
      title={item.isFeatured ? 'Unfeature' : 'Feature'}
    >
      <Star className={`h-4 w-4 ${item.isFeatured ? 'fill-yellow-500 text-yellow-500' : ''}`} />
    </button>,
    <div key={`a-${item.id}`} className="flex items-center gap-2">
      <Link
        href={`/dashboard/communication/news/${item.id}`}
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
            title="No news articles yet"
            description="Create your first article to get started."
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
                  <Link href={`/dashboard/communication/news?page=${pagination.page - 1}`}>
                    <Button variant="outline" size="sm">
                      Previous
                    </Button>
                  </Link>
                )}
                {pagination.page < pagination.totalPages && (
                  <Link href={`/dashboard/communication/news?page=${pagination.page + 1}`}>
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
        title="Delete Article"
        description="Are you sure you want to delete this news article? This action can be undone by an administrator."
        confirmText="Delete"
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}
