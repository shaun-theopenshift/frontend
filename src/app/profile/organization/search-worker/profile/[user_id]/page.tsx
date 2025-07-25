'use client';
import React, { useEffect, useState, Fragment } from 'react';
import Image from 'next/image';
import { StarIcon, ShieldCheckIcon, UserIcon, PhoneIcon, ClockIcon } from '@heroicons/react/24/outline';
import SidebarProfile from '@/app/components/SidebarProfile';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Compose sidebar user for organization
  const sidebarUser = user ? { name: `${user.fname || ''} ${user.lname || ''}`.trim() } : null;

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3464b4]"></div>
      <p className="ml-4 text-gray-700">Loading profile...</p>
    </div>
  );
  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-red-600 font-semibold text-lg p-4 bg-red-50 rounded-lg border border-red-200">
        Error: {error}
      </div>
    </div>
  );
  if (!user) return null;

  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap");
        body {
          font-family: "Ubuntu", sans-serif;
        }
      `}</style>
      <div className="min-h-screen bg-gray-50 text-gray-800 flex relative overflow-hidden"> {/* Added relative and overflow-hidden */}
        {/* Background design elements */}
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#fe7239] rounded-tl-full z-0 opacity-80 xl:w-[700px] xl:h-[700px]"></div>
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#fe7239] rounded-br-full z-0 opacity-80 xl:w-[700px] xl:h-[700px]"></div>

        {/* Desktop Sidebar - now the only sidebar management in this component */}
          <SidebarProfile userType="organization" user={sidebarUser} />

        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 md:pl-72 ubuntu z-10"> {/* Added z-10 */}
          <div className="max-w-4xl mx-auto">
            <header className="flex justify-between items-center mb-6">
              <div className="text-left">
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">
                  Worker Profile
                </h1>
              </div>
            </header>

            {/* Profile Header */}
            <section className="w-full rounded-xl shadow-md overflow-hidden mb-8 border border-gray-200/80">
              <div className="bg-[#3464b4] flex flex-col sm:flex-row items-center sm:items-end gap-6 px-6 sm:px-12 py-8 sm:py-12">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-white">
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-5xl text-[#3464b4] font-bold">
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
            <section className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-200/80">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">About {user.fname || ''}</h3>
              <p className="text-gray-700 text-base min-h-[40px]">{user.bio || <span className="italic text-gray-400">No bio provided.</span>}</p>
            </section>

            {/* Two-column grid for the rest */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-8">
                {/* Skills Section */}
                {user.skills && user.skills.length > 0 && (
                  <section className="bg-white rounded-xl shadow-md p-6 border border-gray-200/80">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.skills.map((skill: string, idx: number) => (
                        <span key={idx} className="px-3 py-1 rounded-full bg-[#e6ebf3] text-[#3464b4] font-medium text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
                {/* Badges Section */}
                {user.badges && user.badges.length > 0 && (
                  <section className="bg-white rounded-xl shadow-md p-6 border border-gray-200/80">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Badges</h3>
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
                  <section className="bg-white rounded-xl shadow-md p-6 border border-gray-200/80">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Immunisation</h3>
                    <div className="flex flex-col gap-2">
                      {user.vaccinations.map((vacc: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-gray-700">
                          {VACC_INFO[vacc as keyof typeof VACC_INFO]?.icon}
                          <span>{VACC_INFO[vacc as keyof typeof VACC_INFO]?.label || vacc}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                {/* Languages Section */}
                {user.languages && user.languages.length > 0 && (
                  <section className="bg-white rounded-xl shadow-md p-6 border border-gray-200/80">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Languages</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.languages.map((lang: string, idx: number) => (
                        <span key={idx} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e6ebf3] text-[#3464b4] text-base font-medium">
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
                  <section className="bg-white rounded-xl shadow-md p-6 border border-gray-200/80">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Interests & Hobbies</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.interests.map((interest: string, idx: number) => (
                        <span key={idx} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e6ebf3] text-[#3464b4] text-base font-medium">
                          {INTEREST_LABELS[interest as keyof typeof INTEREST_LABELS] || interest}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
                {/* Preferences Section */}
                {user.preferences && user.preferences.length > 0 && (
                  <section className="bg-white rounded-xl shadow-md p-6 border border-gray-200/80">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Preferences</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.preferences.map((pref: string, idx: number) => (
                        <span key={idx} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e6ebf3] text-[#3464b4] text-base font-medium">
                          {PREFERENCE_LABELS[pref as keyof typeof PREFERENCE_LABELS] || pref}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
                {/* Services Section */}
                {user.services && user.services.length > 0 && (
                  <section className="bg-white rounded-xl shadow-md p-6 border border-gray-200/80">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Services Provided</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.services.map((service: string, idx: number) => (
                        <span key={idx} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e6ebf3] text-[#3464b4] text-base font-medium">
                          {SERVICE_LABELS[service as keyof typeof SERVICE_LABELS] || service}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
                {/* Contact Section */}
                <section className="bg-white rounded-xl shadow-md p-6 border border-gray-200/80">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Contact</h3>
                  <div className="text-gray-700 text-base mb-2"><span className="font-semibold">Address:</span> {user.address || <span className="italic text-gray-400">N/A</span>}</div>
                  <div className="text-gray-700 text-base"><span className="font-semibold">Gender:</span> {user.gender || <span className="italic text-gray-400">N/A</span>}</div>
                </section>
                {/* Emergency Contact Section */}
                {(user.emergency_contact || user.emergency_contact_phone) && (
                  <section className="bg-white rounded-xl shadow-md p-6 border border-gray-200/80">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Emergency Contact</h3>
                    <div className="text-gray-700 text-base mb-2"><span className="font-semibold">Name:</span> {user.emergency_contact || <span className="italic text-gray-400">N/A</span>}</div>
                    <div className="text-gray-700 text-base"><span className="font-semibold">Phone:</span> {user.emergency_contact_phone || <span className="italic text-gray-400">N/A</span>}</div>
                  </section>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
