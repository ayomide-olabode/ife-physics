'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { YearSelect } from '@/components/forms/YearSelect';
import { toastSuccess, toastError } from '@/lib/toast';
import { THESIS_STATUS_OPTIONS, PROGRAMME_OPTIONS, DEGREE_OPTIONS } from '@/lib/options';
import { createMyThesis, updateMyThesis } from '@/server/actions/profileTheses';
import { ThesisStatus } from '@prisma/client';
import { cn } from '@/lib/utils';

type FormDataState = {
  year: string;
  title: string;
  studentName: string;
  registrationNumber: string;
  programme: string;
  degreeLevel: string;
  externalUrl: string;
  status: ThesisStatus;
};

const defaultValues: FormDataState = {
  year: new Date().getFullYear().toString(),
  title: '',
  studentName: '',
  registrationNumber: '',
  programme: '',
  degreeLevel: '',
  externalUrl: '',
  status: 'ONGOING',
};

export type ThesisEntryData = { id: string } & Partial<FormDataState>;

type ThesisEntryFormProps = {
  initialData?: ThesisEntryData;
  onCancel?: () => void;
  onSuccess?: () => void;
  redirectTo?: string;
  className?: string;
};

function buildInitialState(initialData?: ThesisEntryData): FormDataState {
  return {
    year: initialData?.year ?? defaultValues.year,
    title: initialData?.title ?? defaultValues.title,
    studentName: initialData?.studentName ?? defaultValues.studentName,
    registrationNumber: initialData?.registrationNumber ?? defaultValues.registrationNumber,
    programme: initialData?.programme ?? defaultValues.programme,
    degreeLevel: initialData?.degreeLevel ?? defaultValues.degreeLevel,
    externalUrl: initialData?.externalUrl ?? defaultValues.externalUrl,
    status: initialData?.status ?? defaultValues.status,
  };
}

export function ThesisEntryForm({
  initialData,
  onCancel,
  onSuccess,
  redirectTo,
  className,
}: ThesisEntryFormProps) {
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

    const yearNum = parseInt(formData.year, 10);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
      toastError('Please enter a valid year.');
      return;
    }

    if (!formData.programme) {
      toastError('Programme is required.');
      return;
    }
    if (!formData.degreeLevel) {
      toastError('Degree Level is required.');
      return;
    }

    const payload = {
      year: yearNum,
      title: formData.title,
      studentName: formData.studentName || undefined,
      registrationNumber: formData.registrationNumber || undefined,
      programme: formData.programme,
      degreeLevel: formData.degreeLevel,
      externalUrl: formData.externalUrl || undefined,
      status: formData.status,
    };

    setIsSubmitting(true);
    try {
      let res;
      if (isEdit && initialData?.id) {
        res = await updateMyThesis(initialData.id, payload);
      } else {
        res = await createMyThesis(payload);
      }

      if (res.success) {
        toastSuccess(`Thesis ${isEdit ? 'updated' : 'added'} successfully.`);
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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <FieldLabel required htmlFor="year">
            Year
          </FieldLabel>
          <YearSelect
            value={formData.year}
            onChange={(val) => setFormData((prev) => ({ ...prev, year: val ? String(val) : '' }))}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel required htmlFor="status">
            Status
          </FieldLabel>
          <select
            id="status"
            value={formData.status}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, status: e.target.value as ThesisStatus }))
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
          >
            {THESIS_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <FieldLabel required htmlFor="title">
          Title
        </FieldLabel>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="e.g. Quantum Computing Approaches..."
          required
        />
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="studentName">Student Name</FieldLabel>
        <Input
          id="studentName"
          value={formData.studentName}
          onChange={(e) => setFormData((prev) => ({ ...prev, studentName: e.target.value }))}
          placeholder="Firstname Middlename Lastname"
        />
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="registrationNumber">Registration Number</FieldLabel>
        <Input
          id="registrationNumber"
          value={formData.registrationNumber}
          onChange={(e) => setFormData((prev) => ({ ...prev, registrationNumber: e.target.value }))}
          placeholder="e.g. PHY/2024/001"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <FieldLabel required htmlFor="degreeLevel">
            Degree Level
          </FieldLabel>
          <select
            id="degreeLevel"
            value={formData.degreeLevel}
            onChange={(e) => setFormData((prev) => ({ ...prev, degreeLevel: e.target.value }))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
          >
            <option value="" disabled>
              Select Degree
            </option>
            {DEGREE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <FieldLabel required htmlFor="programme">
            Programme
          </FieldLabel>
          <select
            id="programme"
            value={formData.programme}
            onChange={(e) => setFormData((prev) => ({ ...prev, programme: e.target.value }))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            required
          >
            <option value="" disabled>
              Select Programme
            </option>
            {PROGRAMME_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="externalUrl">External URL</FieldLabel>
        <Input
          id="externalUrl"
          type="url"
          value={formData.externalUrl}
          onChange={(e) => setFormData((prev) => ({ ...prev, externalUrl: e.target.value }))}
          placeholder="e.g. https://repository.example.edu/thesis/..."
        />
      </div>

      <div className="pt-4 border-t flex items-center gap-2">
        <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Thesis'}
        </Button>
      </div>
    </form>
  );
}
