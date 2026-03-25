import Image from 'next/image';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { formatPublicStaffName } from '@/lib/publicName';
import type { PublicPeopleCardItem } from '@/server/public/queries/peoplePublic';

function formatAffiliation(item: PublicPeopleCardItem): string | null {
  if (!item.secondaryAffiliation) return null;

  const { name, acronym } = item.secondaryAffiliation;
  if (!acronym) return name;
  return `${name} (${acronym})`;
}

function formatYearForCard(date: Date | null): string | null {
  if (!date) return null;
  const year = String(date.getUTCFullYear());
  return year;
}

export function StaffCard({ item }: { item: PublicPeopleCardItem }) {
  const personName = formatPublicStaffName({
    firstName: item.firstName,
    middleName: item.middleName,
    lastName: item.lastName,
  });

  const heading = [item.title, personName].filter(Boolean).join(' ').trim() || item.institutionalEmail;
  const affiliation = formatAffiliation(item);
  const isMemoriam = item.isInMemoriam || item.staffStatus === 'IN_MEMORIAM';
  const canOpenProfile = item.staffStatus !== 'FORMER';
  const birthDate = isMemoriam ? formatYearForCard(item.dateOfBirth) : null;
  const deathDate = isMemoriam ? formatYearForCard(item.dateOfDeath) : null;
  const memoriamLifespan =
    birthDate && deathDate ? `${birthDate} – ${deathDate}` : deathDate ?? birthDate;

  return (
    <article className="group flex h-full flex-col border border-gray-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[4/3] border-b border-gray-200 bg-gray-100">
        {item.profileImageUrl ? (
          <Image
            src={item.profileImageUrl}
            alt={heading}
            width={640}
            height={480}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-semibold uppercase tracking-wider text-gray-500">
            No Image
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 text-base text-gray-700">
        <h2 className="text-lg font-bold leading-snug text-brand-navy">
          {canOpenProfile ? (
            <Link
              href={`/people/staff/${item.computedStaffSlug}`}
              className="transition group-hover:underline group-hover:underline-offset-4"
            >
              {heading}
            </Link>
          ) : (
            heading
          )}
        </h2>

        <p className="text-base text-gray-600">
          {isMemoriam
            ? item.academicRank || '—'
            : [item.academicRank, item.designation].filter(Boolean).join(', ') || '—'}
        </p>

        {memoriamLifespan ? (
          <p className="mt-1 text-base text-gray-600">{memoriamLifespan}</p>
        ) : null}

        <p className="text-base text-gray-600">{item.primaryResearchGroup?.name ?? 'Research group not specified'}</p>

        {affiliation ? <p className="text-base text-gray-600">{affiliation}</p> : null}

        {!isMemoriam ? (
          <p className="mt-auto flex items-start gap-2 text-base text-gray-700">
            <Mail className="mt-0.5 h-4 w-4 shrink-0" />
            <a href={`mailto:${item.institutionalEmail}`} className="break-all hover:underline">
              {item.institutionalEmail}
            </a>
          </p>
        ) : null}
      </div>
    </article>
  );
}
