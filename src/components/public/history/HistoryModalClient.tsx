'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type HistoryModalItem = {
  id: string;
  year: number;
  title: string;
  shortDescription: string;
};

export function HistoryModalClient({
  item,
  onClose,
}: {
  item: HistoryModalItem | null;
  onClose: () => void;
}) {
  const open = !!item;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl rounded-none">
        {item ? (
          <>
            <DialogHeader className="space-y-2">
              <p className="text-base font-medium text-brand-navy">{item.year}</p>
              <DialogTitle className="text-2xl font-serif font-bold text-brand-navy leading-tight">
                {item.title}
              </DialogTitle>
            </DialogHeader>

            <div className="max-h-[60vh] overflow-y-auto border border-black/10 bg-white p-5">
              <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-700">
                {item.shortDescription}
              </p>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
