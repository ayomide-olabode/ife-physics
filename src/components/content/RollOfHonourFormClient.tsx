'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { createRollOfHonour, updateRollOfHonour } from '@/server/actions/rollOfHonour';
import { toastSuccess, toastError } from '@/lib/toast';
import { RollOfHonourImageUploader } from './RollOfHonourImageUploader';
import { YearSelect } from '@/components/forms/YearSelect';
import { ROH_PROGRAMME_OPTIONS } from '@/lib/options';

type FormDataState = {
  firstName: string;
  middleName: string;
  lastName: string;
  registrationNumber: string;
  programme: string;
  cgpa: string;
  graduatingYear: string;
  imageUrl: string | null;
};

function parseLegacyFullName(fullName?: string | null) {
  const tokens = (fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!tokens.length) {
    return { firstName: '', middleName: '', lastName: '' };
  }

  if (tokens.length === 1) {
    return { firstName: tokens[0], middleName: '', lastName: '' };
  }

  return {
    firstName: tokens[0],
    middleName: tokens.slice(1, -1).join(' '),
    lastName: tokens[tokens.length - 1],
  };
}

export function RollOfHonourFormClient({
  initialData,
}: {
  initialData?: {
    id: string;
    name: string;
    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;
    registrationNumber: string;
    programme: string;
    cgpa: number;
    graduatingYear: number;
    imageUrl: string | null;
  };
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = !!initialData?.id;
  const parsedLegacyName = useMemo(() => parseLegacyFullName(initialData?.name), [initialData?.name]);
  const didUseLegacySplitFallback = Boolean(
    initialData &&
      (!initialData.firstName?.trim() || !initialData.lastName?.trim()) &&
      initialData.name?.trim(),
  );

  const [formData, setFormData] = useState<FormDataState>(() => ({
    firstName: initialData?.firstName?.trim() || parsedLegacyName.firstName,
    middleName: initialData?.middleName?.trim() || parsedLegacyName.middleName,
    lastName: initialData?.lastName?.trim() || parsedLegacyName.lastName,
    registrationNumber: initialData?.registrationNumber || '',
    programme: initialData?.programme || '',
    cgpa: initialData?.cgpa ? String(initialData.cgpa) : '',
    graduatingYear: initialData?.graduatingYear ? String(initialData.graduatingYear) : '',
    imageUrl: initialData?.imageUrl || null,
  }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim()) return toastError('First Name is required');
    if (!formData.lastName.trim()) return toastError('Last Name is required');
    if (!formData.registrationNumber.trim()) return toastError('Registration Number is required');
    if (!formData.programme.trim()) return toastError('Programme is required');

    const cgpaNum = parseFloat(formData.cgpa);
    if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 5) {
      return toastError('CGPA must be a number between 0 and 5');
    }

    const yearNum = parseInt(formData.graduatingYear, 10);
    const currentYear = new Date().getFullYear();
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear + 1) {
      return toastError(`Graduating Year must be between 1900 and ${currentYear + 1}`);
    }

    const payload = {
      firstName: formData.firstName,
      middleName: formData.middleName,
      lastName: formData.lastName,
      registrationNumber: formData.registrationNumber,
      programme: formData.programme,
      cgpa: cgpaNum,
      graduatingYear: yearNum,
      imageUrl: formData.imageUrl,
    };

    setIsSubmitting(true);
    try {
      if (isEdit && initialData?.id) {
        await updateRollOfHonour(initialData.id, payload);
        toastSuccess('Roll of Honour entry updated successfully.');
      } else {
        const res = await createRollOfHonour(payload);
        toastSuccess('Roll of Honour entry created.');
        router.push(`/dashboard/content/roll-of-honour/${res.id}`);
        return; // Avoid push to index during redirect
      }

      router.push('/dashboard/content/roll-of-honour');
      router.refresh();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8">
      <div className="bg-white p-6 rounded-lg border shadow-sm h-fit">
        <form id="roh-form" onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <FieldLabel required htmlFor="firstName">
                First Name
              </FieldLabel>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                placeholder="Firstname"
                className="rounded-none"
                required
              />
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="middleName">Middle Name</FieldLabel>
              <Input
                id="middleName"
                value={formData.middleName}
                onChange={(e) => setFormData((prev) => ({ ...prev, middleName: e.target.value }))}
                placeholder="Middlename"
                className="rounded-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <FieldLabel required htmlFor="lastName">
              Last Name
            </FieldLabel>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
              placeholder="Lastname"
              className="rounded-none"
              required
            />
            {didUseLegacySplitFallback ? (
              <p className="text-sm text-muted-foreground">
                We split this from the legacy full name; please confirm.
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <FieldLabel required htmlFor="registrationNumber">
                Registration Number
              </FieldLabel>
              <Input
                id="registrationNumber"
                value={formData.registrationNumber}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, registrationNumber: e.target.value }))
                }
                placeholder="e.g. PHY/2012/001"
                className="rounded-none"
                required
              />
            </div>

            <div className="space-y-2">
              <FieldLabel required htmlFor="programme">
                Programme
              </FieldLabel>
              <select
                id="programme"
                value={formData.programme}
                onChange={(e) => setFormData((prev) => ({ ...prev, programme: e.target.value }))}
                className="flex h-9 w-full items-center justify-between rounded-none border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="" disabled>
                  Select a programme...
                </option>
                {ROH_PROGRAMME_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <FieldLabel required htmlFor="cgpa">
                CGPA
              </FieldLabel>
              <Input
                id="cgpa"
                type="number"
                step="0.01"
                min="0"
                max="5"
                value={formData.cgpa}
                onChange={(e) => setFormData((prev) => ({ ...prev, cgpa: e.target.value }))}
                placeholder="e.g. 4.56"
                className="rounded-none"
                required
              />
            </div>

            <div className="space-y-2">
              <FieldLabel required htmlFor="graduatingYear">
                Graduating Year
              </FieldLabel>
              <YearSelect
                value={formData.graduatingYear}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, graduatingYear: val ? String(val) : '' }))
                }
              />
            </div>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
          <h3 className="text-base font-semibold">Student Photo</h3>
          <RollOfHonourImageUploader
            value={formData.imageUrl}
            onChange={(url) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
            onRemove={() => setFormData((prev) => ({ ...prev, imageUrl: null }))}
          />
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/content/roll-of-honour')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" form="roh-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Entry'}
          </Button>
        </div>
      </div>
    </div>
  );
}
