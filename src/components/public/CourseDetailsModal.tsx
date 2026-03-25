'use client';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type CourseForModal = {
  code: string;
  title: string;
  description?: string | null;
  prerequisites?: string | null;
  L?: number | null;
  T?: number | null;
  P?: number | null;
  U?: number | null;
  semesterTaken?: 'HARMATTAN' | 'RAIN' | null;
};

function num(value?: number | null) {
  return typeof value === 'number' ? value : 0;
}

function semesterLabel(value?: 'HARMATTAN' | 'RAIN' | null) {
  if (value === 'HARMATTAN') return 'Harmattan';
  if (value === 'RAIN') return 'Rain';
  return 'Unknown';
}

function normalizePrerequisites(value?: string | null) {
  return (value || '').trim();
}

export function CourseDetailsModal({
  open,
  onOpenChange,
  course,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: CourseForModal | null;
}) {
  if (!course) {
    return null;
  }

  const prerequisites = normalizePrerequisites(course.prerequisites);
  const lineOne = `${course.code}: ${course.title} (${num(course.L)} - ${num(course.T)} - ${num(course.P)}) ${num(course.U)} Units - ${semesterLabel(course.semesterTaken)} Semester`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl sm:rounded-none">
        <DialogHeader className="pr-12 text-left sm:pr-0">
          <DialogTitle className="text-lg leading-relaxed text-brand-navy">{lineOne}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-base text-gray-700">
          <p>{(course.description || '').trim() || 'No description provided.'}</p>
        </div>
        {prerequisites ? (
          <DialogFooter className="justify-start border-t pt-4">
            <div className="space-y-3 text-base text-gray-500">
              <p>Prerequisites: {prerequisites}</p>
            </div>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
