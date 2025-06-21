'use client';

import { UserGroupIcon, BuildingOfficeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import LoadingScreen from '../components/LoadingScreen';

export default function RoleSelection() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useUser();
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [showOrgOptions, setShowOrgOptions] = useState(false);

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
      setShowOrgOptions(true);
    }
  };

  const handleAgedCareOrg = () => {
    router.push('/profile-completion/organization');
  };

  if (authLoading || isCheckingProfile) {
    return <LoadingScreen />;
  }

  return (
    <main className="min-h-screen flex flex-col justify-center items-center px-6 py-12 bg-white">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left Text Column */}
        <div className="flex flex-col justify-center text-center md:text-left">
          <h1 className="text-4xl font-bold text-brand-dark mb-4">Choose Your Role</h1>
          <p className="text-lg text-gray-700">
            Select whether you want to continue as a staff member seeking flexible shifts or an organization posting new opportunities.
          </p>
        </div>

        {/* Right Button Column */}
        <div className="flex flex-col space-y-6">
          {!showOrgOptions ? (
            <>
              <button
                onClick={() => handleRoleSelect('staff')}
                className="w-full flex items-center justify-center px-6 py-5 text-lg font-semibold text-white bg-brand-dark rounded-xl hover:bg-brand-accent transition duration-200"
              >
                <UserGroupIcon className="w-6 h-6 mr-3" />
                Care Provider
              </button>
              <button
                onClick={() => handleRoleSelect('organization')}
                className="w-full flex items-center justify-center px-6 py-5 text-lg font-semibold text-brand-dark border-2 border-brand-dark rounded-xl hover:bg-gray-100 transition duration-200"
              >
                <BuildingOfficeIcon className="w-6 h-6 mr-3" />
                Care Seeker
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="flex items-center text-brand-dark text-sm mb-2 w-fit hover:underline focus:outline-none"
                onClick={() => setShowOrgOptions(false)}
                aria-label="Back to role selection"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-1" />
                Back
              </button>
              <button
                className="w-full flex items-center justify-center px-6 py-5 text-lg font-semibold text-brand-dark border-2 border-brand-dark rounded-xl bg-white hover:bg-gray-100 transition duration-200"
                onClick={() => {}}
              >
                For Myself / For someone I know
              </button>
              <button
                className="w-full flex items-center justify-center px-6 py-5 text-lg font-semibold text-white bg-brand-dark rounded-xl hover:bg-brand-accent transition duration-200"
                onClick={handleAgedCareOrg}
              >
                Aged Care Organization
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
