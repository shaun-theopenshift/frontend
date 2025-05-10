'use client';

import { useState, useRef, useEffect } from 'react';
import { Bars3Icon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close sign-up dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSignupOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-200 rounded-b-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-[#67b5b5] hover:text-[#4a9e9e]">
              TheOpenShift
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900">How it Works</a>
            <a href="#contact" className="text-gray-600 hover:text-gray-900">Contact</a>
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button className="px-4 py-2 text-lg font-medium text-[#67b5b5] hover:text-[#4a9e9e]">
              Log in
            </button>
            <div className="relative" ref={dropdownRef}>
              <button
                className="px-4 py-2 text-lg font-medium text-white bg-[#67b5b5] rounded-md hover:bg-[#4a9e9e] flex items-center gap-1"
                onClick={() => setIsSignupOpen(!isSignupOpen)}
                aria-haspopup="true"
                aria-expanded={isSignupOpen}
              >
                Sign up
                <ChevronDownIcon className="w-4 h-4" />
              </button>
              {isSignupOpen && (
                <div className="absolute right-0 mt-2 w-[400px] rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <button className="w-full px-4 py-3 text-sm font-medium text-white bg-[#67b5b5] rounded-md hover:bg-[#4a9e9e] transition-colors duration-200">
                        Sign up as Organization
                      </button>
                      <button className="w-full px-4 py-3 text-sm font-medium text-[#67b5b5] border border-[#67b5b5] rounded-md hover:bg-[#e6f2f2] transition-colors duration-200">
                        Sign up as Staff
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation with smooth animation */}
        <div
          className={`md:hidden overflow-hidden transition-[max-height] duration-500 ease-in-out ${
            isMenuOpen ? 'max-h-[400px]' : 'max-h-0'
          }`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a href="#features" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">
              Features
            </a>
            <a href="#how-it-works" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">
              How it Works
            </a>
            <a href="#contact" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">
              Contact
            </a>
            <Link href="/pricing" className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50">
              Pricing
            </Link>
            <div className="pt-4 pb-3 border-t border-gray-200">
              <button className="w-full px-3 py-2 text-base font-medium text-[#67b5b5] hover:text-[#4a9e9e]">
                Log in
              </button>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button className="w-full px-3 py-2 text-base font-medium text-white bg-[#67b5b5] rounded-md hover:bg-[#4a9e9e]">
                  Sign up as Organization
                </button>
                <button className="w-full px-3 py-2 text-base font-medium text-[#67b5b5] border border-[#67b5b5] rounded-md hover:bg-[#e6f2f2]">
                  Sign up as Staff
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
