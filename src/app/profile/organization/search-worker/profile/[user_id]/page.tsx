'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { StarIcon, ShieldCheckIcon, UserIcon, PhoneIcon, ClockIcon } from '@heroicons/react/24/outline';
import SidebarProfile from '@/app/components/SidebarProfile';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const BADGE_ICONS = {
  lgbtq: { icon: <span className="text-2xl" role="img" aria-label="LGBTQIA+">🏳️‍🌈</span>, label: "LGBTQIA+ Friendly" },
  non_smoker: { icon: <span className="text-2xl" role="img" aria-label="Non Smoker">🚭</span>, label: "Non-Smoker" },
  pet_friendly: { icon: <span className="text-2xl" role="img" aria-label="Pet Friendly">🐾</span>, label: "Pet Friendly" },
};
const VACC_INFO = {
  covid_19: { icon: <span className="text-2xl" role="img" aria-label="COVID-19">💉</span>, label: "COVID-19 vaccine - Self declared" },
  flu: { icon: <span className="text-2xl" role="img" aria-label="Flu">😷</span>, label: "Seasonal flu vaccine - Self declared" },
  tetanus: { icon: <span className="text-2xl" role="img" aria-label="Tetanus">🩹</span>, label: "Tetanus vaccine - Self declared" },
};
const LANGUAGE_LABELS = {
  english: "English",
  spanish: "Spanish",
  french: "French",
  german: "German",
  chinese: "Chinese",
  other: "Other",
};
const INTEREST_LABELS = {
  cooking: "Cooking",
  movies: "Movies",
  pets: "Pets",
  sports: "Sports",
  gardening: "Gardening",
  music: "Music",
  photography: "Photography",
  travel: "Travel",
  art: "Art",
  reading: "Reading",
  games: "Games",
  festivities: "Festivities",
  fitness: "Fitness",
};
const PREFERENCE_LABELS = {
  non_smoker: "Non-smoker",
  no_pets: "No pets",
  male_only: "Male only",
  female_only: "Female only",
};
const SERVICE_LABELS = {
  everyday: "Everyday Activities Support",
  self_care: "Self-Care Assistance",
  nursing: "Skilled Nursing Care",
  healthcare: "Allied Health Services",
};

export default function SearchWorkerProfilePage({ params }: { params: { user_id: string } }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      setError('');
      try {
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();
        if (!session?.accessToken) throw new Error('No access token');
        const res = await fetch(`https://api.theopenshift.com/v1/users/${params.user_id}`, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Accept': 'application/json',
          },
        });
        if (!res.ok) throw new Error('User not found');
        const data = await res.json();
        setUser(data);
      } catch (e: any) {
        setError(e.message || 'Failed to load user');
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [params.user_id]);

  if (loading) return <div className="p-6 max-w-2xl mx-auto">Loading...</div>;
  if (error) return <div className="p-6 max-w-2xl mx-auto text-red-600">{error}</div>;
  if (!user) return null;

  // Compose sidebar user for organization
  const sidebarUser = user ? { name: `${user.fname || ''} ${user.lname || ''}`.trim() } : null;

  return (
    <div className="min-h-screen bg-white flex">
      {/* Hamburger for mobile */}
      <button
        className="absolute top-4 left-4 z-30 md:hidden bg-white rounded-full p-2 shadow border border-gray-200"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Bars3Icon className="w-7 h-7 text-[#2954bd]" />
      </button>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* Overlay background */}
          <div
            className="fixed inset-0 bg-white/30 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          />
          {/* Sidebar */}
          <div className="relative w-72 max-w-full h-full bg-white shadow-xl flex flex-col">
            <SidebarProfile user={sidebarUser} userType="organization" />
            {/* Close button */}
            <button
              className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>
      )}
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <SidebarProfile user={sidebarUser} userType="organization" />
      </div>
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center py-8 px-4 md:pl-72">
        {/* Profile Header */}
        <section className="w-full max-w-3xl mx-auto rounded-b-2xl overflow-hidden mb-8">
          <div className="bg-[#2954bd] flex flex-col sm:flex-row items-center sm:items-end gap-6 px-6 sm:px-12 py-8 sm:py-12">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-white">
              <div className="w-full h-full flex items-center justify-center bg-gray-200 text-5xl text-[#2954bd]">
                {(user.fname?.[0] || '') + (user.lname?.[0] || '') || 'U'}
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center sm:items-start gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-white">{`${user.fname || ''} ${user.lname || ''}`.trim() || 'No Name'}</h2>
                {user.role && (
                  <span className="bg-[#f07057]/90 text-white text-xs font-semibold px-2 py-1 rounded">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                )}
              </div>
              {user.address && <div className="text-white/80 text-sm">{user.address}</div>}
            </div>
          </div>
        </section>
        {/* About Section */}
        <section className="w-full max-w-3xl mx-auto border-b border-gray-200 pb-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">About {user.fname || ''}</h3>
          </div>
          <div className="text-gray-700 text-sm min-h-[40px]">{user.bio || <span className="italic text-gray-400">No bio provided.</span>}</div>
        </section>
        {/* Two-column grid for the rest */}
        <div className="w-full max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-8">
            {/* Skills Section */}
            {user.skills && user.skills.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 rounded-full bg-[#2954bd]/10 text-[#2954bd] font-medium text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}
            {/* Badges Section */}
            {user.badges && user.badges.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Badges</h3>
                <div className="flex flex-wrap gap-2">
                  {user.badges.map((badge: string, idx: number) => (
                    BADGE_ICONS[badge as keyof typeof BADGE_ICONS] ? (
                      <span key={idx} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f07057]/10 text-[#f07057] text-base font-medium">
                        {BADGE_ICONS[badge as keyof typeof BADGE_ICONS].icon}
                        {BADGE_ICONS[badge as keyof typeof BADGE_ICONS].label}
                      </span>
                    ) : (
                      <span key={idx} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-base font-medium">
                        {badge}
                      </span>
                    )
                  ))}
                </div>
              </section>
            )}
            {/* Vaccinations Section */}
            {user.vaccinations && user.vaccinations.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Immunisation</h3>
                <div className="flex flex-col gap-2">
                  {user.vaccinations.map((vacc: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-black">
                      {VACC_INFO[vacc as keyof typeof VACC_INFO]?.icon}
                      <span>{VACC_INFO[vacc as keyof typeof VACC_INFO]?.label || vacc}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {/* Languages Section */}
            {user.languages && user.languages.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {user.languages.map((lang: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2954bd]/10 text-[#2954bd] text-base font-medium">
                      {LANGUAGE_LABELS[lang as keyof typeof LANGUAGE_LABELS] || lang}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
          <div className="flex flex-col gap-8">
            {/* Interests Section */}
            {user.interests && user.interests.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Interests & Hobbies</h3>
                <div className="flex flex-wrap gap-2">
                  {user.interests.map((interest: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2954bd]/10 text-[#2954bd] text-base font-medium">
                      {INTEREST_LABELS[interest as keyof typeof INTEREST_LABELS] || interest}
                    </span>
                  ))}
                </div>
              </section>
            )}
            {/* Preferences Section */}
            {user.preferences && user.preferences.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Preferences</h3>
                <div className="flex flex-wrap gap-2">
                  {user.preferences.map((pref: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2954bd]/10 text-[#2954bd] text-base font-medium">
                      {PREFERENCE_LABELS[pref as keyof typeof PREFERENCE_LABELS] || pref}
                    </span>
                  ))}
                </div>
              </section>
            )}
            {/* Services Section */}
            {user.services && user.services.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Services Provided</h3>
                <div className="flex flex-wrap gap-2">
                  {user.services.map((service: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2954bd]/10 text-[#2954bd] text-base font-medium">
                      {SERVICE_LABELS[service as keyof typeof SERVICE_LABELS] || service}
                    </span>
                  ))}
                </div>
              </section>
            )}
            {/* Contact Section */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact</h3>
              <div className="text-black text-base"><span className="font-bold">Address:</span> {user.address || <span className="italic text-gray-400">N/A</span>}</div>
              <div className="text-black text-base"><span className="font-bold">Gender:</span> {user.gender || <span className="italic text-gray-400">N/A</span>}</div>
            </section>
            {/* Emergency Contact Section */}
            {(user.emergency_contact || user.emergency_contact_phone) && (
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Emergency Contact</h3>
                <div className="text-black text-base"><span className="font-bold">Name:</span> {user.emergency_contact || <span className="italic text-gray-400">N/A</span>}</div>
                <div className="text-black text-base"><span className="font-bold">Phone:</span> {user.emergency_contact_phone || <span className="italic text-gray-400">N/A</span>}</div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 