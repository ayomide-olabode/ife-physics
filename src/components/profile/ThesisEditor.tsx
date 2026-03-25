'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ThesisEntryData, ThesisEntryForm } from './ThesisEntryForm';

type ThesisEditorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: ThesisEntryData;
};

export function ThesisEditor({ open, onOpenChange, initialData }: ThesisEditorProps) {
  const isEdit = !!initialData?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Student Thesis' : 'Add New Student Thesis'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the details of the thesis/dissertation supervised.'
              : 'Add a new student thesis you have supervised or are currently supervising.'}
          </DialogDescription>
        </DialogHeader>

        <ThesisEntryForm
          key={initialData?.id ?? 'new-thesis'}
          initialData={initialData}
          onCancel={() => onOpenChange(false)}
          onSuccess={() => onOpenChange(false)}
          className="max-h-[70vh] overflow-y-auto px-1"
        />
      </DialogContent>
    </Dialog>
  );
}
