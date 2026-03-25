import 'next-auth';
import type { StaffType } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      userId: string;
      staffId: string;
      staffType?: StaffType;
      isSuperAdmin: boolean;
      firstLogin?: boolean;
      email?: string | null;
    };
  }

  interface User {
    userId: string;
    staffId: string;
    staffType?: StaffType;
    isSuperAdmin: boolean;
    firstLogin?: boolean;
    email?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string;
    staffId: string;
    staffType?: StaffType;
    isSuperAdmin: boolean;
    firstLogin?: boolean;
  }
}
