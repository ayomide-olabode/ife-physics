'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RichTextEditor } from '@/components/editor/RichTextEditorLazy';
import { updatePostgraduateProgram } from '@/server/actions/postgraduateProgram';
import { toastSuccess, toastError } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { ProgrammeCode } from '@prisma/client';

type PostgraduateProgramData = {
  overviewProspects: string | null;
};

interface PostgraduateProgramEditorProps {
  programmeCode: ProgrammeCode;
  initialData: PostgraduateProgramData | null;
}

export function PostgraduateProgramEditor({
  programmeCode,
  initialData,
}: PostgraduateProgramEditorProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [overviewProspects, setOverviewProspects] = useState(initialData?.overviewProspects || '');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload = {
        overviewProspects,
      };

      const res = await updatePostgraduateProgram(programmeCode, payload);
      if (res.success) {
        toastSuccess('Postgraduate programme sections updated.');
        router.refresh();
      } else {
        toastError(res.error || 'Failed to update sections.');
      }
    } catch {
      toastError('An unexpected error occurred.');
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8 max-w-4xl pb-10">
      <div className="space-y-2">
        <FieldLabel>Overview &amp; Prospects</FieldLabel>
        <RichTextEditor value={overviewProspects} onChange={setOverviewProspects} />
      </div>

      <div className="pt-4 border-t">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
