"use client";

import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import Navigation from "../components/Navigation";
import Image from "next/image";
import { PencilSquareIcon } from '@heroicons/react/24/outline';

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

export default function ProfilePage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/api/auth/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      setError("");
      try {
        const session = await fetch('/api/auth/session').then(res => res.json());
        if (!session?.accessToken) {
          setError("Not authenticated.");
          setLoading(false);
          return;
        }
        const res = await fetch(`${API_BASE_URL}/v1/users/me`, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Accept': 'application/json',
          },
        });
        if (res.status === 404) {
          // No profile found, redirect to role selection
          router.push("/role-selection");
          return;
        }
        if (!res.ok) {
          const errorText = await res.text();
          setError(`Failed to fetch profile: ${res.status} ${res.statusText} - ${errorText}`);
          setLoading(false);
          return;
        }
        const profile = await res.json();
        setProfile(profile);
      } catch (e) {
        setError("Error fetching profile.");
      } finally {
        setLoading(false);
      }
    }
    if (user) fetchProfile();
  }, [user, router]);

  if (isLoading || loading) {
    return (
      <>
        <Navigation minimal />
        <div className="min-h-screen flex items-center justify-center text-lg">Loading profile...</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navigation minimal />
        <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Navigation minimal />
        <div className="min-h-screen flex items-center justify-center text-gray-600">No profile data found.</div>
      </>
    );
  }

  return (
    <>
      <Navigation minimal />
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-tr from-[#fafbfc] via-[#e6f2f2] to-[#b2e0e0] p-8">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-2xl w-full flex flex-col items-center relative mt-24 sm:mt-28">
          {/* Edit Profile Button - top right corner */}
          <button
            onClick={() => router.push('/profile-completion/staff?edit=1')}
            className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 rounded-md bg-[#67b5b5] text-white font-semibold hover:bg-[#4a9e9e] transition shadow z-10"
            title="Edit Profile"
          >
            <PencilSquareIcon className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center mb-8 w-full">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#67b5b5] shadow-lg mb-4">
              {user?.picture ? (
                <Image
                  src={user.picture}
                  alt={user.name || "User"}
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-5xl text-[#67b5b5]">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </div>
              )}
            </div>
            <h2 className="text-2xl font-bold text-[#67b5b5]">{user?.name}</h2>
            <p className="text-gray-500">{user?.email}</p>
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
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="font-semibold text-gray-700">First Name</div>
              <div className="text-gray-900">{profile.fname}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700">Last Name</div>
              <div className="text-gray-900">{profile.lname}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700">Address</div>
              <div className="text-gray-900">{profile.address}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700">Date of Birth</div>
              <div className="text-gray-900">{profile.dob}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700">Gender</div>
              <div className="text-gray-900">{profile.gender}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700">Phone</div>
              <div className="text-gray-900">{profile.phone}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700">Bio</div>
              <div className="text-gray-900">{profile.bio}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700">Emergency Contact</div>
              <div className="text-gray-900">{profile.emergency_contact}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700">Emergency Contact Phone</div>
              <div className="text-gray-900">{profile.emergency_contact_phone}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700">TFN</div>
              <div className="text-gray-900">{profile.tfn}</div>
            </div>
            <div className="sm:col-span-2">
              <div className="font-semibold text-gray-700">Skills</div>
              <div className="text-gray-900">{profile.skills && profile.skills.length > 0 ? profile.skills.join(", ") : "None"}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 