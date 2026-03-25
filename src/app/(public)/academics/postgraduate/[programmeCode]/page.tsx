import { DegreeType, ProgrammeCode } from '@prisma/client';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/public/PageHero';
import { Prose } from '@/components/public/Prose';
import { SectionSidebar } from '@/components/public/Academics/SectionSidebar';
import { ProgrammeTabs } from '@/components/public/academics/ProgrammeTabs';
import { PostgraduateCourseListing } from '@/components/public/academics/PostgraduateCourseListing';
import { PostgraduateDegreeAccordion } from '@/components/public/academics/PostgraduateDegreeAccordion';
import {
  getPublicPgDegreeContent,
  getPublicPostgraduateProgram,
  listPublicPgCourses,
  listPublicPgStudyOptions,
} from '@/server/public/queries/academicsPublic';

const POSTGRAD_PROGRAMME_CODES = ['phy', 'eph'] as const;
type PostgraduateProgrammeCode = (typeof POSTGRAD_PROGRAMME_CODES)[number];

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

function DegreeSection({
  id,
  heading,
  introHtml,
  admissionHtml,
  periodHtml,
  courseHtml,
  examHtml,
}: {
  id: string;
  heading: string;
  introHtml?: string | null;
  admissionHtml?: string | null;
  periodHtml?: string | null;
  courseHtml?: string | null;
  examHtml?: string | null;
}) {
  return (
    <section id={id} className="scroll-mt-28 space-y-6">
      <h3 className="text-3xl font-serif font-bold text-brand-navy">{heading}</h3>
      {hasBodyContent(introHtml) ? (
        <Prose html={introHtml || ''} className="text-gray-700" />
      ) : null}

      <PostgraduateDegreeAccordion
        admissionHtml={admissionHtml}
        periodHtml={periodHtml}
        courseHtml={courseHtml}
        examHtml={examHtml}
      />
    </section>
  );
}

export default async function PostgraduateProgrammePage({ params }: PageProps) {
  const { programmeCode: rawProgrammeCode } = await params;
  const programmeCode = rawProgrammeCode.toLowerCase();

  if (!POSTGRAD_PROGRAMME_CODES.includes(programmeCode as PostgraduateProgrammeCode)) {
    notFound();
  }

  const prismaProgrammeCode = programmeCode.toUpperCase() as ProgrammeCode;

  const [program, mscContent, mphilContent, phdContent, studyOptions, courses] = await Promise.all([
    getPublicPostgraduateProgram(prismaProgrammeCode),
    getPublicPgDegreeContent(prismaProgrammeCode, DegreeType.MSC),
    getPublicPgDegreeContent(prismaProgrammeCode, DegreeType.MPHIL),
    getPublicPgDegreeContent(prismaProgrammeCode, DegreeType.PHD),
    listPublicPgStudyOptions(prismaProgrammeCode),
    listPublicPgCourses(prismaProgrammeCode),
  ]);

  const sidebarItems = [
    { id: 'overview', label: 'Overview & Prospects' },
    { id: 'msc', label: 'M.Sc.' },
    { id: 'mphil', label: 'M.Phil.' },
    { id: 'phd', label: 'Ph.D.' },
    { id: 'study-options', label: 'Study Options' },
    { id: 'course-listing', label: 'Course listing' },
  ];

  return (
    <>
      <PageHero breadcrumbLabel="Academics" title="Postgraduate" />

      <section className="py-8 sm:py-10">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <ProgrammeTabs
            activeProgrammeCode={programmeCode as PostgraduateProgrammeCode}
            level="postgraduate"
          />
        </div>
      </section>

      <section className="pb-20 sm:pb-24">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
            <main className="space-y-10">
              <section id="overview" className="scroll-mt-28 space-y-4">
                <h2 className="text-2xl font-serif font-bold text-brand-navy">
                  Overview & Prospects
                </h2>
                {hasBodyContent(program?.overviewProspects) ? (
                  <Prose html={program?.overviewProspects || ''} className="text-gray-700" />
                ) : (
                  <EmptyState
                    title="Overview unavailable"
                    text="Overview and prospects content has not been published for this programme yet."
                  />
                )}
              </section>
              <hr className="border-brand-navy/10" />

              <DegreeSection
                id="msc"
                heading="Master of Science (M.Sc.)"
                admissionHtml={mscContent?.admissionHtml}
                periodHtml={mscContent?.periodHtml}
                courseHtml={mscContent?.courseHtml}
                examHtml={mscContent?.examHtml}
              />
              <hr className="border-brand-navy/10" />

              <DegreeSection
                id="mphil"
                heading="Master of Philosophy (M.Phil.)"
                admissionHtml={mphilContent?.admissionHtml}
                periodHtml={mphilContent?.periodHtml}
                courseHtml={mphilContent?.courseHtml}
                examHtml={mphilContent?.examHtml}
              />
              <hr className="border-brand-navy/10" />

              <DegreeSection
                id="phd"
                heading="Doctor of Philosophy (Ph.D.)"
                admissionHtml={phdContent?.admissionHtml}
                periodHtml={phdContent?.periodHtml}
                courseHtml={phdContent?.courseHtml}
                examHtml={phdContent?.examHtml}
              />
              <hr className="border-brand-navy/10" />

              <section id="study-options" className="scroll-mt-28 space-y-6">
                <h2 className="text-2xl font-serif font-bold text-brand-navy">Study options</h2>

                {studyOptions.length > 0 ? (
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
                <PostgraduateCourseListing courses={courses} />
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
