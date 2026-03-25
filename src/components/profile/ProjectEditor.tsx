'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ProjectEntryData, ProjectEntryForm } from './ProjectEntryForm';

type ProjectEditorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: ProjectEntryData;
};

export function ProjectEditor({ open, onOpenChange, initialData }: ProjectEditorProps) {
  const isEdit = !!initialData?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Project' : 'Add New Project'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the details of your project.'
              : 'Add a new project or significant initiative to your profile.'}
          </DialogDescription>
        </DialogHeader>

        <ProjectEntryForm
          key={initialData?.id ?? 'new-project'}
          initialData={initialData}
          onCancel={() => onOpenChange(false)}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
