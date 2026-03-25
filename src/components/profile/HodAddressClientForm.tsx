'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateMyHodAddress } from '@/server/actions/profileHodAddress';
import { toastSuccess, toastError } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { Textarea } from '@/components/ui/textarea';
import { formatShortDate } from '@/lib/format-date';

type HodAddressClientFormProps = {
  initialTitle?: string;
  initialBody?: string;
  lastUpdatedAt?: Date | string | null;
};

export function HodAddressClientForm({
  initialTitle,
  initialBody,
  lastUpdatedAt,
}: HodAddressClientFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [title, setTitle] = useState(initialTitle || '');
  const [body, setBody] = useState(initialBody || '');

  function handleCancel() {
    setTitle(initialTitle || '');
    setBody(initialBody || '');
    setIsEditing(false);
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!title.trim() || !body.trim()) {
      toastError('Both title and body are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateMyHodAddress({ title, body });
      if (res.success) {
        toastSuccess('HOD Address updated.');
        setIsEditing(false);
        router.refresh();
      } else {
        toastError(res.error || 'Validation payload checks failed structurally.');
      }
    } catch {
      toastError('Unexpected mapping error mutating identity block settings.');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Last updated: {formatShortDate(lastUpdatedAt ?? null)}
        </p>
        {!isEditing && (
          <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        )}
      </div>

      {!isEditing ? (
        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Title</p>
            <p className="text-base">{title.trim() || 'Not provided.'}</p>
          </div>

          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Message Body
            </p>
            <p className="text-base whitespace-pre-wrap">{body.trim() || 'Not provided.'}</p>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <FieldLabel required htmlFor="title">
              Title
            </FieldLabel>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Welcome to the Department of Physics"
              required
              maxLength={120}
              className="rounded-none"
            />
            <p className="text-sm text-muted-foreground">
              Appears as the main heading. Max 120 chars.
            </p>
          </div>

          <div className="space-y-2">
            <FieldLabel required htmlFor="body">
              Message Body
            </FieldLabel>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Your welcoming address content..."
              rows={12}
              required
              maxLength={4000}
              className="rounded-none"
            />
            <p className="text-sm text-muted-foreground">
              The full welcoming message text. Max 4000 chars.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting} className="rounded-none">
              {isSubmitting ? 'Saving...' : 'Save HOD Address'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
