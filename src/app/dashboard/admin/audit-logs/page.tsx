import { PageHeader } from '@/components/dashboard/PageHeader';
import { listAuditLogs } from '@/server/queries/auditLogs';
import { AuditLogViewer, AuditLogRow } from '@/components/admin/AuditLogViewer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; entityType?: string; actorId?: string; page?: string }>;
}) {
  const query = await searchParams;
  const page = parseInt(query.page || '1', 10);
  const pageSize = 20;

  const { items, total } = await listAuditLogs({
    q: query.q,
    entityType: query.entityType,
    actorId: query.actorId,
    page,
    pageSize,
  });

  const hasNextPage = page * pageSize < total;
  const hasPrevPage = page > 1;

  // Render URL construction securely
  const buildPaginationUrl = (newPage: number) => {
    const paginationParams = new URLSearchParams();
    if (query.q) paginationParams.set('q', query.q);
    if (query.entityType) paginationParams.set('entityType', query.entityType);
    if (query.actorId) paginationParams.set('actorId', query.actorId);
    paginationParams.set('page', newPage.toString());
    return `/dashboard/admin/audit-logs?${paginationParams.toString()}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Review recent admin activity."
      />

      <div className="bg-card text-card-foreground shadow-sm rounded-lg border p-4 space-y-4">
        <form className="flex flex-col sm:flex-row gap-4">
          <Input
            name="q"
            defaultValue={query.q || ''}
            placeholder="Search action or entity..."
            className="sm:max-w-[200px]"
          />
          <Input
            name="entityType"
            defaultValue={query.entityType || ''}
            placeholder="Entity Type (e.g., User)"
            className="sm:max-w-[180px]"
          />
          <Input
            name="actorId"
            defaultValue={query.actorId || ''}
            placeholder="Actor ID"
            className="sm:max-w-[180px]"
          />
          <Button type="submit">Filter</Button>
          {(query.q || query.entityType || query.actorId) && (
            <Button variant="outline" asChild>
              <Link href="/dashboard/admin/audit-logs">Clear</Link>
            </Button>
          )}
        </form>
      </div>

      <AuditLogViewer logs={items as unknown as AuditLogRow[]} />

      {/* Pagination Controls */}
      <div className="flex items-center justify-between">
        <p className="text-base text-muted-foreground">
          Showing {Math.min((page - 1) * pageSize + 1, total)} to {Math.min(page * pageSize, total)}{' '}
          of {total} results
        </p>

        <div className="flex gap-2">
          {hasPrevPage && (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildPaginationUrl(page - 1)}>Previous</Link>
            </Button>
          )}
          {hasNextPage && (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildPaginationUrl(page + 1)}>Next</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
