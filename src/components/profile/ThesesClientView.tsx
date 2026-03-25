'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { deleteMyThesis } from '@/server/actions/profileTheses';
import type { ThesisRow } from '@/server/queries/profileTheses';
import { toastSuccess, toastError } from '@/lib/toast';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataTable } from '@/components/dashboard/DataTable';
import { EmptyState } from '@/components/dashboard/EmptyState';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AddNewButton } from '@/components/dashboard/AddNewButton';

type PaginatedData = {
  items: ThesisRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function ThesesClientView({ data }: { data: PaginatedData }) {
  const router = useRouter();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDeleteRequest = (id: string) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    try {
      const res = await deleteMyThesis(deleteId);
      if (res.error) {
        toastError(res.error);
      } else {
        toastSuccess('Thesis deleted successfully.');
        setDeleteOpen(false);
        router.refresh();
      }
    } catch {
      toastError('An unexpected error occurrred.');
    } finally {
      setDeleteId(null);
    }
  };

  // Status mapping to nicely formatted badge styles
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ONGOING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            Ongoing
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
            Completed
          </span>
        );
      case 'DISCONTINUED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            Discontinued
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <>
      <PageHeader
        title="Student Theses"
        description="Manage the theses you supervise."
        actions={
          <AddNewButton
            href="/dashboard/profile/thesis-supervision/new"
            label="Add New Thesis"
          />
        }
      />

      <DataTable
        headers={['Year', 'Title', 'Student', 'Status', 'Actions']}
        rows={data.items.map((item) => [
          <span key="year" className="text-base">
            {item.year}
          </span>,
          <span key="title" className="text-base block min-w-[200px] font-medium">
            {item.title}
          </span>,
          <span key="student" className="text-base text-muted-foreground">
            {item.studentName || '-'}
          </span>,
          <div key="status">{getStatusBadge(item.status)}</div>,
          <div key="actions" className="flex items-center gap-2">
            <Link
              href={`/dashboard/profile/thesis-supervision/${item.id}`}
              className="text-base text-blue-600 hover:text-blue-800 font-medium"
            >
              Edit
            </Link>
            <span className="text-muted-foreground">|</span>
            <button
              onClick={() => handleDeleteRequest(item.id)}
              className="text-base text-destructive hover:text-red-800 font-medium"
            >
              Delete
            </button>
          </div>,
        ])}
        emptyState={
          <EmptyState
            title="No theses yet"
            description="Add your first student thesis to get started."
          />
        }
      />

      {data.totalPages > 1 && (
        <div className="flex justify-between items-center py-4 text-base text-muted-foreground">
          <p>
            Showing page {data.page} of {data.totalPages} ({data.totalCount} total)
          </p>
          <div className="flex space-x-2">
            {data.page > 1 && (
              <Link
                href={`/dashboard/profile/thesis-supervision?page=${data.page - 1}`}
                className="px-3 py-1 border rounded hover:bg-muted"
              >
                Previous
              </Link>
            )}
            {data.page < data.totalPages && (
              <Link
                href={`/dashboard/profile/thesis-supervision?page=${data.page + 1}`}
                className="px-3 py-1 border rounded hover:bg-muted"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Thesis?"
        description="Are you sure you want to remove this thesis? This action is permanent."
        onConfirm={handleConfirmDelete}
        destructive={true}
      />
    </>
  );
}
