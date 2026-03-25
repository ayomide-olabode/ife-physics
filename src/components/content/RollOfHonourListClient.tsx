'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DataTable } from '@/components/dashboard/DataTable';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { deleteRollOfHonour } from '@/server/actions/rollOfHonour';
import { toastSuccess, toastError } from '@/lib/toast';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

type RollOfHonourItem = {
  id: string;
  name: string;
  registrationNumber: string;
  programme: string;
  cgpa: number;
  graduatingYear: number;
  imageUrl: string | null;
  createdAt: Date;
};

type PaginationInfo = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function RollOfHonourListClient({
  items,
  pagination,
  searchQ,
  searchYear,
  searchProg,
}: {
  items: RollOfHonourItem[];
  pagination: PaginationInfo;
  searchQ?: string;
  searchYear?: number;
  searchProg?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Filters state
  const [q, setQ] = useState(searchQ || '');
  const [year, setYear] = useState(searchYear ? String(searchYear) : '');
  const [prog, setProg] = useState(searchProg || '');

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (year) params.set('graduatingYear', year);
    if (prog) params.set('programme', prog);

    startTransition(() => {
      router.push(`/dashboard/content/roll-of-honour?${params.toString()}`);
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRollOfHonour(deleteTarget);
      toastSuccess('Roll of Honour entry archived/deleted.');
      router.refresh();
    } catch {
      toastError('Failed to delete entry');
    } finally {
      setDeleteTarget(null);
    }
  };

  const headers = ['Year', 'Name', 'Reg No.', 'Programme', 'CGPA', 'Actions'];
  const rows = items.map((item) => [
    <span key={`y-${item.id}`} className="text-base font-medium">
      {item.graduatingYear}
    </span>,
    <span key={`n-${item.id}`} className="font-medium text-primary">
      {item.name}
    </span>,
    <span key={`r-${item.id}`} className="text-base">
      {item.registrationNumber}
    </span>,
    <span key={`p-${item.id}`} className="text-base text-muted-foreground whitespace-nowrap">
      {item.programme}
    </span>,
    <span key={`c-${item.id}`} className="text-base font-medium">
      {item.cgpa}
    </span>,
    <div key={`a-${item.id}`} className="flex items-center gap-2">
      <Link
        href={`/dashboard/content/roll-of-honour/${item.id}`}
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
      <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, reg no..."
            className="pl-8"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
          />
        </div>

        <div className="flex flex-1 gap-4 w-full md:w-auto">
          <Input
            placeholder="Year (e.g. 2024)"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
            className="w-32"
          />
          <Input
            placeholder="Programme filter..."
            value={prog}
            onChange={(e) => setProg(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
            className="flex-1 max-w-[200px]"
          />
          <Button onClick={handleApplyFilters} disabled={isPending}>
            Apply
          </Button>
        </div>
      </div>

      <DataTable
        headers={headers}
        rows={rows}
        emptyState={
          <EmptyState
            title="No Roll of Honour entries yet"
            description="Create your first Roll of Honour entry to get started."
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
                      router.push(`/dashboard/content/roll-of-honour?${params.toString()}`);
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
                      router.push(`/dashboard/content/roll-of-honour?${params.toString()}`);
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
        title="Delete Roll of Honour Entry"
        description="Are you sure you want to delete this student from the Roll of Honour? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}
