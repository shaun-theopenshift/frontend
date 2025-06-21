"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { CheckCircleIcon, BuildingOfficeIcon, UserGroupIcon, StarIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useUser } from '@auth0/nextjs-auth0/client';
import LoadingScreen from '../../components/LoadingScreen';
import ErrorToast from '@/app/components/ErrorToast';
import { AU_STATES_SUBURBS, AU_STATE_LABELS } from '@/data/au-states-suburbs';

export default function OrganizationProfileCompletion() {
  const { user, error, isLoading: authLoading } = useUser();
  const [organizationDetails, setOrganizationDetails] = useState({
    name: "",
    address: "",
    phone: "",
    abn: "",
    email: "",
    website: "",
    description: "",
    abnStatus: "",
    abnEffectiveFrom: "",
  });
  const [showToast, setShowToast] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [abnError, setAbnError] = useState("");
  const router = useRouter();
  const [submissionStatus, setSubmissionStatus] = useState({
    type: null as 'success' | 'error' | null,
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorToast, setErrorToast] = useState<{
    message: string;
    isVisible: boolean;
  }>({
    message: '',
    isVisible: false
  });
  const [selectedState, setSelectedState] = useState('');
  const [selectedSuburb, setSelectedSuburb] = useState('');

  // Check user type and redirect if necessary
  useEffect(() => {
    if (user) {
      const userType = user['https://theopenshift.com/user_type'];
      if (userType === 'staff') {
        router.push('/profile-completion/staff');
      }
    }
  }, [user, router]);

  // Update email when user data is loaded
  useEffect(() => {
    if (user) {
      setOrganizationDetails(prev => ({
        ...prev,
        email: user.email || ''
      }));
    }
  }, [user]);

  // Add phone validation function
  const validatePhone = (phone: string): boolean => {
    return /^(\+61|0)[2-4789]\d{8}$/.test(phone);
  };

  const handleAbnLookup = async () => {
    if (!organizationDetails.abn) return;
    
    setIsLoading(true);
    setAbnError("");
    
    try {
      const response = await fetch(`https://abr.business.gov.au/json/AbnDetails.aspx?callback=callback&name=${encodeURIComponent(organizationDetails.name)}&abn=${encodeURIComponent(organizationDetails.abn)}&guid=${process.env.NEXT_PUBLIC_ABN_LOOKUP_GUID}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      const text = await response.text();
      const jsonStr = text.replace(/^callback\(|\)$/g, '');
      const data = JSON.parse(jsonStr);

      if (data.Abn) {
        setOrganizationDetails(prev => ({
          ...prev,
          name: data.EntityName || prev.name,
          phone: data.Phone || prev.phone,
          abnStatus: data.AbnStatus,
          abnEffectiveFrom: data.AbnStatusEffectiveFrom,
        }));
      } else {
        setAbnError("ABN not found or invalid");
      }
    } catch (error) {
      setAbnError("Error looking up ABN");
      console.error('ABN lookup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add validation function
  const validateForm = () => {
    if (!organizationDetails.name) {
      setSubmissionStatus({
        type: 'error',
        message: 'Organization name is required'
      });
      return false;
    }
    if (!organizationDetails.abn) {
      setSubmissionStatus({
        type: 'error',
        message: 'ABN number is required'
      });
      return false;
    }
    if (!organizationDetails.address) {
      setSubmissionStatus({
        type: 'error',
        message: 'Address is required'
      });
      return false;
    }
    if (!organizationDetails.phone) {
      setSubmissionStatus({
        type: 'error',
        message: 'Phone number is required'
      });
      return false;
    }
    if (!validatePhone(organizationDetails.phone)) {
      setSubmissionStatus({
        type: 'error',
        message: 'Please enter a valid Australian phone number'
      });
      return false;
    }
    if (!organizationDetails.website) {
      setSubmissionStatus({
        type: 'error',
        message: 'Website is required'
      });
      return false;
    }
    if (!organizationDetails.description) {
      setSubmissionStatus({
        type: 'error',
        message: 'Description is required'
      });
      return false;
    }
    // Email verification check - commented out for testing
    // if (!user?.email_verified) {
    //   setSubmissionStatus({
    //     type: 'error',
    //     message: 'Please verify your email address first'
    //   });
    //   return false;
    // }
    return true;
  };

  const handleFinish = async () => {
    if (!user) {
      setErrorToast({
        message: 'You must be logged in to submit your profile.',
        isVisible: true
      });
      setSubmissionStatus({
        type: 'error',
        message: 'You must be logged in to submit your profile.'
      });
      return;
    }

    if (!validateForm()) {
      setErrorToast({
        message: submissionStatus.message,
        isVisible: true
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmissionStatus({
        type: null,
        message: 'Creating your organization profile...'
      });

      // Get the session to access the token
      const sessionResponse = await fetch('/api/auth/session');
      const session = await sessionResponse.json();
      
      if (!session?.accessToken) {
        throw new Error('No access token available');
      }

      const profileData = {
        name: organizationDetails.name,
        address: organizationDetails.address,
        phone: organizationDetails.phone,
        abn: organizationDetails.abn,
        website: organizationDetails.website,
        description: organizationDetails.description,
      };

      const response = await fetch('https://api.theopenshift.com/v1/orgs/org', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create organization profile');
      }

      setSubmissionStatus({
        type: 'success',
        message: 'Organization profile created successfully!'
      });
      setErrorToast({
        message: 'Organization profile created successfully!',
        isVisible: true
      });
      setTimeout(() => {
        setErrorToast({ message: '', isVisible: false });
        router.push('/profile/organization');
      }, 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setErrorToast({
        message: `Failed to create organization profile: ${errorMessage}`,
        isVisible: true
      });
      setSubmissionStatus({
        type: 'error',
        message: `Failed to create organization profile: ${errorMessage}`
      });
      setIsSubmitting(false);
    }
  };

  // Update the banner to show validation errors
  const getBannerContent = () => {
    if (submissionStatus.type === 'success') {
      return 'Your organization profile has been successfully created!';
    }
    if (submissionStatus.type === 'error') {
      return submissionStatus.message;
    }
    return 'Your organization profile verification and completion is not finished!';
  };

  if (authLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top row with only profile icon/avatar */}
      <div className="w-full flex justify-end items-center h-16 px-4 border-b bg-white">
        {user && (
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-white overflow-hidden">
              {user.picture ? (
                <Image src={user.picture} alt={user.name || 'Profile'} width={40} height={40} className="w-10 h-10 object-cover rounded-full" />
              ) : (
                <span className="text-[#2954bd]">{user.name?.[0]?.toUpperCase() || 'U'}</span>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Dynamic Banner below avatar */}
      <div className={`w-full max-w-2xl mx-auto text-center py-2 font-medium text-base shadow relative z-10 rounded-lg mb-4 mt-6 ${
        submissionStatus.type === 'success' 
          ? 'bg-green-300 text-green-900' 
          : submissionStatus.type === 'error'
          ? 'bg-red-300 text-red-900'
          : 'bg-yellow-300 text-yellow-900'
      }`} style={{ letterSpacing: 0.2 }}>
        {getBannerContent()}
      </div>
      <main className="flex-1 flex flex-col items-center justify-center py-8">
        {/* Main Card */}
        <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-10 flex flex-col gap-8 text-black relative z-10">
          <h2 className="text-2xl font-bold mb-2 text-center">Organization Registration</h2>
          <div className="flex flex-col gap-4">
            {/* ABN Section */}
            <div>
              <label className="block font-semibold mb-2">ABN Number</label>
              <div className="flex gap-2">
                <input
                  className={`w-full border rounded-md p-2 text-black ${abnError ? 'border-red-500' : ''}`}
                  value={organizationDetails.abn}
                  onChange={e => setOrganizationDetails({ ...organizationDetails, abn: e.target.value })}
                  placeholder="ABN number"
                />
                <button
                  className="px-4 py-2 bg-brand-dark text-white rounded-md hover:bg-brand-accent disabled:opacity-50"
                  onClick={handleAbnLookup}
                  disabled={!organizationDetails.abn || isLoading}
                >
                  {isLoading ? 'Looking up...' : 'Lookup'}
                </button>
              </div>
              {abnError && <p className="text-red-500 text-sm mt-1">{abnError}</p>}
              {organizationDetails.abnStatus && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">ABN Status:</span>
                    <span className={`px-2 py-1 rounded text-sm ${organizationDetails.abnStatus === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {organizationDetails.abnStatus}
                    </span>
                  </div>
                  {organizationDetails.abnEffectiveFrom && (
                    <div className="text-sm text-gray-600">
                      Effective from: {new Date(organizationDetails.abnEffectiveFrom).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Name */}
            <div>
              <label className="block font-semibold mb-2">Organization Name</label>
              <input 
                className="w-full border rounded-md p-2 text-black" 
                value={organizationDetails.name} 
                onChange={e => setOrganizationDetails({ ...organizationDetails, name: e.target.value })} 
                placeholder="Organization name" 
              />
            </div>
            {/* Email */}
            <div>
              <label className="block font-semibold mb-2">Email</label>
              <div className="space-y-2">
                <input 
                  className="w-full border rounded-md p-2 text-black bg-gray-50" 
                  value={organizationDetails.email} 
                  readOnly 
                  placeholder="Your registered email" 
                />
                {user && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Email Status:</span>
                    <span className={`px-2 py-1 rounded text-sm ${user.email_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.email_verified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                )}
                {!user?.email_verified && (
                  <p className="text-sm text-gray-600">
                    Please verify your email address to complete your registration.
                  </p>
                )}
              </div>
            </div>
            {/* Website */}
            <div>
              <label className="block font-semibold mb-2">Website</label>
              <input 
                className="w-full border rounded-md p-2 text-black" 
                value={organizationDetails.website} 
                onChange={e => setOrganizationDetails({ ...organizationDetails, website: e.target.value })} 
                placeholder="https://your-organization.com" 
              />
            </div>
            {/* Description */}
            <div>
              <label className="block font-semibold mb-2">Description</label>
              <textarea 
                className="w-full border rounded-md p-2 text-black min-h-[100px]" 
                value={organizationDetails.description} 
                onChange={e => setOrganizationDetails({ ...organizationDetails, description: e.target.value })} 
                placeholder="Tell us about your organization..."
              />
            </div>
            {/* Address */}
            <div>
              <label className="block font-semibold mb-2">State</label>
              <select
                className="w-full border rounded-md p-2"
                value={selectedState}
                onChange={e => {
                  setSelectedState(e.target.value);
                  setSelectedSuburb('');
                  setOrganizationDetails(prev => ({ ...prev, address: '' }));
                }}
              >
                <option value="">Select state</option>
                {Object.entries(AU_STATE_LABELS).map(([code, label]) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>
              {selectedState && (
                <>
                  <label className="block font-semibold mb-2 mt-4">Suburb</label>
                  <select
                    className="w-full border rounded-md p-2"
                    value={selectedSuburb}
                    onChange={e => {
                      setSelectedSuburb(e.target.value);
                      setOrganizationDetails(prev => ({ ...prev, address: e.target.value }));
                    }}
                  >
                    <option value="">Select suburb</option>
                    {(AU_STATES_SUBURBS[selectedState as keyof typeof AU_STATES_SUBURBS] || []).map((suburb: string) => (
                      <option key={suburb} value={suburb}>{suburb}</option>
                    ))}
                  </select>
                </>
              )}
            </div>
            {/* Phone */}
            <div>
              <label className="block font-semibold mb-2">Phone Number</label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 border rounded-l-md">
                  <span className="text-lg">🇦🇺</span>
                  <span className="text-gray-600">+61</span>
                </div>
                <input 
                  className={`flex-1 border rounded-r-md p-2 text-black ${
                    organizationDetails.phone ? (validatePhone(organizationDetails.phone) ? 'border-green-500' : 'border-red-500') : ''
                  }`}
                  value={organizationDetails.phone} 
                  onChange={e => setOrganizationDetails({ ...organizationDetails, phone: e.target.value })} 
                  placeholder="Enter phone number (e.g., 412345678)" 
                />
              </div>
              {organizationDetails.phone && !validatePhone(organizationDetails.phone) && (
                <p className="text-red-500 text-sm mt-1">Please enter a valid Australian phone number</p>
              )}
            </div>
          </div>
          <div className="mt-8 text-center">
            <button
              onClick={handleFinish}
              disabled={isSubmitting}
              className={`px-8 py-3 rounded-md text-white font-medium bg-brand-dark hover:bg-brand-accent disabled:opacity-50 disabled:cursor-not-allowed ${
                isSubmitting ? 'animate-pulse' : ''
              }`}
            >
              {isSubmitting ? 'Creating Profile...' : 'Complete Organization Profile'}
            </button>
          </div>
        </div>
        {/* Toast Notification */}
        <ErrorToast
          message={errorToast.message}
          isVisible={errorToast.isVisible}
          onClose={() => setErrorToast(prev => ({ ...prev, isVisible: false }))}
          duration={6000}
        />
      </main>
    </div>
  );
}