"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { CheckCircleIcon, BuildingOfficeIcon, UserGroupIcon, StarIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useUser } from '@auth0/nextjs-auth0/client';
import LoadingScreen from '../../components/LoadingScreen';

function GeoapifyAutocomplete({ value, onChange }: { value: string, onChange: (address: string) => void }) {
  const [input, setInput] = useState(value);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { setInput(value); }, [value]);

  useEffect(() => {
    if (!input) { setSuggestions([]); return; }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fetch(`https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(input)}&limit=5&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`)
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
              className="px-4 py-2 hover:bg-brand-bgLight cursor-pointer text-sm"
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
      setSubmissionStatus({
        type: 'error',
        message: 'You must be logged in to submit your profile.'
      });
      return;
    }

    if (!validateForm()) {
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
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        router.push('/profile/organization');
      }, 3000);
    } catch (error) {
      console.error('Error creating organization profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setSubmissionStatus({
        type: 'error',
        message: `Failed to create organization profile: ${errorMessage}. Please try again or contact support if the problem persists.`
      });
    } finally {
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-brand-bgLight via-brand-light to-brand-dark">
      <main className="flex-1 flex flex-col items-center relative">
        {/* Lively Background */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="w-full h-full bg-gradient-to-br from-brand-bgLight via-brand-light to-brand-dark opacity-80"></div>
          <div className="absolute top-0 left-0 w-72 h-72 bg-brand-dark rounded-full blur-3xl opacity-20 animate-pulse" style={{transform: 'translate(-30%,-30%)'}}></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-dark rounded-full blur-3xl opacity-10 animate-pulse" style={{transform: 'translate(30%,30%)'}}></div>
        </div>
        {/* Navbar with logo */}
        <nav className="w-full flex justify-between items-center h-16 px-4 sm:px-8 bg-white border-b relative z-10">
          <div className="text-2xl font-bold text-brand-dark tracking-tight">TheOpenShift</div>
          <button
            className="hidden sm:inline-block px-4 py-2 bg-brand-dark text-white rounded-md hover:bg-brand-accent ml-4"
            onClick={() => router.push('/profile-completion/staff')}
          >
            Looking for Work?
          </button>
        </nav>

        {/* Dynamic Banner */}
        <div className={`w-full text-center py-2 font-medium text-base shadow relative z-10 ${
          submissionStatus.type === 'success' 
            ? 'bg-green-300 text-green-900' 
            : submissionStatus.type === 'error'
            ? 'bg-red-300 text-red-900'
            : 'bg-yellow-300 text-yellow-900'
        }`} style={{ letterSpacing: 0.2 }}>
          {getBannerContent()}
        </div>

        {/* Main Content: Two-column layout */}
        <div className="flex-1 w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-8 py-8 relative z-10 flex flex-col md:flex-row gap-8">
          {/* Left: Form */}
          <div className="w-full md:w-1/2 flex flex-col justify-center">
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8 flex flex-col gap-8 text-black relative">
              <h2 className="text-2xl font-bold mb-6">Organization Registration</h2>
              <div className="flex flex-col gap-4">
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
                <div>
                  <label className="block font-semibold mb-2">Organization Name</label>
                  <input 
                    className="w-full border rounded-md p-2 text-black" 
                    value={organizationDetails.name} 
                    onChange={e => setOrganizationDetails({ ...organizationDetails, name: e.target.value })} 
                    placeholder="Organization name" 
                  />
                </div>
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
                <div>
                  <label className="block font-semibold mb-2">Website</label>
                  <input 
                    className="w-full border rounded-md p-2 text-black" 
                    value={organizationDetails.website} 
                    onChange={e => setOrganizationDetails({ ...organizationDetails, website: e.target.value })} 
                    placeholder="https://your-organization.com" 
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-2">Description</label>
                  <textarea 
                    className="w-full border rounded-md p-2 text-black min-h-[100px]" 
                    value={organizationDetails.description} 
                    onChange={e => setOrganizationDetails({ ...organizationDetails, description: e.target.value })} 
                    placeholder="Tell us about your organization..."
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-2">Address</label>
                  <GeoapifyAutocomplete
                    value={organizationDetails.address || ''}
                    onChange={address => setOrganizationDetails({ ...organizationDetails, address })}
                  />
                </div>
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
                <div className="mt-6 sm:hidden flex justify-center">
                  <button
                    className="px-4 py-2 bg-brand-dark text-white rounded-md hover:bg-brand-accent"
                    onClick={() => router.push('/profile-completion/staff')}
                  >
                    Looking for Work?
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Right: Perks/Benefits */}
          <div className="w-full md:w-1/2 flex flex-col justify-center items-center md:items-start">
            <div className="p-6 sm:p-10 flex flex-col gap-6 w-full">
              <h2 className="text-2xl font-bold text-black mb-2">Start hiring with <span className="text-brand-dark">TheOpenShift</span></h2>
              <p className="text-lg text-gray-700 mb-4">Join 1,000+ businesses across Australia</p>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <CheckCircleIcon className="w-10 h-10 text-brand-dark mt-1" />
                  <div>
                    <span className="font-semibold text-brand-dark">Instant access to available staff:</span>
                    <span className="block text-gray-600">Unlock a pool of thousands of qualified, reliable, and comprehensively screened staff across various roles and locations.</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <StarIcon className="w-10 h-10 text-brand-dark mt-1" />
                  <div>
                    <span className="font-semibold text-brand-dark">Pay less for more:</span>
                    <span className="block text-gray-600">Post a job ad for free to get workers applying within minutes, and set your own pricing to control how much workers are paid above modern awards.</span>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <BriefcaseIcon className="w-10 h-10 text-brand-dark mt-1" />
                  <div>
                    <span className="font-semibold text-brand-dark">You're in control:</span>
                    <span className="block text-gray-600">Easily rehire favourite staff, block ones that are not suited for your needs, or let our smart algorithms choose the best candidates for you.</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg z-20">
            Organization profile completed successfully!
          </div>
        )}
      </main>
    </div>
  );
} 