'use client';

import { UserProvider } from '@auth0/nextjs-auth0/client';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider
      loginUrl="/api/auth/login?audience=https://api.theopenshift.com"
      profileUrl="/api/auth/me"
    >
      {children}
    </UserProvider>
  );
} 