"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    async function checkProfile() {
      try {
        const session = await fetch('/api/auth/session').then(res => res.json());
        const accessToken = session?.accessToken;
        if (!accessToken) {
          router.push('/api/auth/login');
          return;
        }
        // Try staff profile
        const staffRes = await fetch('https://api.theopenshift.com/v1/users/me', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          },
        });
        if (staffRes.ok) {
          router.push('/profile/staff');
          return;
        }
        // Try organization profile
        const orgRes = await fetch('https://api.theopenshift.com/v1/orgs/me', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          },
        });
        if (orgRes.ok) {
          router.push('/profile/organization');
          return;
        }
        // If neither, go to role selection
        router.push('/role-selection');
      } catch (e) {
        router.push('/role-selection');
      }
    }
    checkProfile();
  }, [router]);

  return null;
} 