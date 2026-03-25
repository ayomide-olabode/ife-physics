'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { RichTextEditor } from '@/components/editor/RichTextEditorLazy';
import { toastSuccess, toastError } from '@/lib/toast';
import { useSlugField } from '@/lib/useSlugField';
import { createResearchGroup, updateResearchGroup } from '@/server/actions/researchGroups';
import { ResearchGroupHeroImageUploader } from '@/components/research/ResearchGroupHeroImageUploader';
import { RefreshCw } from 'lucide-react';

export type ResearchGroupFormData = {
  id?: string;
  name: string;
  abbreviation: string;
  slug: string;
  heroImageUrl?: string | null;
  overview: string | null;
};

interface Props {
  initialData?: ResearchGroupFormData;
  onCancel?: () => void;
  onSaveSuccess?: () => void;
  submitLabel?: string;
}

export function ResearchGroupFormClient({
  initialData,
  onCancel,
  onSaveSuccess,
  submitLabel,
}: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(initialData?.id);

  const [name, setName] = useState(initialData?.name || '');
  const [abbreviation, setAbbreviation] = useState(initialData?.abbreviation || '');
  const { slug, isManual, handleTitleChange, handleSlugChange, resetSlug } = useSlugField({
    initialSlug: initialData?.slug,
    isEditing,
  });
  const [heroImageUrl, setHeroImageUrl] = useState(initialData?.heroImageUrl || '');
  const [overview, setOverview] = useState(initialData?.overview || '');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload = {
        name,
        abbreviation,
        slug,
        heroImageUrl: heroImageUrl || undefined,
        overview: overview || undefined,
      };

      const res = isEditing
        ? await updateResearchGroup(initialData!.id!, payload)
        : await createResearchGroup(payload);

      if (res.success) {
        toastSuccess(isEditing ? 'Group updated.' : 'Group created.');
        if (!isEditing && 'groupId' in res && res.groupId) {
          window.location.assign(`/dashboard/research/groups/${res.groupId}`);
          return;
        }
        onSaveSuccess?.();
        router.refresh();
      } else {
        toastError(res.error || 'Something went wrong.');
      }
    } catch {
      toastError('An unexpected error occurred.');
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-3xl pb-10">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2 sm:col-span-2">
          <FieldLabel required htmlFor="name">
            Name
          </FieldLabel>
          <Input
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              handleTitleChange(e.target.value);
            }}
            placeholder="e.g. Theoretical Physics Group"
            required
            maxLength={200}
            className="rounded-none"
          />
        </div>
        <div className="space-y-2">
          <FieldLabel required htmlFor="abbreviation">
            Abbreviation
          </FieldLabel>
          <Input
            id="abbreviation"
            value={abbreviation}
            onChange={(e) => setAbbreviation(e.target.value)}
            placeholder="e.g. TPG"
            required
            maxLength={10}
            className="rounded-none"
          />
        </div>
      </div>

      <div className="space-y-2">
        <FieldLabel required htmlFor="slug">
          Slug
        </FieldLabel>
        <div className="flex gap-2">
          <Input
            id="slug"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="e.g. theoretical-physics"
            required
            maxLength={100}
            className="rounded-none"
          />
          {isManual && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-none"
              onClick={() => resetSlug(name)}
              title="Sync from name"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          URL-friendly identifier. Use lowercase letters, numbers, and hyphens only.
        </p>
      </div>

      <div className="space-y-2">
        <ResearchGroupHeroImageUploader
          value={heroImageUrl || null}
          groupId={initialData?.id}
          onChange={(url) => setHeroImageUrl(url || '')}
        />
      </div>

      <div className="space-y-2">
        <FieldLabel>Overview</FieldLabel>
        <RichTextEditor value={overview} onChange={setOverview} />
      </div>

      <div className="pt-4 border-t">
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSubmitting} className="rounded-none">
            {isSubmitting
              ? 'Saving…'
              : submitLabel || (isEditing ? 'Update Group' : 'Create Group')}
          </Button>
          {onCancel ? (
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
        </div>
      </div>
    </form>
  );
}
