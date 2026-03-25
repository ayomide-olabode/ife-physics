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

interface GalleryItem {
  id: string;
  title: string;
  year: number | null;
  mediaUrl: string;
  bioText: string;
  datesText: string | null;
}

export function LegacyGalleryModal({ items }: { items: GalleryItem[] }) {
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelected(item)}
            className="border border-gray-200 overflow-hidden text-left cursor-pointer hover:border-brand-navy hover:shadow-md transition-colors"
          >
            {/* Image */}
            <div className="relative h-56 bg-gray-100">
              <Image
                src={item.mediaUrl}
                alt={item.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-brand-navy line-clamp-1">{item.title}</h3>
              {(item.year || item.datesText) && (
                <p className="text-sm text-brand-yellow font-medium mt-1">
                  {item.datesText ?? item.year}
                </p>
              )}
              <p className="text-base text-gray-600 mt-2 line-clamp-2">{item.bioText}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="rounded-none max-w-2xl max-h-[80vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogDescription>
                  {[selected.datesText, selected.year && `Year: ${selected.year}`]
                    .filter(Boolean)
                    .join(' · ') || 'Legacy Gallery'}
                </DialogDescription>
              </DialogHeader>

              {/* Full Image */}
              <div className="relative w-full aspect-[4/3] bg-gray-100 mt-4">
                <Image
                  src={selected.mediaUrl}
                  alt={selected.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 640px"
                  className="object-contain"
                />
              </div>

              {/* Bio */}
              <div className="prose prose-sm max-w-none mt-4 whitespace-pre-wrap">
                {selected.bioText}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
