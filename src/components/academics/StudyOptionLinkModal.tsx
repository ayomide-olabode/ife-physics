'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProgrammeCode, ProgramLevel } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { searchStudyOptions } from '@/server/queries/studyOptionSearch';
import {
  linkStudyOptionToProgram,
  createGlobalStudyOption,
} from '@/server/actions/programStudyOptions';
import { toastSuccess, toastError } from '@/lib/toast';

interface SearchResult {
  id: string;
  name: string;
  slug: string | null;
}

interface Props {
  programmeCode: ProgrammeCode;
  level: ProgramLevel;
}

export function StudyOptionLinkModal({ programmeCode, level }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const [newName, setNewName] = useState('');
  const [newAbout, setNewAbout] = useState('');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!q.trim()) return;
    setIsSearching(true);
    setResults([]);
    try {
      const res = await searchStudyOptions({ q });
      setResults(res);
    } catch {
      toastError('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleLink = async (studyOptionId: string) => {
    setIsSubmitting(true);
    const res = await linkStudyOptionToProgram({ programmeCode, level, studyOptionId });
    if (res.success) {
      toastSuccess('Study option linked successfully');
      setOpen(false);
      router.refresh();
      // Redirect to edit page
      if (level === 'POSTGRADUATE') {
        router.push(`/dashboard/postgraduate/${programmeCode.toLowerCase()}/overview`);
      } else {
        router.push(
          `/dashboard/undergraduate/${programmeCode.toLowerCase()}/study-options/${res.programStudyOptionId}`,
        );
      }
    } else {
      toastError(res.error || 'Failed to link option');
    }
    setIsSubmitting(false);
  };

  const handleCreateAndLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsSubmitting(true);
    const createRes = await createGlobalStudyOption({
      name: newName,
      about: newAbout,
    });

    if (!createRes.success || !createRes.studyOptionId) {
      toastError(createRes.error || 'Failed to create study option');
      setIsSubmitting(false);
      return;
    }

    const linkRes = await linkStudyOptionToProgram({
      programmeCode,
      level,
      studyOptionId: createRes.studyOptionId,
    });

    if (linkRes.success) {
      toastSuccess('Created and linked study option successfully');
      setOpen(false);
      router.refresh();
      if (level === 'POSTGRADUATE') {
        router.push(`/dashboard/postgraduate/${programmeCode.toLowerCase()}/overview`);
      } else {
        router.push(
          `/dashboard/undergraduate/${programmeCode.toLowerCase()}/study-options/${linkRes.programStudyOptionId}`,
        );
      }
    } else {
      toastError(linkRes.error || 'Study option created but linking failed');
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Study Option</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Study Option</DialogTitle>
          <DialogDescription>
            Search for an existing global study option to link, or create a new one to use across
            the university.
          </DialogDescription>
        </DialogHeader>

        {!isCreatingNew ? (
          <div className="space-y-4 pt-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Search global options..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <Button type="submit" disabled={isSearching || !q.trim()}>
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </form>

            <div className="space-y-2 border rounded-md p-2 max-h-60 overflow-y-auto">
              {results.length === 0 && !isSearching && q.length > 0 && (
                <div className="text-base text-center py-4 text-muted-foreground">
                  No options found matching &quot;{q}&quot;.
                </div>
              )}
              {results.length === 0 && !isSearching && q.length === 0 && (
                <div className="text-base text-center py-4 text-muted-foreground">
                  Type to search...
                </div>
              )}
              {results.map((opt) => (
                <div
                  key={opt.id}
                  className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md"
                >
                  <span className="font-medium text-base">{opt.name}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => handleLink(opt.id)}
                  >
                    Link
                  </Button>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t text-center">
              <p className="text-base text-muted-foreground mb-2">
                Can&apos;t find what you&apos;re looking for?
              </p>
              <Button variant="secondary" onClick={() => setIsCreatingNew(true)}>
                Create New Study Option
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateAndLink} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="newName">Name</Label>
              <Input
                id="newName"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newAbout">About</Label>
              <Input id="newAbout" value={newAbout} onChange={(e) => setNewAbout(e.target.value)} />
            </div>

            <div className="flex justify-between pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsCreatingNew(false)}>
                Back to Search
              </Button>
              <Button type="submit" disabled={isSubmitting || !newName.trim()}>
                {isSubmitting ? 'Creating...' : 'Create & Link'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
