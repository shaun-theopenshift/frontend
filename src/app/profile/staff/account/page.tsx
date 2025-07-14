"use client"; // This directive marks the component as a Client Component

import React, { useState, useEffect } from 'react';
import { Tab, Disclosure } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Lock,
  FileText,
  Mail,
  Key,
  Trash2,
  MessageSquare,
  Phone,
  AlertCircle,
  ChevronUp,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';

// Import useUser from Auth0
import { useUser } from '@auth0/nextjs-auth0/client';

// Import your actual SidebarProfile component
import SidebarProfile from '@/app/components/SidebarProfile';
import LoadingScreen from '@/app/components/LoadingScreen'; // Adjusted path as per your provided page.tsx


// Define the primary color
const primaryColor = '#3464b4';

// Helper function to join Tailwind classes
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

// Main SettingsPage component
const App: React.FC = () => {
  const { user, isLoading: isAuth0Loading } = useUser(); // Use Auth0's useUser hook
  const [activeTab, setActiveTab] = useState(0);
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [loadingUserData, setLoadingUserData] = useState<boolean>(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true); // State for notifications toggle

  // Incident Report states
  const [incidentTitle, setIncidentTitle] = useState<string>('');
  const [incidentDescription, setIncidentDescription] = useState<string>('');
  const [incidentDateTime, setIncidentDateTime] = useState<string>('');
  const [incidentHelpNeeded, setIncidentHelpNeeded] = useState<string>('');
  const [submittingIncident, setSubmittingIncident] = useState<boolean>(false);
  const [incidentResponse, setIncidentResponse] = useState<any>(null);
  const [incidentError, setIncidentError] = useState<string | null>(null);
  const [openRequests, setOpenRequests] = useState<any[]>([]); // To display submitted incidents

  const [authToken, setAuthToken] = useState<string | null>(null); // State to store the JWT token


  // Fetch user data and Auth0 token
  useEffect(() => {
    const fetchAuth0Data = async () => {
      if (isAuth0Loading) {
        return; // Still loading Auth0 session
      }

      if (!user) {
        setLoadingUserData(false);
        // Optionally handle unauthenticated state, e.g., redirect to login
        console.warn("User not authenticated.");
        return;
      }

      // Set username and email from Auth0 user object
      setUsername(user.nickname || user.name || '');
      setEmail(user.email || '');

      try {
        // Fetch the access token from your Next.js API route
        const sessionRes = await fetch('/api/auth/session');
        if (!sessionRes.ok) {
          throw new Error('Failed to fetch session token.');
        }
        const session = await sessionRes.json();
        if (session?.accessToken) {
          setAuthToken(session.accessToken);
          console.log("Auth0 Access Token:", session.accessToken); // Log the access token
        } else {
          console.warn("Access token not found in session.");
        }
      } catch (error) {
        console.error("Error getting access token:", error);
        setIncidentError("Failed to retrieve authentication token.");
      } finally {
        setLoadingUserData(false);
      }
    };

    fetchAuth0Data();
  }, [user, isAuth0Loading]); // Re-run when user or Auth0 loading state changes

  const handleSubmitIncident = async () => {
    setSubmittingIncident(true);
    setIncidentResponse(null);
    setIncidentError(null);

    // Validate form fields
    if (!incidentTitle || !incidentDescription || !incidentDateTime || !incidentHelpNeeded) {
      setIncidentError('All incident report fields are required.');
      setSubmittingIncident(false);
      return;
    }

    // Convert date and time to ISO format
    let isoDateTime = '';
    try {
      isoDateTime = new Date(incidentDateTime).toISOString();
    } catch (e) {
      setIncidentError('Invalid date and time format.');
      setSubmittingIncident(false);
      return;
    }

    const payload = {
      title: incidentTitle,
      description: incidentDescription,
      incident_at: isoDateTime,
      help_needed_desc: incidentHelpNeeded,
    };

    if (!authToken) {
      setIncidentError('Authentication token is missing. Please log in.');
      setSubmittingIncident(false);
      return;
    }

    try {
      const response = await fetch('https://api.theopenshift.com/v1/forms/incident-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`, // Use the fetched Auth0 JWT token
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to submit incident report. Status: ${response.status}`);
      }

      const data = await response.json();
      setIncidentResponse(data);
      setOpenRequests((prevRequests) => [...prevRequests, data]); // Add to open requests
      // Clear form fields after successful submission
      setIncidentTitle('');
      setIncidentDescription('');
      setIncidentDateTime('');
      setIncidentHelpNeeded('');

    } catch (error: any) {
      setIncidentError(error.message || 'An unknown error occurred.');
    } finally {
      setSubmittingIncident(false);
    }
  };

  if (isAuth0Loading || loadingUserData) {
    return (
      <LoadingScreen/>
    );
  }

  // Sanitize user for SidebarProfile to avoid passing undefined properties
  const sidebarUser = user
    ? {
      name: typeof user.name === 'string' ? user.name : undefined,
      picture: typeof user.picture === 'string' ? user.picture : undefined,
      email: typeof user.email === 'string' ? user.email : undefined,
    }
    : null;


  return (
    <div className="min-h-screen bg-gray-100 font-sans pt-10">
      {/* Integrate your SidebarProfile component here */}
      <SidebarProfile userType="staff" user={sidebarUser} />

      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#dbe9fe] rounded-tl-full z-0 opacity-80 xl:w-[700px] xl:h-[700px]"></div>


      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden p-4 sm:p- lg:p-10 relative z-10">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
          <p className="text-gray-500 mt-1">Manage your account preferences and information.</p>
        </div>

        {/* Tabs Section */}
        <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
          <Tab.List className="flex p-2 space-x-1 bg-gray-50 rounded-xl m-4 border border-gray-200">
            {['General', 'Security', 'Terms', 'Contact'].map((category, index) => (
              <Tab
                key={category}
                className={({ selected }) =>
                  classNames(
                    'w-full py-2.5 text-sm leading-5 font-medium rounded-lg',
                    'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60',
                    selected
                      ? `bg-[${primaryColor}] text-white shadow-md` // Changed to primary color background and white text
                      : 'text-gray-600 hover:bg-white/[0.20] hover:text-gray-900'
                  )
                }
              >
                {index === 0 && <Settings className="inline-block w-4 h-4 mr-2" />}
                {index === 1 && <Lock className="inline-block w-4 h-4 mr-2" />}
                {index === 2 && <FileText className="inline-block w-4 h-4 mr-2" />}
                {index === 3 && <Mail className="inline-block w-4 h-4 mr-2" />}
                {category}
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels className="p-6">
            {/* General Tab Panel */}
            <Tab.Panel
              className={classNames(
                'rounded-xl bg-white p-3',
                'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60'
              )}
            >
              <motion.div
                key="general"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">General Settings</h2>
                {loadingUserData ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin w-6 h-6 text-[${primaryColor}] mr-2" />
                    <span className="text-gray-600">Loading user data...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                      <label htmlFor="username" className="text-gray-700 font-medium">Username</label>
                      <input
                        type="text"
                        id="username"
                        value={username}
                        readOnly // Make it read-only
                        className="border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-700 cursor-not-allowed"
                      />
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                      <label htmlFor="email" className="text-gray-700 font-medium">Email Address</label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        readOnly // Make it read-only
                        className="border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-700 cursor-not-allowed"
                      />
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                  <span className="text-gray-700 font-medium">Notifications</span>
                  <label htmlFor="toggle-notifications" className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="toggle-notifications"
                      className="sr-only peer"
                      checked={notificationsEnabled}
                      onChange={() => setNotificationsEnabled(!notificationsEnabled)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#3464b4]/[0.2] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3464b4]"></div>
                  </label>
                </div>
                <button
                  className={`mt-6 px-6 py-3 bg-[${primaryColor}] text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-[${primaryColor}] focus:ring-offset-2 transition duration-200`}
                >
                  Save Changes
                </button>
              </motion.div>
            </Tab.Panel>

            {/* Security Tab Panel */}
            <Tab.Panel
              className={classNames(
                'rounded-xl bg-white p-3',
                'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60'
              )}
            >
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Security Settings</h2>

                {/* Change Password */}
                <Disclosure as="div" className="mt-2">
                  {({ open }) => (
                    <>
                      <Disclosure.Button className={`flex w-full justify-between rounded-lg bg-gray-50 px-4 py-3 text-left text-sm font-medium text-[${primaryColor}] hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-[${primaryColor}] focus-visible:ring-opacity-75 shadow-sm border border-gray-200`}>
                        <span className="flex items-center">
                          <Key className="w-5 h-5 mr-2" /> Change Password
                        </span>
                        <ChevronUp
                          className={`${
                            open ? 'rotate-180 transform' : ''
                          } h-5 w-5 text-[${primaryColor}]`}
                        />
                      </Disclosure.Button>
                      <AnimatePresence>
                        {open && (
                          <Disclosure.Panel
                            as={motion.div}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            //transition={{ duration: 0.2 }}
                            className="px-4 pt-4 pb-2 text-sm text-gray-500 bg-white rounded-b-lg border border-t-0 border-gray-200 shadow-sm"
                          >
                            <p className="mb-4">
                              It's a good practice to change your password regularly to keep your account secure.
                            </p>
                            <button
                              className={`px-4 py-2 bg-[${primaryColor}] text-white font-semibold rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-[${primaryColor}] focus:ring-offset-2 transition duration-200`}
                            >
                              Change Password
                            </button>
                          </Disclosure.Panel>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </Disclosure>

                {/* Delete Account */}
                <Disclosure as="div" className="mt-2">
                  {({ open }) => (
                    <>
                      <Disclosure.Button className={`flex w-full justify-between rounded-lg bg-gray-50 px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-red-500 focus-visible:ring-opacity-75 shadow-sm border border-gray-200`}>
                        <span className="flex items-center">
                          <Trash2 className="w-5 h-5 mr-2" /> Contact Support
                        </span>
                        <ChevronUp
                          className={`${
                            open ? 'rotate-180 transform' : ''
                          } h-5 w-5 text-red-600`}
                        />
                      </Disclosure.Button>
                      <AnimatePresence>
                        {open && (
                          <Disclosure.Panel
                            as={motion.div}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            //transition={{ duration: 0.2 }}
                            className="px-4 pt-4 pb-2 text-sm text-gray-500 bg-white rounded-b-lg border border-t-0 border-gray-200 shadow-sm"
                          >
                            <p className="mb-4 text-red-700 font-semibold">
                              Warning: Deleting your account is irreversible and will remove all your data.
                            </p>
                            <button
                              className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition duration-200"
                            >
                              Delete Account
                            </button>
                          </Disclosure.Panel>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </Disclosure>
              </motion.div>
            </Tab.Panel>

            {/* Terms Tab Panel */}
            <Tab.Panel
              className={classNames(
                'rounded-xl bg-white p-3',
                'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60'
              )}
            >
              <motion.div
                key="terms"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Terms & Legal</h2>

                {/* Terms of Use */}
                <Disclosure as="div" className="mt-2">
                  {({ open }) => (
                    <>
                      <Disclosure.Button className={`flex w-full justify-between rounded-lg bg-gray-50 px-4 py-3 text-left text-sm font-medium text-[${primaryColor}] hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-[${primaryColor}] focus-visible:ring-opacity-75 shadow-sm border border-gray-200`}>
                        <span className="flex items-center">
                          <FileText className="w-5 h-5 mr-2" /> Terms of Use
                        </span>
                        <ChevronUp
                          className={`${
                            open ? 'rotate-180 transform' : ''
                          } h-5 w-5 text-[${primaryColor}]`}
                        />
                      </Disclosure.Button>
                      <AnimatePresence>
                        {open && (
                          <Disclosure.Panel
                            as={motion.div}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            //transition={{ duration: 0.2 }}
                            className="px-4 pt-4 pb-2 text-sm text-gray-500 bg-white rounded-b-lg border border-t-0 border-gray-200 shadow-sm"
                          >
                            <p className="mb-2">
                              Welcome to our service! By accessing or using our website, you agree to be bound by these Terms of Use and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
                            </p>
                            <p className="mb-2">
                              The materials contained in this website are protected by applicable copyright and trademark law. We reserve the right to revise these terms of use for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these Terms and Conditions of Use.
                            </p>
                            <p>
                              Any claim relating to our website shall be governed by the laws of the State of [Your State/Country] without regard to its conflict of law provisions.
                            </p>
                          </Disclosure.Panel>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </Disclosure>

                {/* Legal */}
                <Disclosure as="div" className="mt-2">
                  {({ open }) => (
                    <>
                      <Disclosure.Button className={`flex w-full justify-between rounded-lg bg-gray-50 px-4 py-3 text-left text-sm font-medium text-[${primaryColor}] hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-[${primaryColor}] focus-visible:ring-opacity-75 shadow-sm border border-gray-200`}>
                        <span className="flex items-center">
                          <FileText className="w-5 h-5 mr-2" /> Legal Information
                        </span>
                        <ChevronUp
                          className={`${
                            open ? 'rotate-180 transform' : ''
                          } h-5 w-5 text-[${primaryColor}]`}
                        />
                      </Disclosure.Button>
                      <AnimatePresence>
                        {open && (
                          <Disclosure.Panel
                            as={motion.div}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            //transition={{ duration: 0.2 }}
                            className="px-4 pt-4 pb-2 text-sm text-gray-500 bg-white rounded-b-lg border border-t-0 border-gray-200 shadow-sm"
                          >
                            <p className="mb-2">
                              This section provides general information about our legal policies, including privacy policy, cookie policy, and data protection regulations. For detailed information, please refer to the specific policy documents linked below.
                            </p>
                            <ul className="list-disc list-inside space-y-1">
                              <li>Privacy Policy: Outlines how we collect, use, and protect your personal data.</li>
                              <li>Cookie Policy: Explains the use of cookies on our website.</li>
                              <li>GDPR Compliance: Information regarding our adherence to General Data Protection Regulation.</li>
                            </ul>
                          </Disclosure.Panel>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </Disclosure>
              </motion.div>
            </Tab.Panel>

            {/* Contact Tab Panel */}
            <Tab.Panel
              className={classNames(
                'rounded-xl bg-white p-3',
                'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60'
              )}
            >
              <motion.div
                key="contact"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Contact Us</h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <a
                    href="#"
                    className={`flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 bg-gray-50 text-[${primaryColor}] hover:bg-gray-100 transition duration-200 shadow-sm`}
                  >
                    <MessageSquare className="w-8 h-8 mb-2" />
                    <span className="font-medium text-sm">Chat with Us</span>
                  </a>
                  <a
                    href="mailto:support@example.com"
                    className={`flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 bg-gray-50 text-[${primaryColor}] hover:bg-gray-100 transition duration-200 shadow-sm`}
                  >
                    <Mail className="w-8 h-8 mb-2" />
                    <span className="font-medium text-sm">Send us an Email</span>
                  </a>
                  <a
                    href="tel:+1234567890"
                    className={`flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 bg-gray-50 text-[${primaryColor}] hover:bg-gray-100 transition duration-200 shadow-sm`}
                  >
                    <Phone className="w-8 h-8 mb-2" />
                    <span className="font-medium text-sm">Call Us</span>
                  </a>
                </div>

                {/* Report an Incident */}
                <Disclosure as="div" className="mt-6">
                  {({ open }) => (
                    <>
                      <Disclosure.Button className={`flex w-full justify-between rounded-lg bg-gray-50 px-4 py-3 text-left text-sm font-medium text-[${primaryColor}] hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-[${primaryColor}] focus-visible:ring-opacity-75 shadow-sm border border-gray-200`}>
                        <span className="flex items-center">
                          <AlertCircle className="w-5 h-5 mr-2" /> Report an Incident
                        </span>
                        <ChevronUp
                          className={`${
                            open ? 'rotate-180 transform' : ''
                          } h-5 w-5 text-[${primaryColor}]`}
                        />
                      </Disclosure.Button>
                      <AnimatePresence>
                        {open && (
                          <Disclosure.Panel
                            as={motion.div}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            //transition={{ duration: 0.2 }}
                            className="px-4 pt-4 pb-2 text-sm text-gray-500 bg-white rounded-b-lg border border-t-0 border-gray-200 shadow-sm space-y-4"
                          >
                            <div>
                              <label htmlFor="incident-title" className="block text-gray-700 font-medium mb-1">Title</label>
                              <input
                                type="text"
                                id="incident-title"
                                placeholder="Brief summary of the incident"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[${primaryColor}] focus:border-transparent transition duration-200"
                                value={incidentTitle}
                                onChange={(e) => setIncidentTitle(e.target.value)}
                              />
                            </div>
                            <div>
                              <label htmlFor="incident-description" className="block text-gray-700 font-medium mb-1">Description</label>
                              <textarea
                                id="incident-description"
                                rows={4}
                                placeholder="Provide a detailed description of the incident"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[${primaryColor}] focus:border-transparent transition duration-200"
                                value={incidentDescription}
                                onChange={(e) => setIncidentDescription(e.target.value)}
                              ></textarea>
                            </div>
                            <div>
                              <label htmlFor="incident-datetime" className="block text-gray-700 font-medium mb-1">Date and Time</label>
                              <input
                                type="datetime-local"
                                id="incident-datetime"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[${primaryColor}] focus:border-transparent transition duration-200"
                                value={incidentDateTime}
                                onChange={(e) => setIncidentDateTime(e.target.value)}
                              />
                            </div>
                            <div>
                              <label htmlFor="incident-help" className="block text-gray-700 font-medium mb-1">What help is needed?</label>
                              <textarea
                                id="incident-help"
                                rows={3}
                                placeholder="e.g., technical support, account recovery, bug fix"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-[${primaryColor}] focus:border-transparent transition duration-200"
                                value={incidentHelpNeeded}
                                onChange={(e) => setIncidentHelpNeeded(e.target.value)}
                              ></textarea>
                            </div>
                            <button
                              onClick={handleSubmitIncident}
                              disabled={submittingIncident || !authToken} // Disable if no token
                              className={`px-4 py-2 bg-[${primaryColor}] text-white font-semibold rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-[${primaryColor}] focus:ring-offset-2 transition duration-200 ${submittingIncident || !authToken ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {submittingIncident ? (
                                <Loader2 className="animate-spin w-4 h-4 inline-block mr-2" />
                              ) : null}
                              Submit Report
                            </button>

                            {incidentResponse && (
                              <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-md flex items-center">
                                <CheckCircle className="w-5 h-5 mr-2" />
                                <span>Incident submitted successfully! ID: {incidentResponse.id}</span>
                              </div>
                            )}

                            {incidentError && (
                              <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md flex items-center">
                                <XCircle className="w-5 h-5 mr-2" />
                                <span>Error: {incidentError}</span>
                              </div>
                            )}

                            {openRequests.length > 0 && (
                              <div className="mt-6 border-t border-gray-200 pt-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">Open Requests</h3>
                                <div className="space-y-3">
                                  {openRequests.map((request, index) => {
                                    let statusColorClass = 'bg-gray-300 text-gray-700'; // Default
                                    if (request.status?.toLowerCase() === 'open') {
                                      statusColorClass = 'bg-orange-100 text-orange-800';
                                    } else if (request.status?.toLowerCase() === 'finished' || request.status?.toLowerCase() === 'closed') {
                                      statusColorClass = 'bg-green-100 text-green-800';
                                    }

                                    return (
                                      <div key={index} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                                        <p className="font-medium text-gray-700">Title: {request.title}</p>
                                        <p className="text-sm text-gray-600 flex items-center">
                                          Status:
                                          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${statusColorClass}`}>
                                            {request.status || 'Pending'}
                                          </span>
                                        </p>
                                        {request.id && <p className="text-xs text-gray-500">ID: {request.id}</p>}
                                        {request.created_at && <p className="text-xs text-gray-500">Submitted: {new Date(request.created_at).toLocaleString()}</p>}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </Disclosure.Panel>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </Disclosure>
              </motion.div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default App;
