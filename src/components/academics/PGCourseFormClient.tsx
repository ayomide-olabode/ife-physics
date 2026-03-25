'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProgrammeCode, SemesterTaken } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { COURSE_SEMESTER_OPTIONS, COURSE_STATUS_OPTIONS } from '@/lib/options';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { Textarea } from '@/components/ui/textarea';
import { normalizeCourseCode } from '@/lib/courseCode';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toastSuccess, toastError } from '@/lib/toast';
import {
  createPostgraduateCourseForProgramme,
  updatePostgraduateCourseForProgramme,
} from '@/server/actions/postgraduateCourses';

export type PGCourseFormData = {
  id?: string;
  code: string;
  title: string;
  description: string | null;
  prerequisites: string | null;
  L: number | null;
  T: number | null;
  P: number | null;
  U: number | null;
  semesterTaken: SemesterTaken | null;
  status: 'CORE' | 'RESTRICTED';
};

interface PGCourseFormClientProps {
  programmeCode: ProgrammeCode;
  initialData?: PGCourseFormData;
}

export function PGCourseFormClient({ programmeCode, initialData }: PGCourseFormClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(initialData?.id);

  const [code, setCode] = useState(initialData?.code || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [prerequisites, setPrerequisites] = useState(initialData?.prerequisites || '');
  const [L, setL] = useState(initialData?.L ?? 0);
  const [T, setT] = useState(initialData?.T ?? 0);
  const [P, setP] = useState(initialData?.P ?? 0);
  const [U, setU] = useState(initialData?.U ?? 0);
  const [semesterTaken, setSemesterTaken] = useState<SemesterTaken | ''>(
    initialData?.semesterTaken || '',
  );
  const [status, setStatus] = useState<'CORE' | 'RESTRICTED'>(initialData?.status || 'CORE');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const normalizedCode = normalizeCourseCode(code);
    setCode(normalizedCode);

    if (!semesterTaken) {
      toastError('Semester is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        code: normalizedCode,
        title,
        description: description || undefined,
        prerequisites: prerequisites || undefined,
        L,
        T,
        P,
        U,
        semesterTaken,
        status,
      };

      const res = isEditing
        ? await updatePostgraduateCourseForProgramme(programmeCode, initialData!.id!, payload)
        : await createPostgraduateCourseForProgramme(programmeCode, payload);

      if (res.success) {
        toastSuccess(isEditing ? 'Course updated.' : 'Course created.');
        if (!isEditing && res.courseId) {
          window.location.assign(
            `/dashboard/postgraduate/${programmeCode.toLowerCase()}/courses/${res.courseId}`,
          );
          return;
        }
        router.refresh();
      } else {
        toastError(res.error || 'Something went wrong.');
      }
    } catch {
      toastError('An unexpected error occurred.');
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-2xl pb-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <FieldLabel required htmlFor="code">
            Course Code
          </FieldLabel>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onBlur={() => setCode((prev) => normalizeCourseCode(prev))}
            placeholder="e.g. PHY501"
            required
            maxLength={20}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel required htmlFor="status">
            Status
          </FieldLabel>
          <Select value={status} onValueChange={(v) => setStatus(v as 'CORE' | 'RESTRICTED')}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COURSE_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <FieldLabel required htmlFor="title">
          Title
        </FieldLabel>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Course title"
          required
          maxLength={200}
        />
      </div>

      <div className="space-y-2">
        <FieldLabel required htmlFor="semesterTaken">
          Semester
        </FieldLabel>
        <Select value={semesterTaken} onValueChange={(v) => setSemesterTaken(v as SemesterTaken)}>
          <SelectTrigger id="semesterTaken">
            <SelectValue placeholder="Select semester..." />
          </SelectTrigger>
          <SelectContent>
            {COURSE_SEMESTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="description">Description</FieldLabel>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional course description"
          rows={4}
          maxLength={4000}
        />
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="prerequisites">Prerequisites</FieldLabel>
        <Input
          id="prerequisites"
          value={prerequisites}
          onChange={(e) => setPrerequisites(e.target.value)}
          placeholder="e.g. PHY501, MTH601"
          maxLength={500}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="space-y-2">
          <FieldLabel htmlFor="L">L (Lectures)</FieldLabel>
          <Input
            id="L"
            type="number"
            min={0}
            max={10}
            value={L}
            onChange={(e) => setL(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <FieldLabel htmlFor="T">T (Tutorials)</FieldLabel>
          <Input
            id="T"
            type="number"
            min={0}
            max={10}
            value={T}
            onChange={(e) => setT(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <FieldLabel htmlFor="P">P (Practicals)</FieldLabel>
          <Input
            id="P"
            type="number"
            min={0}
            max={10}
            value={P}
            onChange={(e) => setP(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <FieldLabel htmlFor="U">U (Units)</FieldLabel>
          <Input
            id="U"
            type="number"
            min={0}
            max={10}
            value={U}
            onChange={(e) => setU(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="pt-4 border-t">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : isEditing ? 'Update Course' : 'Create Course'}
        </Button>
      </div>
    </form>
  );
}
