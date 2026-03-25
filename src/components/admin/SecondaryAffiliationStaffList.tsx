import Link from 'next/link';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { formatFullName } from '@/lib/name';

interface SecondaryAffiliationStaffListProps {
  staff: Array<{
    id: string;
    slug: string;
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    designation: string | null;
    academicRank: string | null;
    profileImageUrl: string | null;
    institutionalEmail: string;
  }>;
}

function initialsFromName(name: string) {
  const parts = name
    .split(' ')
    .map((x) => x.trim())
    .filter(Boolean);
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
}

export function SecondaryAffiliationStaffList({ staff }: SecondaryAffiliationStaffListProps) {
  if (staff.length === 0) {
    return (
      <EmptyState
        title="No staff in this affiliation"
        description="Staff linked to this secondary affiliation will appear here."
      />
    );
  }

  return (
    <div className="grid gap-3">
      {staff.map((member) => {
        const fullName =
          formatFullName({
            firstName: member.firstName,
            middleName: member.middleName,
            lastName: member.lastName,
          }) || member.institutionalEmail;
        const roleText = member.designation || member.academicRank || 'No designation';
        const initials = initialsFromName(fullName).toUpperCase() || 'NA';

        return (
          <Link
            key={member.id}
            href={`/dashboard/admin/staff/${member.id}`}
            className="flex items-center gap-4 border p-3 rounded-none hover:bg-muted/30 transition-colors"
          >
            {member.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.profileImageUrl}
                alt={fullName}
                className="h-10 w-10 border object-cover rounded-none"
              />
            ) : (
              <div className="h-10 w-10 border bg-muted flex items-center justify-center text-sm font-semibold rounded-none">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-base font-medium truncate">{fullName}</p>
              <p className="text-sm text-muted-foreground truncate">{roleText}</p>
              <p className="text-sm text-muted-foreground truncate">{member.institutionalEmail}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
