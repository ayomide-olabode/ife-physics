import Image from 'next/image';
import type { PublicRohEntry } from '@/server/public/queries/rollOfHonourPublic';

export function RollOfHonourCard({ entry }: { entry: PublicRohEntry }) {
  const barPercent = Math.max(0, Math.min(100, (entry.cgpa / 5) * 100));
  const hasSplitName = Boolean(entry.firstName?.trim() && entry.lastName?.trim());
  const displayName = hasSplitName
    ? `${entry.firstName!.trim()}${entry.middleName?.trim() ? ` ${entry.middleName.trim()}` : ''} ${entry.lastName!.trim()}`
    : entry.fullName.trim().replace(/\s+/g, ' ');

  return (
    <article className="border border-gray-200 bg-white overflow-hidden">
      <div className="relative h-52 bg-gray-100">
        {entry.profileImageUrl ? (
          <Image
            src={entry.profileImageUrl}
            alt={displayName}
            width={640}
            height={480}
            loading="lazy"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-base text-gray-400">
            No Image
          </div>
        )}
      </div>

      <div className="space-y-2 p-4">
        <h3 className="text-xl font-semibold text-brand-navy leading-snug">{displayName}</h3>
        <p className="text-base text-gray-600">{entry.registrationNumber}</p>
        <p className="text-base text-gray-600">B.Sc. (Hons) {entry.programme}</p>

        <div className="pt-1">
          <div className="mb-2 flex items-center justify-between text-base">
            <span className="font-medium text-gray-600">CGPA</span>
            <span className="font-semibold text-brand-navy">
              <span className="text-[18px]">{entry.cgpa.toFixed(2)} </span> / 5.00
            </span>
          </div>
          <div className="h-2 w-full bg-gray-200">
            <div className="h-2 bg-brand-yellow" style={{ width: `${barPercent}%` }} />
          </div>
        </div>
      </div>
    </article>
  );
}
