'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { RichTextEditor } from '@/components/editor/RichTextEditorLazy';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { submitTestimonial } from '@/server/actions/publicTributes';

interface PublicTributeSubmissionFormProps {
  staffSlug: string;
}

export function PublicTributeSubmissionForm({ staffSlug }: PublicTributeSubmissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [tributeHtml, setTributeHtml] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting || isReturning || isSuccessModalOpen) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await submitTestimonial({
        staffSlug,
        name,
        relationship,
        tributeHtml,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to submit tribute.');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setIsSuccessModalOpen(true);
    } catch {
      setErrorMessage('Failed to submit tribute. Please try again.');
      setIsSubmitting(false);
    }
  }

  function handleReturnToTributes() {
    if (isReturning) return;
    setIsReturning(true);
    window.location.assign(`/people/staff/${staffSlug}?tab=tributes`);
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 rounded-md border bg-card p-6">
        <div className="space-y-2">
          <FieldLabel htmlFor="name">Name*</FieldLabel>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={120}
            placeholder="Your full name"
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="relationship">Relationship*</FieldLabel>
          <Input
            id="relationship"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            required
            maxLength={120}
            placeholder="E.g., Former student, colleague, family friend"
          />
        </div>

        <div className="space-y-2">
          <FieldLabel>Tribute*</FieldLabel>
          <RichTextEditor value={tributeHtml} onChange={setTributeHtml} />
        </div>

        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-base text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t pt-4">
          <Link href={`/people/staff/${staffSlug}?tab=tributes`}>
            <Button type="button" variant="outline" disabled={isSubmitting || isSuccessModalOpen}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting || isSuccessModalOpen}>
            {isSubmitting ? 'Submitting...' : 'Submit Tribute'}
          </Button>
        </div>
      </form>

      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tribute Submitted</DialogTitle>
            <DialogDescription>
              Your tribute has been submitted successfully. It will be reviewed by our moderation
              team before it appears publicly.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleReturnToTributes} disabled={isReturning}>
              {isReturning ? 'Redirecting...' : 'Back to Tributes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
