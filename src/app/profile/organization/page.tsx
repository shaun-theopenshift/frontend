"use client";

import { useState, useEffect } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  PencilIcon,
  HomeIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  BriefcaseIcon,
  ClipboardDocumentCheckIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import LoadingScreen from "../../components/LoadingScreen";
import SidebarProfile from "../../components/SidebarProfile";
import { usePathname } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { motion } from 'framer-motion';

interface OrganizationProfile {
  name: string;
  abn: string;
  address: string;
  phone: string;
  website: string;
  description: string;
  logo?: string;
  services?: string[];
  certifications?: string[];
  // Removed abn_status from here as it's fetched externally
}

// Mock Data for Graphs (replace with actual API data if available)
const mockShiftsData = [
  { name: 'Jan', shifts: 10 },
  { name: 'Feb', shifts: 15 },
  { name: 'Mar', shifts: 12 },
  { name: 'Apr', shifts: 18 },
  { name: 'May', shifts: 20 },
  { name: 'Jun', shifts: 25 },
];

const mockInteractionsData = [
  { worker: 'Alice', interactions: 50 },
  { worker: 'Bob', interactions: 30 },
  { worker: 'Charlie', interactions: 70 },
  { worker: 'Diana', interactions: 45 },
  { worker: 'Eve', interactions: 60 },
];

export default function OrganizationProfile() {
  const { user, error: authError, isLoading: authLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [orgData, setOrgData] = useState<OrganizationProfile | null>(null);
  const [abnStatus, setAbnStatus] = useState<"active" | "inactive" | null>(
    null
  );
  const [abnLookupLoading, setAbnLookupLoading] = useState(false);
  const [abnError, setAbnError] = useState<string | null>(null);

  // Fetch Organization Profile Data
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/api/auth/login");
      return;
    }

    if (user) {
      fetch("/api/auth/session")
        .then((res) => res.json())
        .then((session) => {
          if (!session?.accessToken) throw new Error("No access token");
          return fetch("https://api.theopenshift.com/v1/orgs/me", {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
              Accept: "application/json",
            },
          });
        })
        .then((res) => res.json())
        .then((data) => {
          setOrgData(data);
        })
        .catch((e) => {
          console.error("Error fetching profile:", e);
        })
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  // Perform ABN Lookup when orgData.abn is available
  useEffect(() => {
    const handleAbnLookup = async (abn: string, orgName: string) => {
      setAbnLookupLoading(true);
      setAbnError(null);

      const ABN_LOOKUP_GUID = process.env.NEXT_PUBLIC_ABN_LOOKUP_GUID || 'YOUR_ABN_LOOKUP_GUID_HERE';

      if (!ABN_LOOKUP_GUID || ABN_LOOKUP_GUID === 'YOUR_ABN_LOOKUP_GUID_HERE') {
        console.warn("ABN Lookup GUID is not configured. ABN status will not be fetched.");
        setAbnStatus(null);
        setAbnLookupLoading(false);
        return;
      }

      try {
        const response = await fetch(`https://abr.business.gov.au/json/AbnDetails.aspx?callback=callback&name=${encodeURIComponent(orgName)}&abn=${encodeURIComponent(abn)}&guid=${ABN_LOOKUP_GUID}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        const text = await response.text();
        const jsonStr = text.replace(/^callback\(|\)$/g, '');
        const data = JSON.parse(jsonStr);

        if (data.Abn) {
          // Assuming data.AbnStatus contains "Active" or "Cancelled" (or similar)
          const status = data.AbnStatus?.toLowerCase() === "active" ? "active" : "inactive";
          setAbnStatus(status);
        } else {
          setAbnError("ABN not found or invalid during lookup.");
          setAbnStatus("inactive"); // Default to inactive if not found
        }
      } catch (error) {
        setAbnError("Error looking up ABN.");
        console.error('ABN lookup error:', error);
        setAbnStatus("inactive"); // Default to inactive on error
      } finally {
        setAbnLookupLoading(false);
      }
    };

    if (orgData?.abn && orgData?.name) {
      handleAbnLookup(orgData.abn, orgData.name);
    } else {
      setAbnStatus(null); // Reset if ABN or name is not available
    }
  }, [orgData?.abn, orgData?.name]); // Depend on orgData.abn and orgData.name

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  if (!orgData) {
    return <div>Error loading organization profile</div>;
  }

  // Compose sidebar user for organization
  const sidebarUser = orgData ? { name: orgData.name } : null;

  return (
    <div className="min-h-screen bg-white flex">
      <SidebarProfile userType="organization" user={sidebarUser} />
      <div className="flex-1 md:pl-72 pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-rose-50 p-4 rounded-lg mt-4">
            <p className="text-rose-700 text-sm">
              Your profile isn't visible to Care Workers until your account is
              approved
            </p>
          </div>

          <div className="bg-[#2954bd] text-white rounded-lg p-6 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {orgData.name?.[0]?.toUpperCase() || "O"}
                </div>
                <div>
                  <h1 className="text-2xl font-semibold">{orgData.name}</h1>
                  <p className="text-white/80">Organization</p>
                </div>
              </div>
              <Link
                href="/profile/organization/edit"
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-md flex items-center space-x-2"
              >
                <PencilIcon className="h-4 w-4" />
                <span>Edit Profile</span>
              </Link>
            </div>
          </div>

          <div className="py-8">
            <section>
              <div className="flex items-center justify-between mb-1 mt-6">
                <h2 className="text-xl font-semibold text-black">
                  Business Details
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-gray-500 text-sm mb-1 font-semibold">ABN</p>
                  <p className="text-gray-900">{orgData.abn}</p>
                  {abnLookupLoading ? (
                    <span className="text-gray-500 text-sm mt-2 inline-block">Loading ABN status...</span>
                  ) : abnError ? (
                    <span className="text-red-600 text-sm mt-2 inline-block">Error: {abnError}</span>
                  ) : (
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold mt-2 inline-block min-w-[80px] text-center ${
                        abnStatus === "active"
                          ? "bg-green-100 text-green-800"
                          : abnStatus === "inactive"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      ABN {abnStatus === "active" ? "Active" : abnStatus === "inactive" ? "Inactive" : "N/A"}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1 font-semibold">Phone</p>
                  <p className="text-gray-900">{orgData.phone}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1 font-semibold">Address</p>
                  <p className="text-gray-900">{orgData.address}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1 font-semibold">Website</p>
                  <p className="text-gray-900">
                    {orgData.website || "Not provided"}
                  </p>
                </div>
              </div>
            </section>

            {/* Statistics Section */}
            <section className="mt-8">
              <h2 className="text-xl font-semibold text-black mb-4">Statistics Overview</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Shifts Posted Graph */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="bg-white rounded-lg shadow-md p-6 border border-gray-100"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Shifts Posted Over Time</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={mockShiftsData}
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis dataKey="name" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            padding: '10px',
                            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)',
                          }}
                          labelStyle={{ fontWeight: 'bold', color: '#333' }}
                          itemStyle={{ color: '#2954bd' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="shifts"
                          stroke="#2954bd"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Worker Interactions Graph */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="bg-white rounded-lg shadow-md p-6 border border-gray-100"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Worker Interactions</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={mockInteractionsData}
                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis dataKey="worker" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e0e0e0',
                            borderRadius: '8px',
                            padding: '10px',
                            boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)',
                          }}
                          labelStyle={{ fontWeight: 'bold', color: '#333' }}
                          itemStyle={{ color: '#2954bd' }}
                        />
                        <Bar dataKey="interactions" fill="#2954bd" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
