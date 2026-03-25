'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getLegacyGalleryById } from '@/server/queries/legacyGallery';
import { Loader2 } from 'lucide-react';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { PublishStatus } from '@prisma/client';

export function LegacyGalleryPreviewModal({
  itemId,
  onClose,
}: {
  itemId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<{
    title: string;
    bioText: string;
    year: number | null;
    datesText: string | null;
    mediaUrl: string;
    status: PublishStatus;
    createdAt: Date;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchItem() {
      try {
        const item = await getLegacyGalleryById(itemId);
        if (item) {
          setData(item);
        }
      } catch (err) {
        console.error('Failed to fetch legacy item details', err);
      } finally {
        setLoading(false);
      }
    }
    fetchItem();
  }, [itemId]);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview Legacy Gallery Item</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !data ? (
          <div className="py-8 text-center text-muted-foreground">Item not found.</div>
        ) : (
          <div className="space-y-6 mt-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-foreground">{data.title}</h3>
                <p className="text-base text-muted-foreground font-medium mt-1">
                  {data.datesText || (data.year ? data.year.toString() : 'No dates provided')}
                </p>
              </div>
              <StatusBadge status={data.status} />
            </div>

            <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border shadow-sm">
              <Image src={data.mediaUrl} alt={data.title} fill className="object-cover" />
            </div>

            <div className="bg-muted p-4 rounded-md">
              <p className="whitespace-pre-wrap text-base text-foreground leading-relaxed">
                {data.bioText}
              </p>
            </div>

            <div className="text-sm text-muted-foreground flex justify-between pt-4 border-t">
              <span>Added: {new Date(data.createdAt).toLocaleString()}</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
