'use client';

import { useState } from 'react';
import { TeachingEditor } from './TeachingEditor';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { deleteMyTeaching } from '@/server/actions/profileTeaching';
import { getMyTeachingById } from '@/server/queries/profileTeaching';
import { toastSuccess, toastError } from '@/lib/toast';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataTable } from '@/components/dashboard/DataTable';
import { EmptyState } from '@/components/dashboard/EmptyState';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

type TeachingFormData = {
  title: string;
  courseCode?: string;
};

type TeachingEditorProps = {
  id: string;
} & TeachingFormData;

type TeachingItem = {
  id: string;
  courseCode: string | null;
  title: string;
  createdAt: Date;
};

type PaginatedData = {
  items: TeachingItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function TeachingClientView({ data, staffId }: { data: PaginatedData; staffId: string }) {
  const router = useRouter();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorData, setEditorData] = useState<TeachingEditorProps | undefined>();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAdd = () => {
    setEditorData(undefined);
    setEditorOpen(true);
  };

  const handleEdit = async (id: string) => {
    try {
      const fullDoc = await getMyTeachingById({ staffId, id });
      if (!fullDoc) {
        toastError('Record not found or inaccessible.');
        return;
      }
      setEditorData({
        id: fullDoc.id,
        title: fullDoc.title,
        courseCode: fullDoc.courseCode || '',
      });
      setEditorOpen(true);
    } catch {
      toastError('Error fetching details.');
    }
  };

  const handleDeleteRequest = (id: string) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    try {
      const res = await deleteMyTeaching(deleteId);
      if (res.error) {
        toastError(res.error);
      } else {
        toastSuccess('Teaching record deleted successfully.');
        setDeleteOpen(false);
        router.refresh();
      }
    } catch {
      toastError('An unexpected error occurred.');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Teaching Responsibilities"
        description="Manage your teaching assignments."
        actions={
          <Button onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4" />
            Add New Record
          </Button>
        }
      />

      <DataTable
        headers={['Course Code', 'Title', 'Actions']}
        rows={data.items.map((item) => [
          <span key="code" className="text-base font-medium">
            {item.courseCode || '-'}
          </span>,
          <span key="title" className="text-base text-muted-foreground block min-w-[200px]">
            {item.title}
          </span>,
          <div key="actions" className="flex items-center gap-2">
            <button
              onClick={() => handleEdit(item.id)}
              className="text-base text-blue-600 hover:text-blue-800 font-medium"
            >
              Edit
            </button>
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
            title="No teaching responsibilities yet"
            description="Add your first teaching responsibility to get started."
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
                href={`/dashboard/profile/teaching?page=${data.page - 1}`}
                className="px-3 py-1 border rounded hover:bg-muted"
              >
                Previous
              </Link>
            )}
            {data.page < data.totalPages && (
              <Link
                href={`/dashboard/profile/teaching?page=${data.page + 1}`}
                className="px-3 py-1 border rounded hover:bg-muted"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}

      <TeachingEditor open={editorOpen} onOpenChange={setEditorOpen} initialData={editorData} />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Record?"
        description="Are you sure you want to remove this teaching responsibility? This action is permanent."
        onConfirm={handleConfirmDelete}
        destructive={true}
      />
    </>
  );
}
