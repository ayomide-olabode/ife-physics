'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { StatusBadge, type PublishStatus } from '@/components/dashboard/StatusBadge';
import { ConfirmDialog } from '@/components/dashboard/ConfirmDialog';
import { publishNews, unpublishNews, archiveNews, deleteNews } from '@/server/actions/news';
import { toastSuccess, toastError } from '@/lib/toast';

export function NewsStatusActions({ id, status }: { id: string; status: PublishStatus }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    description: string;
    confirmText: string;
    destructive: boolean;
    action: () => Promise<{ success: boolean; error?: string }>;
  } | null>(null);

  const actions: {
    label: string;
    show: boolean;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline';
  }[] = [
    {
      label: 'Publish',
      show: status === 'DRAFT',
      onClick: () =>
        setConfirmAction({
          title: 'Publish article?',
          description: 'This will make the article publicly visible.',
          confirmText: 'Publish',
          destructive: false,
          action: () => publishNews(id),
        }),
    },
    {
      label: 'Unpublish',
      show: status === 'PUBLISHED',
      variant: 'outline',
      onClick: () =>
        setConfirmAction({
          title: 'Unpublish article?',
          description: 'This will revert the article to draft status.',
          confirmText: 'Unpublish',
          destructive: false,
          action: () => unpublishNews(id),
        }),
    },
    {
      label: 'Archive',
      show: status !== 'ARCHIVED',
      variant: 'outline',
      onClick: () =>
        setConfirmAction({
          title: 'Archive article?',
          description: 'Archived articles are hidden from all public pages.',
          confirmText: 'Archive',
          destructive: false,
          action: () => archiveNews(id),
        }),
    },
    {
      label: 'Delete',
      show: true,
      variant: 'destructive',
      onClick: () =>
        setConfirmAction({
          title: 'Delete article?',
          description: 'This will soft-delete the article.',
          confirmText: 'Delete',
          destructive: true,
          action: () => deleteNews(id),
        }),
    },
  ];

  const handleConfirm = async () => {
    if (!confirmAction) return;
    startTransition(async () => {
      const res = await confirmAction.action();
      if (res.success) {
        toastSuccess('Action completed.');
        if (confirmAction.title === 'Delete article?') {
          router.push('/dashboard/communication/news');
        } else {
          router.refresh();
        }
      } else {
        toastError(res.error || 'Action failed.');
      }
    });
  };

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        <StatusBadge status={status} />
        {actions
          .filter((a) => a.show)
          .map((a) => (
            <Button
              key={a.label}
              variant={(a.variant as 'default' | 'destructive' | 'outline') || 'default'}
              size="sm"
              onClick={a.onClick}
              disabled={isPending}
            >
              {a.label}
            </Button>
          ))}
      </div>

      {confirmAction && (
        <ConfirmDialog
          open={!!confirmAction}
          onOpenChange={(open) => !open && setConfirmAction(null)}
          title={confirmAction.title}
          description={confirmAction.description}
          confirmText={confirmAction.confirmText}
          onConfirm={handleConfirm}
          destructive={confirmAction.destructive}
        />
      )}
    </>
  );
}
