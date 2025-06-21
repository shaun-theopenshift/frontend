"use client";

import { useState, useRef, useEffect } from 'react';
import { UserGroupIcon, BuildingOfficeIcon, UserCircleIcon, IdentificationIcon, CheckBadgeIcon, CheckCircleIcon, DocumentIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LoadingScreen from '../../components/LoadingScreen';
import { api, StaffProfile } from '@/utils/api';
import ErrorToast from '@/app/components/ErrorToast';
import InfoTooltip from '@/app/components/InfoTooltip';
import { AU_STATES_SUBURBS, AU_STATE_LABELS } from '@/data/au-states-suburbs';

const STEPS = [
    { id: "Profile", label: "Personal Info", icon: <UserCircleIcon className="w-5 h-5" /> },
    { id: "Account", label: "Account Details", icon: <IdentificationIcon className="w-5 h-5" /> },
    { id: "Submit", label: "Review & Submit", icon: <CheckCircleIcon className="w-5 h-5" /> },
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
    const [completedSteps, setCompletedSteps] = useState<string[]>([]);
    const [skillsInput, setSkillsInput] = useState('');
    const [skillsList, setSkillsList] = useState<string[]>([]);

    const [errorToast, setErrorToast] = useState<{
        message: string;
        isVisible: boolean;
    }>({
        message: '',
        isVisible: false
    });

    const [selectedState, setSelectedState] = useState('');
    const [selectedSuburb, setSelectedSuburb] = useState('');

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
                    const skillsArray = profile.skills || [];
                    setSkillsList(skillsArray);
                    setSkills(skillsArray.join(', '));
                })
                .catch(e => {
                    setSubmissionStatus({ type: 'error', message: 'Failed to load profile for editing.' });
                })
                .finally(() => setLoading(false));
        }
    }, [isEditMode, user]);

    // Update the handleFinish function to use the new error toast
    const handleFinish = async () => {
        if (!user) {
            setErrorToast({
                message: 'You must be logged in to submit your profile.',
                isVisible: true
            });
            return;
        }
        try {
            setSubmissionStatus({
                type: null,
                message: isEditMode ? 'Updating your profile...' : 'Creating your profile...'
            });
            const skillsArray = skillsList.map(s => s.trim()).filter(Boolean);
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
                result = await api.updateStaffProfile(profileData);
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
            setErrorToast({
                message: `Failed to ${isEditMode ? 'update' : 'create'} profile: ${errorMessage}. Please try again or contact support if the problem persists.`,
                isVisible: true
            });
            setSubmissionStatus({
                type: 'error',
                message: ''
            });
        }
    };

    // Add function to check if a step is completed
    const isStepCompleted = (stepId: string) => {
        if (stepId === "Profile") {
            return Boolean(
                aboutMe && 
                personalDetails.firstName && validateName(personalDetails.firstName) &&
                personalDetails.lastName && validateName(personalDetails.lastName) &&
                personalDetails.address && 
                personalDetails.dob && validateDateOfBirth(personalDetails.dob) &&
                personalDetails.gender &&
                personalDetails.phone && validatePhone(personalDetails.phone) &&
                skillsList.length > 0
            );
        }
        if (stepId === "Account") {
            return Boolean(
                emergencyContact.name && validateName(emergencyContact.name) &&
                emergencyContact.phone && validatePhone(emergencyContact.phone) &&
                tfn.number && validateTFN(tfn.number)
            );
        }
        return false;
    };

    // Update completed steps when form data changes
    useEffect(() => {
        const newCompletedSteps = STEPS.filter(step => isStepCompleted(step.id)).map(step => step.id);
        setCompletedSteps(newCompletedSteps);
    }, [aboutMe, personalDetails, emergencyContact, tfn, skillsList]);

    // Add function to handle skills
    const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && skillsInput.trim()) {
            e.preventDefault();
            const newSkill = skillsInput.trim();
            if (!skillsList.includes(newSkill)) {
                setSkillsList([...skillsList, newSkill]);
                setSkills(skillsList.join(', ') + (skillsList.length ? ', ' : '') + newSkill);
            }
            setSkillsInput('');
        }
    };

    const handleRemoveSkill = (skillToRemove: string) => {
        const newSkillsList = skillsList.filter(skill => skill !== skillToRemove);
        setSkillsList(newSkillsList);
        setSkills(newSkillsList.join(', '));
    };

    if (authLoading) {
        return <LoadingScreen />;
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-lg">Loading profile for editing...</div>;
    }

    return (
        <div className="min-h-screen bg-white text-black">
            <main className="flex-1 flex flex-col items-center">
                {/* Navbar with logo and avatar */}
                <nav className="w-full flex justify-between items-center h-16 px-4 sm:px-8 bg-white border-b shadow-sm">
                    <div className="text-2xl font-bold text-[#2954bd] tracking-tight">TheOpenShift</div>
                    <div className="relative z-20" ref={avatarRef}>
                        <button
                            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#67b5b5] border border-gray-200"
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
                                        className="px-3 py-2 rounded-md bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition w-full text-center"
                                    >
                                        Sign out
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </nav>

                {/* Status Banner */}
                {submissionStatus.type && (
                    <div className={`w-full text-center py-3 font-medium text-sm ${
                    submissionStatus.type === 'success' 
                            ? 'bg-green-50 text-green-700 border-b border-green-100' 
                        : submissionStatus.type === 'error'
                            ? 'bg-red-50 text-red-700 border-b border-red-100'
                            : 'bg-blue-50 text-blue-700 border-b border-blue-100'
                    }`}>
                        {submissionStatus.message}
                </div>
                )}

                {/* Progress Stepper */}
                <div className="w-full bg-white border-b">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="py-8">
                            <div className="relative">
                                {/* Progress Bar */}
                                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2">
                                    <div 
                                        className="h-full bg-[#2954bd] transition-all duration-300"
                                        style={{ 
                                            width: `${(completedSteps.length / (STEPS.length - 1)) * 100}%`,
                                            maxWidth: activeTab === "Submit" ? "100%" : "50%"
                                        }}
                                    />
                                </div>

                                {/* Steps */}
                                <div className="relative flex justify-between">
                                    {STEPS.map((step, index) => {
                                        const isActive = activeTab === step.id;
                                        const isCompleted = completedSteps.includes(step.id);
                                        const isClickable = index <= STEPS.findIndex(s => s.id === activeTab) + 1;

                                        return (
                                            <div 
                                                key={step.id}
                                                className="flex flex-col items-center"
                                            >
                                        <button
                                                    onClick={() => isClickable && setActiveTab(step.id)}
                                                    disabled={!isClickable}
                                                    className={`group relative flex flex-col items-center ${
                                                        isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                                                    }`}
                                                >
                                                    {/* Step Circle */}
                                                    <div className={`
                                                        w-10 h-10 rounded-full flex items-center justify-center
                                                        transition-colors duration-200
                                                        ${isActive 
                                                            ? 'bg-[#2954bd] text-white ring-4 ring-[#2954bd]/20' 
                                                            : isCompleted 
                                                                ? 'bg-[#2954bd] text-white'
                                                                : 'bg-gray-100 text-gray-400'
                                                        }
                                                    `}>
                                                        {isCompleted ? (
                                                            <CheckIcon className="w-5 h-5" />
                                                        ) : (
                                                            step.icon
                                                        )}
                                                    </div>

                                                    {/* Step Label */}
                                                    <span className={`
                                                        mt-2 text-sm font-medium
                                                        ${isActive 
                                                            ? 'text-[#2954bd]' 
                                                            : isCompleted 
                                                                ? 'text-black'
                                                                : 'text-gray-500'
                                                        }
                                                    `}>
                                                        {step.label}
                                                    </span>

                                                    {/* Step Number */}
                                                    <span className="absolute -top-1 -right-1 w-5 h-5 text-xs font-medium flex items-center justify-center rounded-full bg-gray-100">
                                                        {index + 1}
                                                    </span>
                                        </button>
                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                        {/* Main Content */}
                <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="mb-8">
                        <h1 className="text-2xl font-semibold">
                            {activeTab === "Profile" && "Personal Information"}
                            {activeTab === "Account" && "Account Details"}
                            {activeTab === "Submit" && "Review & Submit"}
                        </h1>
                        <p className="mt-2 text-sm text-gray-600">
                            {activeTab === "Profile" && "Tell us about yourself and your professional background."}
                            {activeTab === "Account" && "Provide your account and emergency contact details."}
                            {activeTab === "Submit" && "Review your information before submitting your profile."}
                        </p>
                    </div>

                    {/* Content Sections */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
                            {activeTab === "Profile" && (
                            <div className="flex flex-col gap-8">
                                {/* Profile Picture Section */}
                                    <div className="flex flex-col sm:flex-row items-center gap-6">
                                        <div className="relative w-24 h-24">
                                        <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-200">
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
                                        <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#2954bd] rounded-full flex items-center justify-center text-white cursor-pointer pointer-events-none shadow-sm">
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
                                        <div className="flex items-center gap-2 mb-2">
                                            <label className="block font-semibold">About Me</label>
                                            <InfoTooltip content="Share your professional background, experience, and what makes you unique. This helps organizations understand your expertise and personality. Aim for 2-3 sentences that highlight your key strengths and career goals." />
                                        </div>
                                            <textarea
                                                value={aboutMe}
                                                onChange={(e) => setAboutMe(e.target.value)}
                                            className="w-full border rounded-md p-2"
                                                rows={4}
                                                placeholder="Tell us about yourself..."
                                            />
                                        </div>

                                        {/* Personal Details Section */}
                                        <div className="border-t pt-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <h3 className="text-lg font-semibold">Personal Details</h3>
                                            <InfoTooltip content="Your personal information helps us verify your identity and ensure proper communication. All information is kept secure and confidential in accordance with privacy laws." />
                                        </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block font-semibold mb-2">First Name</label>
                                                    <input 
                                                    className={`w-full border rounded-md p-2 ${
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
                                                    className={`w-full border rounded-md p-2 ${
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
                                                <label className="block font-semibold mb-2">State</label>
                                                <select
                                                    className="w-full border rounded-md p-2"
                                                    value={selectedState}
                                                    onChange={e => {
                                                        setSelectedState(e.target.value);
                                                        setSelectedSuburb('');
                                                        setPersonalDetails({ ...personalDetails, address: '' });
                                                    }}
                                                >
                                                    <option value="">Select state</option>
                                                    {Object.entries(AU_STATE_LABELS).map(([code, label]) => (
                                                        <option key={code} value={code}>{label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {selectedState && (
                                                <>
                                                    <label className="block font-semibold mb-2 mt-4">Suburb</label>
                                                    <select
                                                        className="w-full border rounded-md p-2"
                                                        value={selectedSuburb}
                                                        onChange={e => {
                                                            setSelectedSuburb(e.target.value);
                                                            setPersonalDetails({ ...personalDetails, address: e.target.value });
                                                        }}
                                                    >
                                                        <option value="">Select suburb</option>
                                                        {(AU_STATES_SUBURBS[selectedState as keyof typeof AU_STATES_SUBURBS] || []).map((suburb: string) => (
                                                            <option key={suburb} value={suburb}>{suburb}</option>
                                                        ))}
                                                    </select>
                                                </>
                                            )}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                                <div>
                                                    <label className="block font-semibold mb-2">Date of Birth</label>
                                                    <input 
                                                        type="date" 
                                                    className={`w-full border rounded-md p-2 ${
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
                                                <select className="w-full border rounded-md p-2" value={personalDetails.gender} onChange={e => setPersonalDetails({ ...personalDetails, gender: e.target.value })}>
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
                                                    className={`flex-1 border rounded-r-md p-2 ${
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

                                    {/* Healthcare Skills Section */}
                                        <div className="border-t pt-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <h3 className="text-lg font-semibold">Healthcare Skills</h3>
                                            <InfoTooltip content="List your healthcare-related skills and certifications. Include both technical skills (e.g., patient care, medical procedures) and soft skills (e.g., communication, teamwork). This helps match you with suitable opportunities." />
                                        </div>
                                            <div className="space-y-4">
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {skillsList.map((skill, index) => (
                                                    <div
                                                        key={index}
                                                        className="group flex items-center gap-1 px-3 py-1.5 bg-[#2954bd]/10 rounded-full"
                                                    >
                                                        <span className="text-sm">{skill}</span>
                                                        <button
                                                            onClick={() => handleRemoveSkill(skill)}
                                                            className="ml-1 p-0.5 rounded-full hover:bg-[#2954bd]/20 transition-colors"
                                                        >
                                                            <XMarkIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                                <input
                                                    type="text"
                                                value={skillsInput}
                                                onChange={(e) => setSkillsInput(e.target.value)}
                                                onKeyDown={handleAddSkill}
                                                className="w-full border rounded-md p-2"
                                                placeholder="Type a skill and press Enter to add"
                                            />
                                            <p className="text-sm text-gray-500">Press Enter to add each skill</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "Account" && (
                            <div className="flex flex-col gap-8">
                                    <div className="space-y-6">
                                        <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <h3 className="text-lg font-semibold">Emergency Contact</h3>
                                            <InfoTooltip content="Provide details of someone we can contact in case of an emergency. This should be a trusted person who can be reached quickly if needed. Their information is kept strictly confidential and only used in emergency situations." />
                                        </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block font-semibold mb-2">Contact Name</label>
                                                    <input 
                                                    className={`w-full border rounded-md p-2 ${
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
                                                        className={`flex-1 border rounded-r-md p-2 ${
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
                                        <div className="flex items-center gap-2 mb-4">
                                            <h3 className="text-lg font-semibold">Tax File Number</h3>
                                            <InfoTooltip content="Your TFN is required for employment purposes. We ensure your TFN is stored securely and only used for legitimate tax and employment purposes. Never share your TFN with anyone else." />
                                        </div>
                                            <div>
                                                <label className="block font-semibold mb-2">TFN</label>
                                                <input 
                                                className={`w-full border rounded-md p-2 ${
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

                            {activeTab === "Submit" && (
                            <div className="flex flex-col gap-8">
                                    <div className="text-center">
                                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Review Your Information</h3>
                                        <p className="text-gray-600 mb-8">
                                            Please review all your information before submitting. You can go back to previous tabs to make changes.
                                        </p>
                                        <button
                                            onClick={handleFinish}
                                            disabled={!allFilled || submissionStatus.type === 'success'}
                                        className={`px-6 py-2 text-sm font-medium rounded-md ${
                                                allFilled && submissionStatus.type !== 'success'
                                                ? 'bg-[#2954bd] text-white hover:bg-[#2954bd]/90'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
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

                        {/* Navigation Buttons */}
                        <div className="mt-8 flex justify-between">
                            <button
                                onClick={() => {
                                    const currentIndex = STEPS.findIndex(step => step.id === activeTab);
                                    if (currentIndex > 0) {
                                        setActiveTab(STEPS[currentIndex - 1].id);
                                    }
                                }}
                                className={`px-4 py-2 text-sm font-medium rounded-md ${
                                    activeTab === "Profile"
                                        ? 'invisible'
                                        : 'bg-white border border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                Previous
                            </button>

                            {activeTab !== "Submit" ? (
                                <button
                                    onClick={() => {
                                        const currentIndex = STEPS.findIndex(step => step.id === activeTab);
                                        if (currentIndex < STEPS.length - 1) {
                                            setActiveTab(STEPS[currentIndex + 1].id);
                                        }
                                    }}
                                    disabled={!isStepCompleted(activeTab)}
                                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                                        isStepCompleted(activeTab)
                                            ? 'bg-[#2954bd] text-white hover:bg-[#2954bd]/90'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    Next
                                </button>
                            ) : (
                                <button
                                    onClick={handleFinish}
                                    disabled={!allFilled || submissionStatus.type === 'success'}
                                    className={`px-6 py-2 text-sm font-medium rounded-md ${
                                        allFilled && submissionStatus.type !== 'success'
                                            ? 'bg-[#2954bd] text-white hover:bg-[#2954bd]/90'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Error Toast */}
            <ErrorToast
                message={errorToast.message}
                isVisible={errorToast.isVisible}
                onClose={() => setErrorToast(prev => ({ ...prev, isVisible: false }))}
                duration={6000}
            />
        </div>
    );
}

// Add CheckIcon component
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
            />
        </svg>
    );
}

// Add XMarkIcon component
function XMarkIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
            />
        </svg>
    );
}
