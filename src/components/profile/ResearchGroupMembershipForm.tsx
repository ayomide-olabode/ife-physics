'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toastSuccess, toastError } from '@/lib/toast';
import { updateMyResearchGroupMembership } from '@/server/actions/profileResearchGroupMembership';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { formatShortDate } from '@/lib/format-date';

interface ResearchGroupOption {
  id: string;
  name: string;
  abbreviation: string;
}

interface FocusAreaOption {
  id: string;
  title: string;
  researchGroupId: string;
}

interface Props {
  initialGroupId: string | null;
  options: ResearchGroupOption[];
  focusAreaOptions: FocusAreaOption[];
  initialFocusAreaIds: string[];
  lastUpdatedAt?: Date | string | null;
}

function hasSameIds(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((id, index) => id === right[index]);
}

export function ResearchGroupMembershipForm({
  initialGroupId,
  options,
  focusAreaOptions,
  initialFocusAreaIds,
  lastUpdatedAt,
}: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>(initialGroupId || 'none');
  const [selectedFocusAreaIds, setSelectedFocusAreaIds] = useState<string[]>(initialFocusAreaIds);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const currentGroup = options.find((opt) => opt.id === selectedId);
  const currentGroupLabel =
    selectedId === 'none'
      ? 'Not set.'
      : currentGroup
        ? `${currentGroup.name} (${currentGroup.abbreviation})`
        : 'Not set.';
  const visibleFocusAreas =
    selectedId === 'none'
      ? []
      : focusAreaOptions.filter((focusArea) => focusArea.researchGroupId === selectedId);
  const selectedFocusAreaIdsForGroup =
    selectedId === 'none'
      ? []
      : selectedFocusAreaIds.filter((focusAreaId) =>
          visibleFocusAreas.some((focusArea) => focusArea.id === focusAreaId),
        );
  const initialSelectedId = initialGroupId || 'none';
  const initialFocusAreaIdsForGroup =
    initialSelectedId === 'none'
      ? []
      : initialFocusAreaIds.filter((focusAreaId) =>
          focusAreaOptions.some(
            (focusArea) =>
              focusArea.id === focusAreaId && focusArea.researchGroupId === initialSelectedId,
          ),
        );
  const hasChanges =
    selectedId !== initialSelectedId ||
    !hasSameIds(selectedFocusAreaIdsForGroup, initialFocusAreaIdsForGroup);
  const currentFocusAreaLabels = initialFocusAreaIdsForGroup
    .map((focusAreaId) => focusAreaOptions.find((focusArea) => focusArea.id === focusAreaId)?.title)
    .filter((title): title is string => Boolean(title));

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const pubId = selectedId === 'none' ? null : selectedId;
      const res = await updateMyResearchGroupMembership({
        researchGroupId: pubId,
        focusAreaIds: pubId ? selectedFocusAreaIdsForGroup : [],
      });
      if (res.error) {
        toastError(res.error);
      } else {
        toastSuccess('Research group membership updated.');
        setIsEditing(false);
        router.refresh();
      }
    } catch {
      toastError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedId(initialGroupId || 'none');
    setSelectedFocusAreaIds(initialFocusAreaIds);
    setIsEditing(false);
  };

  const handleFocusAreaToggle = (focusAreaId: string, checked: boolean) => {
    setSelectedFocusAreaIds((prev) => {
      if (checked) {
        if (prev.includes(focusAreaId)) return prev;
        return [...prev, focusAreaId];
      }
      return prev.filter((id) => id !== focusAreaId);
    });
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="mb-6 border-b pb-2">
        <h2 className="text-xl font-semibold">Research Group Membership</h2>
        <p className="text-base text-muted-foreground mt-1">
          Select the research group you belong to. This helps link publications to research groups.
        </p>
      </div>

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
              Research Group
            </p>
            <p className="text-base">{currentGroupLabel}</p>
            {initialSelectedId !== 'none' ? (
              <div className="mt-4">
                <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  Focus Areas
                </p>
                {currentFocusAreaLabels.length > 0 ? (
                  <p className="text-base">{currentFocusAreaLabels.join(', ')}</p>
                ) : (
                  <p className="text-base text-muted-foreground">Not set.</p>
                )}
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="research-group">Research Group</Label>
              <Select
                value={selectedId}
                onValueChange={(value) => {
                  setSelectedId(value);
                  if (value === 'none') {
                    setSelectedFocusAreaIds([]);
                    return;
                  }
                  const nextAllowedFocusAreaIds = focusAreaOptions
                    .filter((focusArea) => focusArea.researchGroupId === value)
                    .map((focusArea) => focusArea.id);
                  setSelectedFocusAreaIds((prev) =>
                    prev.filter((focusAreaId) => nextAllowedFocusAreaIds.includes(focusAreaId)),
                  );
                }}
                disabled={isSubmitting}
              >
                <SelectTrigger id="research-group">
                  <SelectValue placeholder="Select a research group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {options.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.name} ({opt.abbreviation})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedId !== 'none' ? (
              <div className="space-y-2">
                <Label>Focus Areas</Label>
                {visibleFocusAreas.length > 0 ? (
                  <div className="space-y-2 rounded-md border p-3">
                    {visibleFocusAreas.map((focusArea) => {
                      const checked = selectedFocusAreaIdsForGroup.includes(focusArea.id);
                      return (
                        <label
                          key={focusArea.id}
                          className="flex cursor-pointer items-center gap-2 text-base"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(state) =>
                              handleFocusAreaToggle(focusArea.id, Boolean(state))
                            }
                            disabled={isSubmitting}
                          />
                          <span>{focusArea.title}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-base text-muted-foreground">
                    No focus areas are defined for this research group yet.
                  </p>
                )}
              </div>
            ) : null}

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSubmitting || !hasChanges}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Selection
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
