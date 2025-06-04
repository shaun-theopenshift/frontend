'use client';

import { UserGroupIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import LoadingScreen from '../components/LoadingScreen';

export default function RoleSelection() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useUser();
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkRole() {
      if (!user || authLoading) return;

      const ADMIN_EMAIL = "devteam@theopenshift.com";
      if (user.email === ADMIN_EMAIL) {
        router.push('/profile/admin');
        return;
      }

      try {
        const session = await fetch('/api/auth/session').then(res => res.json());
        if (!session?.accessToken) {
          if (isMounted) setIsCheckingProfile(false);
          return;
        }

        // First try to get user profile
        const userRes = await fetch('https://api.theopenshift.com/v1/users/me', {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Accept': 'application/json',
          },
        });

        if (userRes.ok) {
          const userProfile = await userRes.json();
          if (userProfile.role === 'user') {
            router.push('/profile/staff');
            return;
          }
        }

        // If user profile not found or no role, try organization profile
        const orgRes = await fetch('https://api.theopenshift.com/v1/orgs/me', {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Accept': 'application/json',
          },
        });

        if (orgRes.ok) {
          const orgProfile = await orgRes.json();
          if (orgProfile) {
            router.push('/profile/organization');
            return;
          }
        }

        // If neither profile exists, show role selection
        if (isMounted) setIsCheckingProfile(false);
      } catch (error) {
        console.error('Error checking role:', error);
        if (isMounted) setIsCheckingProfile(false);
      }
    }

    if (!authLoading) {
      checkRole();
    }

    return () => {
      isMounted = false;
    };
  }, [user, authLoading, router]);

  const handleRoleSelect = (role: 'staff' | 'organization') => {
    if (role === 'staff') {
      router.push('/profile-completion/staff');
    } else {
      router.push('/profile-completion/organization');
    }
  };

  // Show loading screen while checking auth and profile
  if (authLoading || isCheckingProfile) {
    return <LoadingScreen />;
  }

  // Only show role selection if we're sure the user doesn't have a profile
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-bgLight to-white p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Continue as</h2>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => handleRoleSelect('staff')}
            className="w-full flex items-center justify-center px-6 py-4 text-lg font-medium text-white bg-brand-dark rounded-md hover:bg-brand-accent transition-colors duration-200"
          >
            <UserGroupIcon className="w-6 h-6 mr-3" />
            Staff
          </button>
          
          <button
            onClick={() => handleRoleSelect('organization')}
            className="w-full flex items-center justify-center px-6 py-4 text-lg font-medium text-brand-dark border-2 border-brand-dark rounded-md hover:bg-brand-bgLight transition-colors duration-200"
          >
            <BuildingOfficeIcon className="w-6 h-6 mr-3" />
            Organization
          </button>
        </div>
      </div>
    </main>
  );
} 