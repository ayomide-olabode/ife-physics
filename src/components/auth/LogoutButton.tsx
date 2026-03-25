'use client';

import { signOut } from 'next-auth/react';
import { Button, type ButtonProps } from '@/components/ui/button';

export function LogoutButton({ children, variant = 'outline', ...props }: ButtonProps) {
  return (
    <Button variant={variant} onClick={() => signOut({ callbackUrl: '/login' })} {...props}>
      {children || 'Log Out'}
    </Button>
  );
}
