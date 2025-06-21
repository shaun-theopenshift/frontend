"use client";

import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter, usePathname } from "next/navigation";
import SidebarProfile from '@/app/components/SidebarProfile';
import Image from "next/image";
import { PencilSquareIcon, ClockIcon, StarIcon, ShieldCheckIcon, UserIcon, PhoneIcon, CreditCardIcon, BriefcaseIcon, Bars3Icon, XMarkIcon, HomeIcon, UsersIcon, MagnifyingGlassIcon, ClipboardDocumentCheckIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, InboxIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import LoadingScreen from '../../components/LoadingScreen';
import TopNav from '../../components/TopNav';
import Link from 'next/link';
import { staffNav } from '@/app/components/SidebarProfile';

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
  badges: string[];
  vaccinations: string[];
  languages: string[];
  interests: string[];
  preferences: string[];
  services: string[];
}

const API_BASE_URL = "https://api.theopenshift.com";

const BADGE_ICONS: Record<string, { icon: JSX.Element; label: string }> = {
  lgbtq: { icon: <span className="text-3xl" role="img" aria-label="LGBTQIA+">🏳️‍🌈</span>, label: "LGBTQIA+ Friendly" },
  non_smoker: { icon: <span className="text-3xl" role="img" aria-label="Non Smoker">🚭</span>, label: "Non-Smoker" },
  pet_friendly: { icon: <span className="text-3xl" role="img" aria-label="Pet Friendly">🐾</span>, label: "Pet Friendly" },
};
const VACC_INFO: Record<string, { icon: JSX.Element; label: string }> = {
  covid_19: { icon: <span className="text-2xl" role="img" aria-label="COVID-19">💉</span>, label: "COVID-19 vaccine - Self declared" },
  flu: { icon: <span className="text-2xl" role="img" aria-label="Flu">😷</span>, label: "Seasonal flu vaccine - Self declared" },
  tetanus: { icon: <span className="text-2xl" role="img" aria-label="Tetanus">🩹</span>, label: "Tetanus vaccine - Self declared" },
};
const LANGUAGE_LABELS: Record<string, string> = {
  english: "English",
  spanish: "Spanish",
  french: "French",
  german: "German",
  chinese: "Chinese",
  other: "Other",
};
const INTEREST_LABELS: Record<string, string> = {
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
const PREFERENCE_LABELS: Record<string, string> = {
  non_smoker: "Non-smoker",
  no_pets: "No pets",
  male_only: "Male only",
  female_only: "Female only",
};

// Add icon mappings for languages, interests, and preferences after the label mappings
const LANGUAGE_ICONS: Record<string, JSX.Element> = {
  english: <span className="text-2xl" role="img" aria-label="English">🇬🇧</span>,
  spanish: <span className="text-2xl" role="img" aria-label="Spanish">🇪🇸</span>,
  french: <span className="text-2xl" role="img" aria-label="French">🇫🇷</span>,
  german: <span className="text-2xl" role="img" aria-label="German">🇩🇪</span>,
  chinese: <span className="text-2xl" role="img" aria-label="Chinese">🇨🇳</span>,
  other: <span className="text-2xl" role="img" aria-label="Other">🌐</span>,
};
const INTEREST_ICONS: Record<string, JSX.Element> = {
  cooking: <span className="text-2xl" role="img" aria-label="Cooking">👩‍🍳</span>,
  movies: <span className="text-2xl" role="img" aria-label="Movies">🎬</span>,
  pets: <span className="text-2xl" role="img" aria-label="Pets">🐶</span>,
  sports: <span className="text-2xl" role="img" aria-label="Sports">🏅</span>,
  gardening: <span className="text-2xl" role="img" aria-label="Gardening">🌱</span>,
  music: <span className="text-2xl" role="img" aria-label="Music">🎵</span>,
  photography: <span className="text-2xl" role="img" aria-label="Photography">📷</span>,
  travel: <span className="text-2xl" role="img" aria-label="Travel">✈️</span>,
  art: <span className="text-2xl" role="img" aria-label="Art">🎨</span>,
  reading: <span className="text-2xl" role="img" aria-label="Reading">📚</span>,
  games: <span className="text-2xl" role="img" aria-label="Games">🎲</span>,
  festivities: <span className="text-2xl" role="img" aria-label="Festivities">🎉</span>,
  fitness: <span className="text-2xl" role="img" aria-label="Fitness">💪</span>,
};
const PREFERENCE_ICONS: Record<string, JSX.Element> = {
  non_smoker: <span className="text-2xl" role="img" aria-label="Non-smoker">🚭</span>,
  no_pets: <span className="text-2xl" role="img" aria-label="No pets">🚫🐾</span>,
  male_only: <span className="text-2xl" role="img" aria-label="Male only">👨</span>,
  female_only: <span className="text-2xl" role="img" aria-label="Female only">👩</span>,
};

// Add this mapping after the other label mappings
const SERVICE_LABELS: Record<string, string> = {
  everyday: "Everyday Activities Support",
  self_care: "Self-Care Assistance",
  nursing: "Skilled Nursing Care",
  healthcare: "Allied Health Services",
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function StaffPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [role, setRole] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [availability, setAvailability] = useState<{ [day: string]: boolean }>({});

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
          return;
        }
        const userProfile = await res.json();
        if (isMounted) {
          setProfile(userProfile);
        }
        // Fetch availability from correct endpoint
        const availRes = await fetch(`${API_BASE_URL}/v1/users/availability`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          },
        });
        console.log('Availability Response Status:', availRes.status);
        if (availRes.ok) {
          const availData = await availRes.json();
          console.log('Raw Availability Data:', availData);
          if (availData && availData.availability) {
            console.log('Setting Availability State:', availData.availability);
            setAvailability(availData.availability);
          }
        }
        // Fetch role
        const roleRes = await fetch(`${API_BASE_URL}/v1/roles/me`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          },
        });
        if (roleRes.ok) {
          const roleData = await roleRes.json();
          if (isMounted && roleData?.role) {
            setRole(roleData.role);
          }
        }
        if (isMounted) setLoading(false);
      } catch (e) {
        if (isMounted) {
          setError("Error fetching profile.");
          setLoading(false);
        }
      }
    }
    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Sanitize user for SidebarProfile
  const sidebarUser = user
    ? {
      name: typeof user.name === 'string' ? user.name : undefined,
      picture: typeof user.picture === 'string' ? user.picture : undefined,
      email: typeof user.email === 'string' ? user.email : undefined,
    }
    : null;

  if (isLoading || loading) {
    return <LoadingScreen />;
  }
  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <TopNav onMobileMenu={() => setMobileMenuOpen(true)} />
      <SidebarProfile userType="staff" user={sidebarUser} />
      <div className="md:pl-72 pt-16">
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Main content goes here, e.g. profile header, sections, etc. */}
          {/* Status Banner */}
          <div className="w-full max-w-6xl mx-auto mb-4 px-2 lg:px-0">
            <div className="bg-[#f5877f]/10 border border-[#f07057]/10 text-[#f07057] rounded-lg px-6 py-3 font-medium text-center text-sm shadow-sm">
              Your profile isn't visible to Ages Care Organizations until your account is approved
            </div>
          </div>
          {/* Profile Header */}
          <section className="w-full max-w-6xl mx-auto rounded-b-2xl overflow-hidden mb-8">
            <div className="bg-[#2954bd] flex flex-col sm:flex-row items-center sm:items-end gap-6 px-6 sm:px-12 py-8 sm:py-12">
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-white">
                {user?.picture ? (
                  <Image src={user.picture} alt={profile?.fname || 'User'} width={128} height={128} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-5xl text-[#2954bd]">
                    {(profile?.fname?.[0] || user?.name?.[0] || 'U').toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col items-center sm:items-start gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">{profile ? `${profile.fname} ${profile.lname}` : ''}</h2>
                  {role && (
                    <span className="bg-[#f07057]/90 text-white text-xs font-semibold px-2 py-1 rounded">
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => router.push('/profile/staff/edit')}
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#f07057] text-white font-semibold hover:bg-[#e05a3c] transition shadow"
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </section>
          {/* About Section */}
          <section className="w-full max-w-6xl mx-auto border-b border-gray-200 pb-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">About {profile?.fname || ''}</h3>
              <button className="text-[#2954bd] text-sm font-medium hover:underline" onClick={() => router.push('/profile/staff/edit')}>Edit bio</button>
            </div>
            <div className="text-gray-700 text-sm min-h-[40px]">{profile?.bio || <span className="italic text-gray-400">No bio provided.</span>}</div>
          </section>
          {/* Skills Section */}
          {profile?.skills && profile.skills.length > 0 && (
            <section className="w-full max-w-6xl mx-auto mb-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-full bg-[#2954bd]/10 text-[#2954bd] font-medium text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}
          {/* Main Info Grid */}
          <section className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Preferred Hours */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-6 h-6 text-[#2954bd]" />
                  <h4 className="text-xl font-bold text-black">Preferred hours</h4>
                </div>
                <button className="text-[#2954bd] text-base font-medium hover:underline" onClick={() => router.push('/profile/staff/edit')}>Edit</button>
              </div>
              <div className="text-black text-base mb-2">Support sessions don't need to fill each time slot completely.</div>
              <div className="mb-2">
                {(() => {
                  console.log('Current Availability State:', availability);
                  // Accepts both boolean and array (future proof)
                  const availableDays = DAYS.filter(day => {
                    const val = availability[day.toLowerCase()];
                    console.log(`Checking ${day}:`, val);
                    if (Array.isArray(val)) return val.length > 0;
                    return val === true;
                  });
                  console.log('Filtered Available Days:', availableDays);
                  if (availableDays.length === 0) {
                    return <span className="italic text-gray-400">No availability set.</span>;
                  }
                  return (
                    <div className="flex flex-wrap gap-2">
                      {availableDays.map(day => (
                        <span key={day} className="inline-block bg-[#2954bd]/10 text-[#2954bd] text-base px-3 py-1 rounded-full font-semibold">
                          {day}
                        </span>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div className="mt-12">
                <div className="flex items-center gap-2 mb-1">
                  <BriefcaseIcon className="w-5 h-5 text-[#2954bd]" />
                  <div className="font-bold text-black text-lg">Indicative rates <button className="text-[#2954bd] text-base font-medium hover:underline ml-2" onClick={() => router.push('/profile/staff/edit')}>Edit</button></div>
                </div>
                <div className="flex flex-wrap gap-4 text-base text-black">
                  <div>Meet & greet <span className="font-bold">Free</span></div>
                  <div>Weekday <span className="font-bold">$40.00</span> p/hour</div>
                  <div>Saturday <span className="font-bold">$50.00</span> p/hour</div>
                  <div>Sunday <span className="font-bold">$60.00</span> p/hour</div>
                  <div>24-hour session <span className="font-bold">$600.00</span> p/session</div>
                  <div className="bg-blue-100 border-t border-b border-blue-500 text-blue-700 px-4 py-3 w-full" role="alert">
                    <p className="font-bold">Informational message</p>
                    <p className="text-sm">Some additional text to explain said message.</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Badges, Immunisation, Experience */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <StarIcon className="w-6 h-6 text-[#2954bd]" />
                  <h4 className="text-xl font-bold text-black">Badges</h4>
                </div>
                <button className="text-[#2954bd] text-base font-medium hover:underline" onClick={() => router.push('/profile/staff/edit')}>Edit</button>
              </div>
              <div className="flex gap-3 mb-6">
                {profile?.badges && profile.badges.length > 0 ? (
                  profile.badges.map(badge =>
                    BADGE_ICONS[badge] ? (
                      <span key={badge} className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${badge === 'lgbtq' ? 'bg-[#f07057]/10 text-[#f07057]' : 'bg-[#2954bd]/10 text-[#2954bd]'} text-base font-medium`}>
                        {BADGE_ICONS[badge].icon}
                        {BADGE_ICONS[badge].label}
                </span>
                    ) : null
                  )
                ) : (
                  <span className="italic text-gray-400">No badges selected.</span>
                )}
              </div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="w-6 h-6 text-[#2954bd]" />
                  <h4 className="text-xl font-bold text-black">Immunisation</h4>
                </div>
                <button className="text-[#2954bd] text-base font-medium hover:underline" onClick={() => router.push('/profile/staff/edit')}>Edit</button>
              </div>
              <div className="mb-2">
                {profile?.vaccinations && profile.vaccinations.length > 0 ? (
                  profile.vaccinations.map(vax =>
                    VACC_INFO[vax] ? (
                      <div key={vax} className="flex items-center gap-2 text-black text-base mb-2">
                        {VACC_INFO[vax].icon}
                        <span>{VACC_INFO[vax].label}</span>
                      </div>
                    ) : null
                  )
                ) : (
                  <span className="italic text-gray-400">No vaccinations declared.</span>
                )}
              </div>
              {profile?.services && profile.services.length > 0 && (
                <section className="w-full max-w-6xl mx-auto mb-6 px-2 lg:px-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl font-bold text-black">Services Provided</span>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {profile.services.map(service =>
                      SERVICE_LABELS[service] ? (
                        <span key={service} className="inline-flex items-center justify-center rounded-full bg-[#e6f2f2] text-[#2954bd] font-bold text-base px-6 py-3 shadow-md whitespace-nowrap">
                          {SERVICE_LABELS[service]}
                        </span>
                      ) : null
                    )}
                  </div>
                </section>
              )}
              <div className="flex items-center justify-between mb-5 mt-4">
                <div className="flex items-center gap-2">
                  <BriefcaseIcon className="w-6 h-6 text-[#2954bd]" />
                  <h4 className="text-xl font-bold text-black">Experience</h4>
                </div>
                <button className="text-[#2954bd] text-base font-medium hover:underline" onClick={() => router.push('/profile/staff/edit')}>Edit</button>
              </div>
              <div className="border border-dashed border-gray-300 rounded p-4 text-black text-base bg-gray-50">
                <div className="font-bold mb-1">Only visible to you</div>
                <div>Enter your main experience areas.</div>
                <button className="mt-2 px-3 py-1 rounded bg-[#2954bd] text-white text-base font-semibold hover:bg-[#1d3e8a]">Add experience</button>
              </div>
            </div>
          </section>
          {/* Languages Section */}
          {profile?.languages && profile.languages.length > 0 && (
            <section className="w-full max-w-6xl mx-auto mb-6 px-2 lg:px-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl font-bold text-black">Languages</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {profile.languages.map(lang =>
                  LANGUAGE_LABELS[lang] ? (
                    <span key={lang} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2954bd]/10 text-[#2954bd] text-base font-medium">
                      {LANGUAGE_ICONS[lang]}
                      {LANGUAGE_LABELS[lang]}
                    </span>
                  ) : null
                )}
              </div>
            </section>
          )}
          {/* Interests & Hobbies Section */}
          {profile?.interests && profile.interests.length > 0 && (
            <section className="w-full max-w-6xl mx-auto mb-6 px-2 lg:px-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl font-bold text-black">Interests & Hobbies</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {profile.interests.map(interest =>
                  INTEREST_LABELS[interest] ? (
                    <span key={interest} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2954bd]/10 text-[#2954bd] text-base font-medium">
                      {INTEREST_ICONS[interest]}
                      {INTEREST_LABELS[interest]}
                    </span>
                  ) : null
                )}
              </div>
            </section>
          )}
          {/* Preferences Section */}
          {profile?.preferences && profile.preferences.length > 0 && (
            <section className="w-full max-w-6xl mx-auto mb-6 px-2 lg:px-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl font-bold text-black">Preferences</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {profile.preferences.map(pref =>
                  PREFERENCE_LABELS[pref] ? (
                    <span key={pref} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2954bd]/10 text-[#2954bd] text-base font-medium">
                      {PREFERENCE_ICONS[pref]}
                      {PREFERENCE_LABELS[pref]}
                    </span>
                  ) : null
                )}
              </div>
            </section>
          )}
          {/* Contact & Emergency */}
          <section className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-t border-gray-200 pt-8 pb-10">
            {/* Contact */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-6 h-6 text-[#2954bd]" />
                  <h4 className="text-xl font-bold text-black">Contact</h4>
                </div>
                <button className="text-[#2954bd] text-base font-medium hover:underline" onClick={() => router.push('/profile/staff/edit')}>Edit</button>
              </div>
              <div className="text-black text-base"><span className="font-bold">Phone:</span> {profile?.phone || <span className="italic text-gray-400">N/A</span>}</div>
              <div className="text-black text-base"><span className="font-bold">Address:</span> {profile?.address || <span className="italic text-gray-400">N/A</span>}</div>
              <div className="text-black text-base"><span className="font-bold">Date of Birth:</span> {profile?.dob || <span className="italic text-gray-400">N/A</span>}</div>
              <div className="text-black text-base"><span className="font-bold">Gender:</span> {profile?.gender || <span className="italic text-gray-400">N/A</span>}</div>
            </div>
            {/* Emergency Contact */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <PhoneIcon className="w-6 h-6 text-[#2954bd]" />
                  <h4 className="text-xl font-bold text-black">Emergency Contact</h4>
                </div>
                <button className="text-[#2954bd] text-base font-medium hover:underline">Edit</button>
              </div>
              <div className="text-black text-base pb-4"><span className="font-bold">Name:</span> {profile?.emergency_contact || <span className="italic text-gray-400">N/A</span>}</div>
              <div className="text-black text-base pb-2"><span className="font-bold">Phone:</span> {profile?.emergency_contact_phone || <span className="italic text-gray-400">N/A</span>}</div>
            </div>
          </section>
          {/* Billing Section 
          <section className="w-full max-w-6xl mx-auto border-t border-gray-200 pt-8 mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CreditCardIcon className="w-6 h-6 text-[#2954bd]" />
                <h4 className="text-xl font-bold text-black">Billing</h4>
              </div>
              <button className="text-[#2954bd] text-base font-medium hover:underline">Edit</button>
            </div>
            <div className="text-black text-base">Your billing and payment information will appear here. (Coming soon...)</div>
          </section>
          */}
        </div>
      </div>
      {/* Mobile menu overlay */}
      <div className={`${mobileMenuOpen ? "block" : "hidden"} md:hidden`}>
        <div
          className="fixed inset-0 z-50 bg-white/80"
          onClick={() => setMobileMenuOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10 pt-16">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="-m-1.5 p-1.5">
              <span className="text-2xl font-semibold text-[#2954bd]">
                TheOpenShift
              </span>
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          {/* SidebarProfile nav items for mobile */}
          <nav className="mt-6 space-y-1">
            {staffNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-base font-medium rounded-md ${
                    isActive
                      ? "bg-[#e6f2f2] text-[#2954bd]"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon
                    className={`mr-4 h-6 w-6 flex-shrink-0 ${
                      isActive
                        ? "text-[#2954bd]"
                        : "text-gray-400 group-hover:text-gray-500"
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
            {/* Logout button for mobile */}
            <a
              href="/api/auth/logout"
              className="group flex items-center px-3 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-red-600 mt-4"
            >
              <ArrowRightOnRectangleIcon className="mr-4 h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-red-600" aria-hidden="true" />
              Log out
            </a>
          </nav>
        </div>
      </div>
    </div>
  );
}