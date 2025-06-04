"use client";

import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Sidebar from '../../components/Sidebar';
import TopNav from '../../components/TopNav';
import Image from "next/image";
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import LoadingScreen from '../../components/LoadingScreen';

interface StaffProfile {
  fname: string;
  lname: string;
  address: string;
  dob: string;
  gender: string;
  phone: string;
  bio: string;
  emergency_contact: string;
  emergency_contact_phone: string;
  tfn: string;
  skills: string[];
}

const API_BASE_URL = "https://api.theopenshift.com";

export default function StaffPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const refresh = searchParams!.get('refresh');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchProfile() {
      if (!user) return;
      try {
        const session = await fetch('/api/auth/session').then(res => res.json());
        const accessToken = session?.accessToken;
        if (!accessToken) {
          if (isMounted) {
            setError("Not authenticated.");
            setLoading(false);
            setIsCheckingProfile(false);
          }
          return;
        }
        const res = await fetch(`${API_BASE_URL}/v1/users/me`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          },
        });
        if (!res.ok) {
          setProfile(null);
          setLoading(false);
          setIsCheckingProfile(false);
          return;
        }
        const userProfile = await res.json();
        if (isMounted) {
          setProfile(userProfile);
          setLoading(false);
          setIsCheckingProfile(false);
        }
      } catch (e) {
        if (isMounted) {
          setError("Error fetching profile.");
          setLoading(false);
          setIsCheckingProfile(false);
        }
      }
    }
    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [user, pathname, refresh]);

  if (isLoading || isCheckingProfile || loading) {
    return (
      <>
        <Sidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />
        <TopNav onMobileMenu={() => setMobileSidebarOpen(true)} />
        <LoadingScreen />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Sidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />
        <TopNav onMobileMenu={() => setMobileSidebarOpen(true)} />
        <div className="min-h-screen flex items-center justify-center text-red-600 sm:pl-64 pt-16 sm:pt-20 bg-gradient-to-tr from-brand-bgLight via-brand-light to-brand-mint">
          {error}
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Sidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />
        <TopNav onMobileMenu={() => setMobileSidebarOpen(true)} />
        <div className="min-h-screen flex items-center justify-center text-gray-600 sm:pl-64 pt-16 sm:pt-20 bg-gradient-to-tr from-brand-bgLight via-brand-light to-brand-mint">
          No profile data found.
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />
      <TopNav onMobileMenu={() => setMobileSidebarOpen(true)} />
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-[#fafbfc] via-[#e6f2f2] to-[#b2e0e0] sm:pl-64 pt-16 sm:pt-20">
        <section className="bg-white rounded-2xl shadow-2xl p-4 sm:p-10 max-w-full sm:max-w-2xl w-full flex flex-col items-center relative mx-2 sm:mx-0">
          {/* Edit Profile Button - top right corner */}
          <button
            onClick={() => router.push('/profile-completion/staff?edit=1')}
            className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-md bg-[#67b5b5] text-white font-semibold hover:bg-[#4a9e9e] transition shadow z-10"
            title="Edit Profile"
          >
            <PencilSquareIcon className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center mb-8 w-full">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-[#67b5b5] shadow-lg mb-4">
              {user?.picture ? (
                <Image
                  src={user.picture}
                  alt={user.name || "User"}
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-4xl sm:text-5xl text-[#67b5b5]">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </div>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#67b5b5]">{user?.name}</h2>
            <p className="text-gray-500 text-sm sm:text-base">{user?.email}</p>
            {/* Mobile action buttons */}
            <div className="flex flex-col gap-2 w-full mt-4 sm:hidden">
              <button
                onClick={() => router.push('/profile-completion/staff?edit=1')}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#67b5b5] text-white font-semibold hover:bg-[#4a9e9e] transition w-full justify-center"
              >
                <PencilSquareIcon className="w-5 h-5" />
                Edit Profile
              </button>
              <a
                href="/api/auth/logout"
                className="px-4 py-2 rounded-md bg-gray-200 text-[#67b5b5] font-semibold hover:bg-gray-300 transition w-full text-center"
              >
                Sign out
              </a>
            </div>
          </div>
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <div className="font-semibold text-gray-700 text-sm sm:text-base">First Name</div>
              <div className="text-gray-900 break-words">{profile.fname}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700 text-sm sm:text-base">Last Name</div>
              <div className="text-gray-900 break-words">{profile.lname}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700 text-sm sm:text-base">Address</div>
              <div className="text-gray-900 break-words">{profile.address}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700 text-sm sm:text-base">Date of Birth</div>
              <div className="text-gray-900 break-words">{profile.dob}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700 text-sm sm:text-base">Gender</div>
              <div className="text-gray-900 break-words">{profile.gender}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700 text-sm sm:text-base">Phone</div>
              <div className="text-gray-900 break-words">{profile.phone}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700 text-sm sm:text-base">Bio</div>
              <div className="text-gray-900 break-words">{profile.bio}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700 text-sm sm:text-base">Emergency Contact</div>
              <div className="text-gray-900 break-words">{profile.emergency_contact}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700 text-sm sm:text-base">Emergency Contact Phone</div>
              <div className="text-gray-900 break-words">{profile.emergency_contact_phone}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700 text-sm sm:text-base">TFN</div>
              <div className="text-gray-900 break-words">{profile.tfn}</div>
            </div>
            <div className="sm:col-span-2">
              <div className="font-semibold text-gray-700 text-sm sm:text-base">Skills</div>
              <div className="text-gray-900 break-words">{profile.skills && profile.skills.length > 0 ? profile.skills.join(", ") : "None"}</div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
} 