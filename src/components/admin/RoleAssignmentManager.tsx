'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { assignRole, revokeRole } from '@/server/actions/roleAssignments';
import { Button } from '@/components/ui/button';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { DataTable } from '@/components/dashboard/DataTable';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { toastSuccess, toastError } from '@/lib/toast';
import { DegreeScope, ProgrammeScope, ScopedRole } from '@prisma/client';
import { DEGREE_SCOPE_OPTIONS, PROGRAMME_SCOPE_OPTIONS, SCOPED_ROLE_OPTIONS } from '@/lib/options';
import { formatDate } from '@/lib/format-date';

type Assignment = {
  id: string;
  role: string;
  scopeType: string;
  scopeId: string | null;
  programmeScope: string | null;
  degreeScope: string | null;
  expiresAt: Date | null;
  deletedAt: Date | null;
};

type ResearchGroupOption = {
  id: string;
  name: string;
  abbreviation: string | null;
};

export function RoleAssignmentManager({
  userId,
  assignments,
  researchGroups,
}: {
  userId: string;
  assignments: Assignment[];
  researchGroups: ResearchGroupOption[];
}) {
  const router = useRouter();

  // Form state
  const [role, setRole] = useState<ScopedRole | ''>('');
  const [scopeId, setScopeId] = useState('');
  const [programmeScope, setProgrammeScope] = useState<ProgrammeScope | ''>('');
  const [degreeScope, setDegreeScope] = useState<DegreeScope | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);

  // Revoke state
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      toastError('Please select a role.');
      return;
    }

    if (role === 'RESEARCH_LEAD' && !scopeId) {
      toastError('Please select a research group.');
      return;
    }
    if (role === 'ACADEMIC_COORDINATOR' && (!programmeScope || !degreeScope)) {
      toastError('Please select both programme and degree scope.');
      return;
    }

    setIsSubmitting(true);
    try {
      const acProgrammeScope = role === 'ACADEMIC_COORDINATOR' ? programmeScope || null : null;
      const acDegreeScope = role === 'ACADEMIC_COORDINATOR' ? degreeScope || null : null;

      const res = await assignRole({
        userId,
        role,
        scopeId: role === 'RESEARCH_LEAD' ? scopeId : null,
        programmeScope: acProgrammeScope,
        degreeScope: acDegreeScope,
      });

      if (res.error) {
        toastError(res.error);
      } else {
        toastSuccess('Role assigned successfully.');
        setRole('');
        setScopeId('');
        setProgrammeScope('');
        setDegreeScope('');
        router.refresh();
      }
    } catch {
      toastError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeId || isRevoking) return;
    setIsRevoking(true);
    try {
      const res = await revokeRole({ roleAssignmentId: revokeId });
      if (res.error) {
        toastError(res.error);
      } else {
        toastSuccess('Role revoked successfully.');
        router.refresh();
        setRevokeId(null);
      }
    } catch {
      toastError('Failed to revoke role.');
    } finally {
      setIsRevoking(false);
    }
  };

  // Build a lookup map for research group names to display in the table
  const groupLookup = new Map(researchGroups.map((g) => [g.id, g]));

  const roleRows = assignments.map((ra) => [
    <span key="role" className="font-medium text-base">
      {ra.role}
    </span>,
    <span key="scope" className="text-base">
      {ra.role === 'ACADEMIC_COORDINATOR'
        ? `${ra.programmeScope ?? '-'} / ${ra.degreeScope ?? '-'}`
        : `${ra.scopeType}${ra.scopeId ? ` (${groupLookup.get(ra.scopeId)?.name ?? ra.scopeId})` : ''}`}
    </span>,
    <span key="status" className="text-base">
      {ra.deletedAt ? (
        <span className="text-red-600">Deleted</span>
      ) : ra.expiresAt && new Date(ra.expiresAt) < new Date() ? (
        <span className="text-yellow-600">Expired</span>
      ) : (
        <span className="text-green-600">Active</span>
      )}
    </span>,
    <span key="expires" className="text-base text-muted-foreground">
      {ra.expiresAt ? formatDate(ra.expiresAt) : 'Never'}
    </span>,
    <span key="actions">
      {!ra.deletedAt && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setRevokeId(ra.id)}
            disabled={isRevoking}
          >
            Revoke
          </Button>
      )}
    </span>,
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        {/* Assign Form */}
        <div className="md:col-span-1 rounded-lg border p-4 bg-card">
          <h3 className="text-lg font-semibold mb-4">Assign Role</h3>
          <form onSubmit={handleAssign} className="space-y-4">
            <div className="space-y-2">
              <FieldLabel htmlFor="role">Role</FieldLabel>
              <select
                id="role"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value as ScopedRole);
                  setScopeId('');
                  setProgrammeScope('');
                  setDegreeScope('');
                }}
                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="" disabled>
                  Select a role...
                </option>
                {SCOPED_ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {role === 'RESEARCH_LEAD' && (
              <div className="space-y-2">
                <FieldLabel htmlFor="scopeId">Research Group</FieldLabel>
                {researchGroups.length === 0 ? (
                  <p className="text-base text-muted-foreground py-2">
                    No research groups yet. Create one in the Research module first.
                  </p>
                ) : (
                  <select
                    id="scopeId"
                    value={scopeId}
                    onChange={(e) => setScopeId(e.target.value)}
                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="" disabled>
                      Select a research group...
                    </option>
                    {researchGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                        {group.abbreviation ? ` (${group.abbreviation})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {role === 'ACADEMIC_COORDINATOR' && (
              <>
                <div className="space-y-2">
                  <FieldLabel htmlFor="programmeScope">Programme Scope</FieldLabel>
                  <select
                    id="programmeScope"
                    value={programmeScope}
                    onChange={(e) => setProgrammeScope(e.target.value as ProgrammeScope)}
                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="" disabled>
                      Select programme scope...
                    </option>
                    {PROGRAMME_SCOPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <FieldLabel htmlFor="degreeScope">Degree Scope</FieldLabel>
                  <select
                    id="degreeScope"
                    value={degreeScope}
                    onChange={(e) => setDegreeScope(e.target.value as DegreeScope)}
                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="" disabled>
                      Select degree scope...
                    </option>
                    {DEGREE_SCOPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <Button
              type="submit"
              disabled={
                isSubmitting ||
                isRevoking ||
                (role === 'RESEARCH_LEAD' && researchGroups.length === 0) ||
                (role === 'ACADEMIC_COORDINATOR' && (!programmeScope || !degreeScope))
              }
              className="w-full"
            >
              {isSubmitting ? 'Assigning...' : 'Assign Role'}
            </Button>
          </form>
        </div>

        {/* Assignments Table */}
        <div className="md:col-span-2 space-y-4">
          <DataTable
            headers={['Role', 'Scope', 'Status', 'Expires At', 'Actions']}
            rows={roleRows}
            emptyState={
              <EmptyState
                title="No role assignments yet"
                description="Assign a role to this user to get started."
              />
            }
          />
        </div>
      </div>

      <ConfirmDialog
        open={!!revokeId}
        onOpenChange={(open) => {
          if (!open) setRevokeId(null);
        }}
        title="Revoke Role Assignment"
        description="Are you sure you want to revoke this role? The user will lose associated permissions immediately."
        confirmText="Revoke"
        cancelText="Cancel"
        onConfirm={handleRevoke}
        destructive
      />
    </div>
  );
}
