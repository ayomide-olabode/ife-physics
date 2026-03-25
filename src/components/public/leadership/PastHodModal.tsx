'use client';

import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Prose } from '@/components/public/Prose';
import { formatPublicStaffDisplayName } from '@/lib/publicName';
import { formatYearRange } from '@/lib/leadershipFormat';

export interface PastHodModalItem {
  id: string;
  startYear: number | string;
  endYear: number | string | null;
  hasHodAddress?: boolean;
  staff: {
    title?: string | null;
    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;
    profileImageUrl?: string | null;
  };
  address?: {
    title?: string | null;
    body?: string | null;
  } | null;
}

interface PastHodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PastHodModalItem | null;
}

function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export function PastHodModal({ open, onOpenChange, item }: PastHodModalProps) {
  if (!item) {
    return null;
  }

  const name = formatPublicStaffDisplayName({
    title: item.staff.title,
    firstName: item.staff.firstName,
    middleName: item.staff.middleName,
    lastName: item.staff.lastName,
  }) || 'Unknown Staff';
  const tenure = formatYearRange(
    Number(item.startYear),
    item.endYear ? Number(item.endYear) : null,
  );
  const addressTitle = item.address?.title?.trim();
  const addressBody = item.address?.body?.trim();
  const hasAddress = Boolean(item.hasHodAddress && addressBody);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none max-w-3xl p-0">
        <div className="border-b border-gray-200 px-6 py-4">
          <DialogHeader>
            <p className="text-sm uppercase tracking-wide font-semibold text-gray-500">
              Past Head of Department
            </p>
            <DialogTitle className="text-2xl font-serif text-brand-navy">{name}</DialogTitle>
            <DialogDescription className="text-base text-gray-600">{tenure}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="modal-scroll max-h-[70vh] overflow-auto p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
            <div className="relative mx-auto w-full max-w-[260px] aspect-[3/4] bg-gray-100 border border-gray-200 md:mx-0 md:max-w-none">
              {item.staff.profileImageUrl ? (
                <Image
                  src={item.staff.profileImageUrl}
                  alt={name}
                  fill
                  sizes="(max-width: 767px) 260px, 260px"
                  className="object-cover"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-base">
                  No Image
                </div>
              )}
            </div>

            <div className="space-y-4">
              {hasAddress ? (
                <>
                  <h3 className="text-lg font-semibold text-brand-navy">
                    {addressTitle || 'Address'}
                  </h3>
                  {addressBody ? (
                    looksLikeHtml(addressBody) ? (
                      <Prose html={addressBody} className="prose-sm rounded-none" />
                    ) : (
                      <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {addressBody}
                      </div>
                    )
                  ) : (
                    <p className="text-gray-500">No address available.</p>
                  )}
                </>
              ) : (
                <p className="text-gray-500">No address available.</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
