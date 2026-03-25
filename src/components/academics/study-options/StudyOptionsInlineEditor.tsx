'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { toastSuccess, toastError } from '@/lib/toast';
import { Plus, Search, Trash2 } from 'lucide-react';
import {
  createStudyOption,
  deleteStudyOption,
  toggleProgramStudyOption,
  updateStudyOption,
} from '@/server/actions/studyOptionsUniversal';

type StudyOptionItem = {
  id: string;
  name: string;
  about: string;
  isEnabledForProgram: boolean;
};

interface StudyOptionsInlineEditorProps {
  academicProgramId: string;
  initialOptions: StudyOptionItem[];
}

export function StudyOptionsInlineEditor({
  academicProgramId,
  initialOptions,
}: StudyOptionsInlineEditorProps) {
  const [options, setOptions] = React.useState<StudyOptionItem[]>(initialOptions);
  const [searchQuery, setSearchQuery] = React.useState('');

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');

  const selectedOption = React.useMemo(
    () => options.find((option) => option.id === selectedId) || null,
    [options, selectedId],
  );

  const filteredOptions = React.useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return options;

    return options.filter(
      (option) =>
        option.name.toLowerCase().includes(normalized) ||
        option.about.toLowerCase().includes(normalized),
    );
  }, [options, searchQuery]);

  React.useEffect(() => {
    if (isCreatingNew) {
      setTitle('');
      setDescription('');
      return;
    }

    if (selectedOption) {
      setTitle(selectedOption.name);
      setDescription(selectedOption.about || '');
    }
  }, [isCreatingNew, selectedOption]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setIsCreatingNew(false);
  };

  const handleToggle = async (studyOptionId: string, enabled: boolean) => {
    const previous = options;
    setOptions((current) =>
      current.map((option) =>
        option.id === studyOptionId ? { ...option, isEnabledForProgram: enabled } : option,
      ),
    );

    try {
      const res = await toggleProgramStudyOption({
        academicProgramId,
        studyOptionId,
        enabled,
      });

      if (!res.success) {
        setOptions(previous);
        toastError(res.error || 'Failed to update programme selection.');
      }
    } catch {
      setOptions(previous);
      toastError('Failed to update programme selection.');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toastError('Title is required');
      return;
    }

    setIsSaving(true);
    try {
      if (isCreatingNew) {
        const createRes = await createStudyOption({
          academicProgramId,
          title,
          description,
        });

        if ('error' in createRes && createRes.error) {
          toastError(createRes.error);
          return;
        }

        const createdId = createRes.id;
        if (!createdId) {
          toastError('Failed to create study option.');
          return;
        }
        const newOption: StudyOptionItem = {
          id: createdId,
          name: title.trim(),
          about: description.trim(),
          isEnabledForProgram: true,
        };

        setOptions((current) =>
          [...current, newOption].sort((a, b) => a.name.localeCompare(b.name)),
        );
        setSelectedId(createdId);
        setIsCreatingNew(false);

        await toggleProgramStudyOption({
          academicProgramId,
          studyOptionId: createdId,
          enabled: true,
        });

        toastSuccess('Study option created and enabled for this programme.');
        return;
      }

      if (!selectedId) return;

      const updateRes = await updateStudyOption(selectedId, {
        academicProgramId,
        title,
        description,
      });

      if (!updateRes.success) {
        toastError(updateRes.error || 'Failed to save details.');
        return;
      }

      setOptions((current) =>
        current
          .map((option) =>
            option.id === selectedId
              ? { ...option, name: title.trim(), about: description.trim() }
              : option,
          )
          .sort((a, b) => a.name.localeCompare(b.name)),
      );

      toastSuccess('Study option details saved.');
    } catch {
      toastError('Unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm('Are you sure you want to delete this study option globally?')) return;

    setIsSaving(true);
    try {
      const res = await deleteStudyOption({ id: selectedId, academicProgramId });
      if (!res.success) {
        toastError('Failed to delete study option.');
        return;
      }

      setOptions((current) => current.filter((option) => option.id !== selectedId));
      setSelectedId(null);
      setIsCreatingNew(false);
      setTitle('');
      setDescription('');
      toastSuccess('Study option deleted.');
    } catch {
      toastError('Failed to delete study option.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartCreate = () => {
    setSelectedId(null);
    setIsCreatingNew(true);
    setTitle('');
    setDescription('');
  };

  return (
    <div className="flex h-[420px] flex-col gap-6 md:flex-row">
      <div className="flex w-full flex-col border rounded-md bg-muted/20 md:w-1/3">
        <div className="space-y-3 border-b p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">Study Options</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Use the checkbox beside an option to make it available for this programme. Click an
                option to edit its details.
              </p>
            </div>
            <Button size="sm" onClick={handleStartCreate} variant="outline">
              <Plus className="h-4 w-4" />
              New
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter options..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-base text-muted-foreground">No options found.</div>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = selectedId === option.id && !isCreatingNew;
              return (
                <div
                  key={option.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelect(option.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(option.id);
                    }
                  }}
                  className={`w-full rounded-md px-3 py-2 text-left transition-colors ${
                    isSelected
                      ? 'bg-primary/10 text-accent-foreground'
                      : 'hover:bg-primary/5 hover:text-accent-foreground'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={option.isEnabledForProgram}
                      onClick={(e) => e.stopPropagation()}
                      onCheckedChange={(checked) => handleToggle(option.id, Boolean(checked))}
                      aria-label={`Enable ${option.name} for this programme`}
                      className="mt-0.5 border-brand-navy data-[state=checked]:border-brand-navy data-[state=checked]:bg-brand-navy data-[state=checked]:text-white"
                    />
                    <div>
                      <p className="text-base font-medium">{option.name}</p>
                      {option.about ? (
                        <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                          {option.about}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="flex w-full flex-col overflow-y-auto rounded-md border bg-card p-6 md:w-2/3">
        {!selectedId && !isCreatingNew ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              title="No Study Option Selected"
              description="Select a study option from the list or create a new one to edit its details."
            />
          </div>
        ) : (
          <div className="flex flex-1 flex-col space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-xl font-bold">
                {isCreatingNew ? 'Create Study Option' : 'Edit Study Option'}
              </h2>
              {!isCreatingNew ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={handleDelete}
                  disabled={isSaving}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <FieldLabel required htmlFor="study-option-title">
                  Title
                </FieldLabel>
                <Input
                  id="study-option-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Theoretical Physics"
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="study-option-description">Description (Optional)</FieldLabel>
                <Textarea
                  id="study-option-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this study option..."
                  rows={5}
                  maxLength={4000}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreatingNew(false);
                  setSelectedId(null);
                }}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Details'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
