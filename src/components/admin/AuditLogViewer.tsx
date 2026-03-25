'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/dashboard/DataTable';
import { EmptyState } from '@/components/dashboard/EmptyState';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatFullName } from '@/lib/name';
import { toastError } from '@/lib/toast';

type Actor = {
  id: string;
  isSuperAdmin: boolean;
  staff: {
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    institutionalEmail: string;
  } | null;
};

export type AuditLogRow = {
  id: string;
  createdAt: Date;
  action: string;
  entityType: string;
  entityId: string;
  actorId: string | null;
  actor: Actor | null;
};

export function AuditLogViewer({ logs }: { logs: AuditLogRow[] }) {
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [snapshotData, setSnapshotData] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSnapshot = async (id: string) => {
    setSelectedLogId(id);
    setIsLoading(true);
    setSnapshotData(null);

    try {
      const res = await fetch(`/api/admin/audit-logs/${id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch snapshot');
      }

      setSnapshotData(data.log?.snapshot || {});
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Error loading snapshot.');
      setSelectedLogId(null);
    } finally {
      setIsLoading(false);
    }
  };

  const rows = logs.map((log) => {
    const actorName = log.actor?.staff
      ? formatFullName({
          firstName: log.actor.staff.firstName,
          middleName: log.actor.staff.middleName,
          lastName: log.actor.staff.lastName,
        }) || log.actor.staff.institutionalEmail
      : log.actorId || 'System';

    return [
      <span key={`date-${log.id}`} className="text-base whitespace-nowrap">
        {new Date(log.createdAt).toLocaleString()}
      </span>,
      <span key={`actor-${log.id}`} className="text-base">
        {actorName}
      </span>,
      <span key={`action-${log.id}`} className="text-base font-medium">
        {log.action}
      </span>,
      <span key={`entityType-${log.id}`} className="text-base">
        {log.entityType}
      </span>,
      <span
        key={`entityId-${log.id}`}
        className="text-base font-mono text-muted-foreground truncate max-w-[150px] inline-block"
      >
        {log.entityId}
      </span>,
      <Button
        key={`action-btn-${log.id}`}
        variant="outline"
        size="sm"
        onClick={() => fetchSnapshot(log.id)}
      >
        View
      </Button>,
    ];
  });

  return (
    <>
      <DataTable
        headers={['Date', 'Actor', 'Action', 'Entity Type', 'Entity ID', 'Details']}
        rows={rows}
        emptyState={
          <EmptyState
            title="No audit logs yet"
            description="Audit logs will appear here when actions are taken."
          />
        }
      />

      <Dialog
        open={!!selectedLogId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLogId(null);
            setSnapshotData(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Audit Log Snapshot</DialogTitle>
            <DialogDescription>
              Technical overview of the affected entity&apos;s state at the time of the action.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 bg-muted/50 rounded-md border mt-4">
            {isLoading ? (
              <div className="text-base text-muted-foreground animate-pulse">
                Loading snapshot data...
              </div>
            ) : snapshotData ? (
              <pre className="text-sm whitespace-pre-wrap break-words font-mono">
                {JSON.stringify(snapshotData, null, 2)}
              </pre>
            ) : (
              <div className="text-base text-muted-foreground">No snapshot available.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
