'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { formatPublicStaffName } from '@/lib/publicName';

interface PastHod {
  id: string;
  startDate: Date;
  endDate: Date | null;
  staff: {
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
    hodAddress: { title: string; body: string } | null;
  };
}

export function LeadershipModal({ hods }: { hods: PastHod[] }) {
  const [selected, setSelected] = useState<PastHod | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {hods.map((term) => {
          const name = formatPublicStaffName({
            firstName: term.staff.firstName,
            middleName: term.staff.middleName,
            lastName: term.staff.lastName,
          });
          const startYear = new Date(term.startDate).getFullYear();
          const endYear = term.endDate ? new Date(term.endDate).getFullYear() : 'Present';
          const hasAddress = !!term.staff.hodAddress;

          return (
            <button
              key={term.id}
              type="button"
              onClick={() => hasAddress && setSelected(term)}
              className={`border border-gray-200 overflow-hidden text-left transition-colors ${
                hasAddress
                  ? 'cursor-pointer hover:border-brand-navy hover:shadow-md'
                  : 'cursor-default'
              }`}
            >
              {/* Image */}
              <div className="relative h-56 bg-gray-100">
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
                <p className="text-base text-gray-500 mt-1">
                  {startYear} – {endYear}
                </p>
                {hasAddress && (
                  <p className="text-sm text-brand-yellow mt-2 font-medium">View Address →</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Modal */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="rounded-none max-w-2xl max-h-[80vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selected.staff.hodAddress?.title ??
                    `Address by ${formatPublicStaffName({
                      firstName: selected.staff.firstName,
                      middleName: selected.staff.middleName,
                      lastName: selected.staff.lastName,
                    })}`}
                </DialogTitle>
                <DialogDescription>
                  {formatPublicStaffName({
                    firstName: selected.staff.firstName,
                    middleName: selected.staff.middleName,
                    lastName: selected.staff.lastName,
                  })}{' '}
                  — {new Date(selected.startDate).getFullYear()} –{' '}
                  {selected.endDate ? new Date(selected.endDate).getFullYear() : 'Present'}
                </DialogDescription>
              </DialogHeader>

              {selected.staff.hodAddress && (
                <div className="prose prose-sm max-w-none mt-4 whitespace-pre-wrap">
                  {selected.staff.hodAddress.body}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
