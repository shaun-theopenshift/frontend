'use client';
import { useState } from 'react';
import Sidebar from '@/app/components/Sidebar';
import TopNav from '@/app/components/TopNav';

export default function WorkHistoryPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  return (
    <>
      <Sidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />
      <TopNav onMobileMenu={() => setMobileSidebarOpen(true)} />
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-[#fafbfc] via-[#e6f2f2] to-[#b2e0e0] sm:pl-64 pt-16 sm:pt-20">
        <div className="text-2xl text-gray-400">Work history and timesheets will appear here.</div>
      </main>
    </>
  );
} 