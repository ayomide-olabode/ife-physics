'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { YearSelect } from '@/components/forms/YearSelect';
import { RichTextEditor } from '@/components/editor/RichTextEditorLazy';
import { toastSuccess, toastError } from '@/lib/toast';
import { PROJECT_STATUS_OPTIONS } from '@/lib/options';
import { createMyProject, updateMyProject } from '@/server/actions/profileProjects';
import { ProjectStatus } from '@prisma/client';
import { cn } from '@/lib/utils';

type FormDataState = {
  title: string;
  acronym: string;
  descriptionHtml: string;
  url: string;
  status: string;
  isFunded: boolean;
  startYear: string;
  endYear: string;
};

const defaultValues: FormDataState = {
  title: '',
  acronym: '',
  descriptionHtml: '',
  url: '',
  status: 'ONGOING',
  isFunded: false,
  startYear: new Date().getFullYear().toString(),
  endYear: '',
};

export type ProjectEntryData = { id: string } & Partial<FormDataState>;

type ProjectEntryFormProps = {
  initialData?: ProjectEntryData;
  onCancel?: () => void;
  onSuccess?: () => void;
  redirectTo?: string;
  className?: string;
};

function buildInitialState(initialData?: ProjectEntryData): FormDataState {
  return {
    title: initialData?.title ?? defaultValues.title,
    acronym: initialData?.acronym ?? defaultValues.acronym,
    descriptionHtml: initialData?.descriptionHtml ?? defaultValues.descriptionHtml,
    url: initialData?.url ?? defaultValues.url,
    status: initialData?.status ?? defaultValues.status,
    isFunded: initialData?.isFunded ?? defaultValues.isFunded,
    startYear: initialData?.startYear ?? defaultValues.startYear,
    endYear: initialData?.endYear ?? defaultValues.endYear,
  };
}

export function ProjectEntryForm({
  initialData,
  onCancel,
  onSuccess,
  redirectTo,
  className,
}: ProjectEntryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const isEdit = !!initialData?.id;
  const [formData, setFormData] = useState<FormDataState>(() => buildInitialState(initialData));

  useEffect(() => {
    setFormData(buildInitialState(initialData));
  }, [initialData]);

  const handleCancel = () => {
    if (isSubmitting) return;
    if (onCancel) {
      onCancel();
      return;
    }
    if (redirectTo) {
      router.push(redirectTo);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toastError('Title is required');
      return;
    }

    const startYr = parseInt(formData.startYear, 10);
    if (isNaN(startYr)) {
      toastError('Start year is required');
      return;
    }

    const payload = {
      title: formData.title,
      acronym: formData.acronym || undefined,
      descriptionHtml: formData.descriptionHtml || undefined,
      url: formData.url || undefined,
      status: formData.status as ProjectStatus,
      isFunded: formData.isFunded,
      startYear: startYr,
      endYear: formData.endYear ? parseInt(formData.endYear, 10) : undefined,
    };

    setIsSubmitting(true);
    try {
      let res;
      if (isEdit && initialData?.id) {
        res = await updateMyProject(initialData.id, payload);
      } else {
        res = await createMyProject(payload);
      }

      if (res.success) {
        toastSuccess(`Project ${isEdit ? 'updated' : 'added'} successfully.`);
        onSuccess?.();

        if (redirectTo) {
          router.push(redirectTo);
        } else {
          if (!isEdit) {
            setFormData(defaultValues);
          }
          router.refresh();
        }
      } else {
        toastError(res.error || 'Validation failed. Please check your inputs.');
      }
    } catch {
      toastError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className={cn('space-y-4 py-4', className)}>
      <div className="space-y-2">
        <FieldLabel required htmlFor="title">
          Title
        </FieldLabel>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="e.g. Next-Gen Physics Engine"
          required
        />
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="acronym">Acronym</FieldLabel>
        <Input
          id="acronym"
          value={formData.acronym}
          onChange={(e) => setFormData((prev) => ({ ...prev, acronym: e.target.value }))}
          placeholder="e.g. NGPE"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <FieldLabel required htmlFor="status">
            Status
          </FieldLabel>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
          >
            {PROJECT_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="url">URL Link</FieldLabel>
          <Input
            id="url"
            type="url"
            value={formData.url}
            onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <FieldLabel required htmlFor="startYear">
            Start Year
          </FieldLabel>
          <YearSelect
            value={formData.startYear}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, startYear: val ? String(val) : '' }))
            }
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="endYear">End Year</FieldLabel>
          <YearSelect
            includeOngoing
            value={formData.endYear}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, endYear: val ? String(val) : '' }))
            }
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <input
          type="checkbox"
          id="isFunded"
          checked={formData.isFunded}
          onChange={(e) => setFormData((prev) => ({ ...prev, isFunded: e.target.checked }))}
          className="h-4 w-4 rounded border-gray-300 accent-brand-navy focus:ring-brand-navy"
        />
        <label
          htmlFor="isFunded"
          className="text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Is this a funded project?
        </label>
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="descriptionHtml">Description</FieldLabel>
        <RichTextEditor
          value={formData.descriptionHtml}
          onChange={(val: string) => setFormData((prev) => ({ ...prev, descriptionHtml: val }))}
        />
      </div>

      <div className="pt-4 border-t flex items-center gap-2">
        <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Project'}
        </Button>
      </div>
    </form>
  );
}
