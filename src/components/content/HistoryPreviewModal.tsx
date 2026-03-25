'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getHistoryById } from '@/server/queries/history';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Loader2 } from 'lucide-react';
import { PublishStatus } from '@prisma/client';
import { formatDate } from '@/lib/format-date';

export function HistoryPreviewModal({
  historyId,
  onClose,
}: {
  historyId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<{
    id: string;
    title: string;
    year: number;
    shortDesc: string;
    status: PublishStatus;
    createdAt: Date;
    publishedAt?: Date | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const item = await getHistoryById(historyId);
        setData(item);
      } catch (err) {
        console.error('Failed to fetch history details', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [historyId]);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Preview Timeline Entry</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !data ? (
          <div className="py-8 text-center text-muted-foreground">Entry not found.</div>
        ) : (
          <div className="space-y-6 mt-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-foreground">{data.title}</h3>
                <p className="text-base text-primary mt-1 font-medium">{data.year}</p>
              </div>
              <StatusBadge status={data.status} />
            </div>

            <div className="bg-muted p-4 rounded-md">
              <p className="whitespace-pre-wrap text-base text-foreground">{data.shortDesc}</p>
            </div>

            <div className="text-sm text-muted-foreground flex justify-between">
              <span>Added: {formatDate(data.createdAt)}</span>
              {data.publishedAt && <span>Published: {formatDate(data.publishedAt)}</span>}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
