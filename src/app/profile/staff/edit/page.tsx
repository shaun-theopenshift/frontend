"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import SidebarProfile from '@/app/components/SidebarProfile';
import Image from "next/image";
import {
  UserIcon, PhoneIcon, IdentificationIcon, CalendarIcon, MapPinIcon, ChatBubbleLeftRightIcon, BriefcaseIcon, CheckCircleIcon, XMarkIcon, StarIcon, ShieldCheckIcon, CreditCardIcon, LanguageIcon, HeartIcon, AdjustmentsHorizontalIcon, CameraIcon, BookOpenIcon, ClockIcon, Bars3Icon,
  ChevronUpIcon // Imported for the arrow icon
} from '@heroicons/react/24/outline';
import { apiRequest } from '@/utils/api';
import Player from 'lottie-react';
import vaccinationLottie from './vaccination_extracted/animations/a97011f3-4d86-45cf-a59f-d40bd2ccb5d0.json';
import Toast from '@/app/components/ErrorToast';
import LoadingScreen from '@/app/components/LoadingScreen';
import { AU_STATES_SUBURBS, AU_STATE_LABELS } from '@/data/au-states-suburbs';

// Import Headless UI Disclosure
import { Disclosure } from '@headlessui/react';
// Import Framer Motion
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = "https://api.theopenshift.com";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const LANGUAGES = [
  { label: "English", value: "english" },
  { label: "Spanish", value: "spanish" },
  { label: "French", value: "french" },
  { label: "German", value: "german" },
  { label: "Chinese", value: "chinese" },
  { label: "Other", value: "other" },
];
const INTERESTS = [
  { label: "Cooking", value: "cooking", icon: HeartIcon },
  { label: "Movies", value: "movies", icon: ChatBubbleLeftRightIcon },
  { label: "Pets", value: "pets", icon: UserIcon },
  { label: "Sports", value: "sports", icon: CheckCircleIcon },
  { label: "Gardening", value: "gardening", icon: StarIcon },
  { label: "Music", value: "music", icon: ChatBubbleLeftRightIcon },
  { label: "Photography", value: "photography", icon: CameraIcon },
  { label: "Travel", value: "travel", icon: MapPinIcon },
  { label: "Art", value: "art", icon: XMarkIcon },
  { label: "Reading", value: "reading", icon: BookOpenIcon },
  { label: "Games", value: "games", icon: AdjustmentsHorizontalIcon },
  { label: "Festivities", value: "festivities", icon: StarIcon },
  { label: "Fitness", value: "fitness", icon: StarIcon },
];
const BADGES = [
  { label: "LGBTQIA+", value: "lgbtq", emoji: "🏳️‍🌈" },
  { label: "Non Smoker", value: "non_smoker", emoji: "🚭" },
  { label: "Pet Friendly", value: "pet_friendly", emoji: "🐾" },
];
const VACCINATIONS = [
  { label: "COVID-19", value: "covid_19", emoji: "💉" },
  { label: "Flu", value: "flu", emoji: "🤧" },
  { label: "Tetanus", value: "tetanus", emoji: "🩹" },
];
const PawPrintIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="5.5" cy="10.5" r="1.5" />
    <circle cx="18.5" cy="10.5" r="1.5" />
    <circle cx="12" cy="7.5" r="2" />
    <circle cx="7.5" cy="16.5" r="2" />
    <circle cx="16.5" cy="16.5" r="2" />
  </svg>
);
const PREFERENCES = [
  { label: "Non-smoker", value: "non_smoker", icon: ShieldCheckIcon, iconClass: "text-[#2954bd]" },
  { label: "No pets", value: "no_pets", icon: PawPrintIcon, iconClass: "text-yellow-600" },
  { label: "Male only", value: "male_only", icon: UserIcon, iconClass: "text-blue-500" },
  { label: "Female only", value: "female_only", icon: UserIcon, iconClass: "text-pink-400" },
];
const SERVICES = [
  {
    label: "Everyday Activities Support",
    value: "everyday",
    description: "Assistance with daily living tasks such as meal preparation, cleaning, shopping, and transportation. Helps clients maintain independence in their own homes."
  },
  {
    label: "Self-Care Assistance",
    value: "self_care",
    description: "Support with personal hygiene, bathing, dressing, grooming, toileting, and mobility. Ensures clients' dignity and comfort in daily routines."
  },
  {
    label: "Skilled Nursing Care",
    value: "nursing",
    description: "Medical care provided by registered nurses, including medication management, wound care, injections, monitoring vital signs, and post-hospital care."
  },
  {
    label: "Allied Health Services",
    value: "healthcare",
    description: "Access to allied health professionals such as physiotherapists, occupational therapists, speech pathologists, and dietitians for rehabilitation and wellness."
  },
];

export default function EditProfilePage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});
  const [skillsInput, setSkillsInput] = useState('');
  const [skillsList, setSkillsList] = useState<string[]>(form.skills || []);
  const [activeStep, setActiveStep] = useState(0);

  // Updated stepSections: Removed 'Indicative Rate' and renamed 'Bank Details'
  const stepSections = [
    'Availability',
    'Stripe', // Renamed from 'Bank Details'
    'Badges',
    'Vaccination',
    'Languages',
    'Interests & Hobbies',
    'Services Provided',
    'My Preferences',
  ];

  // Add state for availability
  const [availabilityDays, setAvailabilityDays] = useState<{ [day: string]: boolean }>(() => Object.fromEntries(DAYS.map(day => [day, false])));

  // Add state for Stripe
  const [stripeDashboardUrl, setStripeDashboardUrl] = useState<string | null>(null);
  const [chargesEnabled, setChargesEnabled] = useState<boolean>(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [fetchingStripeLink, setFetchingStripeLink] = useState(false);


  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>(form.services || []);
  const [serviceInfo, setServiceInfo] = useState<string | null>(null);

  const [errorToast, setErrorToast] = useState<{
    message: string;
    isVisible: boolean;
    type?: 'success' | 'error';
  }>({
    message: '',
    isVisible: false,
    type: 'error',
  });

  const [selectedState, setSelectedState] = useState('');
  const [selectedSuburb, setSelectedSuburb] = useState('');

  // Function to fetch Stripe dashboard link
  const fetchStripeDashboardLink = useCallback(async (accessToken: string): Promise<string | null> => {
    setFetchingStripeLink(true);
    setStripeError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/v1/payments/dashboard`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setStripeDashboardUrl(data.url || null);
        return data.url || null;
      } else {
        const errorData = await res.json();
        setStripeError(errorData.message || "Failed to get Stripe dashboard link.");
        setStripeDashboardUrl(null);
        return null;
      }
    } catch (e: any) {
      setStripeError(e.message || "An unexpected error occurred while fetching Stripe dashboard link.");
      setStripeDashboardUrl(null);
      return null;
    } finally {
      setFetchingStripeLink(false);
    }
  }, []);


  // Fetch current profile and availability
  useEffect(() => {
    let isMounted = true;
    async function fetchProfileAndData() {
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

        // Fetch profile
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
          setForm({ ...userProfile });
          // Initialize state for location if data exists
          if (userProfile.address) {
            const foundState = Object.entries(AU_STATES_SUBURBS).find(([, suburbs]) =>
              suburbs.includes(userProfile.address)
            )?.[0];
            if (foundState) {
              setSelectedState(foundState);
              setSelectedSuburb(userProfile.address);
            }
          }
          // Initialize skillsList if form.skills exists
          if (userProfile.skills) {
              setSkillsList(userProfile.skills);
          }
          // Initialize selectedServices if form.services exists
          if (userProfile.services) {
            setSelectedServices(userProfile.services);
          }
          // Initialize selectedHobbies if form.interests exists
          if (userProfile.interests) {
            setSelectedHobbies(userProfile.interests);
          }
          // Set chargesEnabled directly from userProfile
          setChargesEnabled(userProfile.charges_enabled || false);
        }

        // Fetch availability
        const availRes = await fetch(`${API_BASE_URL}/v1/users/availability`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
          },
        });
        if (availRes.ok) {
          const availData = await availRes.json();
          if (availData && availData.availability) {
            // Convert backend keys to match DAYS array casing (e.g., "monday" to "Monday")
            const formattedAvailability: { [key: string]: boolean } = {};
            for (const day of DAYS) {
                formattedAvailability[day] = availData.availability[day.toLowerCase()] || false;
            }
            setAvailabilityDays(formattedAvailability);
          }
        }

        setLoading(false);
      } catch (e) {
        if (isMounted) {
          setError("Error fetching profile or related data.");
          setLoading(false);
        }
      }
    }
    fetchProfileAndData();
    return () => { isMounted = false; };
  }, [user]);


  // Handle PATCH save
  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        // Ensure that address is correctly set from selectedSuburb
        address: selectedSuburb || form.address,
        badges: (form.badges || []).filter((b: string) => BADGES.some(bd => bd.value === b)),
        vaccinations: (form.vaccinations || []).filter((v: string) => VACCINATIONS.some(vx => vx.value === v)),
        languages: (form.languages || []).filter((l: string) => LANGUAGES.some(lg => lg.value === l)),
        // Use selectedHobbies for interests, as that's what's toggled
        interests: selectedHobbies.filter((i: string) => INTERESTS.some(it => it.value === i)),
        preferences: (form.preferences || []).filter((p: string) => PREFERENCES.some(pr => pr.value === p)),
        services: selectedServices.filter(s => SERVICES.some(sv => sv.value === s)),
        skills: skillsList, // Ensure skills are sent
      };

      await apiRequest('/v1/users/user', 'PATCH', payload);
      // Save availability (booleans only)
      const session = await fetch('/api/auth/session').then(res => res.json());
      const accessToken = session?.accessToken;
      if (accessToken) {
        // Convert keys to lowercase for backend
        const availabilityLower = Object.fromEntries(
          Object.entries(availabilityDays).map(([k, v]) => [k.toLowerCase(), v])
        );
        const availRes = await fetch(`${API_BASE_URL}/v1/users/availability`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ availability: availabilityLower }),
        });
        if (!availRes.ok) {
          setErrorToast({
            message: 'Error saving availability',
            isVisible: true,
            type: 'error',
          });
        }
      }
      // Update local profile state after successful save
      setProfile({ ...payload, services: selectedServices, interests: selectedHobbies, skills: skillsList });
      setErrorToast({
        message: 'Profile updated!',
        isVisible: true,
        type: 'success',
      });
    } catch (e) {
      console.error("Error saving profile:", e);
      setErrorToast({
        message: 'Error saving profile. Please try again.',
        isVisible: true,
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  }

  // Sanitize user for SidebarProfile
  const sidebarUser = user
    ? {
      name: typeof user.name === 'string' ? user.name : undefined,
      picture: typeof user.picture === 'string' ? user.picture : undefined,
      email: typeof user.email === 'string' ? user.email : undefined,
    }
    : null;

  // --- Skills handlers ---
  function handleAddSkill(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && skillsInput.trim()) {
      e.preventDefault();
      const newSkill = skillsInput.trim();
      if (!skillsList.includes(newSkill)) {
        const updated = [...skillsList, newSkill];
        setSkillsList(updated);
        setForm((f: any) => ({ ...f, skills: updated }));
      }
      setSkillsInput('');
    }
  }
  function handleRemoveSkill(skill: string) {
    const updated = skillsList.filter(s => s !== skill);
    setSkillsList(updated);
    setForm((f: any) => ({ ...f, skills: updated }));
  }

  function handleDayToggle(day: string) {
    setAvailabilityDays(prev => ({ ...prev, [day]: !prev[day] }));
  }

  function handleToggleHobby(hobby: string) {
    setSelectedHobbies(prev =>
      prev.includes(hobby)
        ? prev.filter(h => h !== hobby)
        : [...prev, hobby]
    );
    // Also update the form state for interests
    setForm((f: any) => {
        const current = f.interests || [];
        return {
            ...f,
            interests: current.includes(hobby)
                ? current.filter((i: string) => i !== hobby)
                : [...current, hobby],
        };
    });
  }

  // --- Additional Details handlers ---
  function handleToggleBadge(badgeValue: string) {
    setForm((f: any) => {
      const current = f.badges || [];
      return {
        ...f,
        badges: current.includes(badgeValue)
          ? current.filter((b: string) => b !== badgeValue)
          : [...current, badgeValue],
      };
    });
  }
  function handleToggleVaccination(vaxValue: string) {
    setForm((f: any) => {
      const current = f.vaccinations || [];
      return {
        ...f,
        vaccinations: current.includes(vaxValue)
          ? current.filter((v: string) => v !== vaxValue)
          : [...current, vaxValue],
      };
    });
  }
  function handleToggleLanguage(langValue: string) {
    setForm((f: any) => {
      const current = f.languages || [];
      return {
        ...f,
        languages: current.includes(langValue)
          ? current.filter((l: string) => l !== langValue)
          : [...current, langValue],
      };
    });
  }

  function handleTogglePreference(prefValue: string) {
    setForm((f: any) => {
      const current = f.preferences || [];
      return {
        ...f,
        preferences: current.includes(prefValue)
          ? current.filter((p: string) => p !== prefValue)
          : [...current, prefValue],
      };
    });
  }

  // Stripe Onboarding Handler
  async function handleStripeOnboarding() {
    setFetchingStripeLink(true);
    setStripeError(null);
    try {
      const session = await fetch('/api/auth/session').then(res => res.json());
      const accessToken = session?.accessToken;
      if (!accessToken) {
        setStripeError("Authentication required to onboard with Stripe.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/v1/payments/onboard`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        setStripeError(errorData.message || "Failed to get Stripe onboarding link.");
        return;
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe onboarding
      } else {
        setStripeError("Stripe onboarding link not found.");
      }
    } catch (e: any) {
      setStripeError(e.message || "An unexpected error occurred during Stripe onboarding.");
    } finally {
      setFetchingStripeLink(false);
    }
  }

  // Go to Stripe Dashboard Handler
  async function handleGoToStripeDashboard() {
    setFetchingStripeLink(true);
    setStripeError(null);
    try {
      const session = await fetch('/api/auth/session').then(res => res.json());
      const accessToken = session?.accessToken;
      if (!accessToken) {
        setStripeError("Authentication required to access Stripe dashboard.");
        setFetchingStripeLink(false);
        return;
      }

      // Call fetchStripeDashboardLink and wait for the URL
      const dashboardUrl = await fetchStripeDashboardLink(accessToken);

      if (dashboardUrl) {
        window.open(dashboardUrl, '_blank'); // Open dashboard in new tab
      } else {
        // Error message already set by fetchStripeDashboardLink
      }
    } catch (e: any) {
      setStripeError(e.message || "An unexpected error occurred while trying to open Stripe dashboard.");
    } finally {
      setFetchingStripeLink(false);
    }
  }


  if (isLoading || loading) {
    return (
      <div className="flex">
        <SidebarProfile user={sidebarUser} userType="staff" />
        <div className="flex-1 min-h-screen flex items-center justify-center bg-[#f6f8fa]">
          <LoadingScreen />
        </div>
      </div>
    );
  }

  // Handler to close sidebar when a nav link is clicked
  function handleSidebarNavClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A') {
      setSidebarOpen(false);
    }
  }

  // Define variants for the disclosure panel animation
  const panelVariants = {
    collapsed: { opacity: 0, height: 0, overflow: 'hidden' },
    open: { opacity: 1, height: 'auto', overflow: 'visible', transition: { duration: 0.3, ease: "easeInOut" } },
  };

  // Variants for individual selectable items
  const itemVariants = {
    hover: { scale: 1.03, transition: { duration: 0.2 } },
    tap: { scale: 0.97, transition: { duration: 0.2 } },
  };


  return (
    <div className="flex min-h-screen bg-[#f6f8fa] relative">
      {/* Hamburger for mobile */}
      <button
        className="absolute top-4 left-4 z-30 md:hidden bg-white rounded-full p-2 shadow border border-gray-200"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Bars3Icon className="w-7 h-7 text-[#3464b4]" />
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
          <div className="relative w-72 max-w-full h-full bg-white shadow-xl flex flex-col" onClick={handleSidebarNavClick}>
            <SidebarProfile
              user={sidebarUser}
              userType="staff"
            />
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
      <SidebarProfile user={sidebarUser} userType="staff" />
      <main className="flex-1 flex flex-col items-center px-2 sm:px-8 py-8">
        <h1 className="text-4xl font-bold text-[#3464b4] mb-8">Edit Profile</h1>

        {/* Current Details Section - Wrapped in Disclosure */}
        <Disclosure as="section" className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow p-8 mb-6">
          {({ open }) => (
            <>
              <Disclosure.Button className="flex justify-between items-center w-full focus:outline-none py-2">
                <h2 className="text-2xl font-bold text-[#3464b4] flex items-center gap-2">
                  <UserIcon className="w-7 h-7 text-[#3464b4]" /> Current Details
                </h2>
                <ChevronUpIcon className={`w-6 h-6 text-[#3464b4] transform transition-transform duration-300 ${open ? 'rotate-0' : 'rotate-180'}`} />
              </Disclosure.Button>
              <AnimatePresence>
                {open && (
                  <Disclosure.Panel static>
                      <motion.div
                          initial="collapsed"
                          animate="open"
                          exit="collapsed"
                          variants={panelVariants}
                          className="pt-4 overflow-hidden"
                      >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block font-semibold text-gray-700 mb-1">First Name</label>
                              <input className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 focus:ring-2 focus:ring-[#3464b4] focus:border-transparent transition" value={form.fname || ''} onChange={e => setForm((f: any) => ({ ...f, fname: e.target.value }))} />
                            </div>
                            <div>
                              <label className="block font-semibold text-gray-700 mb-1">Last Name</label>
                              <input className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 focus:ring-2 focus:ring-[#3464b4] focus:border-transparent transition" value={form.lname || ''} onChange={e => setForm((f: any) => ({ ...f, lname: e.target.value }))} />
                            </div>
                            <div>
                              <label className="block font-semibold text-gray-700 mb-2">State</label>
                              <select
                                className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 focus:ring-2 focus:ring-[#3464b4] focus:border-transparent transition"
                                value={selectedState}
                                onChange={e => {
                                  setSelectedState(e.target.value);
                                  setSelectedSuburb('');
                                  setForm((prev: any) => ({ ...prev, address: '' }));
                                }}
                              >
                                <option value="">Select state</option>
                                {Object.entries(AU_STATE_LABELS).map(([code, label]) => (
                                  <option key={code} value={code}>{label}</option>
                                ))}
                              </select>
                            </div>
                            {selectedState && (
                              <div>
                                <label className="block font-semibold text-gray-700 mb-2">Suburb</label>
                                <select
                                  className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 focus:ring-2 focus:ring-[#3464b4] focus:border-transparent transition"
                                  value={selectedSuburb}
                                  onChange={e => {
                                    setSelectedSuburb(e.target.value);
                                    setForm((prev: any) => ({ ...prev, address: e.target.value }));
                                  }}
                                >
                                  <option value="">Select suburb</option>
                                  {(AU_STATES_SUBURBS[selectedState as keyof typeof AU_STATES_SUBURBS] || []).map((suburb: string) => (
                                    <option key={suburb} value={suburb}>{suburb}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            <div>
                              <label className="block font-semibold text-gray-700 mb-1">Date of Birth</label>
                              <input type="date" className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 focus:ring-2 focus:ring-[#3464b4] focus:border-transparent transition" value={form.dob || ''} onChange={e => setForm((f: any) => ({ ...f, dob: e.target.value }))} />
                            </div>
                            <div>
                              <label className="block font-semibold text-gray-700 mb-1">Gender</label>
                              <select className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 focus:ring-2 focus:ring-[#3464b4] focus:border-transparent transition" value={form.gender || ''} onChange={e => setForm((f: any) => ({ ...f, gender: e.target.value }))}>
                                <option value="">Select</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                            <div>
                              <label className="block font-semibold text-gray-700 mb-1">Phone</label>
                              <input className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 focus:ring-2 focus:ring-[#3464b4] focus:border-transparent transition" value={form.phone || ''} onChange={e => setForm((f: any) => ({ ...f, phone: e.target.value }))} />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block font-semibold text-gray-700 mb-1">Bio</label>
                              <textarea className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 focus:ring-2 focus:ring-[#3464b4] focus:border-transparent transition" rows={3} value={form.bio || ''} onChange={e => setForm((f: any) => ({ ...f, bio: e.target.value }))} />
                            </div>
                            <div>
                              <label className="block font-semibold text-gray-700 mb-1">Emergency Contact Name</label>
                              <input className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 focus:ring-2 focus:ring-[#3464b4] focus:border-transparent transition" value={form.emergency_contact || ''} onChange={e => setForm((f: any) => ({ ...f, emergency_contact: e.target.value }))} />
                            </div>
                            <div>
                              <label className="block font-semibold text-gray-700 mb-1">Emergency Contact Phone</label>
                              <input className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 focus:ring-2 focus:ring-[#3464b4] focus:border-transparent transition" value={form.emergency_contact_phone || ''} onChange={e => setForm((f: any) => ({ ...f, emergency_contact_phone: e.target.value }))} />
                            </div>
                            <div>
                              <label className="block font-semibold text-gray-700 mb-1">TFN</label>
                              <input className="w-full border border-gray-300 rounded-lg p-2 text-gray-800 focus:ring-2 focus:ring-[#3464b4] focus:border-transparent transition" value={form.tfn || ''} onChange={e => setForm((f: any) => ({ ...f, tfn: e.target.value }))} />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block font-semibold text-gray-700 mb-1">Skills</label>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {skillsList.map((skill, idx) => (
                                  <div key={idx} className="group flex items-center gap-1 px-3 py-1.5 bg-[#3464b4]/10 rounded-full text-[#3464b4]">
                                    <span className="text-sm">{skill}</span>
                                    <button type="button" onClick={() => handleRemoveSkill(skill)} className="ml-1 p-0.5 rounded-full hover:bg-[#3464b4]/20 transition-colors">
                                      <XMarkIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <input
                                type="text"
                                value={skillsInput}
                                onChange={e => setSkillsInput(e.target.value)}
                                onKeyDown={handleAddSkill}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-[#3464b4] focus:border-transparent transition"
                                placeholder="Type a skill and press Enter to add"
                              />
                              <p className="text-sm text-gray-600 mt-1">Press Enter to add each skill</p>
                            </div>
                          </div>
                      </motion.div>
                  </Disclosure.Panel>
                )}
              </AnimatePresence>
            </>
          )}
        </Disclosure>

        <section className="w-full max-w-4xl mx-auto rounded-2xl p-0 mb-4">
          <div className="mt-6 flex items-start gap-2 bg-yellow-100 border-l-4 border-yellow-400 p-4 rounded-lg">
            <svg
              className="w-6 h-6 text-yellow-500 mt-0.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
              />
            </svg>
            <span className="text-yellow-800 text-sm font-medium">
              Note: This information will help us match you with suitable clients and opportunities. Please ensure all details are accurate and up-to-date.
            </span>
          </div>
        </section>

        {/* Additional Details Section - Wrapped in Disclosure */}
        <Disclosure as="section" className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow p-8 mb-10">
          {({ open }) => (
            <>
              <Disclosure.Button className="flex justify-between items-center w-full focus:outline-none py-2">
                <h2 className="text-2xl font-bold text-[#3464b4] flex items-center gap-2">
                  <AdjustmentsHorizontalIcon className="w-7 h-7 text-[#3464b4]" /> Additional Details
                </h2>
                <ChevronUpIcon className={`w-6 h-6 text-[#3464b4] transform transition-transform duration-300 ${open ? 'rotate-0' : 'rotate-180'}`} />
              </Disclosure.Button>
              <AnimatePresence>
                {open && (
                  <Disclosure.Panel static>
                      <motion.div
                          initial="collapsed"
                          animate="open"
                          exit="collapsed"
                          variants={panelVariants}
                          className="pt-4 overflow-hidden"
                      >
                          <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex flex-col gap-4 md:w-1/4">
                              {stepSections.map((label, idx) => (
                                <button
                                  key={label}
                                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-semibold text-left ${activeStep === idx ? 'bg-[#dbe9fe] text-[#3464b4]' : 'bg-gray-50 text-gray-800 hover:bg-[#dbe9fe] hover:text-[#3464b4]'} focus:outline-none`}
                                  onClick={() => setActiveStep(idx)}
                                >
                                  <span className={`w-6 h-6 flex items-center justify-center rounded-full border ${activeStep === idx ? 'bg-[#3464b4] text-white border-[#3464b4]' : 'bg-white text-[#3464b4] border-[#3464b4]/40'}`}>{idx + 1}</span>
                                  {label}
                                </button>
                              ))}
                            </div>
                            <div className="flex-1">
                              {activeStep === 0 && (
                                // Availability
                                <div className="mb-12 p-8 bg-[#f8faff] rounded-xl border border-[#e3e8f0]">
                                  <h3 className="text-2xl font-bold text-[#3464b4] mb-6 flex items-center gap-2"><ClockIcon className="w-7 h-7 text-[#3464b4]" /> Availability</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {DAYS.map(day => {
                                      const isSelected = availabilityDays[day];
                                      return (
                                        <motion.button
                                          key={day}
                                          type="button"
                                          onClick={() => handleDayToggle(day)}
                                          whileHover="hover"
                                          whileTap="tap"
                                          variants={itemVariants}
                                          className={`flex items-center gap-3 p-4 rounded-lg border transition font-semibold cursor-pointer text-left shadow-sm
                                            ${isSelected ? 'bg-[#3464b4] text-white border-[#3464b4]' : 'bg-white text-gray-800 border-[#e3e8f0] hover:bg-[#dbe9fe] hover:text-[#3464b4]'}
                                          `}
                                        >
                                          <input
                                            type="checkbox"
                                            className="hidden" // Hide the default checkbox
                                            checked={isSelected}
                                            readOnly // Make it read-only as the button handles clicks
                                          />
                                          <span className={`w-6 h-6 flex items-center justify-center rounded-full border-2 transition-all duration-200
                                            ${isSelected ? 'bg-white text-[#3464b4] border-white' : 'bg-white text-transparent border-gray-400'}
                                          `}>
                                            {isSelected && <CheckCircleIcon className="w-5 h-5" />}
                                          </span>
                                          <span className="text-lg">{day}</span>
                                        </motion.button>
                                      );
                                    })}
                                  </div>
                                  <div className="mt-6 flex items-start gap-2 bg-yellow-100 border-l-4 border-yellow-400 p-4 rounded-lg">
                                    <svg className="w-6 h-6 text-yellow-500 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                                    </svg>
                                    <span className="text-yellow-800 text-sm font-medium">Please select at least one day you are available.</span>
                                  </div>
                                </div>
                              )}
                              {activeStep === 1 && (
                                // Stripe Section (formerly Bank Details)
                                <div className="mb-8 p-8 bg-[#f8faff] rounded-xl border border-[#e3e8f0]">
                                  <h3 className="text-xl font-bold text-[#3464b4] mb-4 flex items-center gap-2"><CreditCardIcon className="w-6 h-6 text-[#3464b4]" /> Stripe</h3>
                                  {chargesEnabled ? (
                                    <div className="flex flex-col items-center justify-center p-6 bg-green-50 border border-green-200 rounded-lg text-green-800">
                                      <CheckCircleIcon className="w-12 h-12 text-green-500 mb-3" />
                                      <p className="font-bold text-lg mb-2">Stripe Onboarding Completed!</p>
                                      <p className="text-sm text-center mb-4">You are all set to receive payments.</p>
                                      <button
                                        onClick={handleGoToStripeDashboard}
                                        disabled={fetchingStripeLink}
                                        className="px-6 py-2 rounded-lg bg-[#3464b4] text-white font-bold hover:bg-[#2a5196] transition disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
                                      >
                                        {fetchingStripeLink ? 'Loading Dashboard...' : 'Go to Dashboard'}
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center p-6 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
                                      <p className="font-bold text-lg mb-2">Complete Stripe Onboarding</p>
                                      <p className="text-sm text-center mb-4">
                                        To receive payments, you need to connect your account with Stripe. This is a one-time setup.
                                      </p>
                                      <button
                                        onClick={handleStripeOnboarding}
                                        disabled={fetchingStripeLink}
                                        className="px-6 py-2 rounded-lg bg-[#3464b4] text-white font-bold hover:bg-[#2a5196] transition disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
                                      >
                                        {fetchingStripeLink ? 'Redirecting...' : 'Stripe Onboarding'}
                                      </button>
                                      {stripeError && (
                                        <p className="text-red-600 text-sm mt-4">{stripeError}</p>
                                      )}
                                    </div>
                                  )}
                                  <div className="mt-6 flex items-start gap-2 bg-yellow-100 border-l-4 border-yellow-400 p-4 rounded-lg">
                                    <svg className="w-6 h-6 text-yellow-500 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                                    </svg>
                                    <span className="text-yellow-800 text-sm font-medium">Stripe onboarding is required to receive payments for your services.</span>
                                  </div>
                                </div>
                              )}
                              {activeStep === 2 && (
                                // Badges
                                <div className="mb-12 p-8 bg-[#f8faff] rounded-xl border border-[#e3e8f0]">
                                  <h3 className="text-2xl font-bold text-[#3464b4] mb-8 flex items-center gap-2"><StarIcon className="w-7 h-7 text-[#3464b4]" /> Badges</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-center">
                                    {BADGES.map((badge) => {
                                      const isSelected = form.badges?.includes(badge.value);
                                      return (
                                        <motion.button
                                          key={badge.value}
                                          type="button"
                                          onClick={() => handleToggleBadge(badge.value)}
                                          whileHover="hover"
                                          whileTap="tap"
                                          variants={itemVariants}
                                          className={`flex flex-col items-center p-6 rounded-2xl border transition shadow-sm
                                            ${isSelected ? 'bg-[#3464b4] text-white border-[#3464b4]' : 'bg-white text-gray-800 border-[#e3e8f0] hover:bg-[#dbe9fe] hover:text-[#3464b4]'}
                                          `}
                                        >
                                          <span className="text-5xl mb-3" role="img" aria-label={badge.label}>{badge.emoji}</span>
                                          <span className="font-bold text-lg mb-2">{badge.label}</span>
                                          <input
                                            type="checkbox"
                                            className="hidden" // Hide the default checkbox
                                            checked={isSelected}
                                            readOnly // Make it read-only as the button handles clicks
                                          />
                                          <span className={`w-6 h-6 flex items-center justify-center rounded-full border-2 transition-all duration-200
                                            ${isSelected ? 'bg-white text-[#3464b4] border-white' : 'bg-white text-transparent border-gray-400'}
                                          `}>
                                            {isSelected && <CheckCircleIcon className="w-5 h-5" />}
                                          </span>
                                        </motion.button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              {activeStep === 3 && (
                                // Vaccination
                                <div className="mb-12 p-8 bg-[#f8faff] rounded-xl border border-[#e3e8f0] flex flex-col md:flex-row gap-8 items-stretch">
                                  {/* Vaccine Selection (left) */}
                                  <div className="flex-1 flex flex-col justify-center gap-8">
                                    {VACCINATIONS.map((vax) => {
                                      const isSelected = form.vaccinations?.includes(vax.value);
                                      return (
                                        <motion.button
                                          key={vax.value}
                                          type="button"
                                          onClick={() => handleToggleVaccination(vax.value)}
                                          whileHover="hover"
                                          whileTap="tap"
                                          variants={itemVariants}
                                          className={`flex items-center gap-4 p-6 rounded-2xl border transition shadow-sm text-left
                                            ${isSelected ? 'bg-[#3464b4] text-white border-[#3464b4]' : 'bg-white text-gray-800 border-[#e3e8f0] hover:bg-[#dbe9fe] hover:text-[#3464b4]'}
                                          `}
                                        >
                                          <span className="text-4xl mr-2" role="img" aria-label={vax.label}>{vax.emoji}</span>
                                          <div className="flex-1">
                                            <span className="font-bold text-lg mb-2 block">{vax.label}</span>
                                            <input
                                              type="checkbox"
                                              className="hidden"
                                              checked={isSelected}
                                              readOnly
                                            />
                                            <span className={`w-6 h-6 flex items-center justify-center rounded-full border-2 transition-all duration-200
                                              ${isSelected ? 'bg-white text-[#3464b4] border-white' : 'bg-white text-transparent border-gray-400'}
                                            `}>
                                              {isSelected && <CheckCircleIcon className="w-5 h-5" />}
                                            </span>
                                          </div>
                                        </motion.button>
                                      );
                                    })}
                                  </div>
                                  {/* Info (right, no card) */}
                                  <div className="flex-1 flex flex-col items-start p-0 bg-transparent border-none shadow-none">
                                    <div className="w-48 h-48 !mb-0">
                                      <Player autoplay loop animationData={vaccinationLottie} />
                                    </div>
                                    <h4 className="text-xl font-bold text-[#3464b4] mb-2">Why Vaccination?</h4>
                                    <ul className="list-disc pl-6 text-gray-800 text-base space-y-2">
                                      <li>COVID-19 and flu vaccines help protect you and residents.</li>
                                      <li>Most Aged Care Organizations require these vaccinations for staff.</li>
                                    </ul>
                                  </div>
                                </div>
                              )}
                              {activeStep === 4 && ( // This is now Languages (old step 5)
                                // Languages
                                <div className="mb-8 p-8 bg-[#f8faff] rounded-xl border border-[#e3e8f0]">
                                  <h3 className="text-xl font-bold text-[#3464b4] mb-2 flex items-center gap-2"><LanguageIcon className="w-6 h-6 text-[#3464b4]" /> Languages</h3>
                                  <div className="flex flex-wrap gap-2">
                                    {LANGUAGES.map(lang => {
                                      const isSelected = (form.languages || []).includes(lang.value);
                                      return (
                                        <motion.button
                                          key={lang.value}
                                          type="button"
                                          onClick={() => handleToggleLanguage(lang.value)}
                                          whileHover="hover"
                                          whileTap="tap"
                                          variants={itemVariants}
                                          className={`px-4 py-2 rounded-full border border-[#3464b4] transition text-base font-medium cursor-pointer
                                            ${isSelected ? 'bg-[#3464b4] text-white font-bold' : 'bg-white text-[#3464b4] hover:bg-[#dbe9fe]'}
                                          `}
                                        >
                                          {lang.label}
                                        </motion.button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              {activeStep === 5 && ( // This is now Interests & Hobbies (old step 6)
                                // Interests & Hobbies
                                <div className="mb-8 p-8 bg-[#f8faff] rounded-xl border border-[#e3e8f0]">
                                  <h3 className="text-xl font-bold text-[#3464b4] mb-2 flex items-center gap-2"><HeartIcon className="w-6 h-6 text-[#3464b4]" /> Interests & Hobbies</h3>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {INTERESTS.map(hobby => {
                                      const isSelected = selectedHobbies.includes(hobby.value);
                                      return (
                                        <motion.button
                                          key={hobby.value}
                                          type="button"
                                          onClick={() => handleToggleHobby(hobby.value)}
                                          whileHover="hover"
                                          whileTap="tap"
                                          variants={itemVariants}
                                          className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition focus:outline-none shadow-sm
                                            ${isSelected ? 'bg-[#3464b4] text-white font-bold border-[#3464b4]' : 'bg-white text-[#3464b4] border-gray-200 hover:bg-[#dbe9fe]'}
                                          `}
                                        >
                                          <hobby.icon className="w-8 h-8" />
                                          <span className="font-semibold text-base">{hobby.label}</span>
                                        </motion.button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              {activeStep === 6 && ( // This is now Services Provided (old step 7)
                                // Services Provided
                                <div className="mb-8 p-8 bg-[#f8faff] rounded-xl border border-[#e3e8f0] flex flex-col md:flex-row gap-8">
                                  <div className="flex-1">
                                    <h3 className="text-xl font-bold text-[#3464b4] mb-2 flex items-center gap-2">
                                      <BriefcaseIcon className="w-6 h-6 text-[#3464b4]" /> Services Provided
                                    </h3>
                                    <div className="flex flex-wrap gap-3 pb-8">
                                      {SERVICES.map(service => {
                                        const isSelected = selectedServices.includes(service.value);
                                        return (
                                          <motion.button
                                            key={service.value}
                                            type="button"
                                            onClick={() => {
                                              setSelectedServices(prev =>
                                                prev.includes(service.value)
                                                  ? prev.filter(s => s !== service.value)
                                                  : [...prev, service.value]
                                              );
                                              setServiceInfo(service.description);
                                            }}
                                            onMouseEnter={() => setServiceInfo(service.description)}
                                            onFocus={() => setServiceInfo(service.description)}
                                            whileHover="hover"
                                            whileTap="tap"
                                            variants={itemVariants}
                                            className={`px-4 py-2 rounded-full border border-[#3464b4] transition text-base font-medium cursor-pointer
                                              ${isSelected ? 'bg-[#3464b4] text-white font-bold' : 'bg-white text-[#3464b4] hover:bg-[#dbe9fe]'}
                                            `}
                                          >
                                            {service.label}
                                          </motion.button>
                                        );
                                      })}
                                    </div>
                                    <div className="bg-blue-100 border-t border-b border-blue-500 text-blue-700 px-4 py-3 w-full rounded-lg" role="alert">
                                      <p className="font-bold">Informational message</p>
                                      <p className="text-sm">Please select at least one service you provide.</p>
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-[250px]">
                                    {serviceInfo && (
                                      <div className="bg-[#f8faff] border border-[#e3e8f0] rounded-xl p-6 shadow text-gray-800">
                                        <h4 className="font-bold text-lg mb-2 text-[#3464b4]">Service Details</h4>
                                        <p className="text-base">{serviceInfo}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              {activeStep === 7 && ( // This is now My Preferences (old step 8)
                                // My Preferences
                                <div className="mb-2 p-8 bg-[#f8faff] rounded-xl border border-[#e3e8f0]">
                                  <h3 className="text-xl font-bold text-[#3464b4] mb-2 flex items-center gap-2"><AdjustmentsHorizontalIcon className="w-6 h-6 text-[#3464b4]" /> My Preferences</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {PREFERENCES.map(pref => {
                                      const isSelected = (form.preferences || []).includes(pref.value);
                                      return (
                                        <motion.button
                                          key={pref.value}
                                          type="button"
                                          onClick={() => handleTogglePreference(pref.value)}
                                          whileHover="hover"
                                          whileTap="tap"
                                          variants={itemVariants}
                                          className={`flex items-center gap-4 p-6 rounded-xl border transition shadow text-lg font-semibold cursor-pointer text-left
                                            ${isSelected ? 'bg-[#3464b4] text-white border-[#3464b4]' : 'bg-white text-gray-800 border-[#e3e8f0] hover:bg-[#dbe9fe] hover:text-[#3464b4]'}
                                          `}
                                        >
                                          <pref.icon className={`w-10 h-10 ${pref.iconClass || ''}`} />
                                          <span>{pref.label}</span>
                                          <input
                                            type="checkbox"
                                            className="hidden" // Hide the default checkbox
                                            checked={isSelected}
                                            readOnly // Make it read-only as the button handles clicks
                                          />
                                          <span className={`ml-auto w-6 h-6 flex items-center justify-center rounded-full border-2 transition-all duration-200
                                            ${isSelected ? 'bg-white text-[#3464b4] border-white' : 'bg-white text-transparent border-gray-400'}
                                          `}>
                                            {isSelected && <CheckCircleIcon className="w-5 h-5" />}
                                          </span>
                                        </motion.button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              {/* Stepper Navigation Buttons */}
                              <div className="flex gap-4 mt-8">
                                <button
                                  onClick={() => setActiveStep(s => Math.max(0, s - 1))}
                                  disabled={activeStep === 0}
                                  className={`px-4 py-2 rounded-lg font-medium border ${activeStep === 0 ? 'bg-gray-100 text-gray-800 opacity-50 cursor-not-allowed' : 'bg-white text-[#3464b4] border-[#3464b4] hover:bg-[#dbe9fe]'} shadow-sm`}
                                >Previous</button>
                                <button
                                  onClick={() => setActiveStep(s => Math.min(stepSections.length - 1, s + 1))}
                                  disabled={activeStep === stepSections.length - 1}
                                  className={`px-4 py-2 rounded-lg font-medium border ${activeStep === stepSections.length - 1 ? 'bg-gray-100 text-gray-800 opacity-50 cursor-not-allowed' : 'bg-[#3464b4] text-white border-[#3464b4] hover:bg-[#2a5196]'} shadow-sm`}
                                >Next</button>
                              </div>
                            </div>
                          </div>
                      </motion.div>
                  </Disclosure.Panel>
                )}
              </AnimatePresence>
            </>
          )}
        </Disclosure>

        {/* Single Global Save Button */}
        <div className="w-full flex justify-center mt-8">
          <button onClick={handleSave} disabled={saving} className="px-8 py-3 rounded-lg bg-[#3464b4] text-white font-bold hover:bg-[#2a5196] transition disabled:opacity-60 disabled:cursor-not-allowed shadow-md">
            {saving ? 'Saving All Details...' : 'Save All Details'}
          </button>
        </div>
      </main>
      <Toast
        message={errorToast.message}
        isVisible={errorToast.isVisible}
        onClose={() => setErrorToast(prev => ({ ...prev, isVisible: false }))}
        duration={6000}
        type={errorToast.type}
      />
    </div>
  );
}
