"use client";

import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import SidebarProfile from '@/app/components/SidebarProfile';
import Image from "next/image";
import {
  PencilSquareIcon, UserIcon, PhoneIcon, IdentificationIcon, CalendarIcon, MapPinIcon, ChatBubbleLeftRightIcon, BriefcaseIcon, CheckCircleIcon, XMarkIcon, StarIcon, ShieldCheckIcon, CreditCardIcon, LanguageIcon, HeartIcon, AdjustmentsHorizontalIcon, CameraIcon, BookOpenIcon, ClockIcon, Bars3Icon
} from '@heroicons/react/24/outline';
import { apiRequest } from '@/utils/api';
import Player from 'lottie-react';
import vaccinationLottie from './vaccination_extracted/animations/a97011f3-4d86-45cf-a59f-d40bd2ccb5d0.json';
import Toast from '@/app/components/ErrorToast';
import LoadingScreen from '@/app/components/LoadingScreen';
import { AU_STATES_SUBURBS, AU_STATE_LABELS } from '@/data/au-states-suburbs';

const API_BASE_URL = "https://api.theopenshift.com";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME_SLOTS = ["6am-11am", "11am-2pm", "2pm-5pm", "5pm-9pm"];
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
  { label: "LGBTQIA+", value: "lgbtq" },
  { label: "Non Smoker", value: "non_smoker" },
  { label: "Pet Friendly", value: "pet_friendly" },
];
const VACCINATIONS = [
  { label: "COVID-19", value: "covid_19" },
  { label: "Flu", value: "flu" },
  { label: "Tetanus", value: "tetanus" },
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
  const stepSections = [
    'Availability',
    'Bank Details',
    'Badges',
    'Vaccination',
    'Indicative Rate',
    'Languages',
    'Interests & Hobbies',
    'Services Provided',
    'My Preferences',
  ];

  // Add state for availability
  const [availabilityDays, setAvailabilityDays] = useState<{ [day: string]: boolean }>(() => Object.fromEntries(DAYS.map(day => [day, false])));

  // Add after other useState hooks
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

  // Fetch current profile and availability
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
            setAvailabilityDays(availData.availability);
          }
        }
        setLoading(false);
      } catch (e) {
        if (isMounted) {
          setError("Error fetching profile.");
          setLoading(false);
        }
      }
    }
    fetchProfile();
    return () => { isMounted = false; };
  }, [user]);

  // Handle PATCH save
  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        badges: (form.badges || []).filter((b: string) => BADGES.some(bd => bd.value === b)),
        vaccinations: (form.vaccinations || []).filter((v: string) => VACCINATIONS.some(vx => vx.value === v)),
        languages: (form.languages || []).filter((l: string) => LANGUAGES.some(lg => lg.value === l)),
        interests: (form.interests || []).filter((i: string) => INTERESTS.some(it => it.value === i)),
        preferences: (form.preferences || []).filter((p: string) => PREFERENCES.some(pr => pr.value === p)),
        services: selectedServices.filter(s => SERVICES.some(sv => sv.value === s)),
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
      setProfile({ ...form, services: selectedServices });
      setErrorToast({
        message: 'Profile updated!',
        isVisible: true,
        type: 'success',
      });
    } catch (e) {
      setErrorToast({
        message: 'Error saving profile',
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
  }

  // --- Additional Details handlers ---
  function handleToggleBadge(badge: string) {
    setForm((f: any) => {
      const current = f.badges || [];
      return {
        ...f,
        badges: current.includes(badge)
          ? current.filter((b: string) => b !== badge)
          : [...current, badge],
      };
    });
  }
  function handleToggleVaccination(vax: string) {
    setForm((f: any) => {
      const current = f.vaccinations || [];
      return {
        ...f,
        vaccinations: current.includes(vax)
          ? current.filter((v: string) => v !== vax)
          : [...current, vax],
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
  function handleToggleInterest(interestValue: string) {
    setForm((f: any) => {
      const current = f.interests || [];
      return {
        ...f,
        interests: current.includes(interestValue)
          ? current.filter((i: string) => i !== interestValue)
          : [...current, interestValue],
      };
    });
  }
  function handleTogglePreference(pref: string) {
    setForm((f: any) => {
      const current = f.preferences || [];
      return {
        ...f,
        preferences: current.includes(pref)
          ? current.filter((p: string) => p !== pref)
          : [...current, pref],
      };
    });
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

  return (
    <div className="flex min-h-screen bg-[#f6f8fa] relative">
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
        <h1 className="text-3xl font-bold text-black mb-8">Edit Profile</h1>
        {/* Current Details */}
        <section className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow p-8 mb-10">
          <h2 className="text-2xl font-bold text-black mb-6 flex items-center gap-2"><UserIcon className="w-7 h-7 text-[#2954bd]" /> Current Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold text-black mb-1">First Name</label>
              <input className="w-full border rounded p-2 text-black" value={form.fname || ''} onChange={e => setForm((f: any) => ({ ...f, fname: e.target.value }))} />
            </div>
            <div>
              <label className="block font-semibold text-black mb-1">Last Name</label>
              <input className="w-full border rounded p-2 text-black" value={form.lname || ''} onChange={e => setForm((f: any) => ({ ...f, lname: e.target.value }))} />
            </div>
            <div>
              <label className="block font-semibold mb-2">State</label>
              <select
                className="w-full border rounded-md p-2"
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
                <label className="block font-semibold mb-2">Suburb</label>
                <select
                  className="w-full border rounded-md p-2"
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
              <label className="block font-semibold text-black mb-1">Date of Birth</label>
              <input type="date" className="w-full border rounded p-2 text-black" value={form.dob || ''} onChange={e => setForm((f: any) => ({ ...f, dob: e.target.value }))} />
            </div>
            <div>
              <label className="block font-semibold text-black mb-1">Gender</label>
              <select className="w-full border rounded p-2 text-black" value={form.gender || ''} onChange={e => setForm((f: any) => ({ ...f, gender: e.target.value }))}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-black mb-1">Phone</label>
              <input className="w-full border rounded p-2 text-black" value={form.phone || ''} onChange={e => setForm((f: any) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="block font-semibold text-black mb-1">Bio</label>
              <textarea className="w-full border rounded p-2 text-black" rows={3} value={form.bio || ''} onChange={e => setForm((f: any) => ({ ...f, bio: e.target.value }))} />
            </div>
            <div>
              <label className="block font-semibold text-black mb-1">Emergency Contact Name</label>
              <input className="w-full border rounded p-2 text-black" value={form.emergency_contact || ''} onChange={e => setForm((f: any) => ({ ...f, emergency_contact: e.target.value }))} />
            </div>
            <div>
              <label className="block font-semibold text-black mb-1">Emergency Contact Phone</label>
              <input className="w-full border rounded p-2 text-black" value={form.emergency_contact_phone || ''} onChange={e => setForm((f: any) => ({ ...f, emergency_contact_phone: e.target.value }))} />
            </div>
            <div>
              <label className="block font-semibold text-black mb-1">TFN</label>
              <input className="w-full border rounded p-2 text-black" value={form.tfn || ''} onChange={e => setForm((f: any) => ({ ...f, tfn: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="block font-semibold text-black mb-1">Skills</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {skillsList.map((skill, idx) => (
                  <div key={idx} className="group flex items-center gap-1 px-3 py-1.5 bg-[#2954bd]/10 rounded-full">
                    <span className="text-sm">{skill}</span>
                    <button type="button" onClick={() => handleRemoveSkill(skill)} className="ml-1 p-0.5 rounded-full hover:bg-[#2954bd]/20 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
              <input
                type="text"
                value={skillsInput}
                onChange={e => setSkillsInput(e.target.value)}
                onKeyDown={handleAddSkill}
                className="w-full border rounded p-2"
                placeholder="Type a skill and press Enter to add"
              />
              <p className="text-sm text-black">Press Enter to add each skill</p>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving} className="mt-6 px-6 py-2 rounded bg-[#2954bd] text-white font-bold hover:bg-[#1d3e8a] transition disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
        </section>
        <section className="w-full max-w-4xl mx-auto rounded-2xl p-0 mb-4">
                <div className="mt-6 flex items-start gap-2 bg-yellow-100 border-l-4 border-yellow-400 p-4 rounded">
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
        {/* Additional Details (Stepper) */}
        <section className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow p-8 mb-10">
          <h2 className="text-2xl font-bold text-black mb-6 flex items-center gap-2"><AdjustmentsHorizontalIcon className="w-7 h-7 text-[#2954bd]" /> Additional Details</h2>
          {/* Stepper Navigation */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col gap-4 md:w-1/4">
              {stepSections.map((label, idx) => (
                <button
                  key={label}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-semibold text-left ${activeStep === idx ? 'bg-[#2954bd]/10 text-[#2954bd]' : 'bg-gray-50 text-black hover:bg-[#2954bd]/5'}`}
                  onClick={() => setActiveStep(idx)}
                >
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full border ${activeStep === idx ? 'bg-[#2954bd] text-white border-[#2954bd]' : 'bg-white text-[#2954bd] border-[#2954bd]/40'}`}>{idx + 1}</span>
                  {label}
                </button>
              ))}
            </div>
            <div className="flex-1">
              {activeStep === 0 && (
                // Availability
                <div className="mb-12 p-8 bg-[#f8faff] rounded-xl border border-[#e3e8f0]">
                  <h3 className="text-2xl font-bold text-black mb-6 flex items-center gap-2"><ClockIcon className="w-7 h-7 text-[#2954bd]" /> Availability</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {DAYS.map(day => (
                      <div key={day} className="mb-4 p-4 rounded-lg border border-[#e3e8f0] bg-white">
                        <label className="font-semibold text-black flex items-center gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            className="accent-[#2954bd] w-5 h-5"
                            checked={availabilityDays[day]}
                            onChange={() => handleDayToggle(day)}
                          />
                          <span className="text-lg">{day}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeStep === 1 && (
                // Bank Details
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-black mb-2 flex items-center gap-2"><CreditCardIcon className="w-6 h-6 text-[#2954bd]" /> Bank Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-semibold text-black mb-1">Account Holder Name</label>
                      <input className="w-full border rounded p-2 text-black" />
                    </div>
                    <div>
                      <label className="block font-semibold text-black mb-1">Bank Name</label>
                      <input className="w-full border rounded p-2 text-black" />
                    </div>
                    <div>
                      <label className="block font-semibold text-black mb-1">BSB</label>
                      <input className="w-full border rounded p-2 text-black" />
                    </div>
                    <div>
                      <label className="block font-semibold text-black mb-1">Account Number</label>
                      <input className="w-full border rounded p-2 text-black" />
                    </div>
                  </div>
                  <div className="mt-6 flex items-start gap-2 bg-yellow-100 border-l-4 border-yellow-400 p-4 rounded">
                    <svg className="w-6 h-6 text-yellow-500 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                    </svg>
                    <span className="text-yellow-800 text-sm font-medium">Please provide correct banking details. False or incorrect information may lead to payment delays.</span>
                  </div>
                </div>
              )}
              {activeStep === 2 && (
                // Badges
                <div className="mb-12 p-8 bg-[#f8faff] rounded-xl border border-[#e3e8f0]">
                  <h3 className="text-2xl font-bold text-black mb-8 flex items-center gap-2"><StarIcon className="w-7 h-7 text-[#2954bd]" /> Badges</h3>
                  <div className="flex flex-col md:flex-row gap-8 justify-center">
                    {/* LGBTQIA+ */}
                    <div className="flex-1 flex flex-col items-center p-6 bg-white rounded-2xl shadow border border-[#e3e8f0]">
                      <span className="text-5xl mb-3" role="img" aria-label="LGBTQIA+">🏳️‍🌈</span>
                      <span className="font-bold text-lg text-black mb-2">LGBTQIA+</span>
                      <div className="flex gap-4 mt-2 text-black">
                        <label className="flex items-center gap-2 text-lg font-medium">
                          <input type="checkbox" name="lgbtqia" className="accent-[#2954bd] w-5 h-5" checked={form.badges?.includes('lgbtq')} onChange={() => handleToggleBadge('lgbtq')} /> Yes
                        </label>
                      </div>
                    </div>
                    {/* Non Smoker */}
                    <div className="flex-1 flex flex-col items-center p-6 bg-white rounded-2xl shadow border border-[#e3e8f0]">
                      <span className="text-5xl mb-3" role="img" aria-label="Non Smoker">🚭</span>
                      <span className="font-bold text-lg text-black mb-2">Non Smoker</span>
                      <div className="flex gap-4 mt-2 text-black">
                        <label className="flex items-center gap-2 text-lg font-medium">
                          <input type="checkbox" name="non_smoker" className="accent-[#2954bd] w-5 h-5" checked={form.badges?.includes('non_smoker')} onChange={() => handleToggleBadge('non_smoker')} /> Yes
                        </label>
                      </div>
                    </div>
                    {/* Pet Friendly */}
                    <div className="flex-1 flex flex-col items-center p-6 bg-white rounded-2xl shadow border border-[#e3e8f0]">
                      <span className="text-5xl mb-3" role="img" aria-label="Pet Friendly">🐾</span>
                      <span className="font-bold text-lg text-black mb-2">Pet Friendly</span>
                      <div className="flex gap-4 mt-2 text-black">
                        <label className="flex items-center gap-2 text-lg font-medium">
                          <input type="checkbox" name="pet_friendly" className="accent-[#2954bd] w-5 h-5" checked={form.badges?.includes('pet_friendly')} onChange={() => handleToggleBadge('pet_friendly')} /> Yes
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeStep === 3 && (
                // Vaccination
                <div className="mb-12 p-8 bg-[#f8faff] rounded-xl border border-[#e3e8f0] flex flex-col md:flex-row gap-8 items-stretch">
                  {/* Vaccine Selection (left) */}
                  <div className="flex-1 flex flex-col justify-center gap-8">
                    <div className="flex items-center gap-4 bg-white rounded-2xl shadow border border-[#e3e8f0] p-6">
                      <span className="text-4xl mr-2" role="img" aria-label="COVID-19">💉</span>
                      <div className="flex-1">
                        <span className="font-bold text-lg text-black mb-2 block">COVID-19 Vaccine</span>
                        <div className="flex gap-4 mt-2 text-black">
                          <label className="flex items-center gap-2 text-lg font-medium">
                            <input type="checkbox" name="covid19" className="accent-[#2954bd] w-5 h-5" checked={form.vaccinations?.includes('covid_19')} onChange={() => handleToggleVaccination('covid_19')} /> Yes
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-white rounded-2xl shadow border border-[#e3e8f0] p-6">
                      <span className="text-4xl mr-2" role="img" aria-label="Flu">🤧</span>
                      <div className="flex-1">
                        <span className="font-bold text-lg text-black mb-2 block">Flu Vaccine</span>
                        <div className="flex gap-4 mt-2 text-black">
                          <label className="flex items-center gap-2 text-lg font-medium">
                            <input type="checkbox" name="flu" className="accent-[#2954bd] w-5 h-5" checked={form.vaccinations?.includes('flu')} onChange={() => handleToggleVaccination('flu')} /> Yes
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-white rounded-2xl shadow border border-[#e3e8f0] p-6">
                      <span className="text-4xl mr-2" role="img" aria-label="Tetanus">🩹</span>
                      <div className="flex-1">
                        <span className="font-bold text-lg text-black mb-2 block">Tetanus Vaccine</span>
                        <div className="flex gap-4 mt-2 text-black">
                          <label className="flex items-center gap-2 text-lg font-medium">
                            <input type="checkbox" name="tetanus" className="accent-[#2954bd] w-5 h-5" checked={form.vaccinations?.includes('tetanus')} onChange={() => handleToggleVaccination('tetanus')} /> Yes
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Info (right, no card) */}
                  <div className="flex-1 flex flex-col items-start p-0 bg-transparent border-none shadow-none">
                    <div className="w-48 h-48 !mb-0">
                      <Player autoplay loop animationData={vaccinationLottie} />
                    </div>
                    <h4 className="text-xl font-bold text-black mb-2">Why Vaccination?</h4>
                    <ul className="list-disc pl-6 text-black text-base space-y-2">
                      <li>COVID-19 and flu vaccines help protect you and residents.</li>
                      <li>Most Aged Care Organisations require these vaccinations for staff.</li>
                    </ul>
                  </div>
                </div>
              )}
              {activeStep === 4 && (
                // Indicative Rate
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-black mb-2 flex items-center gap-2"><BriefcaseIcon className="w-6 h-6 text-[#2954bd]" /> Indicative Rate</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-semibold text-black mb-1">Weekday (per hour)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full border rounded p-2 text-black"
                        value={form.indicativeRates?.weekday || ''}
                        onChange={e => setForm((f: any) => ({
                          ...f,
                          indicativeRates: { ...f.indicativeRates, weekday: e.target.value }
                        }))}
                        placeholder="$ Weekday's hourly rate"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-black mb-1">Saturday (per hour)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full border rounded p-2 text-black"
                        value={form.indicativeRates?.saturday || ''}
                        onChange={e => setForm((f: any) => ({
                          ...f,
                          indicativeRates: { ...f.indicativeRates, saturday: e.target.value }
                        }))}
                        placeholder="$ Saturday's hourly rate"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-black mb-1">Sunday (per hour)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full border rounded p-2 text-black"
                        value={form.indicativeRates?.sunday || ''}
                        onChange={e => setForm((f: any) => ({
                          ...f,
                          indicativeRates: { ...f.indicativeRates, sunday: e.target.value }
                        }))}
                        placeholder="$ Sunday's hourly rate"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-black mb-1">Whole Day (per session)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full border rounded p-2 text-black"
                        value={form.indicativeRates?.wholeDay || ''}
                        onChange={e => setForm((f: any) => ({
                          ...f,
                          indicativeRates: { ...f.indicativeRates, wholeDay: e.target.value }
                        }))}
                        placeholder="$ Rate per session"
                      />
                    </div>
                  </div>
                  <div className="flex items-center mt-4 mb-4">
                    <input
                      type="checkbox"
                      id="meetGreetFree"
                      className="accent-[#2954bd] w-5 h-5 mr-2"
                      checked={!!form.indicativeRates?.meetGreetFree}
                      onChange={e => setForm((f: any) => ({
                        ...f,
                        indicativeRates: { ...f.indicativeRates, meetGreetFree: e.target.checked }
                      }))}
                    />
                    <label htmlFor="meetGreetFree" className="text-black font-medium">Meet & Greet is free</label>
                  </div>
                  <div className="mt-4 flex items-start gap-2 bg-yellow-100 border-l-4 border-yellow-400 p-4 rounded">
                    <svg className="w-6 h-6 text-yellow-500 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                    </svg>
                    <span className="text-yellow-800 text-sm font-medium">Rates may vary depending on the organization's needs and timings. These are indicative only and may be negotiated.</span>
                  </div>
                </div>
              )}
              {activeStep === 5 && (
                // Languages
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-black mb-2 flex items-center gap-2"><LanguageIcon className="w-6 h-6 text-[#2954bd]" /> Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map(lang => {
                      const isSelected = (form.languages || []).includes(lang.value);
                      return (
                        <button
                          key={lang.value}
                          type="button"
                          onClick={() => handleToggleLanguage(lang.value)}
                          className={`px-4 py-2 rounded-full border border-[#2954bd] transition text-base font-medium cursor-pointer
                            ${isSelected ? 'bg-[#2954bd] text-white font-bold' : 'bg-white text-[#2954bd] hover:bg-[#2954bd]/10 hover:text-[#2954bd]'}
                          `}
                        >
                          {lang.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {activeStep === 6 && (
                // Interests & Hobbies
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-black mb-2 flex items-center gap-2"><HeartIcon className="w-6 h-6 text-[#2954bd]" /> Interests & Hobbies</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {INTERESTS.map(hobby => {
                      const isSelected = (form.interests || []).includes(hobby.value);
                      return (
                        <button
                          key={hobby.value}
                          type="button"
                          onClick={() => handleToggleInterest(hobby.value)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition focus:outline-none
                            ${isSelected ? 'bg-[#2954bd] text-white font-bold border-[#2954bd]' : 'bg-gray-50 text-[#2954bd] border-gray-200 hover:bg-[#2954bd]/10 hover:text-[#2954bd]'}
                          `}
                        >
                          <hobby.icon className="w-8 h-8" />
                          <span className="font-semibold text-base">{hobby.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {activeStep === 7 && (
                // Services Provided
                <div className="mb-8 flex flex-col md:flex-row gap-8">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-black mb-2 flex items-center gap-2">
                      <BriefcaseIcon className="w-6 h-6 text-[#2954bd]" /> Services Provided
                    </h3>
                    <div className="flex flex-wrap gap-3 pb-8">
                      {SERVICES.map(service => {
                        const isSelected = selectedServices.includes(service.value);
                        return (
                          <button
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
                            className={`px-4 py-2 rounded-full border border-[#2954bd] transition text-base font-medium cursor-pointer
                              ${isSelected ? 'bg-[#2954bd] text-white font-bold' : 'bg-white text-[#2954bd] hover:bg-[#2954bd]/10 hover:text-[#2954bd]'}
                            `}
                          >
                            {service.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="bg-blue-100 border-t border-b border-blue-500 text-blue-700 px-4 py-3 w-full" role="alert">
                    <p className="font-bold">Informational message</p>
                    <p className="text-sm">Some additional text to explain said message.</p>
                  </div>
                  </div>
                  <div className="flex-1 min-w-[250px]">
                    {serviceInfo && (
                      <div className="bg-[#f8faff] border border-[#e3e8f0] rounded-xl p-6 shadow text-black">
                        <h4 className="font-bold text-lg mb-2 text-[#2954bd]">Service Details</h4>
                        <p className="text-base">{serviceInfo}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {activeStep === 8 && (
                // My Preferences
                <div className="mb-2">
                  <h3 className="text-xl font-bold text-black mb-2 flex items-center gap-2"><AdjustmentsHorizontalIcon className="w-6 h-6 text-[#2954bd]" /> My Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {PREFERENCES.map(pref => (
                      <label key={pref.value} className="flex items-center gap-4 p-6 rounded-xl border border-[#e3e8f0] bg-white shadow text-lg text-black font-semibold cursor-pointer hover:bg-[#2954bd]/10 transition">
                        <pref.icon className={`w-10 h-10 ${pref.iconClass || ''}`} />
                        <span>{pref.label}</span>
                        <input type="checkbox" className="ml-auto accent-[#2954bd] w-6 h-6" checked={(form.preferences || []).includes(pref.value)} onChange={() => handleTogglePreference(pref.value)} />
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {/* Stepper Navigation Buttons */}
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setActiveStep(s => Math.max(0, s - 1))}
                  disabled={activeStep === 0}
                  className={`px-4 py-2 rounded font-medium border ${activeStep === 0 ? 'bg-gray-100 text-black opacity-50 cursor-not-allowed' : 'bg-white text-black border-gray-300 hover:bg-gray-50'}`}
                >Previous</button>
                <button
                  onClick={() => setActiveStep(s => Math.min(stepSections.length - 1, s + 1))}
                  disabled={activeStep === stepSections.length - 1}
                  className={`px-4 py-2 rounded font-medium border ${activeStep === stepSections.length - 1 ? 'bg-gray-100 text-black opacity-50 cursor-not-allowed' : 'bg-[#2954bd] text-white border-[#2954bd] hover:bg-[#1d3e8a]'}`}
                >Next</button>
              </div>
            </div>
          </div>
        </section>
        {/* Save button at the end of Additional Details */}
        <div className="w-full flex justify-end mt-8">
          <button onClick={handleSave} disabled={saving} className="px-8 py-3 rounded bg-[#2954bd] text-white font-bold hover:bg-[#1d3e8a] transition disabled:opacity-60">{saving ? 'Saving...' : 'Save Additional Details'}</button>
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