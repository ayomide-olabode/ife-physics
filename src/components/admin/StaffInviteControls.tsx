'use client';

import { Mail } from 'lucide-react';
import { useState } from 'react';
import { toastError, toastSuccess } from '@/lib/toast';
import { sendInviteForStaff } from '@/server/actions/adminInvites';
import { Button } from '@/components/ui/button';

type StaffInviteControlsProps = {
  staffId: string;
};

export function StaffInviteControls({ staffId }: StaffInviteControlsProps) {
  const [isSending, setIsSending] = useState(false);

  async function handleResendInvite() {
    setIsSending(true);
    try {
      const result = await sendInviteForStaff(staffId);

      if (!result.success) {
        toastError(result.error || 'Failed to send invite.');
        return;
      }

      if (result.status === 'SENT') {
        toastSuccess('Invite link sent');
        return;
      }

      if (result.status === 'THROTTLED') {
        const minutes = result.minutesRemaining ?? 1;
        toastError(`Invite already sent recently. Try again in ${minutes} minute(s).`);
        return;
      }

      if (result.status === 'ALREADY_ACTIVE') {
        toastSuccess('This user is already active.');
        return;
      }

      toastError('Staff record not found.');
    } catch {
      toastError('An unexpected error occurred while sending invite.');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={handleResendInvite} disabled={isSending}>
      <Mail className="h-4 w-4" />
      {isSending ? 'Sending...' : 'Resend invite'}
    </Button>
  );
}
