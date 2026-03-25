'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CourseDetailsModal } from '@/components/public/CourseDetailsModal';

type PostgraduateCourse = {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  prerequisites?: string | null;
  L?: number | null;
  T?: number | null;
  P?: number | null;
  U?: number | null;
  semesterTaken?: 'HARMATTAN' | 'RAIN' | null;
};

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

function displayLTPU(course: PostgraduateCourse) {
  const L = typeof course.L === 'number' ? course.L : 0;
  const T = typeof course.T === 'number' ? course.T : 0;
  const P = typeof course.P === 'number' ? course.P : 0;
  const U = typeof course.U === 'number' ? course.U : 0;
  return `${L} - ${T} - ${P} - ${U}`;
}

export function PostgraduateCourseListing({ courses }: { courses: PostgraduateCourse[] }) {
  const sortedCourses = useMemo(
    () => [...courses].sort((a, b) => a.code.localeCompare(b.code)),
    [courses],
  );
  const searchParams = useSearchParams();
  const deepLinkedCourseCode = searchParams.get('course')?.trim().toUpperCase() ?? null;
  const initialDeepLinkedCourse = useMemo(() => {
    if (!deepLinkedCourseCode) return null;
    return (
      sortedCourses.find((course) => course.code.trim().toUpperCase() === deepLinkedCourseCode) ??
      null
    );
  }, [sortedCourses, deepLinkedCourseCode]);
  const [selectedCourse, setSelectedCourse] = useState<PostgraduateCourse | null>(
    initialDeepLinkedCourse,
  );

  if (sortedCourses.length === 0) {
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
    <>
      <div className="border border-brand-navy/20 bg-white md:hidden">
        {sortedCourses.map((course) => (
          <button
            key={course.id}
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

      <div className="hidden overflow-x-auto border border-brand-navy/20 bg-white md:block">
        <table className="min-w-full border-collapse text-sm md:text-base">
          <thead>
            <tr className="bg-slate-50 text-left text-brand-navy">
              <th className="border border-brand-navy/20 px-4 py-3 font-semibold">Course Code</th>
              <th className="border border-brand-navy/20 px-4 py-3 font-semibold">Course Title</th>
              <th className="border border-brand-navy/20 px-4 py-3 font-semibold">Semester Taken</th>
              <th className="border border-brand-navy/20 px-4 py-3 font-semibold">L - T - P - U</th>
            </tr>
          </thead>
          <tbody>
            {sortedCourses.map((course) => (
              <tr
                key={course.id}
                className="cursor-pointer bg-white transition-colors hover:bg-brand-navy/5"
                onClick={() => setSelectedCourse(course)}
              >
                <td className="border border-brand-navy/20 px-4 py-3 font-medium text-brand-navy">
                  {course.code}
                </td>
                <td className="border border-brand-navy/20 px-4 py-3 text-gray-700">{course.title}</td>
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

      <CourseDetailsModal
        open={Boolean(selectedCourse)}
        onOpenChange={(open) => {
          if (!open) setSelectedCourse(null);
        }}
        course={selectedCourse}
      />
    </>
  );
}
