"use client";

import { useState, useRef, useEffect } from 'react';
import { UserGroupIcon, BuildingOfficeIcon, UserCircleIcon, IdentificationIcon, CheckBadgeIcon, CheckCircleIcon, DocumentIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LoadingScreen from '../../components/LoadingScreen';

const TABS = [
    { label: "Profile", icon: <UserCircleIcon className="w-4 h-4 mr-1.5" /> },
    { label: "Account", icon: <IdentificationIcon className="w-4 h-4 mr-1.5" /> },
    { label: "Certificates", icon: <CheckBadgeIcon className="w-4 h-4 mr-1.5" /> },
    { label: "Agreements", icon: <DocumentIcon className="w-4 h-4 mr-1.5" /> },
    { label: "Submit", icon: <CheckCircleIcon className="w-4 h-4 mr-1.5" /> },
];

interface Experience {
    companyName: string;
    position: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    description: string;
}

// Add TFN validation function
function validateTFN(tfn: string): boolean {
    // Remove any non-digit characters
    const digits = tfn.replace(/\D/g, '');
    
    // Check if length is 9 digits
    if (digits.length !== 9) return false;
    
    // TFN validation algorithm
    const weights = [1, 4, 3, 7, 5, 8, 6, 9, 10];
    let sum = 0;
    
    for (let i = 0; i < 9; i++) {
        sum += parseInt(digits[i]) * weights[i];
    }
    
    return sum % 11 === 0;
}

function calculateExperience(startDate: string, endDate: string, isCurrent: boolean): string {
    if (!startDate) return '';
    
    const start = new Date(startDate);
    const end = isCurrent ? new Date() : new Date(endDate);
    
    if (isNaN(start.getTime()) || (!isCurrent && isNaN(end.getTime()))) return '';
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
    const diffMonths = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
    
    let result = '';
    if (diffYears > 0) {
        result += `${diffYears} year${diffYears > 1 ? 's' : ''}`;
    }
    if (diffMonths > 0) {
        if (result) result += ' and ';
        result += `${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
    }
    
    return result || 'Less than a month';
}

function GeoapifyAutocomplete({ value, onChange }: { value: string, onChange: (address: string) => void }) {
    const [input, setInput] = useState(value);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => { setInput(value); }, [value]);

    useEffect(() => {
        if (!input) { setSuggestions([]); return; }
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
        timeoutRef.current = setTimeout(() => {
            fetch(`https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(input)}&limit=5&apiKey=${apiKey}`)
                .then(res => res.json())
                .then(data => setSuggestions(data.features || []));
        }, 300);
        return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
    }, [input]);

    return (
        <div className="relative">
            <input
                className="w-full border rounded-md p-2 text-black"
                value={input}
                onChange={e => { setInput(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Start typing your street name..."
                autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-50 bg-white border rounded-md mt-1 w-full shadow-lg max-h-56 overflow-auto">
                    {suggestions.map((s, i) => (
                        <li
                            key={s.properties.place_id}
                            className="px-4 py-2 hover:bg-[#e6f2f2] cursor-pointer text-sm"
                            onClick={() => { onChange(s.properties.formatted); setInput(s.properties.formatted); setShowSuggestions(false); }}
                        >
                            {s.properties.formatted}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

const API_BASE_URL = "https://api.theopenshift.com";

export async function apiRequest<T>(
  endpoint: string,
  method: "POST" | "PATCH" = "POST",
  body?: any
): Promise<T> {
  try {
    const session = await fetch("/api/auth/session").then((res) => res.json());
    console.log("Session:", session);
    if (!session?.accessToken) throw new Error("No access token available");

    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${session.accessToken}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      if (errorText.includes('User already has a role assigned')) {
        throw new Error('You have already completed your profile or have a role assigned. If you believe this is a mistake, please contact support.');
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Handle empty response
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}

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
    skills: string[];
    tfn: string;
}

const api = {
  // Create user
  updateStaffProfile: (data: Partial<StaffProfile>) =>
    apiRequest<StaffProfile>('/v1/users/user', 'POST', data),

  // Get current user profile
  getProfile: () => apiRequest<StaffProfile>('/v1/users/me'),
};

export default function ProfileCompletion() {
    const { user, error, isLoading: authLoading } = useUser();
    const searchParams = useSearchParams();
    // @ts-expect-error Next.js useSearchParams never returns null
    const isEditMode = searchParams.get('edit') === '1';
    const [loading, setLoading] = useState(isEditMode);
    const [activeTab, setActiveTab] = useState("Profile");
    const [aboutMe, setAboutMe] = useState("");
    const [personalDetails, setPersonalDetails] = useState({ 
        firstName: "", 
        lastName: "", 
        address: "", 
        dob: "", 
        gender: "", 
        phone: ""
    });
    const [emergencyContact, setEmergencyContact] = useState({ name: "", phone: "" });
    const [tfn, setTfn] = useState({ number: "" });
    const [showToast, setShowToast] = useState(false);
    
    // Add these missing states and refs
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const [showAvatarMenu, setShowAvatarMenu] = useState(false);
    const avatarRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const router = useRouter();

    const [submissionStatus, setSubmissionStatus] = useState<{
        type: 'success' | 'error' | null;
        message: string;
    }>({ type: null, message: '' });

    const [skills, setSkills] = useState('');

    // Add the profile picture handler
    const handleProfilePic = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProfilePic(URL.createObjectURL(e.target.files[0]));
        }
    };

    // Add click outside handler for avatar menu
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
                setShowAvatarMenu(false);
            }
        }
        if (showAvatarMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showAvatarMenu]);

    // Validation functions
    const validateName = (name: string): boolean => {
        return /^[A-Za-z\s'-]{2,50}$/.test(name);
    };

    const validatePhone = (phone: string): boolean => {
        return /^(\+61|0)[2-4789]\d{8}$/.test(phone);
    };

    const validateTFN = (tfn: string): boolean => {
        // Remove any non-digit characters
        const digits = tfn.replace(/\D/g, '');
        // Check if length is 9 digits
        if (digits.length !== 9) return false;
        
        // TFN validation algorithm
        const weights = [1, 4, 3, 7, 5, 8, 6, 9, 10];
        let sum = 0;
        
        for (let i = 0; i < 9; i++) {
            sum += parseInt(digits[i]) * weights[i];
        }
        
        return sum % 11 === 0;
    };

    const validateDateOfBirth = (dob: string): boolean => {
        const date = new Date(dob);
        const today = new Date();
        const age = today.getFullYear() - date.getFullYear();
        const monthDiff = today.getMonth() - date.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
            return age - 1 >= 18;
        }
        return age >= 18;
    };

    // Required fields check
    const allFilled =
        aboutMe && 
        personalDetails.firstName && validateName(personalDetails.firstName) &&
        personalDetails.lastName && validateName(personalDetails.lastName) &&
        personalDetails.address && 
        personalDetails.dob && validateDateOfBirth(personalDetails.dob) &&
        personalDetails.gender &&
        personalDetails.phone && validatePhone(personalDetails.phone) &&
        emergencyContact.name && validateName(emergencyContact.name) &&
        emergencyContact.phone && validatePhone(emergencyContact.phone) &&
        tfn.number && validateTFN(tfn.number);

    // Check user type and redirect if necessary
    useEffect(() => {
        if (user) {
            const userType = user['https://theopenshift.com/user_type'];
            if (userType === 'organization') {
                router.push('/profile-completion/organization');
            }
        }
    }, [user, router]);

    // Prefill form in edit mode
    useEffect(() => {
        if (isEditMode && user) {
            setLoading(true);
            fetch('/api/auth/session')
                .then(res => res.json())
                .then(session => {
                    if (!session?.accessToken) throw new Error('No access token');
                    return fetch('https://api.theopenshift.com/v1/users/me', {
                        headers: {
                            'Authorization': `Bearer ${session.accessToken}`,
                            'Accept': 'application/json',
                        },
                    });
                })
                .then(res => res.json())
                .then(profile => {
                    setAboutMe(profile.bio || '');
                    setPersonalDetails({
                        firstName: profile.fname || '',
                        lastName: profile.lname || '',
                        address: profile.address || '',
                        dob: profile.dob || '',
                        gender: profile.gender || '',
                        phone: profile.phone || '',
                    });
                    setEmergencyContact({
                        name: profile.emergency_contact || '',
                        phone: profile.emergency_contact_phone || '',
                    });
                    setTfn({ number: profile.tfn || '' });
                    setSkills(profile.skills ? profile.skills.join(', ') : '');
                })
                .catch(e => {
                    setSubmissionStatus({ type: 'error', message: 'Failed to load profile for editing.' });
                })
                .finally(() => setLoading(false));
        }
    }, [isEditMode, user]);

    // Update the handleFinish function to map the data correctly
    const handleFinish = async () => {
        if (!user) {
            setSubmissionStatus({
                type: 'error',
                message: 'You must be logged in to submit your profile.'
            });
            return;
        }
        try {
            setSubmissionStatus({
                type: null,
                message: isEditMode ? 'Updating your profile...' : 'Creating your profile...'
            });
            const skillsArray = skills
                ? skills.split(',').map(s => s.trim()).filter(Boolean)
                : [];
            const profileData: StaffProfile = {
                fname: String(personalDetails.firstName),
                lname: String(personalDetails.lastName),
                address: String(personalDetails.address),
                dob: String(personalDetails.dob),
                gender: String(personalDetails.gender),
                phone: String(personalDetails.phone),
                bio: String(aboutMe),
                emergency_contact: String(emergencyContact.name),
                emergency_contact_phone: String(emergencyContact.phone),
                tfn: String(tfn.number),
                skills: skillsArray,
            };
            console.log('Sending profile data:', JSON.stringify(profileData, null, 2));
            let result;
            if (isEditMode) {
                result = await apiRequest('/v1/users/user', 'PATCH', profileData);
            } else {
                result = await api.updateStaffProfile(profileData);
            }
            console.log(result);
            setSubmissionStatus({
                type: 'success',
                message: isEditMode ? 'Profile updated successfully!' : 'Profile created successfully!'
            });
            setShowToast(true);
            setTimeout(() => {
                setShowToast(false);
                router.push('/profile');
            }, 3000);
        } catch (error: unknown) {
            console.error('Error creating profile:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            setSubmissionStatus({
                type: 'error',
                message: `Failed to ${isEditMode ? 'update' : 'create'} profile: ${errorMessage}. Please try again or contact support if the problem persists.`
            });
        }
    };

    if (authLoading) {
        return <LoadingScreen />;
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-lg">Loading profile for editing...</div>;
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-tr from-brand-bgLight via-brand-light to-brand-mint">
            <main className="flex-1 flex flex-col items-center relative">
                {/* Lively Background for Staff (distinct from organization) */}
                <div className="absolute inset-0 -z-10 pointer-events-none">
                    <div className="w-full h-full bg-gradient-to-tr from-brand-bgLight via-brand-light to-brand-mint opacity-90"></div>
                    <div className="absolute top-10 right-0 w-80 h-80 bg-brand-dark rounded-3xl blur-2xl opacity-20 animate-pulse" style={{transform: 'translate(30%,-20%)'}}></div>
                    <div className="absolute bottom-0 left-0 w-96 h-40 bg-brand-mint rounded-full blur-3xl opacity-20 animate-pulse" style={{transform: 'translate(-20%,30%)'}}></div>
                    <div className="absolute bottom-10 right-1/3 w-40 h-40 bg-brand-dark rounded-full blur-2xl opacity-10 animate-pulse" style={{}}></div>
                </div>
                {/* Navbar with logo and avatar */}
                <nav className="w-full flex justify-between items-center h-16 px-4 sm:px-8 bg-white border-b relative z-10">
                    <div className="text-2xl font-bold text-[#67b5b5] tracking-tight">TheOpenShift</div>
                    <div className="relative z-20" ref={avatarRef}>
                        <button
                            className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#67b5b5]"
                            onClick={() => setShowAvatarMenu((prev: boolean) => !prev)}
                            aria-label="Open user menu"
                            tabIndex={0}
                        >
                            {profilePic ? (
                                <Image src={profilePic} alt="Profile" width={40} height={40} className="object-cover w-10 h-10" />
                            ) : (
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            )}
                        </button>
                        {showAvatarMenu && (
                            <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                                <div className="flex flex-col items-center justify-center px-3 py-2">
                                    <a
                                        href="/api/auth/logout"
                                        className="px-3 py-2 rounded-md bg-gray-200 text-brand-dark font-medium hover:bg-gray-300 transition w-full text-center"
                                    >
                                        Sign out
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </nav>
                {/* Dynamic Banner */}
                <div className={`w-full text-center py-2 font-medium text-base shadow relative z-5 ${
                    submissionStatus.type === 'success' 
                        ? 'bg-green-300 text-green-900' 
                        : submissionStatus.type === 'error'
                        ? 'bg-red-300 text-red-900'
                        : 'bg-yellow-300 text-yellow-900'
                }`} style={{ letterSpacing: 0.2 }}>
                    {submissionStatus.type === 'success' 
                        ? 'Your profile has been successfully updated!'
                        : submissionStatus.type === 'error'
                        ? submissionStatus.message
                        : 'Your profile verification and completion is not finished!'}
                </div>
                {/* Main Content Responsive Layout */}
                <div className="flex-1 w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-8 py-8 relative z-10">
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Sidebar */}
                        <aside className="w-full md:w-64 flex-shrink-0 mb-6 md:mb-0">
                            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
                                <nav className="space-y-1">
                                    {TABS.map((tab) => (
                                        <button
                                            key={tab.label}
                                            onClick={() => setActiveTab(tab.label)}
                                            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${activeTab === tab.label
                                                    ? "bg-[#67b5b5] text-white"
                                                    : "text-gray-600 hover:bg-gray-50"
                                                }`}
                                        >
                                            {tab.icon}
                                            {tab.label}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                        </aside>

                        {/* Main Content */}
                        <main className="flex-1 min-w-0">
                            {activeTab === "Profile" && (
                                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-8 flex flex-col gap-8 text-black">
                                    <div className="flex flex-col sm:flex-row items-center gap-6">
                                        <div className="relative w-24 h-24">
                                            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                                                {profilePic ? (
                                                    <Image src={profilePic} alt="Profile" width={96} height={96} className="object-cover w-24 h-24" />
                                                ) : (
                                                    <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                )}
                                            </div>
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                className="absolute bottom-0 right-0 w-8 h-8 opacity-0 cursor-pointer" 
                                                onChange={handleProfilePic}
                                                ref={fileInputRef}
                                            />
                                            <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#67b5b5] rounded-full flex items-center justify-center text-white cursor-pointer pointer-events-none">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="flex-1 text-center sm:text-left">
                                            <h3 className="text-lg font-semibold mb-2">Profile Picture</h3>
                                            <p className="text-gray-600 text-sm">Upload a professional photo of yourself</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block font-semibold mb-2">About Me</label>
                                            <textarea
                                                value={aboutMe}
                                                onChange={(e) => setAboutMe(e.target.value)}
                                                className="w-full border rounded-md p-2 text-black"
                                                rows={4}
                                                placeholder="Tell us about yourself..."
                                            />
                                        </div>

                                        {/* Personal Details Section */}
                                        <div className="border-t pt-6">
                                            <h3 className="text-lg font-semibold mb-4">Personal Details</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block font-semibold mb-2">First Name</label>
                                                    <input 
                                                        className={`w-full border rounded-md p-2 text-black ${
                                                            personalDetails.firstName ? (validateName(personalDetails.firstName) ? 'border-green-500' : 'border-red-500') : ''
                                                        }`}
                                                        value={personalDetails.firstName} 
                                                        onChange={e => setPersonalDetails({ ...personalDetails, firstName: e.target.value })} 
                                                        placeholder="First name" 
                                                    />
                                                    {personalDetails.firstName && !validateName(personalDetails.firstName) && (
                                                        <p className="text-red-500 text-sm mt-1">Please enter a valid first name (letters only)</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block font-semibold mb-2">Last Name</label>
                                                    <input 
                                                        className={`w-full border rounded-md p-2 text-black ${
                                                            personalDetails.lastName ? (validateName(personalDetails.lastName) ? 'border-green-500' : 'border-red-500') : ''
                                                        }`}
                                                        value={personalDetails.lastName} 
                                                        onChange={e => setPersonalDetails({ ...personalDetails, lastName: e.target.value })} 
                                                        placeholder="Last name" 
                                                    />
                                                    {personalDetails.lastName && !validateName(personalDetails.lastName) && (
                                                        <p className="text-red-500 text-sm mt-1">Please enter a valid last name (letters only)</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <label className="block font-semibold mb-2">Address</label>
                                                <GeoapifyAutocomplete
                                                    value={personalDetails.address || ''}
                                                    onChange={address => setPersonalDetails({ ...personalDetails, address })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                                <div>
                                                    <label className="block font-semibold mb-2">Date of Birth</label>
                                                    <input 
                                                        type="date" 
                                                        className={`w-full border rounded-md p-2 text-black ${
                                                            personalDetails.dob ? (validateDateOfBirth(personalDetails.dob) ? 'border-green-500' : 'border-red-500') : ''
                                                        }`}
                                                        value={personalDetails.dob} 
                                                        onChange={e => setPersonalDetails({ ...personalDetails, dob: e.target.value })} 
                                                    />
                                                    {personalDetails.dob && !validateDateOfBirth(personalDetails.dob) && (
                                                        <p className="text-red-500 text-sm mt-1">You must be at least 18 years old</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block font-semibold mb-2">Gender</label>
                                                    <select className="w-full border rounded-md p-2 text-black" value={personalDetails.gender} onChange={e => setPersonalDetails({ ...personalDetails, gender: e.target.value })}>
                                                        <option value="">Select gender</option>
                                                        <option value="male">Male</option>
                                                        <option value="female">Female</option>
                                                        <option value="other">Other</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <label className="block font-semibold mb-2">Phone Number</label>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 border rounded-l-md">
                                                        <span className="text-lg">🇦🇺</span>
                                                        <span className="text-gray-600">+61</span>
                                                    </div>
                                                    <input 
                                                        className={`flex-1 border rounded-r-md p-2 text-black ${
                                                            personalDetails.phone ? (validatePhone(personalDetails.phone) ? 'border-green-500' : 'border-red-500') : ''
                                                        }`}
                                                        value={personalDetails.phone} 
                                                        onChange={e => setPersonalDetails({ ...personalDetails, phone: e.target.value })} 
                                                        placeholder="Enter phone number (e.g., 412345678)" 
                                                    />
                                                </div>
                                                {personalDetails.phone && !validatePhone(personalDetails.phone) && (
                                                    <p className="text-red-500 text-sm mt-1">Please enter a valid Australian phone number</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Healthcare Skill Section */}
                                        <div className="border-t pt-6">
                                            <h3 className="text-lg font-semibold mb-4">Healthcare Skill</h3>
                                            <div className="space-y-4">
                                                <input
                                                    type="text"
                                                    value={skills}
                                                    onChange={(e) => setSkills(e.target.value)}
                                                    className="w-full border rounded-md p-2 text-black"
                                                    placeholder="Enter skills separated by commas (e.g., Patient Care, Medical Records)"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "Account" && (
                                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-8 flex flex-col gap-8 text-black">
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block font-semibold mb-2">Contact Name</label>
                                                    <input 
                                                        className={`w-full border rounded-md p-2 text-black ${
                                                            emergencyContact.name ? (validateName(emergencyContact.name) ? 'border-green-500' : 'border-red-500') : ''
                                                        }`}
                                                        value={emergencyContact.name} 
                                                        onChange={e => setEmergencyContact({ ...emergencyContact, name: e.target.value })} 
                                                        placeholder="Emergency contact name" 
                                                    />
                                                    {emergencyContact.name && !validateName(emergencyContact.name) && (
                                                        <p className="text-red-500 text-sm mt-1">Please enter a valid name</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block font-semibold mb-2">Contact Phone</label>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 border rounded-l-md">
                                                            <span className="text-lg">🇦🇺</span>
                                                            <span className="text-gray-600">+61</span>
                                                        </div>
                                                        <input 
                                                            className={`flex-1 border rounded-r-md p-2 text-black ${
                                                                emergencyContact.phone ? (validatePhone(emergencyContact.phone) ? 'border-green-500' : 'border-red-500') : ''
                                                            }`}
                                                            value={emergencyContact.phone} 
                                                            onChange={e => setEmergencyContact({ ...emergencyContact, phone: e.target.value })} 
                                                            placeholder="Enter phone number" 
                                                        />
                                                    </div>
                                                    {emergencyContact.phone && !validatePhone(emergencyContact.phone) && (
                                                        <p className="text-red-500 text-sm mt-1">Please enter a valid Australian phone number</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-semibold mb-4">Tax File Number</h3>
                                            <div>
                                                <label className="block font-semibold mb-2">TFN</label>
                                                <input 
                                                    className={`w-full border rounded-md p-2 text-black ${
                                                        tfn.number ? (validateTFN(tfn.number) ? 'border-green-500' : 'border-red-500') : ''
                                                    }`}
                                                    value={tfn.number} 
                                                    onChange={e => setTfn({ number: e.target.value })} 
                                                    placeholder="Enter your TFN" 
                                                />
                                                {tfn.number && !validateTFN(tfn.number) && (
                                                    <p className="text-red-500 text-sm mt-1">Please enter a valid TFN</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "Certificates" && (
                                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-8 flex flex-col gap-8 text-black">
                                    <div className="text-center">
                                        <h3 className="text-lg font-semibold mb-4">Certificates</h3>
                                        <p className="text-gray-600">No certificates required at this time.</p>
                                    </div>
                                </div>
                            )}

                            {activeTab === "Agreements" && (
                                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-8 flex flex-col gap-8 text-black">
                                    <div className="text-center">
                                        <h3 className="text-lg font-semibold mb-4">Agreements</h3>
                                        <p className="text-gray-600">No agreements required at this time.</p>
                                    </div>
                                </div>
                            )}

                            {activeTab === "Submit" && (
                                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-8 flex flex-col gap-8 text-black">
                                    <div className="text-center">
                                        <h3 className="text-xl font-semibold mb-4">Review Your Information</h3>
                                        {submissionStatus.type && (
                                            <div className={`mb-4 p-4 rounded-md ${
                                                submissionStatus.type === 'success' 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : submissionStatus.type === 'error'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {submissionStatus.message}
                                            </div>
                                        )}
                                        <p className="text-gray-600 mb-8">
                                            Please review all your information before submitting. You can go back to previous tabs to make changes.
                                        </p>
                                        <button
                                            onClick={handleFinish}
                                            disabled={!allFilled || submissionStatus.type === 'success'}
                                            className={`px-8 py-3 rounded-md text-white font-medium ${
                                                allFilled && submissionStatus.type !== 'success'
                                                    ? "bg-[#67b5b5] hover:bg-[#4a9e9e]"
                                                    : "bg-gray-300 cursor-not-allowed"
                                            }`}
                                        >
                                            {submissionStatus.type === 'success' 
                                                ? 'Profile Created!' 
                                                : submissionStatus.type === 'error'
                                                ? 'Try Again'
                                                : submissionStatus.message === 'Creating your profile...'
                                                ? 'Creating Profile...'
                                                : 'Submit Profile'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            </main>

            {/* Toast Notification */}
            {showToast && (
                <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg z-20">
                    Profile completed successfully!
                </div>
            )}
        </div>
    );
}
