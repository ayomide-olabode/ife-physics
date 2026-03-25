'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { toastSuccess, toastError } from '@/lib/toast';
import {
  createPublication,
  updatePublication,
  deletePublication,
} from '@/server/actions/publications';
import { Loader2 } from 'lucide-react';
import { YearSelect } from '@/components/forms/YearSelect';

const currentYear = new Date().getFullYear();

const publicationFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  authors: z.string().max(2000).optional().nullable(),
  year: z.coerce
    .number()
    .int()
    .min(1900)
    .max(currentYear + 1)
    .optional()
    .nullable(),
  venue: z.string().max(500).optional().nullable(),
  doi: z.string().max(200).optional().nullable(),
  url: z.string().url('Must be a valid URL').max(2000).optional().nullable().or(z.literal('')),
  abstract: z.string().max(5000).optional().nullable(),
});

export type PublicationFormData = {
  id?: string;
  title: string;
  authors: string | null;
  year: number | null;
  venue: string | null;
  doi: string | null;
  url: string | null;
  abstract: string | null;
};

interface Props {
  groupId: string;
  initialData?: PublicationFormData;
}

export function PublicationFormClient({ groupId, initialData }: Props) {
  const router = useRouter();
  const isEditing = Boolean(initialData?.id);
  const basePath = `/dashboard/research/groups/${groupId}/publications`;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [data, setData] = useState({
    title: initialData?.title || '',
    authors: initialData?.authors || '',
    year: initialData?.year ?? null,
    venue: initialData?.venue || '',
    doi: initialData?.doi || '',
    url: initialData?.url || '',
    abstract: initialData?.abstract || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        title: data.title,
        authors: data.authors || null,
        year: data.year ? Number(data.year) : null,
        venue: data.venue || null,
        doi: data.doi || null,
        url: data.url || null,
        abstract: data.abstract || null,
      };

      // Validate client-side
      publicationFormSchema.parse(payload);

      const res = isEditing
        ? await updatePublication(groupId, initialData!.id!, payload)
        : await createPublication(groupId, payload);

      if (res.success) {
        toastSuccess(isEditing ? 'Research output updated.' : 'Research output created.');
        if (!isEditing && 'publicationId' in res && res.publicationId) {
          router.push(`${basePath}/${res.publicationId}`);
        } else {
          router.refresh();
        }
      } else {
        toastError(res.error || 'Something went wrong.');
      }
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        toastError(err.issues[0].message);
      } else {
        toastError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    try {
      const res = await deletePublication(groupId, initialData.id);
      if (res.success) {
        toastSuccess('Research output deleted.');
        router.push(basePath);
      } else {
        toastError(res.error || 'Failed to delete.');
      }
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Failed to delete.');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl bg-card p-6 border rounded-lg">
        <div className="space-y-4">
          <div className="space-y-2">
            <FieldLabel required htmlFor="title">
              Title
            </FieldLabel>
            <Input
              id="title"
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              placeholder="Research output title"
              disabled={isSubmitting}
              required
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="authors">Authors</FieldLabel>
            <Input
              id="authors"
              value={data.authors}
              onChange={(e) => setData({ ...data, authors: e.target.value })}
              placeholder="e.g. A. Smith, B. Jones, C. Lee"
              disabled={isSubmitting}
              maxLength={2000}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <FieldLabel htmlFor="year">Year</FieldLabel>
              <YearSelect
                value={data.year ?? null}
                onChange={(val) => setData({ ...data, year: val })}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <FieldLabel htmlFor="venue">Venue / Journal</FieldLabel>
              <Input
                id="venue"
                value={data.venue}
                onChange={(e) => setData({ ...data, venue: e.target.value })}
                placeholder="e.g. Physical Review Letters"
                disabled={isSubmitting}
                maxLength={500}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <FieldLabel htmlFor="doi">DOI</FieldLabel>
              <Input
                id="doi"
                value={data.doi}
                onChange={(e) => setData({ ...data, doi: e.target.value })}
                placeholder="e.g. 10.1234/example"
                disabled={isSubmitting}
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <FieldLabel htmlFor="url">URL</FieldLabel>
              <Input
                id="url"
                value={data.url}
                onChange={(e) => setData({ ...data, url: e.target.value })}
                placeholder="https://..."
                disabled={isSubmitting}
                maxLength={2000}
              />
            </div>
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="abstract">Abstract</FieldLabel>
            <Textarea
              id="abstract"
              value={data.abstract}
              onChange={(e) => setData({ ...data, abstract: e.target.value })}
              placeholder="Research output abstract or summary..."
              className="min-h-[150px]"
              disabled={isSubmitting}
              maxLength={5000}
            />
          </div>

        </div>

        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(basePath)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Create Research Output'}
          </Button>
          {isEditing && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSubmitting}
            >
              Delete
            </Button>
          )}
        </div>
      </form>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Research Output"
        description="Are you sure you want to delete this research output? This action will soft-delete it."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        destructive={true}
      />
    </>
  );
}
