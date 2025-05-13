"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { UserCircleIcon, IdentificationIcon, CheckBadgeIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

const TABS = [
  { label: "Profile", icon: <UserCircleIcon className="w-4 h-4 mr-1.5" /> },
  { label: "Account", icon: <IdentificationIcon className="w-4 h-4 mr-1.5" /> },
  { label: "Fit2Work", icon: <CheckBadgeIcon className="w-4 h-4 mr-1.5" /> },
  { label: "Submit", icon: <CheckCircleIcon className="w-4 h-4 mr-1.5" /> },
];

export default function Success() {
  const [activeTab, setActiveTab] = useState("Profile");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [aboutMe, setAboutMe] = useState("");
  const [experience, setExperience] = useState("");
  const [personalDetails, setPersonalDetails] = useState({ firstName: "", lastName: "", city: "", state: "", dob: "", gender: "" });
  const [emergencyContact, setEmergencyContact] = useState({ name: "", phone: "" });
  const [fit2work, setFit2work] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Required fields check
  const allFilled =
    profilePic && aboutMe && experience && personalDetails.firstName && personalDetails.lastName && personalDetails.city && personalDetails.state && emergencyContact.name && emergencyContact.phone && fit2work;

  // Profile picture upload handler
  const handleProfilePic = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePic(URL.createObjectURL(e.target.files[0]));
    }
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
    <div className="min-h-screen bg-[#fafbfc] flex flex-col items-center">
      {/* Navbar with logo and avatar */}
      <nav className="w-full flex justify-between items-center h-16 px-4 sm:px-8 bg-white border-b">
        <div className="text-2xl font-bold text-[#67b5b5] tracking-tight">TheOpenShift</div>
        <div className="relative" ref={avatarRef}>
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
      <div className="w-full bg-yellow-300 text-yellow-900 text-center py-2 font-medium text-base shadow" style={{letterSpacing: 0.2}}>
        Your profile verification and completion is not finished!
      </div>
      {/* Main Content with Sidebar Tabs */}
      <div className="w-full max-w-4xl mt-8 flex flex-col md:flex-row gap-4 sm:gap-8 px-2 sm:px-0">
        {/* Sidebar Tabs */}
        <div className="flex md:flex-col flex-row md:w-40 w-full md:gap-1 gap-2 md:mb-0 mb-2 md:items-stretch items-center justify-between md:justify-start">
          {TABS.map((tab) => (
            <button
              key={tab.label}
              className={`w-full flex items-center text-left px-2 py-2 rounded-md font-medium text-base transition-colors duration-200 border md:border-l-4 border-l-0 border-transparent md:border-transparent md:border-l-4 md:border-l-transparent md:mb-1
                ${activeTab === tab.label ? "bg-[#67b5b5] text-black border-l-4 border-[#67b5b5] shadow-sm" : "bg-[#f5f9f9] text-black hover:bg-[#67b5b5]/10"}`}
              style={activeTab !== tab.label ? { transition: 'background 0.2s', color: '#222' } : {}}
              onClick={() => setActiveTab(tab.label)}
              tabIndex={0}
            >
              {tab.icon}
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>
        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "Profile" && (
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-8 flex flex-col gap-8 text-black">
              <div className="flex items-center gap-6">
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
                <div className="flex-1">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-700">
                    <b>Profile photo criteria</b>
                    <ul className="list-disc ml-5 mt-2">
                      <li>Clear and well lit with plain background</li>
                      <li>No hats or sunglasses (eyeglasses and religious garments are accepted)</li>
                      <li>Full face and top of shoulders</li>
                      <li>Face is centred, with only one person in picture</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-2">About Me</label>
                <textarea className="w-full border rounded-md p-2 text-black" rows={3} value={aboutMe} onChange={e => setAboutMe(e.target.value)} placeholder="Give employers a summary of you and your professional experience." />
              </div>
              <div>
                <label className="block font-semibold mb-2">Experience (years)</label>
                <input type="number" min="0" className="w-full border rounded-md p-2 text-black" value={experience} onChange={e => setExperience(e.target.value)} placeholder="e.g. 3" />
              </div>
            </div>
          )}
          {activeTab === "Account" && (
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-8 flex flex-col gap-8 text-black">
              {/* Personal Details */}
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block font-semibold mb-2">First Name</label>
                    <input className="w-full border rounded-md p-2 text-black" value={personalDetails.firstName} onChange={e => setPersonalDetails({ ...personalDetails, firstName: e.target.value })} placeholder="First name" />
                  </div>
                  <div className="flex-1">
                    <label className="block font-semibold mb-2">Last Name</label>
                    <input className="w-full border rounded-md p-2 text-black" value={personalDetails.lastName} onChange={e => setPersonalDetails({ ...personalDetails, lastName: e.target.value })} placeholder="Last name" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block font-semibold mb-2">City</label>
                    <input className="w-full border rounded-md p-2 text-black" value={personalDetails.city} onChange={e => setPersonalDetails({ ...personalDetails, city: e.target.value })} placeholder="City" />
                  </div>
                  <div className="flex-1">
                    <label className="block font-semibold mb-2">State</label>
                    <input className="w-full border rounded-md p-2 text-black" value={personalDetails.state} onChange={e => setPersonalDetails({ ...personalDetails, state: e.target.value })} placeholder="State" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block font-semibold mb-2">Date of Birth</label>
                    <input type="date" className="w-full border rounded-md p-2 text-black" value={personalDetails.dob} onChange={e => setPersonalDetails({ ...personalDetails, dob: e.target.value })} />
                  </div>
                  <div className="flex-1">
                    <label className="block font-semibold mb-2">Gender</label>
                    <select className="w-full border rounded-md p-2 text-black" value={personalDetails.gender} onChange={e => setPersonalDetails({ ...personalDetails, gender: e.target.value })}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
              {/* Emergency Contact Section */}
              <div className="mt-6 pt-6 border-t">
                <div className="text-lg font-semibold mb-4">Emergency Contact</div>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block font-semibold mb-2">Contact Name</label>
                    <input className="w-full border rounded-md p-2 text-black" value={emergencyContact.name} onChange={e => setEmergencyContact({ ...emergencyContact, name: e.target.value })} placeholder="Contact name" />
                  </div>
                  <div>
                    <label className="block font-semibold mb-2">Contact Phone</label>
                    <input className="w-full border rounded-md p-2 text-black" value={emergencyContact.phone} onChange={e => setEmergencyContact({ ...emergencyContact, phone: e.target.value })} placeholder="Contact phone" />
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === "Fit2Work" && (
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-8 flex flex-col gap-8 items-center justify-center text-black">
              <div className="text-lg font-semibold mb-4">Fit2Work</div>
              <button
                className={`px-6 py-3 rounded-md font-medium text-white ${fit2work ? "bg-green-500" : "bg-[#67b5b5] hover:bg-[#4a9e9e]"}`}
                onClick={() => setFit2work(true)}
                disabled={fit2work}
              >
                {fit2work ? "Completed" : "Mark as Complete"}
              </button>
            </div>
          )}
          {activeTab === "Submit" && (
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-8 flex flex-col gap-8 items-center justify-center text-black">
              <div className="text-lg font-semibold mb-4 text-center w-full">Submit your profile</div>
              <button
                className={`w-full max-w-xs px-8 py-3 rounded-md font-bold text-white text-lg ${allFilled ? "bg-[#67b5b5] hover:bg-[#4a9e9e]" : "bg-gray-300 cursor-not-allowed"}`}
                disabled={!allFilled}
                onClick={handleFinish}
              >
                Finish
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Material Toast */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-fade-in">
          <svg className="w-6 h-6 text-white-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          Profile completed!
        </div>
      )}
    </div>
  );
} 