'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSpotlight, updateSpotlight } from '@/server/actions/spotlight';
import { toastSuccess, toastError } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { Textarea } from '@/components/ui/textarea';
import { SpotlightImageUploader } from '@/components/communication/SpotlightImageUploader';

type FormInitial = {
  id?: string;
  title?: string;
  date?: string | null;
  text?: string;
  imageUrl?: string | null;
};

function toDateInput(val?: string | Date | null): string {
  if (!val) return '';
  const d = typeof val === 'string' ? new Date(val) : val;
  return d.toISOString().split('T')[0];
}

export function SpotlightFormClient({ initial }: { initial?: FormInitial }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initial?.id;

  const [title, setTitle] = useState(initial?.title || '');
  const [date, setDate] = useState(toDateInput(initial?.date));
  const [text, setText] = useState(initial?.text || '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl || '');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload = {
        title,
        date: date || '',
        text: text || '',
        imageUrl: imageUrl || '',
      };

      if (isEditing && initial?.id) {
        const res = await updateSpotlight(initial.id, payload);
        if (res.success) {
          toastSuccess('Updated successfully.');
          router.refresh();
        } else {
          toastError(res.error || 'Failed to update.');
        }
        setIsSubmitting(false);
        return;
      }

      const res = await createSpotlight(payload);
      if (res.success && res.data?.id) {
        toastSuccess('Created as draft.');
        window.location.assign(`/dashboard/communication/spotlight/${res.data.id}`);
        return;
      }

      toastError(res.error || 'Failed to create.');
    } catch {
      toastError('An unexpected error occurred.');
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-3xl">
      <div className="space-y-2">
        <FieldLabel required htmlFor="title">
          Title
        </FieldLabel>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Spotlight title"
          required
        />
      </div>

      <div className="space-y-2">
        <FieldLabel required htmlFor="date">
          Display Date
        </FieldLabel>
        <Input
          id="date"
          type="date"
          value={date}
          required
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <FieldLabel required>Image</FieldLabel>
        <SpotlightImageUploader
          value={imageUrl}
          onChange={setImageUrl}
          onRemove={() => setImageUrl('')}
        />
      </div>

      <div className="space-y-2">
        <FieldLabel required htmlFor="text">
          Text / Summary
        </FieldLabel>
        <Textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Short text describing the spotlight..."
          rows={6}
          maxLength={2000}
          required
        />
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : isEditing ? 'Update' : 'Create Draft'}
        </Button>
      </div>
    </form>
  );
}
