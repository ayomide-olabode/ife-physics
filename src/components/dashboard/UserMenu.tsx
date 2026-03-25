'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export type TopbarUser = {
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function UserMenu({ user }: { user: TopbarUser }) {
  const avatarFallback = user.name
    ? user.name[0]?.toUpperCase()
    : user.email?.[0]?.toUpperCase() || 'U';

  return (
    <>
      <Link
        href="/dashboard/profile/overview"
        className="flex items-center gap-2 p-2 pr-4 hover:bg-gray-100 transition-colors rounded-lg"
      >
        <Avatar className="h-8 w-8 rounded-full">
          <AvatarImage src={user.image || ''} alt={user.name || user.email || 'Avatar'} />
          <AvatarFallback>{avatarFallback}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col space-y-1">
          <p className="text-base font-medium leading-none">
            {user.name ? user.name : 'Complete Profile'}
          </p>
          <p className="text-sm leading-none text-muted-foreground">{user.email}</p>
        </div>
      </Link>
    </>
  );
}
