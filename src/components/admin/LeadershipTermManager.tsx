'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { endLeadershipTerm } from '@/server/actions/leadershipTerms';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/dashboard/DataTable';
import { EmptyState } from '@/components/dashboard/EmptyState';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { toastSuccess, toastError } from '@/lib/toast';
import { formatDate } from '@/lib/format-date';
import { formatFullName } from '@/lib/name';

type Staff = {
  id: string;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  institutionalEmail: string;
  profileImageUrl: string | null;
};

export type TermRow = {
  id: string;
  role: string;
  startDate: Date;
  endDate: Date | null;
  programmeCode: string | null;
  staffId: string;
  staff: Staff;
};

export function LeadershipTermManager({
  hodTerms,
  pastHodTerms,
  coordinatorTerms,
}: {
  hodTerms: TermRow[];
  pastHodTerms: TermRow[];
  coordinatorTerms: TermRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // End Term Dialog State
  const [endTermId, setEndTermId] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const handleEndTerm = async () => {
    if (!endTermId || !endDate) return;

    try {
      const res = await endLeadershipTerm({
        termId: endTermId,
        endDate: new Date(endDate),
      });

      if (res.error) {
        toastError(res.error);
      } else {
        toastSuccess('Leadership term ended successfully.');
        setEndTermId(null);
        startTransition(() => {
          router.refresh();
        });
      }
    } catch {
      toastError('Failed to end term.');
    }
  };

  const renderRoles = (terms: TermRow[], emptyTitle: string) => {
    const rows = terms.map((term) => [
      <div key={`name-${term.id}`} className="text-base font-medium">
        {formatFullName({
          firstName: term.staff.firstName,
          middleName: term.staff.middleName,
          lastName: term.staff.lastName,
        }) || term.staff.institutionalEmail}
      </div>,
      <div key={`prog-${term.id}`} className="text-base text-muted-foreground">
        {term.programmeCode || '-'}
      </div>,
      <span key={`start-${term.id}`} className="text-base">
        {formatDate(term.startDate)}
      </span>,
      <span key={`end-${term.id}`} className="text-base">
        {term.endDate ? formatDate(term.endDate) : 'Present'}
      </span>,
      <div key={`actions-${term.id}`}>
        {!term.endDate && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEndTermId(term.id)}
            disabled={isPending}
          >
            End Term
          </Button>
        )}
      </div>,
    ]);

    return (
      <DataTable
        headers={['Staff Member', 'Programme', 'Start Date', 'End Date', 'Actions']}
        rows={rows}
        emptyState={
          <EmptyState title={emptyTitle} description="Leadership records will appear here." />
        }
      />
    );
  };

  return (
    <div className="space-y-8">
      {/* Active HOD Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Current HOD</h2>
        {renderRoles(hodTerms, 'No Active HOD')}
      </div>

      {/* Coordinators Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Academic Coordinators</h2>
        {renderRoles(coordinatorTerms, 'No Academic Coordinators')}
      </div>

      {/* Past HOD Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight mt-8">Past HODs</h2>
        {renderRoles(pastHodTerms, 'No Past HODs')}
      </div>

      <Dialog
        open={!!endTermId}
        onOpenChange={(open) => {
          if (!open) {
            setEndTermId(null);
            setEndDate(new Date().toISOString().split('T')[0]);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Leadership Term</DialogTitle>
            <DialogDescription>
              Select the official end date for this leadership term to properly close out the
              historical record.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <FieldLabel htmlFor="endDate" className="text-right">
                End Date
              </FieldLabel>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEndTermId(null);
                setEndDate(new Date().toISOString().split('T')[0]);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleEndTerm} disabled={isPending || !endDate}>
              {isPending ? 'Saving...' : 'End Term'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
