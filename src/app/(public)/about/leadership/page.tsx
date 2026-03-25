import Image from 'next/image';
import { getPublicLeadership } from '@/server/public/queries/leadershipPublic';
import { PageHero } from '@/components/public/PageHero';
import { CurrentHodSection } from '@/components/public/about/CurrentHodSection';
import { PastHodGrid } from '@/components/public/leadership/PastHodGrid';
import { formatPublicStaffDisplayName } from '@/lib/publicName';

const DEGREE_SCOPE_LABELS = {
  GENERAL: 'General',
  UNDERGRADUATE: 'Undergraduate',
  POSTGRADUATE: 'Postgraduate',
} as const;

const PROGRAMME_SCOPE_LABELS = {
  GENERAL: 'General',
  PHY: 'Physics',
  EPH: 'Engineering Physics',
  SLT: 'Science Laboratory Technology',
} as const;

const COORDINATOR_TITLE_LABELS = {
  GENERAL_POSTGRADUATE: 'General Postgraduate Coordinator',
  GENERAL_UNDERGRADUATE: 'General Undergraduate Coordinator',
  GENERAL_SLT: 'General SLT Coordinator',
} as const;

export default async function LeadershipPage() {
  const { currentHod, academicCoordinators: coordinators, pastHods } = await getPublicLeadership();

  return (
    <>
      <PageHero breadcrumbLabel="Our Department" title="Our Leadership" />

      <div className="py-16">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          {/* ─── Current HOD ─── */}
          {currentHod && <CurrentHodSection hod={currentHod} />}

          {/* ─── Academic Coordinators ─── */}
          {coordinators.length > 0 && (
            <section className="mb-16">
              <div className="bg-brand-navy px-6 py-4 mb-6">
                <h2 className="text-xl font-serif font-bold text-white">Academic Coordinators</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {coordinators.map((term) => {
                  if (!term.degreeScope || !term.programmeScope) {
                    return null;
                  }

                  const name = formatPublicStaffDisplayName({
                    title: term.staff.title,
                    firstName: term.staff.firstName,
                    middleName: term.staff.middleName,
                    lastName: term.staff.lastName,
                  }) || 'Unknown Staff';
                  const degreeLabel = DEGREE_SCOPE_LABELS[term.degreeScope];
                  const programmeLabel = PROGRAMME_SCOPE_LABELS[term.programmeScope];
                  const coordinatorTitle =
                    COORDINATOR_TITLE_LABELS[
                      term.coordinatorType as keyof typeof COORDINATOR_TITLE_LABELS
                    ] || `${degreeLabel} Coordinator`;

                  return (
                    <div
                      key={term.id}
                      className="bg-white border border-gray-200 shadow-sm overflow-hidden"
                    >
                      <div className="relative h-64 bg-gray-100">
                        {term.staff.profileImageUrl ? (
                          <Image
                            src={term.staff.profileImageUrl}
                            alt={name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-400 text-base">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-brand-navy">{name}</h3>
                        <p className="text-base text-gray-600 mt-1">{coordinatorTitle}</p>
                        <p className="text-base text-gray-600 mt-1">{programmeLabel} Programme</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ─── Past HODs ─── */}
          {pastHods.length > 0 && <PastHodGrid pastHods={pastHods} />}

          {/* Empty state */}
          {!currentHod && coordinators.length === 0 && pastHods.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">
                No leadership information available yet. Check back soon.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
