'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { toastError, toastSuccess } from '@/lib/toast';
import { createFocusArea, deleteFocusArea, updateFocusArea } from '@/server/actions/focusAreas';
import { Loader2, Plus, Search, Trash2 } from 'lucide-react';

type FocusAreaItem = {
  id: string;
  title: string;
  description: string | null;
};

interface FocusAreasInlineEditorProps {
  groupId: string;
  initialItems: FocusAreaItem[];
}

export function FocusAreasInlineEditor({ groupId, initialItems }: FocusAreasInlineEditorProps) {
  const [items, setItems] = useState<FocusAreaItem[]>(initialItems);
  const [filterText, setFilterText] = useState('');
  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FocusAreaItem | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const filteredItems = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q),
    );
  }, [filterText, items]);

  const selectExisting = (id: string) => {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    setSelectedId(id);
    setLastSelectedId(id);
    setTitle(item.title);
    setDescription(item.description || '');
  };

  const handleCreateMode = () => {
    if (selectedId && selectedId !== 'new') {
      setLastSelectedId(selectedId);
    }
    setSelectedId('new');
    setTitle('');
    setDescription('');
  };

  const handleCancel = () => {
    if (selectedId === 'new' && lastSelectedId) {
      selectExisting(lastSelectedId);
      return;
    }
    setSelectedId(null);
    setTitle('');
    setDescription('');
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toastError('Title is required.');
      return;
    }

    setIsSaving(true);
    try {
      if (selectedId === 'new') {
        const res = await createFocusArea({
          groupId,
          title: trimmedTitle,
          description,
        });
        if (!res.success || !('focusArea' in res) || !res.focusArea) {
          toastError(res.error || 'Failed to create focus area.');
          return;
        }

        const newItem = res.focusArea;
        setItems((prev) => [...prev, newItem]);
        setSelectedId(newItem.id);
        setLastSelectedId(newItem.id);
        setTitle(newItem.title);
        setDescription(newItem.description || '');
        toastSuccess('Focus area created.');
        return;
      }

      if (!selectedId) {
        toastError('Select a focus area first.');
        return;
      }

      const res = await updateFocusArea({
        id: selectedId,
        groupId,
        title: trimmedTitle,
        description,
      });
      if (!res.success || !('focusArea' in res) || !res.focusArea) {
        toastError(res.error || 'Failed to update focus area.');
        return;
      }

      setItems((prev) => prev.map((item) => (item.id === selectedId ? res.focusArea : item)));
      toastSuccess('Focus area updated.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      const res = await deleteFocusArea({
        id: deleteTarget.id,
        groupId,
      });
      if (!res.success) {
        toastError(res.error || 'Failed to delete focus area.');
        return;
      }

      setItems((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      if (selectedId === deleteTarget.id) {
        setSelectedId(null);
        setTitle('');
        setDescription('');
      }
      setDeleteTarget(null);
      toastSuccess('Focus area deleted.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-[320px] border rounded-none bg-muted/20">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">Focus Areas</h3>
            <Button
              size="sm"
              variant="outline"
              className="rounded-none"
              onClick={handleCreateMode}
              type="button"
            >
              <Plus className="h-4 w-4" />
              New
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter focus areas..."
              className="pl-8 rounded-none"
            />
          </div>
        </div>

        <div className="p-2 space-y-1 max-h-[360px] overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="text-center py-6 text-base text-muted-foreground">
              No focus areas found.
            </div>
          ) : (
            filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectExisting(item.id)}
                className={`w-full text-left px-3 py-2 text-base rounded-none transition-colors ${
                  selectedId === item.id
                    ? 'bg-primary/10 text-accent-foreground font-medium'
                    : 'hover:bg-primary/5 hover:text-accent-foreground'
                }`}
              >
                {item.title}
              </button>
            ))
          )}
          {selectedId === 'new' && (
            <div className="w-full text-left px-3 py-2 text-base rounded-none bg-primary/10 text-accent-foreground font-medium">
              New Focus Area
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 border rounded-none p-6 bg-card min-h-[360px]">
        {!selectedId ? (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              title="No Focus Area Selected"
              description="Select a focus area from the list or create a new one to edit its details."
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-xl font-bold">
                {selectedId === 'new' ? 'Create Focus Area' : 'Edit Focus Area'}
              </h2>
              {selectedId !== 'new' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-none text-destructive"
                  onClick={() => {
                    const item = items.find((entry) => entry.id === selectedId);
                    if (item) {
                      setDeleteTarget(item);
                    }
                  }}
                  disabled={isSaving}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <FieldLabel required htmlFor="focus-area-title">
                  Title
                </FieldLabel>
                <Input
                  id="focus-area-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={300}
                  placeholder="e.g. Earth Observation and Space Weather"
                  className="rounded-none"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="focus-area-description">Description (Optional)</FieldLabel>
                <Textarea
                  id="focus-area-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  maxLength={5000}
                  placeholder="Describe this focus area..."
                  className="rounded-none"
                  disabled={isSaving}
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-none"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="rounded-none"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Details
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Focus Area"
        description={`Are you sure you want to delete "${deleteTarget?.title || 'this focus area'}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}
