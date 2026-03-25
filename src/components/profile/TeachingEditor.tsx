'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { UniversalCourseAutocomplete } from '@/components/academics/UniversalCourseAutocomplete';
import { toastSuccess, toastError } from '@/lib/toast';
import { createMyTeaching, updateMyTeaching } from '@/server/actions/profileTeaching';
import { useRouter } from 'next/navigation';

type FormDataState = {
  title: string;
  courseCode: string;
};

const defaultValues: FormDataState = {
  title: '',
  courseCode: '',
};

type TeachingEditorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: { id: string } & Partial<FormDataState>;
};

export function TeachingEditor({ open, onOpenChange, initialData }: TeachingEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Selection state logic tracking
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const isEdit = !!initialData?.id;

  const [formData, setFormData] = useState<FormDataState>(() => ({
    ...defaultValues,
    ...initialData,
  }));

  // Setup form states properly when initialized
  useEffect(() => {
    if (open) {
      setFormData({
        ...defaultValues,
        ...initialData,
      });
      // Try to assume we matched if we have a title & code coming in from DB
      if (initialData?.courseCode && initialData?.title) {
        setSelectedCourseId('matched-initially');
      } else {
        setSelectedCourseId(null);
      }
    }
  }, [open, initialData]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCourseId) {
      toastError('Course not found. Please contact an administrator to add it.');
      return;
    }

    if (!formData.title.trim() || !formData.courseCode.trim()) {
      toastError('Course Code and Title must be populated correctly.');
      return;
    }

    const payload = {
      courseCode: formData.courseCode,
      title: formData.title,
    };

    setIsSubmitting(true);
    try {
      let res;
      if (isEdit && initialData?.id) {
        res = await updateMyTeaching(initialData.id, payload);
      } else {
        res = await createMyTeaching(payload);
      }

      if (res.success) {
        toastSuccess(`Teaching record ${isEdit ? 'updated' : 'added'} successfully.`);
        onOpenChange(false);
        router.refresh();
      } else {
        toastError(res.error || 'Validation failed. Please check your inputs.');
      }
    } catch {
      toastError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Teaching Record' : 'Add Teaching Record'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the details of your teaching responsibility.'
              : 'Add a new course or subject you teach.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <FieldLabel required htmlFor="courseCode">
              Course
            </FieldLabel>
            <UniversalCourseAutocomplete
              onSelect={(course) => {
                setSelectedCourseId(course.id);
                setFormData((prev) => ({
                  ...prev,
                  courseCode: course.code,
                  title: course.title,
                }));
              }}
              onChange={(val) => {
                // If user starts typing manually after selecting, invalidate selection
                if (val !== formData.courseCode) {
                  setSelectedCourseId(null);
                  setFormData((prev) => ({
                    ...prev,
                    courseCode: val,
                  }));
                }
              }}
              value={formData.courseCode}
              placeholder="Search by course code or title..."
            />
          </div>

          <div className="space-y-2">
            <FieldLabel htmlFor="title">Course Title</FieldLabel>
            <Input
              id="title"
              value={formData.title}
              readOnly
              className="bg-gray-50"
              placeholder="Auto-filled when course is selected..."
            />
            <p className="text-sm text-muted-foreground">
              Title is tied directly to the selected course.
            </p>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Record'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
