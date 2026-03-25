import { requireAuth } from '@/lib/guards';
import prisma from '@/lib/prisma';
import { EditProfileForm } from '@/components/dashboard/EditProfileForm';
import { AvatarUpload } from '@/components/dashboard/AvatarUpload';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { getProfileCompleteness } from '@/server/queries/profileCompleteness';
import { ProfileCompletenessCard } from '@/components/dashboard/ProfileCompletenessCard';
import { ResearchGroupMembershipForm } from '@/components/profile/ResearchGroupMembershipForm';
import { listResearchGroupOptions } from '@/server/queries/researchGroupOptions';
import {
  getMySecondaryAffiliation,
  listSecondaryAffiliationOptions,
} from '@/server/queries/profileSecondaryAffiliation';
import { SecondaryAffiliationSelector } from '@/components/profile/SecondaryAffiliationSelector';

export default async function ProfileOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarding?: string }>;
}) {
  const session = await requireAuth();

  const staffId = session.user?.staffId;

  if (!staffId) {
    return (
      <main className="container mx-auto px-4 py-12">
        <PageHeader title="My Profile" description="Manage your profile details." />
        <p className="text-muted-foreground mt-4">
          Error: No underlying staff record located for this account.
        </p>
      </main>
    );
  }

  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      title: true,
      staffType: true,
      academicRank: true,
      designation: true,
      roomNumber: true,
      bio: true,
      education: true,
      researchInterests: true,
      membershipOfProfessionalOrganizations: true,
      profileImageUrl: true,
      updatedAt: true,
      researchMemberships: {
        where: {
          leftAt: null,
          researchGroup: {
            deletedAt: null,
          },
        },
        select: {
          researchGroupId: true,
        },
        take: 1,
      },
    },
  });

  if (!staff) {
    return (
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>
        <p className="text-muted-foreground">
          Error: No underlying staff record located for this account.
        </p>
      </main>
    );
  }

  const params = await searchParams;
  const showOnboarding = params.onboarding === '1';
  const canManageAcademicAffiliations =
    staff.staffType !== 'TECHNICAL' && staff.staffType !== 'SUPPORT';

  const completeness = await getProfileCompleteness(staffId);
  const options = canManageAcademicAffiliations ? await listResearchGroupOptions() : [];
  const currentGroupId =
    canManageAcademicAffiliations && staff.researchMemberships[0]?.researchGroupId
      ? staff.researchMemberships[0].researchGroupId
      : null;
  const [focusAreaOptions, currentFocusAreaRows] = canManageAcademicAffiliations
    ? await Promise.all([
        prisma.focusArea.findMany({
          where: {
            deletedAt: null,
            researchGroup: {
              deletedAt: null,
            },
          },
          select: {
            id: true,
            title: true,
            researchGroupId: true,
          },
          orderBy: [{ researchGroupId: 'asc' }, { title: 'asc' }],
        }),
        currentGroupId
          ? prisma.staffFocusAreaSelection.findMany({
              where: {
                staffId,
                focusArea: {
                  deletedAt: null,
                  researchGroupId: currentGroupId,
                  researchGroup: {
                    deletedAt: null,
                  },
                },
              },
              select: {
                focusAreaId: true,
              },
            })
          : Promise.resolve([]),
      ])
    : [[], []];
  const initialFocusAreaIds = currentFocusAreaRows.map((row) => row.focusAreaId);
  const secondaryAffiliationOptions = canManageAcademicAffiliations
    ? await listSecondaryAffiliationOptions()
    : [];
  const currentSecondaryAffiliation = canManageAcademicAffiliations
    ? await getMySecondaryAffiliation(staffId)
    : null;

  return (
    <main className="container mx-auto px-4 py-12 space-y-8 max-w-4xl">
      {!completeness.isComplete && (
        <ProfileCompletenessCard completeness={completeness} emphasizeRequired={showOnboarding} />
      )}

      <div>
        <PageHeader title="My Profile" description="Manage your profile details." />
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold mb-6 border-b pb-2">Profile Image</h2>
        <AvatarUpload
          currentImageUrl={staff.profileImageUrl}
          fallbackText={staff.firstName?.[0] || 'S'}
          lastUpdatedAt={staff.updatedAt}
        />
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-xl font-semibold mb-6 border-b pb-2">
          Personal &amp; Appointment Details
        </h2>
        <EditProfileForm
          staffType={staff.staffType}
          initialTitle={staff.title}
          initialFirstName={staff.firstName}
          initialMiddleName={staff.middleName}
          initialLastName={staff.lastName}
          initialAcademicRank={staff.academicRank}
          initialDesignation={staff.designation}
          initialRoomNumber={staff.roomNumber}
          initialBio={staff.bio}
          initialEducation={staff.education}
          initialResearchInterests={staff.researchInterests}
          initialMembershipOfProfessionalOrganizations={
            staff.membershipOfProfessionalOrganizations
          }
          lastUpdatedAt={staff.updatedAt}
        />
      </div>

      {canManageAcademicAffiliations ? (
        <>
          <div className="rounded-none border bg-card p-6">
            <div className="mb-6 border-b pb-2">
              <h2 className="text-xl font-semibold">Secondary Affiliation</h2>
              <p className="text-base text-muted-foreground mt-1">
                Optional — select a centre/unit you&apos;re affiliated with.
              </p>
            </div>
            <SecondaryAffiliationSelector
              initialSecondaryAffiliationId={
                currentSecondaryAffiliation?.secondaryAffiliationId ?? null
              }
              options={secondaryAffiliationOptions}
              lastUpdatedAt={staff.updatedAt}
            />
          </div>

          <ResearchGroupMembershipForm
            initialGroupId={currentGroupId}
            options={options}
            focusAreaOptions={focusAreaOptions}
            initialFocusAreaIds={initialFocusAreaIds}
            lastUpdatedAt={staff.updatedAt}
          />
        </>
      ) : null}
    </main>
  );
}
