'use client';

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowUp, GripVertical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AuthorObject } from '@/lib/researchOutputTypes';

type AuthorChipsReorderProps = {
  authors: AuthorObject[];
  disabled?: boolean;
  onAuthorsChange: (authors: AuthorObject[]) => void;
};

function authorLabel(author: AuthorObject): string {
  if (author.is_group) {
    return author.given_name?.trim() || author.family_name?.trim() || 'Group author';
  }

  const family = author.family_name?.trim();
  const given = [author.given_name?.trim(), author.middle_name?.trim()].filter(Boolean).join(' ');
  return [family, given].filter(Boolean).join(', ') || given || family || 'Unnamed author';
}

function authorItemId(author: AuthorObject, index: number): string {
  const stablePart =
    author.staffId ||
    `${author.given_name}|${author.middle_name || ''}|${author.family_name}|${author.suffix || ''}`;
  return `${stablePart}::${index}`;
}

function SortableAuthorRow({
  author,
  index,
  id,
  disabled = false,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  author: AuthorObject;
  index: number;
  id: string;
  disabled?: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="border bg-card px-3 py-2 text-base rounded-none">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground disabled:opacity-40"
            disabled={disabled}
            aria-label={`Drag to reorder author ${index + 1}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <span className="inline-flex h-6 w-6 items-center justify-center border border-brand-navy text-brand-navy text-sm font-semibold rounded-none">
            {index + 1}
          </span>
          {author.staffId && (
            <span className="h-2 w-2 bg-green-500 shrink-0" title="Staff member" />
          )}
          <span className="truncate font-medium">{authorLabel(author)}</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onMoveUp}
            disabled={disabled || isFirst}
            aria-label={`Move author ${index + 1} up`}
            className="h-7 w-7 rounded-none"
          >
            <ArrowUp />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onMoveDown}
            disabled={disabled || isLast}
            aria-label={`Move author ${index + 1} down`}
            className="h-7 w-7 rounded-none"
          >
            <ArrowDown />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onRemove}
            disabled={disabled}
            aria-label={`Remove author ${index + 1}`}
            className="h-7 w-7 rounded-none text-muted-foreground hover:text-destructive hover:bg-destructive/20"
          >
            <X />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AuthorChipsReorder({
  authors,
  disabled = false,
  onAuthorsChange,
}: AuthorChipsReorderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const itemIds = authors.map((author, index) => authorItemId(author, index));

  function moveAuthor(from: number, to: number) {
    if (from < 0 || from >= authors.length || to < 0 || to >= authors.length || from === to) return;
    onAuthorsChange(arrayMove(authors, from, to));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = itemIds.findIndex((id) => id === String(active.id));
    const newIndex = itemIds.findIndex((id) => id === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    onAuthorsChange(arrayMove(authors, oldIndex, newIndex));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {authors.map((author, index) => (
            <SortableAuthorRow
              key={itemIds[index]}
              author={author}
              index={index}
              id={itemIds[index]}
              disabled={disabled}
              isFirst={index === 0}
              isLast={index === authors.length - 1}
              onMoveUp={() => moveAuthor(index, index - 1)}
              onMoveDown={() => moveAuthor(index, index + 1)}
              onRemove={() => onAuthorsChange(authors.filter((_, i) => i !== index))}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
