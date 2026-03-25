'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { updateMySecondaryAffiliation } from '@/server/actions/profileSecondaryAffiliation';
import { toastError, toastSuccess } from '@/lib/toast';
import { formatShortDate } from '@/lib/format-date';

interface SecondaryAffiliationOption {
  id: string;
  name: string;
  acronym: string | null;
}

interface SecondaryAffiliationSelectorProps {
  initialSecondaryAffiliationId: string | null;
  options: SecondaryAffiliationOption[];
  lastUpdatedAt?: Date | string | null;
}

export function SecondaryAffiliationSelector({
  initialSecondaryAffiliationId,
  options,
  lastUpdatedAt,
}: SecondaryAffiliationSelectorProps) {
  const router = useRouter();
  const initialValue = initialSecondaryAffiliationId ?? 'none';
  const [selectedId, setSelectedId] = useState<string>(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const hasChanged = useMemo(() => selectedId !== initialValue, [selectedId, initialValue]);
  const currentOption = options.find((option) => option.id === selectedId);
  const currentLabel =
    selectedId === 'none'
      ? 'Not set.'
      : currentOption
        ? currentOption.acronym
          ? `${currentOption.name} (${currentOption.acronym})`
          : currentOption.name
        : 'Not set.';

  async function handleSave() {
    setIsSubmitting(true);
    try {
      const nextId = selectedId === 'none' ? null : selectedId;
      const result = await updateMySecondaryAffiliation({ secondaryAffiliationId: nextId });
      if (result.error) {
        toastError(result.error);
      } else {
        toastSuccess('Secondary affiliation updated.');
        setIsEditing(false);
        router.refresh();
      }
    } catch {
      toastError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    setSelectedId(initialValue);
    setIsEditing(false);
  }

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Last updated: {formatShortDate(lastUpdatedAt ?? null)}
        </p>
        {!isEditing && (
          <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        )}
      </div>

      {!isEditing ? (
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Secondary Affiliation
          </p>
          <p className="text-base">{currentLabel}</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="secondary-affiliation">Secondary Affiliation (Optional)</Label>
            <select
              id="secondary-affiliation"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={isSubmitting}
              className="flex h-9 w-full rounded-none border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="none">None</option>
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.acronym ? `${option.name} (${option.acronym})` : option.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={isSubmitting || !hasChanged}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
