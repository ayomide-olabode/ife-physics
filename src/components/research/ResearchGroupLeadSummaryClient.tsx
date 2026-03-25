'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { sanitizeRichHtml } from '@/lib/security/sanitizeHtml';
import { ResearchGroupFormClient, type ResearchGroupFormData } from './ResearchGroupFormClient';

interface ResearchGroupLeadSummaryClientProps {
  group: ResearchGroupFormData;
}

export function ResearchGroupLeadSummaryClient({ group }: ResearchGroupLeadSummaryClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const sanitizedOverview = useMemo(() => sanitizeRichHtml(group.overview || ''), [group.overview]);

  return (
    <div className="rounded-lg border bg-card p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Group Summary</h2>
          <p className="text-base text-muted-foreground">Review and update this research group.</p>
        </div>
        {!isEditing ? (
          <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        ) : null}
      </div>

      {!isEditing ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Name
              </p>
              <p className="text-base">{group.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Abbreviation
              </p>
              <p className="text-base">{group.abbreviation}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Slug
              </p>
              <p className="text-base font-mono">{group.slug}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-2">
              Overview
            </p>
            {sanitizedOverview ? (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizedOverview }}
              />
            ) : (
              <p className="text-base text-muted-foreground">No overview provided yet.</p>
            )}
          </div>
        </div>
      ) : (
        <ResearchGroupFormClient
          initialData={group}
          onCancel={() => setIsEditing(false)}
          onSaveSuccess={() => setIsEditing(false)}
          submitLabel="Save Changes"
        />
      )}
    </div>
  );
}
