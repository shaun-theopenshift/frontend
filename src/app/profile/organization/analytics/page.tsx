"use client";

import { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import {
  HomeIcon,
  UserGroupIcon,
  CalendarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

const SIDEBAR_ITEMS = [
  { label: "Dashboard", icon: <HomeIcon className="w-5 h-5" />, href: "/profile/organization" },
  { label: "Staff", icon: <UserGroupIcon className="w-5 h-5" />, href: "/profile/organization/staff" },
  { label: "Shifts", icon: <CalendarIcon className="w-5 h-5" />, href: "/profile/organization/shifts" },
  { label: "Documents", icon: <DocumentTextIcon className="w-5 h-5" />, href: "/profile/organization/documents" },
  { label: "Analytics", icon: <ChartBarIcon className="w-5 h-5" />, href: "/profile/organization/analytics" },
  { label: "Settings", icon: <Cog6ToothIcon className="w-5 h-5" />, href: "/profile/organization/settings" },
];

export default function OrganizationAnalyticsPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
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
        <nav className="mt-5 px-2">
          {SIDEBAR_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-brand-bgLight hover:text-brand-dark"
            >
              {item.icon}
              <span className="ml-3">{item.label}</span>
            </a>
          ))}
        </nav>
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
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <button
                    onClick={() => router.push('/profile-completion/organization?edit=1')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-accent hover:bg-brand-accent"
                  >
                    Edit Profile
                  </button>
                </div>
                <div className="ml-4 flex items-center md:ml-6">
                  <a
                    href="/api/auth/logout"
                    className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent"
                  >
                    <span className="sr-only">Sign out</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
              <h1 className="text-2xl font-semibold text-gray-900 mb-6">Analytics Dashboard</h1>
              <div className="text-gray-500">
                Analytics features coming soon...
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 