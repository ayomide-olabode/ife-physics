'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ProgrammeCode } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/forms/FieldLabel';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toastSuccess, toastError } from '@/lib/toast';
import { searchCourses } from '@/server/queries/undergraduateCourses';
import {
  addCourseToStudyOption,
  removeCourseFromStudyOption,
} from '@/server/actions/undergraduateStudyOptionCourses';

type MappedCourse = {
  id: string;
  code: string;
  title: string;
};

interface CourseMapperProps {
  programmeCode: ProgrammeCode;
  studyOptionId: string;
  mappedCourses: MappedCourse[];
}

export function CourseMapper({ programmeCode, studyOptionId, mappedCourses }: CourseMapperProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MappedCourse[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    startTransition(async () => {
      try {
        const results = await searchCourses({
          programmeCode,
          q: searchQuery,
          take: 10,
        });
        // Filter out already-mapped courses
        const mappedIds = new Set(mappedCourses.map((c) => c.id));
        setSearchResults(results.filter((r) => !mappedIds.has(r.id)));
      } catch {
        toastError('Failed to search courses.');
      } finally {
        setIsSearching(false);
      }
    });
  };

  const handleAdd = (courseId: string) => {
    startTransition(async () => {
      try {
        const res = await addCourseToStudyOption(programmeCode, studyOptionId, courseId);
        if (res.success) {
          toastSuccess('Course added.');
          setSearchResults((prev) => prev.filter((c) => c.id !== courseId));
          router.refresh();
        } else {
          toastError(res.error || 'Failed to add course.');
        }
      } catch {
        toastError('An unexpected error occurred.');
      }
    });
  };

  const handleRemove = (courseId: string) => {
    startTransition(async () => {
      try {
        const res = await removeCourseFromStudyOption(programmeCode, studyOptionId, courseId);
        if (res.success) {
          toastSuccess('Course removed.');
          router.refresh();
        } else {
          toastError(res.error || 'Failed to remove course.');
        }
      } catch {
        toastError('An unexpected error occurred.');
      }
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Mapped Courses</h3>

      {/* Current mappings */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappedCourses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                  No courses mapped to this study option yet.
                </TableCell>
              </TableRow>
            ) : (
              mappedCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.code}</TableCell>
                  <TableCell>{course.title}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleRemove(course.id)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Search and add */}
      <div className="space-y-4 rounded-lg border bg-card p-4">
        <FieldLabel>Add Course</FieldLabel>
        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by code or title..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearch();
              }
            }}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleSearch}
            disabled={isPending || isSearching}
          >
            Search
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableBody>
                {searchResults.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.code}</TableCell>
                    <TableCell>{course.title}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleAdd(course.id)}
                      >
                        Add
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
