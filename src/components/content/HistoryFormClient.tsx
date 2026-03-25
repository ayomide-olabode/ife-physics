'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { YearGroupedSelect } from '@/components/forms/YearGroupedSelect';
import { createHistory, updateHistory } from '@/server/actions/history';
import { toastSuccess, toastError } from '@/lib/toast';

type FormDataState = {
  title: string;
  year?: number;
  shortDesc: string;
};

const MIN_HISTORY_YEAR = 1960;
const CURRENT_YEAR = new Date().getFullYear();

export function HistoryFormClient({
  initialData,
}: {
  initialData?: { id: string; title: string; year: number; shortDesc: string };
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = !!initialData?.id;

  const [formData, setFormData] = useState<FormDataState>(() => ({
    title: initialData?.title || '',
    year: initialData?.year,
    shortDesc: initialData?.shortDesc || '',
  }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toastError('Title is required');
      return;
    }
    if (typeof formData.year !== 'number') {
      toastError('Year is required');
      return;
    }
    if (formData.year < MIN_HISTORY_YEAR || formData.year > CURRENT_YEAR) {
      toastError(`Year must be between ${MIN_HISTORY_YEAR} and ${CURRENT_YEAR}`);
      return;
    }
    if (!formData.shortDesc.trim()) {
      toastError('Description is required');
      return;
    }
    if (formData.shortDesc.length > 2000) {
      toastError('Description must be under 2000 characters');
      return;
    }

    const payload = {
      title: formData.title,
      year: formData.year,
      shortDesc: formData.shortDesc,
    };

    setIsSubmitting(true);
    try {
      if (isEdit && initialData?.id) {
        await updateHistory(initialData.id, payload);
        toastSuccess('History entry updated successfully.');
      } else {
        const res = await createHistory(payload);
        toastSuccess('History entry created as Draft.');
        router.push(`/dashboard/content/history/${res.id}`);
        return; // Avoid push to index during redirect
      }

      router.push('/dashboard/content/history');
      router.refresh();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl bg-white p-6 rounded-lg border shadow-sm">
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-2">
          <FieldLabel required htmlFor="title">
            Title
          </FieldLabel>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="E.g., Department Founded"
            required
          />
        </div>

        <div className="space-y-2">
          <FieldLabel required htmlFor="year">
            Year
          </FieldLabel>
          <YearGroupedSelect
            id="year"
            value={formData.year}
            onChange={(year) => setFormData((prev) => ({ ...prev, year }))}
            minYear={MIN_HISTORY_YEAR}
            maxYear={CURRENT_YEAR}
            placeholder="Year"
          />
        </div>

        <div className="space-y-2">
          <FieldLabel required htmlFor="shortDesc">
            Short Description
          </FieldLabel>
          <Textarea
            id="shortDesc"
            value={formData.shortDesc}
            onChange={(e) => setFormData((prev) => ({ ...prev, shortDesc: e.target.value }))}
            placeholder="Briefly describe the historical event..."
            className="min-h-[120px]"
            required
            maxLength={2000}
          />
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/content/history')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Draft'}
          </Button>
        </div>
      </form>
    </div>
  );
}
