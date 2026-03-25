'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RichTextEditor } from '@/components/editor/RichTextEditorLazy';
import { updateUndergraduateProgram } from '@/server/actions/undergraduateProgram';
import { toastSuccess, toastError } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { ProgrammeCode } from '@prisma/client';

type UndergraduateProgramData = {
  overviewProspects: string | null;
  admissionRequirements: string | null;
  courseRequirements: string | null;
  curriculum: string | null;
  programmeStructure: string | null;
  studyOptionsText: string | null;
  courseDescriptionsIntro: string | null;
};

interface UndergraduateRequirementsEditorProps {
  programmeCode: ProgrammeCode;
  initialData: UndergraduateProgramData | null;
}

export function UndergraduateRequirementsEditor({
  programmeCode,
  initialData,
}: UndergraduateRequirementsEditorProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [admissionRequirements, setAdmissionRequirements] = useState(
    initialData?.admissionRequirements || '',
  );
  const [courseRequirements, setCourseRequirements] = useState(
    initialData?.courseRequirements || '',
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Preserve all other fields by sending their initial values back
      const payload = {
        overviewProspects: initialData?.overviewProspects || '',
        admissionRequirements,
        courseRequirements,
        curriculum: initialData?.curriculum || '',
        programmeStructure: initialData?.programmeStructure || '',
        studyOptionsText: initialData?.studyOptionsText || '',
        courseDescriptionsIntro: initialData?.courseDescriptionsIntro || '',
      };

      const res = await updateUndergraduateProgram(programmeCode, payload);
      if (res.success) {
        toastSuccess('Requirements updated.');
        router.refresh();
      } else {
        toastError(res.error || 'Failed to update requirements.');
      }
    } catch {
      toastError('An unexpected error occurred.');
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8 max-w-4xl pb-4">
      <div className="space-y-4">
        <div>
          <FieldLabel>Admission Requirements</FieldLabel>
          <p className="text-base text-muted-foreground mb-2">
            Entry criteria and qualifications needed for prospective students.
          </p>
        </div>
        <RichTextEditor value={admissionRequirements} onChange={setAdmissionRequirements} />
      </div>

      <div className="space-y-4">
        <div>
          <FieldLabel>Course Requirements</FieldLabel>
          <p className="text-base text-muted-foreground mb-2">
            Required and elective courses that students must complete for this programme.
          </p>
        </div>
        <RichTextEditor value={courseRequirements} onChange={setCourseRequirements} />
      </div>

      <div className="pt-4 border-t flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
