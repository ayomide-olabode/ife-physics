'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getRollOfHonourById } from '@/server/queries/rollOfHonour';
import { Loader2 } from 'lucide-react';

export function RollOfHonourPreviewModal({
  entryId,
  onClose,
}: {
  entryId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<{
    name: string;
    registrationNumber: string;
    programme: string;
    cgpa: number;
    graduatingYear: number;
    imageUrl: string | null;
    createdAt: Date;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEntry() {
      try {
        const item = await getRollOfHonourById(entryId);
        setData(item);
      } catch (err) {
        console.error('Failed to fetch Roll of Honour details', err);
      } finally {
        setLoading(false);
      }
    }
    fetchEntry();
  }, [entryId]);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Preview Roll of Honour Entry</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !data ? (
          <div className="py-8 text-center text-muted-foreground">Entry not found.</div>
        ) : (
          <div className="space-y-6 mt-4">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="w-full sm:w-1/3 flex justify-center">
                {data.imageUrl ? (
                  <div className="relative w-32 h-40 rounded-lg overflow-hidden border shadow-sm">
                    <Image src={data.imageUrl} alt={data.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-32 h-40 bg-muted border rounded-lg flex items-center justify-center text-muted-foreground">
                    No Photo
                  </div>
                )}
              </div>
              <div className="w-full sm:w-2/3 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{data.name}</h3>
                  <p className="text-base text-muted-foreground">Reg No. {data.registrationNumber}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground font-semibold uppercase">
                      Programme
                    </p>
                    <p className="text-base text-foreground">{data.programme}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-semibold uppercase">CGPA</p>
                    <p className="text-base text-foreground">{data.cgpa}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-semibold uppercase">
                      Graduating Year
                    </p>
                    <p className="text-base text-foreground">{data.graduatingYear}</p>
                  </div>
                </div>
              </div>
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
