'use client';

import { UserGroupIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export default function RoleSelection() {
  const router = useRouter();

  const handleRoleSelect = (role: 'staff' | 'organization') => {
    if (role === 'staff') {
      router.push('/profile-completion/staff');
    } else {
      router.push('/profile-completion/organization');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#e6f2f2] to-white p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Continue as</h2>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => handleRoleSelect('staff')}
            className="w-full flex items-center justify-center px-6 py-4 text-lg font-medium text-white bg-[#67b5b5] rounded-md hover:bg-[#4a9e9e] transition-colors duration-200"
          >
            <UserGroupIcon className="w-6 h-6 mr-3" />
            Staff
          </button>
          
          <button
            onClick={() => handleRoleSelect('organization')}
            className="w-full flex items-center justify-center px-6 py-4 text-lg font-medium text-[#67b5b5] border-2 border-[#67b5b5] rounded-md hover:bg-[#e6f2f2] transition-colors duration-200"
          >
            <BuildingOfficeIcon className="w-6 h-6 mr-3" />
            Organization
          </button>
        </div>
      </div>
    </main>
  );
} 