"use client";

import { useState, useRef, useEffect } from 'react';
import { UserGroupIcon, BuildingOfficeIcon, UserCircleIcon, IdentificationIcon, CheckBadgeIcon, CheckCircleIcon, DocumentIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

const TABS = [
    { label: "Profile", icon: <UserCircleIcon className="w-4 h-4 mr-1.5" /> },
    { label: "Account", icon: <IdentificationIcon className="w-4 h-4 mr-1.5" /> },
    { label: "Certificates", icon: <CheckBadgeIcon className="w-4 h-4 mr-1.5" /> },
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
        console.log(apiKey); //guu khalta mahnun api key log
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
                placeholder="Start typing address..."
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

export default function ProfileCompletion() {
    const [activeTab, setActiveTab] = useState("Profile");
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const [aboutMe, setAboutMe] = useState("");
    const [experiences, setExperiences] = useState<Experience[]>([{
        companyName: '',
        position: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        description: ''
    }]);
    const [personalDetails, setPersonalDetails] = useState({ firstName: "", lastName: "", city: "", state: "", dob: "", gender: "", address: "" });
    const [emergencyContact, setEmergencyContact] = useState({ name: "", phone: "" });
    const [superannuation, setSuperannuation] = useState({ fundName: "", memberNumber: "" });
    const [tfn, setTfn] = useState({ number: "" });
    const [bankDetails, setBankDetails] = useState({ accountName: "", bsb: "", accountNumber: "" });
    const [fit2work, setFit2work] = useState(false);
    const [additionalDocuments, setAdditionalDocuments] = useState<File[]>([]);
    const [showToast, setShowToast] = useState(false);
    const [showAvatarMenu, setShowAvatarMenu] = useState(false);
    const avatarRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Required fields check
    const allFilled =
        profilePic && aboutMe && experiences.every(exp =>
            exp.companyName && exp.position && exp.startDate && (exp.isCurrent || exp.endDate) && exp.description
        ) && personalDetails.firstName && personalDetails.lastName && personalDetails.address && emergencyContact.name && emergencyContact.phone && superannuation.fundName && superannuation.memberNumber
        && tfn.number && bankDetails.accountName && bankDetails.bsb && bankDetails.accountNumber && fit2work;

    // Profile picture upload handler
    const handleProfilePic = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setProfilePic(URL.createObjectURL(e.target.files[0]));
        }
    };

    // Experience handlers
    const addExperience = () => {
        setExperiences([...experiences, {
            companyName: '',
            position: '',
            startDate: '',
            endDate: '',
            isCurrent: false,
            description: ''
        }]);
    };

    const removeExperience = (index: number) => {
        setExperiences(experiences.filter((_, i) => i !== index));
    };

    const updateExperience = (index: number, field: keyof Experience, value: string | boolean) => {
        const newExperiences = [...experiences];
        newExperiences[index] = { ...newExperiences[index], [field]: value };
        setExperiences(newExperiences);
    };

    // Document upload handler
    const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAdditionalDocuments([...additionalDocuments, ...Array.from(e.target.files)]);
        }
    };

    // Remove document handler
    const removeDocument = (index: number) => {
        setAdditionalDocuments(additionalDocuments.filter((_, i) => i !== index));
    };

    // Toast handler
    const handleFinish = () => {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    // Close avatar dropdown on outside click
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

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-tr from-[#fafbfc] via-[#e6f2f2] to-[#b2e0e0]">
            <main className="flex-1 flex flex-col items-center relative">
                {/* Lively Background for Staff (distinct from organization) */}
                <div className="absolute inset-0 -z-10 pointer-events-none">
                    <div className="w-full h-full bg-gradient-to-tr from-[#fafbfc] via-[#e6f2f2] to-[#b2e0e0] opacity-90"></div>
                    <div className="absolute top-10 right-0 w-80 h-80 bg-[#67b5b5] rounded-3xl blur-2xl opacity-20 animate-pulse" style={{transform: 'translate(30%,-20%)'}}></div>
                    <div className="absolute bottom-0 left-0 w-96 h-40 bg-[#b2e0e0] rounded-full blur-3xl opacity-20 animate-pulse" style={{transform: 'translate(-20%,30%)'}}></div>
                    <div className="absolute bottom-10 right-1/3 w-40 h-40 bg-[#67b5b5] rounded-full blur-2xl opacity-10 animate-pulse" style={{}}></div>
                </div>
                {/* Navbar with logo and avatar */}
                <nav className="w-full flex justify-between items-center h-16 px-4 sm:px-8 bg-white border-b relative z-10">
                    <div className="text-2xl font-bold text-[#67b5b5] tracking-tight">TheOpenShift</div>
                    <div className="relative z-20" ref={avatarRef}>
                        <button
                            className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#67b5b5]"
                            onClick={() => setShowAvatarMenu((v) => !v)}
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
                                <a
                                    href="/api/auth/logout"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-b-md"
                                    onClick={() => setShowAvatarMenu(false)}
                                >
                                    Logout
                                </a>
                            </div>
                        )}
                    </div>
                </nav>
                {/* Yellow Banner */}
                <div className="w-full bg-yellow-300 text-yellow-900 text-center py-2 font-medium text-base shadow relative z-5" style={{ letterSpacing: 0.2 }}>
                    Your profile verification and completion is not finished!
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
                                                    <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                )}
                                            </div>
                                            <input type="file" accept="image/*" className="absolute bottom-0 right-0 w-8 h-8 opacity-0 cursor-pointer" onChange={handleProfilePic} />
                                            <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#67b5b5] rounded-full flex items-center justify-center text-white cursor-pointer pointer-events-none">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
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

                                        <div>
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                                                <label className="block font-semibold">Experience</label>
                                                <button
                                                    onClick={addExperience}
                                                    className="text-[#67b5b5] hover:text-[#4a9e9e] text-sm font-medium"
                                                >
                                                    + Add Experience
                                                </button>
                                            </div>
                                            <div className="space-y-6">
                                                {experiences.map((exp, index) => (
                                                    <div key={index} className="border rounded-lg p-4 space-y-4">
                                                        <div className="flex flex-col sm:flex-row justify-between gap-2">
                                                            <h4 className="font-medium">Experience {index + 1}</h4>
                                                            {experiences.length > 1 && (
                                                                <button
                                                                    onClick={() => removeExperience(index)}
                                                                    className="text-red-500 hover:text-red-600 text-sm self-start sm:self-center"
                                                                >
                                                                    Remove
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                                                <input
                                                                    type="text"
                                                                    value={exp.companyName}
                                                                    onChange={(e) => updateExperience(index, 'companyName', e.target.value)}
                                                                    className="w-full border rounded-md p-2"
                                                                    placeholder="Enter company name"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                                                                <input
                                                                    type="text"
                                                                    value={exp.position}
                                                                    onChange={(e) => updateExperience(index, 'position', e.target.value)}
                                                                    className="w-full border rounded-md p-2"
                                                                    placeholder="Enter position"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                                                <input
                                                                    type="date"
                                                                    value={exp.startDate}
                                                                    onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                                                                    className="w-full border rounded-md p-2"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                                                    <input
                                                                        type="date"
                                                                        value={exp.endDate}
                                                                        onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                                                                        className="w-full border rounded-md p-2"
                                                                        disabled={exp.isCurrent}
                                                                    />
                                                                    <div className="flex items-center mt-2 sm:mt-0">
                                                                        <input
                                                                            type="checkbox"
                                                                            id={`current-${index}`}
                                                                            checked={exp.isCurrent}
                                                                            onChange={(e) => updateExperience(index, 'isCurrent', e.target.checked)}
                                                                            className="w-4 h-4 text-[#67b5b5] border-gray-300 rounded focus:ring-[#67b5b5]"
                                                                        />
                                                                        <label htmlFor={`current-${index}`} className="ml-2 text-sm text-gray-600">
                                                                            Currently employed
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                                            <textarea
                                                                value={exp.description}
                                                                onChange={(e) => updateExperience(index, 'description', e.target.value)}
                                                                className="w-full border rounded-md p-2"
                                                                rows={3}
                                                                placeholder="Describe your responsibilities and achievements..."
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "Account" && (
                                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-8 flex flex-col gap-8 text-black">
                                    <h3 className="text-lg font-semibold mb-4">Personal Details</h3>
                                    <div className="flex flex-col gap-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block font-semibold mb-2">First Name</label>
                                                <input className="w-full border rounded-md p-2 text-black" value={personalDetails.firstName} onChange={e => setPersonalDetails({ ...personalDetails, firstName: e.target.value })} placeholder="First name" />
                                            </div>
                                            <div>
                                                <label className="block font-semibold mb-2">Last Name</label>
                                                <input className="w-full border rounded-md p-2 text-black" value={personalDetails.lastName} onChange={e => setPersonalDetails({ ...personalDetails, lastName: e.target.value })} placeholder="Last name" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block font-semibold mb-2">Address</label>
                                            <GeoapifyAutocomplete
                                                value={personalDetails.address || ''}
                                                onChange={address => setPersonalDetails({ ...personalDetails, address })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block font-semibold mb-2">Date of Birth</label>
                                                <input type="date" className="w-full border rounded-md p-2 text-black" value={personalDetails.dob} onChange={e => setPersonalDetails({ ...personalDetails, dob: e.target.value })} />
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
                                    </div>
                                    {/* Emergency Contact Section */}
                                    <div className="border-t pt-6">
                                        <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block font-semibold mb-2">Name</label>
                                                <input className="w-full border rounded-md p-2 text-black" value={emergencyContact.name} onChange={e => setEmergencyContact({ ...emergencyContact, name: e.target.value })} placeholder="Emergency contact name" />
                                            </div>
                                            <div>
                                                <label className="block font-semibold mb-2">Phone</label>
                                                <input className="w-full border rounded-md p-2 text-black" value={emergencyContact.phone} onChange={e => setEmergencyContact({ ...emergencyContact, phone: e.target.value })} placeholder="Emergency contact phone" />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Superannuation, TFN, bank details */}
                                    <div className="border-t pt-6">
                                        <h3 className="text-lg font-semibold mb-4">Superannuation</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block font-semibold mb-2">Fund Name</label>
                                                <input className="w-full border rounded-md p-2 text-black" value={superannuation.fundName} onChange={e => setSuperannuation({ ...superannuation, fundName: e.target.value })} placeholder="Enter fund name" />
                                            </div>
                                            <div>
                                                <label className="block font-semibold mb-2">Member Number</label>
                                                <input className="w-full border rounded-md p-2 text-black" value={superannuation.memberNumber} onChange={e => setSuperannuation({ ...superannuation, memberNumber: e.target.value })} placeholder="Enter member number" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border-t pt-6">
                                        <h3 className="text-lg font-semibold mb-4">TFN</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block font-semibold mb-2">TFN</label>
                                                <input className="w-full border rounded-md p-2 text-black" value={tfn.number} onChange={e => setTfn({ ...tfn, number: e.target.value })} placeholder="Enter TFN" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border-t pt-6">
                                        <h3 className="text-lg font-semibold mb-4">Bank Details</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block font-semibold mb-2">Account Name</label>
                                                <input className="w-full border rounded-md p-2 text-black" value={bankDetails.accountName} onChange={e => setBankDetails({ ...bankDetails, accountName: e.target.value })} placeholder="Enter account name" />
                                            </div>
                                            <div>
                                                <label className="block font-semibold mb-2">BSB</label>
                                                <input className="w-full border rounded-md p-2 text-black" value={bankDetails.bsb} onChange={e => setBankDetails({ ...bankDetails, bsb: e.target.value })} placeholder="Enter BSB" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block font-semibold mb-2">Account Number</label>
                                                <input className="w-full border rounded-md p-2 text-black" value={bankDetails.accountNumber} onChange={e => setBankDetails({ ...bankDetails, accountNumber: e.target.value })} placeholder="Enter account number" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "Certificates" && (
                                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-8 flex flex-col gap-8 text-black">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        <input
                                            type="checkbox"
                                            id="fit2work"
                                            checked={fit2work}
                                            onChange={(e) => setFit2work(e.target.checked)}
                                            className="w-5 h-5 text-[#67b5b5] border-gray-300 rounded focus:ring-[#67b5b5]"
                                        />
                                        <label htmlFor="fit2work" className="text-lg font-semibold">
                                            I confirm that I have a valid Fit2Work check
                                        </label>
                                    </div>
                                    <p className="text-gray-600">
                                        You must have a valid Fit2Work check to work in aged care. Please ensure your check is up to date.
                                    </p>

                                    <div className="border-t pt-6">
                                        <h3 className="text-lg font-semibold mb-4">Additional Documents</h3>
                                        <div className="space-y-4">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="px-4 py-2 bg-[#67b5b5] text-white rounded-md hover:bg-[#4a9e9e] flex items-center gap-2"
                                                >
                                                    <DocumentIcon className="w-5 h-5" />
                                                    Upload Document
                                                </button>
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleDocumentUpload}
                                                    className="hidden"
                                                    multiple
                                                />
                                            </div>
                                            {additionalDocuments.length > 0 && (
                                                <div className="mt-4">
                                                    <h4 className="font-medium mb-2">Uploaded Documents:</h4>
                                                    <ul className="space-y-2">
                                                        {additionalDocuments.map((doc, index) => (
                                                            <li key={index} className="flex items-center justify-between gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
                                                                <div className="flex items-center gap-2">
                                                                    <DocumentIcon className="w-4 h-4" />
                                                                    <span className="truncate">{doc.name}</span>
                                                                </div>
                                                                <button
                                                                    onClick={() => removeDocument(index)}
                                                                    className="text-red-500 hover:text-red-600 p-1 rounded-full hover:bg-red-50"
                                                                    title="Remove document"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "Submit" && (
                                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-8 flex flex-col gap-8 text-black">
                                    <div className="text-center">
                                        <h3 className="text-xl font-semibold mb-4">Review Your Information</h3>
                                        <p className="text-gray-600 mb-8">
                                            Please review all your information before submitting. You can go back to previous tabs to make changes.
                                        </p>
                                        <button
                                            onClick={handleFinish}
                                            disabled={!allFilled}
                                            className={`px-8 py-3 rounded-md text-white font-medium ${allFilled
                                                    ? "bg-[#67b5b5] hover:bg-[#4a9e9e]"
                                                    : "bg-gray-300 cursor-not-allowed"
                                                }`}
                                        >
                                            Complete Profile
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
