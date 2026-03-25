'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProgrammeCode, DegreeType, RequirementType } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RichTextEditor } from '@/components/editor/RichTextEditorLazy';
import { toastSuccess, toastError } from '@/lib/toast';
import { REQUIREMENT_TYPE_OPTIONS } from '@/lib/options';
import {
  createRequirementBlock,
  updateRequirementBlock,
  deleteRequirementBlock,
} from '@/server/actions/pgRequirementBlocks';

export type ReqBlockFormData = {
  id?: string;
  title: string;
  requirementType: RequirementType;
  orderIndex: number;
  contentHtml: string;
};

interface Props {
  programmeCode: ProgrammeCode;
  degreeType: DegreeType;
  initialData?: ReqBlockFormData;
  onClose: () => void;
}

export function PgRequirementBlockEditor({
  programmeCode,
  degreeType,
  initialData,
  onClose,
}: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(initialData?.id);

  const [title, setTitle] = useState(initialData?.title || '');
  const [requirementType, setRequirementType] = useState<RequirementType>(
    initialData?.requirementType || 'ADMISSION',
  );
  const [orderIndex, setOrderIndex] = useState(initialData?.orderIndex ?? 0);
  const [contentHtml, setContentHtml] = useState(initialData?.contentHtml || '');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload = { title, requirementType, orderIndex, contentHtml };
      const res = isEditing
        ? await updateRequirementBlock(programmeCode, degreeType, initialData!.id!, payload)
        : await createRequirementBlock(programmeCode, degreeType, payload);

      if (res.success) {
        toastSuccess(isEditing ? 'Block updated.' : 'Block created.');
        router.refresh();
        onClose();
      } else {
        toastError(res.error || 'Something went wrong.');
      }
    } catch {
      toastError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-6 space-y-6">
      <h3 className="text-lg font-semibold">{isEditing ? 'Edit Block' : 'New Block'}</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <FieldLabel required htmlFor="rb-title">
              Title
            </FieldLabel>
            <Input
              id="rb-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Block title"
              required
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <FieldLabel required htmlFor="rb-type">
              Type
            </FieldLabel>
            <Select
              value={requirementType}
              onValueChange={(v) => setRequirementType(v as RequirementType)}
            >
              <SelectTrigger id="rb-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REQUIREMENT_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <FieldLabel htmlFor="rb-order">Order</FieldLabel>
            <Input
              id="rb-order"
              type="number"
              min={0}
              max={999}
              value={orderIndex}
              onChange={(e) => setOrderIndex(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <FieldLabel required>Content</FieldLabel>
          <RichTextEditor value={contentHtml} onChange={setContentHtml} />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEditing ? 'Update Block' : 'Create Block'}
          </Button>
        </div>
      </form>
    </div>
  );
}

// Inline delete button with confirm
interface DeleteProps {
  programmeCode: ProgrammeCode;
  degreeType: DegreeType;
  blockId: string;
}

export function PgReqBlockDeleteButton({ programmeCode, degreeType, blockId }: DeleteProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleDelete = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await deleteRequirementBlock(programmeCode, degreeType, blockId);
      if (res.success) {
        toastSuccess('Block deleted.');
        router.refresh();
      } else {
        toastError(res.error || 'Failed to delete.');
      }
    } catch {
      toastError('An unexpected error occurred.');
    } finally {
      setConfirming(false);
      setIsSubmitting(false);
    }
  };

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>
          ✕
        </Button>
        <Button variant="destructive" size="sm" disabled={isSubmitting} onClick={handleDelete}>
          {isSubmitting ? '…' : 'Confirm'}
        </Button>
      </span>
    );
  }

  return (
    <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
      Delete
    </Button>
  );
}
