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

interface UndergraduateOverviewEditorProps {
  programmeCode: ProgrammeCode;
  initialData: UndergraduateProgramData | null;
}

export function UndergraduateOverviewEditor({
  programmeCode,
  initialData,
}: UndergraduateOverviewEditorProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [overviewProspects, setOverviewProspects] = useState(initialData?.overviewProspects || '');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // We preserve all other fields by sending their initial values back
      const payload = {
        overviewProspects,
        admissionRequirements: initialData?.admissionRequirements || '',
        courseRequirements: initialData?.courseRequirements || '',
        curriculum: initialData?.curriculum || '',
        programmeStructure: initialData?.programmeStructure || '',
        studyOptionsText: initialData?.studyOptionsText || '',
        courseDescriptionsIntro: initialData?.courseDescriptionsIntro || '',
      };

      const res = await updateUndergraduateProgram(programmeCode, payload);
      if (res.success) {
        toastSuccess('Undergraduate overview updated.');
        router.refresh();
      } else {
        toastError(res.error || 'Failed to update overview.');
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
          <FieldLabel>Overview & Prospects</FieldLabel>
          <p className="text-base text-muted-foreground mb-2">
            This content introduces the programme to prospective students. It appears on the public
            website.
          </p>
        </div>
        <RichTextEditor value={overviewProspects} onChange={setOverviewProspects} />
      </div>

      <div className="pt-4 border-t flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
