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
import Sidebar from '../../../components/Sidebar';
import TopNav from '../../../components/TopNav';

const SIDEBAR_ITEMS = [
  { label: "Dashboard", icon: <HomeIcon className="w-5 h-5" />, href: "/profile/staff" },
  { label: "Shifts", icon: <CalendarIcon className="w-5 h-5" />, href: "/profile/staff/shifts" },
  { label: "Documents", icon: <DocumentTextIcon className="w-5 h-5" />, href: "/profile/staff/documents" },
  { label: "Settings", icon: <Cog6ToothIcon className="w-5 h-5" />, href: "/profile/staff/settings" },
];

export default function SettingsPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <>
      <Sidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />
      <TopNav onMobileMenu={() => setMobileSidebarOpen(true)} />
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-[#fafbfc] via-[#e6f2f2] to-[#b2e0e0] sm:pl-64 pt-16 sm:pt-20">
        <div className="text-2xl text-gray-400">Settings will appear here.</div>
      </main>
    </>
  );
} 