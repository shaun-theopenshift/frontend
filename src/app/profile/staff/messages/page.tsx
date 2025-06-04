'use client';
import { useState } from 'react';
import Sidebar from '../../../components/Sidebar';
import TopNav from '../../../components/TopNav';

export default function MessagesPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  return (
    <>
      <Sidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />
      <TopNav onMobileMenu={() => setMobileSidebarOpen(true)} />
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-brand-bgLight via-brand-light to-brand-mint sm:pl-64 pt-16 sm:pt-20">
        <div className="text-2xl text-gray-400">Messages will appear here.</div>
      </main>
    </>
  );
} 