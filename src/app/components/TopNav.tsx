'use client';
import { BellIcon, Bars3Icon } from '@heroicons/react/24/outline';

export default function TopNav({ onMobileMenu }: { onMobileMenu?: () => void }) {
  return (
    <header className="fixed top-0 left-0 w-full h-16 bg-white/80 backdrop-blur-md z-30 border-b border-gray-200 flex items-center px-4 sm:px-8 justify-between">
      <div className="flex items-center gap-2">
        {/* Hamburger for mobile */}
        {onMobileMenu && (
          <button className="sm:hidden p-2 rounded hover:bg-brand-bgLight" onClick={onMobileMenu} aria-label="Open sidebar">
            <Bars3Icon className="w-7 h-7 text-brand-dark" />
          </button>
        )}
        <span className="text-2xl font-bold text-brand-dark hidden sm:block">TheOpenShift</span>
      </div>
      <button className="relative p-2 rounded-full hover:bg-brand-bgLight transition" aria-label="Notifications">
        <BellIcon className="w-7 h-7 text-brand-dark" />
        {/* Notification dot (optional) */}
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
      </button>
    </header>
  );
} 