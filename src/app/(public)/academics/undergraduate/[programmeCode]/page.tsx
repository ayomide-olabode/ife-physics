import { ProgrammeCode } from '@prisma/client';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/public/PageHero';
import { Prose } from '@/components/public/Prose';
import { SectionSidebar } from '@/components/public/Academics/SectionSidebar';
import { ProgrammeTabs } from '@/components/public/academics/ProgrammeTabs';
import { UndergraduateCourseListing } from '@/components/public/academics/UndergraduateCourseListing';
import {
  getPublicUndergraduateProgram,
  listPublicUgCourses,
  listPublicUgStudyOptions,
} from '@/server/public/queries/academicsPublic';

const UNDERGRAD_PROGRAMME_CODES = ['phy', 'eph', 'slt'] as const;
type UndergraduateProgrammeCode = (typeof UNDERGRAD_PROGRAMME_CODES)[number];

interface PageProps {
  params: Promise<{ programmeCode: string }>;
}

function hasBodyContent(value?: string | null) {
  if (!value) return false;
  const plain = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > 0;
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="border border-brand-navy/20 bg-white px-4 py-3">
      <p className="text-base font-semibold text-brand-navy">{title}</p>
      <p className="mt-1 text-base text-gray-600">{text}</p>
    </div>
  );
}

function SectionBlock({
  id,
  heading,
  html,
  emptyTitle,
  emptyText,
}: {
  id: string;
  heading: string;
  html?: string | null;
  emptyTitle: string;
  emptyText: string;
}) {
  const hasContent = hasBodyContent(html);

  return (
    <section id={id} className="scroll-mt-28 space-y-4">
      <h2 className="text-2xl font-serif font-bold text-brand-navy">{heading}</h2>
      {hasContent ? (
        <Prose html={html || ''} className="text-gray-700" />
      ) : (
        <EmptyState title={emptyTitle} text={emptyText} />
      )}
    </section>
  );
}

export default async function UndergraduateProgrammePage({ params }: PageProps) {
  const { programmeCode: rawProgrammeCode } = await params;
  const programmeCode = rawProgrammeCode.toLowerCase();

  if (!UNDERGRAD_PROGRAMME_CODES.includes(programmeCode as UndergraduateProgrammeCode)) {
    notFound();
  }

  const prismaProgrammeCode = programmeCode.toUpperCase() as ProgrammeCode;

  const [program, studyOptions, courses] = await Promise.all([
    getPublicUndergraduateProgram(prismaProgrammeCode),
    listPublicUgStudyOptions(prismaProgrammeCode),
    listPublicUgCourses(prismaProgrammeCode),
  ]);

  const hasStudyOptions = studyOptions.length > 0;
  const sidebarItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'admission-requirements', label: 'Admission Requirements' },
    { id: 'course-requirements', label: 'Course Requirements' },
    { id: 'study-options', label: 'Study Options' },
    { id: 'course-listing', label: 'Course listing' },
  ];

  return (
    <>
      <PageHero breadcrumbLabel="Academics" title="Undergraduate" />

      <section className="py-8 sm:py-10">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <ProgrammeTabs activeProgrammeCode={programmeCode as UndergraduateProgrammeCode} />
        </div>
      </section>

      <section className="pb-20 sm:pb-24">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
            <main className="space-y-10">
              <SectionBlock
                id="overview"
                heading="Overview & Prospects"
                html={program?.overviewProspects}
                emptyTitle="Overview unavailable"
                emptyText="Overview and prospects content has not been published for this programme yet."
              />
              <hr className="border-brand-navy/10" />

              <SectionBlock
                id="admission-requirements"
                heading="Admission Requirements"
                html={program?.admissionRequirements}
                emptyTitle="Admission requirements unavailable"
                emptyText="Admission requirements for this programme will appear here when available."
              />
              <hr className="border-brand-navy/10" />

              <SectionBlock
                id="course-requirements"
                heading="Course Requirements"
                html={program?.courseRequirements}
                emptyTitle="Course requirements unavailable"
                emptyText="Course requirement details for this programme are not available yet."
              />
              <hr className="border-brand-navy/10" />

              <section id="study-options" className="scroll-mt-28 space-y-6">
                <h2 className="text-2xl font-serif font-bold text-brand-navy">Study options</h2>
                {hasStudyOptions ? (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {studyOptions.map(({ id, studyOption }) => (
                      <article key={id} className="border border-brand-navy/20 bg-white p-6">
                        <h3 className="text-lg font-semibold text-brand-navy">
                          {studyOption.name}
                        </h3>
                        <p className="mt-2 line-clamp-3 text-base text-gray-600">
                          {studyOption.about?.trim() || 'Description coming soon.'}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No study options yet"
                    text="Study options linked to this programme will be listed here once published."
                  />
                )}
              </section>
              <hr className="border-brand-navy/10" />

              <section id="course-listing" className="scroll-mt-28 space-y-6">
                <h2 className="text-2xl font-serif font-bold text-brand-navy">Course listing</h2>
                <UndergraduateCourseListing
                  courses={courses.map((course) => ({
                    id: course.id,
                    code: course.code,
                    title: course.title,
                    description: course.description,
                    prerequisites: course.prerequisites,
                    L: course.L,
                    T: course.T,
                    P: course.P,
                    U: course.U,
                    semesterTaken: course.semesterTaken,
                    year: course.yearLevel,
                  }))}
                />
              </section>
            </main>

            <aside className="hidden lg:block">
              <SectionSidebar items={sidebarItems} />
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
