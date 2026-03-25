'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateStaffPublicVisibility } from '@/server/actions/adminStaff';
import { FieldLabel } from '@/components/forms/FieldLabel';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

export function StaffPublicVisibilityManager({
  staffId,
  currentIsPublicProfile,
}: {
  staffId: string;
  currentIsPublicProfile: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [nextIsPublicProfile, setNextIsPublicProfile] = useState(currentIsPublicProfile);
  const hasChanged = nextIsPublicProfile !== currentIsPublicProfile;

  const onSubmit = () => {
    if (!hasChanged) return;

    startTransition(async () => {
      try {
        const result = await updateStaffPublicVisibility({
          staffId,
          isPublicProfile: nextIsPublicProfile,
        });
        if (result.unchanged) {
          toast.info('No visibility change detected.');
          return;
        }
        toast.success(
          nextIsPublicProfile
            ? 'Staff profile is now visible to the public.'
            : 'Staff profile has been hidden from public pages.',
        );
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to update profile visibility.');
      }
    });
  };

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <h3 className="text-base font-medium text-muted-foreground">Public Profile Visibility</h3>
      <div className="flex items-start gap-3">
        <Checkbox
          id="staff-public-visibility"
          checked={nextIsPublicProfile}
          onCheckedChange={(checked) => setNextIsPublicProfile(Boolean(checked))}
        />
        <div className="space-y-1">
          <FieldLabel htmlFor="staff-public-visibility" className="cursor-pointer">
            Show this staff profile on public pages
          </FieldLabel>
          <p className="text-sm text-muted-foreground">
            When disabled, this person is removed from public staff listings, profile pages,
            leadership, and research group member displays.
          </p>
        </div>
      </div>

      <Button type="button" size="sm" onClick={onSubmit} disabled={isPending || !hasChanged}>
        {isPending ? 'Updating...' : 'Update Visibility'}
      </Button>
    </div>
  );
}
