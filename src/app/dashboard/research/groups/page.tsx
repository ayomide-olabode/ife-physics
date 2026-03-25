import Link from 'next/link';
import { AddNewButton } from '@/components/dashboard/AddNewButton';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { requireAuth, requireAnyResearchLead } from '@/lib/guards';
import { isSuperAdmin } from '@/lib/rbac';
import { listResearchGroupsForUser } from '@/server/queries/researchGroups';

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function ResearchGroupsListPage({ searchParams }: PageProps) {
  const session = await requireAuth();
  await requireAnyResearchLead(session);

  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams.q || '';
  const page = parseInt(resolvedSearchParams.page || '1', 10);
  const pageSize = 10;

  const { items, total } = await listResearchGroupsForUser({
    session,
    q,
    page,
    pageSize,
  });
  const totalPages = Math.ceil(total / pageSize);
  const isAdmin = isSuperAdmin(session);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Research Groups"
        description="Manage research groups."
        actions={
          isAdmin ? (
            <AddNewButton href="/dashboard/research/groups/new" />
          ) : undefined
        }
      />

      <form className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="space-y-1 w-full sm:w-64">
          <label htmlFor="q" className="text-base font-medium">
            Search
          </label>
          <Input id="q" name="q" defaultValue={q} placeholder="Name or abbreviation..." />
        </div>
        <Button type="submit" variant="secondary">
          Apply
        </Button>
      </form>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Abbrev</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No research groups found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.abbreviation}</TableCell>
                  <TableCell>{group.name}</TableCell>
                  <TableCell className="text-muted-foreground">{group.slug}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/research/groups/${group.id}`}>Edit</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
            {page > 1 ? (
              <Link href={`?q=${encodeURIComponent(q)}&page=${page - 1}`}>Previous</Link>
            ) : (
              <span>Previous</span>
            )}
          </Button>
          <span className="text-base text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            asChild={page < totalPages}
          >
            {page < totalPages ? (
              <Link href={`?q=${encodeURIComponent(q)}&page=${page + 1}`}>Next</Link>
            ) : (
              <span>Next</span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
