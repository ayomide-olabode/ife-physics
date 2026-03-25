import Image from 'next/image';
import Link from 'next/link';
import { formatPublicStaffName } from '@/lib/publicName';

type Scientist = {
  id: string;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  institutionalEmail: string;
  profileImageUrl: string | null;
  computedStaffSlug: string | null;
  focusAreas: string[];
  isResearchGroupHead: boolean;
};

export function GroupScientistsGrid({ scientists }: { scientists: Scientist[] }) {
  if (scientists.length === 0) {
    return (
      <div className="border border-gray-200 bg-white p-6 text-base text-gray-500 rounded-none">
        No scientists are currently listed for this group.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {scientists.map((scientist) => {
        const name = formatPublicStaffName(scientist);
        return (
          <article
            key={scientist.id}
            className="border border-gray-200 bg-white rounded-none overflow-hidden"
          >
            <div className="relative h-56 bg-gray-100">
              {scientist.isResearchGroupHead ? (
                <span className="absolute left-3 top-3 z-10 bg-brand-navy px-2 py-1 text-sm font-semibold uppercase tracking-wide text-white">
                  Research Group Head
                </span>
              ) : null}
              {scientist.profileImageUrl ? (
                <Image
                  src={scientist.profileImageUrl}
                  alt={name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gray-100 flex items-center justify-center text-base text-gray-400">
                  No image
                </div>
              )}
            </div>
            <div className="p-4 space-y-1">
              <h3 className="text-brand-navy font-semibold">
                {scientist.computedStaffSlug ? (
                  <Link
                    href={`/people/staff/${scientist.computedStaffSlug}`}
                    className="hover:underline hover:underline-offset-2"
                  >
                    {name}
                  </Link>
                ) : (
                  name
                )}
              </h3>
              <a
                href={`mailto:${scientist.institutionalEmail}`}
                className="inline-block text-base text-brand-navy hover:underline break-all"
              >
                {scientist.institutionalEmail}
              </a>
              <hr className="my-2 border-gray-200" />
              <p className="pt-1 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Focus Areas
              </p>
              <p className="text-base text-gray-700 leading-snug">
                {scientist.focusAreas.length > 0
                  ? scientist.focusAreas.join(', ')
                  : 'Not specified'}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
