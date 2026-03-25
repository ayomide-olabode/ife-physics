'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { CourseDetailsModal } from '@/components/public/CourseDetailsModal';

type YearNumber = 1 | 2 | 3 | 4;

interface UndergraduateCourse {
  id?: string;
  code: string;
  title: string;
  description?: string | null;
  prerequisites?: string | null;
  L?: number | null;
  T?: number | null;
  P?: number | null;
  U?: number | null;
  semesterTaken?: 'HARMATTAN' | 'RAIN' | null;
  year?: number | null;
}

interface UndergraduateCourseListingProps {
  courses: UndergraduateCourse[];
}

interface GroupedYear {
  year: YearNumber;
  label: string;
  courses: UndergraduateCourse[];
}

const YEARS: YearNumber[] = [1, 2, 3, 4];

function sortCourses(courses: UndergraduateCourse[]) {
  return [...courses].sort((a, b) => a.code.localeCompare(b.code));
}

function getDefaultOpenYear(groups: GroupedYear[]) {
  const firstPopulated = groups.find((group) => group.courses.length > 0);
  return firstPopulated?.year ?? 1;
}

function groupCoursesByYear(courses: UndergraduateCourse[]) {
  const hasExplicitYearMapping = courses.some((course) => {
    return (
      typeof course.year === 'number' &&
      Number.isInteger(course.year) &&
      course.year >= 1 &&
      course.year <= 4
    );
  });

  const byYear = new Map<YearNumber, UndergraduateCourse[]>(
    YEARS.map((year) => [year, [] as UndergraduateCourse[]]),
  );

  if (hasExplicitYearMapping) {
    for (const course of courses) {
      const year = course.year;
      if (typeof year === 'number' && year >= 1 && year <= 4) {
        byYear.get(year as YearNumber)?.push(course);
      } else {
        byYear.get(1)?.push(course);
      }
    }
  } else {
    // TODO(UG): Switch to year/semester mapping fields when UG program-course mapping is available.
    for (const course of courses) {
      byYear.get(1)?.push(course);
    }
  }

  return YEARS.map((year) => ({
    year,
    label: `Year ${year}`,
    courses: sortCourses(byYear.get(year) || []),
  }));
}

function displaySemester(value?: 'HARMATTAN' | 'RAIN' | null) {
  if (value === 'HARMATTAN') return 'Harmattan';
  if (value === 'RAIN') return 'Rain';
  return '—';
}

function displaySemesterLine(value?: 'HARMATTAN' | 'RAIN' | null) {
  if (value === 'HARMATTAN') return 'Harmattan Semester';
  if (value === 'RAIN') return 'Rain Semester';
  return 'Unknown Semester';
}

function displayLTPU(course: UndergraduateCourse) {
  const L = typeof course.L === 'number' ? course.L : 0;
  const T = typeof course.T === 'number' ? course.T : 0;
  const P = typeof course.P === 'number' ? course.P : 0;
  const U = typeof course.U === 'number' ? course.U : 0;
  return `${L} - ${T} - ${P} - ${U}`;
}

export function UndergraduateCourseListing({ courses }: UndergraduateCourseListingProps) {
  const groups = useMemo(() => groupCoursesByYear(courses), [courses]);
  const searchParams = useSearchParams();
  const deepLinkedCourseCode = searchParams.get('course')?.trim().toUpperCase() ?? null;
  const initialDeepLinkedCourse = useMemo(() => {
    if (!deepLinkedCourseCode) return null;
    return (
      courses.find((course) => course.code.trim().toUpperCase() === deepLinkedCourseCode) ?? null
    );
  }, [courses, deepLinkedCourseCode]);
  const [openYear, setOpenYear] = useState<YearNumber>(() => {
    if (
      initialDeepLinkedCourse &&
      typeof initialDeepLinkedCourse.year === 'number' &&
      Number.isInteger(initialDeepLinkedCourse.year) &&
      initialDeepLinkedCourse.year >= 1 &&
      initialDeepLinkedCourse.year <= 4
    ) {
      return initialDeepLinkedCourse.year as YearNumber;
    }
    return getDefaultOpenYear(groups);
  });
  const [selectedCourse, setSelectedCourse] = useState<UndergraduateCourse | null>(
    initialDeepLinkedCourse,
  );

  if (courses.length === 0) {
    return (
      <div className="border border-brand-navy/20 bg-white px-4 py-3">
        <p className="text-base font-semibold text-brand-navy">No courses yet</p>
        <p className="mt-1 text-base text-gray-600">
          Courses will appear here once added by an academic coordinator.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-brand-navy/20 bg-white">
      {groups.map((group) => {
        const isOpen = openYear === group.year;

        return (
          <section key={group.year} className="border-b border-brand-navy/20 last:border-b-0">
            <h3>
              <button
                type="button"
                onClick={() => setOpenYear(group.year)}
                className={cn(
                  'flex w-full items-center justify-between px-5 py-4 text-left text-base font-semibold transition-colors',
                  isOpen
                    ? 'bg-brand-navy text-white'
                    : 'bg-white text-brand-navy hover:bg-slate-50',
                )}
                aria-expanded={isOpen}
              >
                <span>{group.label}</span>
                <span className="text-lg leading-none">{isOpen ? '−' : '+'}</span>
              </button>
            </h3>

            {isOpen ? (
              <div className="border-t border-brand-navy/20">
                {group.courses.length > 0 ? (
                  <>
                    <div className="md:hidden">
                      {group.courses.map((course) => (
                        <button
                          key={course.id || course.code}
                          type="button"
                          onClick={() => setSelectedCourse(course)}
                          className="block w-full border-b border-brand-navy/20 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-brand-navy/5"
                        >
                          <p className="text-base font-semibold text-brand-navy">
                            {course.code} - {course.title}
                          </p>
                          <p className="mt-1 text-base text-gray-700">
                            {displaySemesterLine(course.semesterTaken)} ({displayLTPU(course)})
                          </p>
                        </button>
                      ))}
                    </div>

                    <div className="hidden overflow-x-auto md:block">
                      <table className="min-w-full border-collapse text-sm md:text-base">
                        <thead>
                          <tr className="bg-slate-50 text-left text-brand-navy">
                            <th className="border border-brand-navy/20 px-4 py-3 font-semibold">
                              Course Code
                            </th>
                            <th className="border border-brand-navy/20 px-4 py-3 font-semibold">
                              Course Title
                            </th>
                            <th className="border border-brand-navy/20 px-4 py-3 font-semibold">
                              Semester Taken
                            </th>
                            <th className="border border-brand-navy/20 px-4 py-3 font-semibold">
                              L - T - P - U
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.courses.map((course) => (
                            <tr
                              key={course.id || course.code}
                              className="cursor-pointer bg-white transition-colors hover:bg-brand-navy/5"
                              onClick={() => setSelectedCourse(course)}
                            >
                              <td className="border border-brand-navy/20 px-4 py-3 font-medium text-brand-navy">
                                {course.code}
                              </td>
                              <td className="border border-brand-navy/20 px-4 py-3 text-gray-700">
                                {course.title}
                              </td>
                              <td className="border border-brand-navy/20 px-4 py-3 text-gray-700">
                                {displaySemester(course.semesterTaken)}
                              </td>
                              <td className="border border-brand-navy/20 px-4 py-3 text-gray-700">
                                {displayLTPU(course)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="px-4 py-4">
                    <p className="text-base text-gray-600">No courses for this year yet.</p>
                  </div>
                )}
              </div>
            ) : null}
          </section>
        );
      })}

      <CourseDetailsModal
        open={Boolean(selectedCourse)}
        onOpenChange={(open) => {
          if (!open) setSelectedCourse(null);
        }}
        course={selectedCourse}
      />
    </div>
  );
}
