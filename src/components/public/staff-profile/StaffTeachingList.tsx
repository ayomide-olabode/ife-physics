'use client';

import { useState } from 'react';
import { CourseDetailsModal } from '@/components/public/CourseDetailsModal';

type ModalCourse = {
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

type TeachingRecord = {
  id: string;
  courseCode: string | null;
  title: string;
  semester: string | null;
  sessionYear: number | null;
  modalCourse: ModalCourse | null;
};

export function StaffTeachingList({ records }: { records: TeachingRecord[] }) {
  const [selectedCourse, setSelectedCourse] = useState<ModalCourse | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {records.map((record) => {
          const teachingTitle = record.courseCode
            ? `${record.courseCode} - ${record.title}`
            : record.title;

          return (
            <article key={record.id} className="border border-gray-200 p-4">
              <h3 className="font-semibold text-brand-navy">
                {record.modalCourse ? (
                  <button
                    type="button"
                    onClick={() => setSelectedCourse(record.modalCourse)}
                    className="text-left hover:underline hover:underline-offset-2"
                  >
                    {teachingTitle}
                  </button>
                ) : (
                  teachingTitle
                )}
              </h3>
              <p className="mt-1 text-base text-gray-600">
                {[record.sessionYear, record.semester].filter(Boolean).join(' • ')}
              </p>
            </article>
          );
        })}
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
