'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { formatPublicStaffDisplayName } from '@/lib/publicName';
import { formatYearRange } from '@/lib/leadershipFormat';
import { PastHodModal, type PastHodModalItem } from './PastHodModal';

const INITIAL_LIMIT = 9;

interface PastHodGridProps {
  pastHods: PastHodModalItem[];
}

export function PastHodGrid({ pastHods }: PastHodGridProps) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<PastHodModalItem | null>(null);

  const itemsToShow = useMemo(
    () => (expanded ? pastHods : pastHods.slice(0, INITIAL_LIMIT)),
    [expanded, pastHods],
  );

  return (
    <section>
      <div className="bg-brand-navy px-6 py-4 mb-6">
        <h2 className="text-xl font-serif font-bold text-white">Past Heads of Department</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {itemsToShow.map((item) => {
          const name = formatPublicStaffDisplayName({
            title: item.staff.title,
            firstName: item.staff.firstName,
            middleName: item.staff.middleName,
            lastName: item.staff.lastName,
          }) || 'Unknown Staff';
          const hasAddress = Boolean(item.hasHodAddress);

          const cardContent = (
            <>
              <div className="relative w-full aspect-[4/3] bg-gray-100">
                {item.staff.profileImageUrl ? (
                  <Image
                    src={item.staff.profileImageUrl}
                    alt={name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-base text-gray-400">
                    No Image
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-brand-navy">{name}</h3>
                <span className="inline-block mt-2 bg-brand-navy text-white text-sm font-semibold px-3 py-1">
                  {formatYearRange(
                    Number(item.startYear),
                    item.endYear ? Number(item.endYear) : null,
                  )}
                </span>
              </div>
            </>
          );

          if (!hasAddress) {
            return (
              <div
                key={item.id}
                className="bg-white border border-gray-200 shadow-sm overflow-hidden text-left transition-all hover:border-gray-300"
              >
                {cardContent}
              </div>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item)}
              className="bg-white border border-gray-200 shadow-sm overflow-hidden text-left transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              {cardContent}
            </button>
          );
        })}
      </div>

      {pastHods.length > INITIAL_LIMIT && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="px-6 py-2 border border-brand-navy text-brand-navy font-semibold hover:bg-brand-navy hover:text-white transition-colors"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        </div>
      )}

      <PastHodModal
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
        item={selected}
      />
    </section>
  );
}
