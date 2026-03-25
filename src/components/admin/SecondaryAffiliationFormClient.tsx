'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FieldLabel } from '@/components/forms/FieldLabel';
import {
  createSecondaryAffiliation,
  updateSecondaryAffiliation,
} from '@/server/actions/adminSecondaryAffiliations';
import { toastError, toastSuccess } from '@/lib/toast';

interface SecondaryAffiliationFormClientProps {
  mode: 'create' | 'edit';
  affiliationId?: string;
  initialValues?: {
    name?: string | null;
    acronym?: string | null;
    description?: string | null;
  };
}

export function SecondaryAffiliationFormClient({
  mode,
  affiliationId,
  initialValues,
}: SecondaryAffiliationFormClientProps) {
  const router = useRouter();
  const [name, setName] = useState(initialValues?.name ?? '');
  const [acronym, setAcronym] = useState(initialValues?.acronym ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === 'create') {
        const result = await createSecondaryAffiliation({ name, acronym, description });
        if (result.error) {
          toastError(result.error);
          setIsSubmitting(false);
          return;
        }
        toastSuccess('Secondary affiliation created.');
        router.push(`/dashboard/admin/secondary-affiliations/${result.id}`);
        return;
      }

      if (!affiliationId) {
        toastError('Missing affiliation ID.');
        setIsSubmitting(false);
        return;
      }

      const result = await updateSecondaryAffiliation(affiliationId, {
        name,
        acronym,
        description,
      });
      if (result.error) {
        toastError(result.error);
        setIsSubmitting(false);
        return;
      }

      toastSuccess('Secondary affiliation updated.');
      router.refresh();
      setIsSubmitting(false);
    } catch {
      toastError('An unexpected error occurred.');
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 border p-6 rounded-none">
      <div className="space-y-2">
        <FieldLabel htmlFor="name" required>
          Name
        </FieldLabel>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-none"
          required
        />
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="acronym">Acronym</FieldLabel>
        <Input
          id="acronym"
          value={acronym}
          onChange={(e) => setAcronym(e.target.value)}
          className="rounded-none"
        />
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="description">Description</FieldLabel>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-28 rounded-none"
        />
      </div>

      <div className="flex items-center justify-end gap-4 pt-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-none"
          onClick={() => router.push('/dashboard/admin/secondary-affiliations')}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" className="rounded-none" disabled={isSubmitting}>
          {isSubmitting
            ? mode === 'create'
              ? 'Creating...'
              : 'Saving...'
            : mode === 'create'
              ? 'Create'
              : 'Save'}
        </Button>
      </div>
    </form>
  );
}
