"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  HomeIcon,
  UserGroupIcon,
  CalendarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import LoadingScreen from '../../components/LoadingScreen';

interface OrganizationProfile {
  abn: string;
  name: string;
  address: string;
  phone: string;
  website: string;
  description: string;
  user_id: string;
  rating: number;
  abn_status?: {
    is_active: boolean;
    valid_until?: string;
  };
}

const SIDEBAR_ITEMS = [
  { label: "Dashboard", icon: <HomeIcon className="w-5 h-5" />, href: "/profile/organization" },
  { label: "Staff", icon: <UserGroupIcon className="w-5 h-5" />, href: "/profile/organization/staff" },
  { label: "Shifts", icon: <CalendarIcon className="w-5 h-5" />, href: "/profile/organization/shifts" },
  { label: "Documents", icon: <DocumentTextIcon className="w-5 h-5" />, href: "/profile/organization/documents" },
  { label: "Analytics", icon: <ChartBarIcon className="w-5 h-5" />, href: "/profile/organization/analytics" },
  { label: "Settings", icon: <Cog6ToothIcon className="w-5 h-5" />, href: "/profile/organization/settings" },
];

export default function OrganizationDashboard() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname() || '';
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [organizationData, setOrganizationData] = useState<OrganizationProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [abnStatus, setAbnStatus] = useState<string | null>(null);
  const [abnEffectiveFrom, setAbnEffectiveFrom] = useState<string | null>(null);
  const [abnLoading, setAbnLoading] = useState(false);
  const [abnError, setAbnError] = useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/api/auth/login");
      return;
    }

    async function fetchOrganizationData() {
      try {
        const session = await fetch('/api/auth/session').then(res => res.json());
        if (!session?.accessToken) {
          setError("Not authenticated.");
          return;
        }

        const res = await fetch('https://api.theopenshift.com/v1/orgs/me', {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Accept': 'application/json',
          },
        });

        if (!res.ok) {
          if (res.status === 404) {
            router.push("/role-selection");
            return;
          }
          throw new Error(`Failed to fetch organization data: ${res.status}`);
        }

        const data = await res.json();
        setOrganizationData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error fetching organization data");
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchOrganizationData();
    }
  }, [user, isLoading, router]);

  // ABN verification handler
  const handleAbnLookup = async () => {
    if (!organizationData?.abn) return;
    setAbnLoading(true);
    setAbnError("");
    try {
      const response = await fetch(`https://abr.business.gov.au/json/AbnDetails.aspx?callback=callback&abn=${encodeURIComponent(organizationData.abn)}&guid=${process.env.NEXT_PUBLIC_ABN_LOOKUP_GUID}`);
      const text = await response.text();
      const jsonStr = text.replace(/^callback\(|\)$/g, '');
      const data = JSON.parse(jsonStr);
      if (data.Abn) {
        setAbnStatus(data.AbnStatus);
        setAbnEffectiveFrom(data.AbnStatusEffectiveFrom);
      } else {
        setAbnStatus(null);
        setAbnEffectiveFrom(null);
        setAbnError("ABN not found or invalid");
      }
    } catch (error) {
      setAbnError("Error looking up ABN");
    } finally {
      setAbnLoading(false);
    }
  };

  if (isLoading || loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  }

  if (!organizationData) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">No organization data found.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden ${mobileSidebarOpen ? 'block' : 'hidden'}`}
        onClick={() => setMobileSidebarOpen(false)}>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-center border-b">
          <div className="text-2xl font-bold text-brand-dark">TheOpenShift</div>
        </div>
        <nav className="mt-5 px-2 flex-1">
          {SIDEBAR_ITEMS.map((item) => {
            // Dashboard: exact match. Others: startsWith, but not for dashboard.
            const isDashboard = item.href === '/profile/organization';
            const isActive = isDashboard
              ? pathname === '/profile/organization'
              : pathname.startsWith(item.href) && item.href !== '/profile/organization';
            return (
              <a
                key={item.label}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition
                  ${isActive ? 'bg-brand-bgLight text-brand-dark font-bold' : 'text-gray-600 hover:bg-brand-bgLight hover:text-brand-dark'}`}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </a>
            );
          })}
        </nav>
        {/* Logout button at the bottom */}
        <div className="absolute bottom-0 left-0 w-full p-4 border-t bg-white">
          <a
            href="/api/auth/logout"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-brand-dark text-white font-semibold hover:bg-brand-accent transition text-base"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            Logout
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64">
        {/* Top Navigation */}
        <div className="sticky top-0 z-10 bg-white shadow">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <button
                  type="button"
                  className="lg:hidden px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-dark"
                  onClick={() => setMobileSidebarOpen(true)}
                >
                  <span className="sr-only">Open sidebar</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
              {/* Removed Edit Profile button from top navbar */}
              <div className="flex items-center"></div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Organization Profile Card */}
            <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-brand-dark flex items-center justify-center">
                      <BuildingOfficeIcon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{organizationData.name}</h2>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                </div>
                {/* Restore Edit Profile button here */}
                <button
                  onClick={() => router.push('/profile-completion/organization?edit=1')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-dark hover:bg-brand-accent"
                >
                  Edit Profile
                </button>
              </div>

              {/* Organization Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">ABN</h3>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-base text-gray-900">{organizationData.abn}</p>
                      {organizationData.abn_status ? (
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${organizationData.abn_status.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {organizationData.abn_status.is_active ? 'Verified' : 'Not Verified'}
                        </span>
                      ) : (
                        <span className="ml-2 px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-600">Unknown</span>
                      )}
                      {organizationData.abn_status?.valid_until && organizationData.abn_status.is_active && (
                        <span className="ml-2 text-xs text-gray-500">(valid until {new Date(organizationData.abn_status.valid_until).toLocaleDateString()})</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Address</h3>
                    <p className="mt-1 text-base text-gray-900">{organizationData.address}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                    <p className="mt-1 text-base text-gray-900">{organizationData.phone}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Website</h3>
                    <a 
                      href={organizationData.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-1 text-base text-brand-dark hover:text-brand-accent"
                    >
                      {organizationData.website}
                    </a>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Description</h3>
                    <p className="mt-1 text-base text-gray-900">{organizationData.description}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Rating</h3>
                    <div className="mt-1 flex items-center">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.floor(organizationData.rating) ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">
                        {typeof organizationData.rating === "number"
                          ? organizationData.rating.toFixed(1)
                          : "0.0"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <UserGroupIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Staff</dt>
                        <dd className="text-lg font-medium text-gray-900">0</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CalendarIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Active Job Listings</dt>
                        <dd className="text-lg font-medium text-gray-900">0</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ChartBarIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Completed Shifts</dt>
                        <dd className="text-lg font-medium text-gray-900">0</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mt-8">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
              <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  <li className="px-6 py-4">
                    <div className="text-sm text-gray-500">No recent activity</div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 