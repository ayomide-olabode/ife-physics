'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { deleteMyProject } from '@/server/actions/profileProjects';
import { toastSuccess, toastError } from '@/lib/toast';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataTable } from '@/components/dashboard/DataTable';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AddNewButton } from '@/components/dashboard/AddNewButton';

type ProjectItem = {
  id: string;
  title: string;
  acronym: string | null;
  status: string;
  isFunded: boolean;
  startYear: number;
  endYear: number | null;
  url: string | null;
  createdAt: Date;
};

type PaginatedData = {
  items: ProjectItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function ProjectsClientView({ data }: { data: PaginatedData }) {
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
      const res = await deleteMyProject(deleteId);
      if (res.error) {
        toastError(res.error);
      } else {
        toastSuccess('Project deleted successfully.');
        setDeleteOpen(false);
        router.refresh();
      }
    } catch {
      toastError('An unexpected error occurrred.');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Projects"
        description="Manage your ongoing and completed projects."
        actions={<AddNewButton href="/dashboard/profile/projects/new" label="Add New Project" />}
      />

      <DataTable
        headers={['Title', 'Status', 'Years', 'Link', 'Actions']}
        rows={data.items.map((item) => [
          <div key="title" className="text-base block min-w-[300px]">
            <span className="font-medium">{item.title}</span>
            {item.acronym && <span className="text-muted-foreground ml-2">({item.acronym})</span>}
            {item.isFunded && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">
                Funded
              </span>
            )}
          </div>,
          <span key="status" className="text-base text-muted-foreground capitalize">
            {item.status.toLowerCase()}
          </span>,
          <span key="years" className="text-base text-muted-foreground">
            {item.startYear} - {item.endYear || 'Ongoing'}
          </span>,
          <div key="links" className="flex flex-col gap-1">
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-blue-600 hover:underline"
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                Link
              </a>
            ) : (
              <span className="text-sm text-muted-foreground">-</span>
            )}
          </div>,

          <div key="actions" className="flex items-center gap-2">
            <Link
              href={`/dashboard/profile/projects/${item.id}`}
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
            title="No projects yet"
            description="Add your first project to get started."
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
                href={`/dashboard/profile/projects?page=${data.page - 1}`}
                className="px-3 py-1 border rounded hover:bg-muted"
              >
                Previous
              </Link>
            )}
            {data.page < data.totalPages && (
              <Link
                href={`/dashboard/profile/projects?page=${data.page + 1}`}
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
        title="Delete Project?"
        description="Are you sure you want to remove this project? This action is permanent."
        onConfirm={handleConfirmDelete}
        destructive={true}
      />
    </>
  );
}
