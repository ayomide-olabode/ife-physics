'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { StatusBadge, type PublishStatus } from '@/components/dashboard/StatusBadge';
import { DataTable } from '@/components/dashboard/DataTable';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { deleteHistory } from '@/server/actions/history';
import { toastSuccess } from '@/lib/toast';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PUBLISH_STATUS_OPTIONS_WITH_ALL } from '@/lib/options';

type HistoryItem = {
  id: string;
  title: string;
  status: PublishStatus;
  year: number;
  createdAt: Date;
};

type PaginationInfo = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function HistoryListClient({
  items,
  pagination,
  searchQ,
  searchStatus,
}: {
  items: HistoryItem[];
  pagination: PaginationInfo;
  searchQ?: string;
  searchStatus?: PublishStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Filters state
  const [q, setQ] = useState(searchQ || '');
  const [status, setStatus] = useState<PublishStatus | 'ALL'>(searchStatus || 'ALL');

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status && status !== 'ALL') params.set('status', status);

    startTransition(() => {
      router.push(`/dashboard/content/history?${params.toString()}`);
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteHistory(deleteTarget);
    toastSuccess('History entry archived/deleted.');
    router.refresh();
    setDeleteTarget(null);
  };

  const headers = ['Year / Date', 'Title', 'Status', 'Actions'];
  const rows = items.map((item) => [
    <span key={`d-${item.id}`} className="text-base font-medium">
      {item.year}
    </span>,
    <span key={`t-${item.id}`} className="font-medium text-primary">
      {item.title}
    </span>,
    <StatusBadge key={`s-${item.id}`} status={item.status} />,
    <div key={`a-${item.id}`} className="flex items-center gap-2">
      <Link
        href={`/dashboard/content/history/${item.id}`}
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
    <div className="space-y-4">
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search title or description..."
            className="pl-8"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
          />
        </div>
        <div className="w-48">
          <Select value={status} onValueChange={(val: PublishStatus | 'ALL') => setStatus(val)}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {PUBLISH_STATUS_OPTIONS_WITH_ALL.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleApplyFilters} disabled={isPending}>
          Apply
        </Button>
      </div>

      <DataTable
        headers={headers}
        rows={rows}
        emptyState={
          <EmptyState
            title="No history entries yet"
            description="Create your first history entry to get started."
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const params = new URLSearchParams(window.location.search);
                      params.set('page', String(pagination.page - 1));
                      router.push(`/dashboard/content/history?${params.toString()}`);
                    }}
                  >
                    Previous
                  </Button>
                )}
                {pagination.page < pagination.totalPages && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const params = new URLSearchParams(window.location.search);
                      params.set('page', String(pagination.page + 1));
                      router.push(`/dashboard/content/history?${params.toString()}`);
                    }}
                  >
                    Next
                  </Button>
                )}
              </div>
            </div>
          )
        }
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete History Entry"
        description="Are you sure you want to delete this timeline entry? It will be archived and no longer visible."
        confirmText="Delete"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}
