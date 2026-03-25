'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/dashboard/DataTable';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { deleteLegacyItem } from '@/server/actions/legacyGallery';
import { toastSuccess, toastError } from '@/lib/toast';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { PublishStatus } from '@prisma/client';
import { formatDate } from '@/lib/format-date';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PUBLISH_STATUS_OPTIONS_WITH_ALL } from '@/lib/options';

type LegacyItem = {
  id: string;
  title: string;
  year: number | null;
  datesText: string | null;
  mediaUrl: string;
  status: PublishStatus;
  createdAt: Date;
};

interface Props {
  data: LegacyItem[];
  total: number;
  page: number;
  pageSize: number;
  searchQuery?: string;
  yearQuery?: string;
  statusQuery?: string;
}

export function LegacyGalleryListClient({
  data,
  total,
  page,
  pageSize,
  searchQuery = '',
  yearQuery = '',
  statusQuery = 'ALL',
}: Props) {
  const router = useRouter();
  const [q, setQ] = useState(searchQuery);
  const [year, setYear] = useState(yearQuery);
  const [status, setStatus] = useState<PublishStatus | 'ALL'>(
    (statusQuery as PublishStatus) || 'ALL',
  );

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (year) params.set('year', year);
    if (status && status !== 'ALL') params.set('status', status);
    params.set('page', '1');
    router.push(`/dashboard/content/legacy-gallery?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (year) params.set('year', year);
    if (status && status !== 'ALL') params.set('status', status);
    params.set('page', newPage.toString());
    router.push(`/dashboard/content/legacy-gallery?${params.toString()}`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteLegacyItem(deleteTarget);
      toastSuccess('Legacy item deleted.');
      router.refresh();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to delete item.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const columns = [
    {
      header: 'Photo',
      accessor: (row: LegacyItem) => (
        <div className="w-12 h-12 rounded bg-muted overflow-hidden relative shadow-sm border">
          {/* Using img tag to avoid heavy Next Image components in large lists */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={row.mediaUrl} alt={row.title} className="w-full h-full object-cover" />
        </div>
      ),
    },
    {
      header: 'Title',
      accessor: (row: LegacyItem) => <span className="font-medium">{row.title}</span>,
    },
    {
      header: 'Year / Dates',
      accessor: (row: LegacyItem) =>
        row.datesText ||
        (row.year ? (
          row.year.toString()
        ) : (
          <span className="text-muted-foreground italic">N/A</span>
        )),
    },
    {
      header: 'Status',
      accessor: (row: LegacyItem) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Created',
      accessor: (row: LegacyItem) => (
        <span className="text-muted-foreground">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row: LegacyItem) => (
        <div className="flex items-center gap-2 justify-end">
          <Link
            href={`/dashboard/content/legacy-gallery/${row.id}`}
            className="text-base text-blue-600 hover:text-blue-800 font-medium"
          >
            Edit
          </Link>
          <span className="text-muted-foreground">|</span>
          <button
            type="button"
            onClick={() => setDeleteTarget(row.id)}
            className="text-base text-destructive hover:text-red-800 font-medium"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search titles or text..."
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div className="w-32">
          <Input
            placeholder="Year"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
        <Button onClick={handleSearch}>Filter</Button>
      </div>

      {data.length === 0 ? (
        <EmptyState
          title="No legacy items yet"
          description={
            searchQuery || yearQuery || statusQuery !== 'ALL'
              ? 'Try adjusting your filters.'
              : 'Add your first legacy item to get started.'
          }
          action={
            <Button
              onClick={() => {
                if (searchQuery || yearQuery || statusQuery !== 'ALL') {
                  router.push('/dashboard/content/legacy-gallery');
                } else {
                  router.push('/dashboard/content/legacy-gallery/new');
                }
              }}
            >
              {searchQuery ? 'Clear Filters' : 'Add Your First Item'}
            </Button>
          }
        />
      ) : (
        <DataTable
          headers={columns.map((c) => c.header)}
          rows={data.map((row) => columns.map((col) => col.accessor(row)))}
          footer={
            <div className="flex justify-between items-center">
              <span className="text-base text-muted-foreground">
                Showing entries {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of{' '}
                {total}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * pageSize >= total}
                  onClick={() => handlePageChange(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          }
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Legacy Item"
        description="Are you sure you want to delete this legacy item? This action will hide it from the public."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        destructive={true}
      />
    </div>
  );
}
