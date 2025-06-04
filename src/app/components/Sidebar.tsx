'use client';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  UserCircleIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';

const menuItems = [
  { label: 'Profile', icon: UserCircleIcon, path: '/profile/staff' },
  { label: 'Messages', icon: ChatBubbleLeftRightIcon, path: '/profile/staff/messages' },
  { label: 'Fit2Work', icon: ClipboardDocumentCheckIcon, path: '/profile/staff/fit2work' },
  { label: 'Work History', icon: ClockIcon, path: '/profile/staff/work-history' },
  { label: 'Availability', icon: CalendarDaysIcon, path: '/profile/staff/availability' },
  { label: 'Account', icon: Cog6ToothIcon, path: '/profile/staff/account' },
  { label: 'Help & Center', icon: QuestionMarkCircleIcon, path: '/help' },
];

export default function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen?: boolean, setMobileOpen?: (open: boolean) => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Responsive: show/hide sidebar on mobile
  const sidebarClass = `
    h-screen bg-brand-bgLight border-r border-brand-mint flex flex-col transition-all duration-200
    ${collapsed ? 'w-20' : 'w-64'}
    fixed left-0 top-0 z-40
    hidden sm:flex
  `;
  const mobileSidebarClass = `
    h-screen bg-brand-bgLight border-r border-brand-mint flex flex-col transition-all duration-200
    w-64 fixed left-0 top-0 z-50
    sm:hidden
    ${mobileOpen ? 'block' : 'hidden'}
  `;

  const content = (
    <>
      <div className="flex items-center justify-between px-4 py-6">
        {!collapsed && <span className="text-2xl font-bold text-brand-dark">TheOpenShift</span>}
        <button
          className="p-2 rounded hover:bg-brand-mint sm:block hidden"
          onClick={() => setCollapsed((c) => !c)}
          aria-label="Toggle sidebar"
        >
          <Bars3Icon className="w-6 h-6 text-brand-dark" />
        </button>
        {/* Mobile close button */}
        {setMobileOpen && (
          <button
            className="p-2 rounded hover:bg-brand-mint sm:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <Bars3Icon className="w-6 h-6 text-brand-dark" />
          </button>
        )}
      </div>
      <nav className="flex-1 flex flex-col gap-1 mt-4">
        {menuItems.map(({ label, icon: Icon, path }) => (
          <button
            key={label}
            onClick={() => {
              if (path === '/profile/staff' && pathname === '/profile/staff') {
                router.replace(`/profile/staff?refresh=${Date.now()}`);
              } else {
                router.push(path);
              }
              if (setMobileOpen) setMobileOpen(false);
            }}
            className={`flex items-center gap-4 px-4 py-3 rounded-md transition font-medium text-brand-dark hover:bg-brand-mint ${pathname === path ? 'bg-brand-mint font-bold' : ''} ${collapsed ? 'justify-center' : ''}`}
            title={label}
          >
            <Icon className="w-6 h-6" />
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </nav>
      <div className="mt-auto mb-6 px-4">
        <a
          href="/api/auth/logout"
          className={`flex items-center gap-4 px-4 py-3 rounded-md transition font-medium text-red-600 hover:bg-red-100 ${collapsed ? 'justify-center' : ''}`}
        >
          <ArrowLeftOnRectangleIcon className="w-6 h-6" />
          {!collapsed && <span>Logout</span>}
        </a>
      </div>
    </>
  );

  return (
    <>
      <aside className={sidebarClass}>{content}</aside>
      <aside className={mobileSidebarClass}>{content}</aside>
    </>
  );
} 