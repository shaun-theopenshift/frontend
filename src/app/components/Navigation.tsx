'use client';

import { useState, useRef, useEffect } from 'react';
import { Bars3Icon, XMarkIcon, ChevronDownIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import Image from 'next/image';

export default function Navigation({ minimal = false }: { minimal?: boolean }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const { user, isLoading } = useUser();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSignupOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMobileMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

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
          {!minimal && (
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900">How it Works</a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900">Contact</a>
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link>
            </div>
          )}

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {!isLoading && (
              <>
                {user ? (
                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="w-10 h-10 rounded-full overflow-hidden bg-[#67b5b5] text-white flex items-center justify-center font-semibold hover:bg-[#4a9e9e] transition-colors"
                    >
                      {user.picture ? (
                        <Image
                          src={user.picture}
                          alt={user.name || 'User'}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user.name?.[0]?.toUpperCase() || 'U'
                      )}
                    </button>
                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                        <div className="py-1">
                          <Link
                            href="/profile"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Profile
                          </Link>
                          <a
                            href="/api/auth/logout"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Sign out
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  !minimal && (
                    <>
                      <a
                        href="/api/auth/login?audience=https://api.theopenshift.com"
                        className="px-4 py-2 text-sm font-medium text-[#67b5b5] hover:text-[#4a9e9e] rounded-md border border-[#67b5b5]"
                      >
                        Log in
                      </a>
                      <div className="relative" ref={dropdownRef}>
                        <button
                          className="px-4 py-2 text-sm font-medium text-white bg-[#67b5b5] rounded-md hover:bg-[#4a9e9e] flex items-center gap-1"
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
                                <a
                                  href="/api/auth/login?screen_hint=signup&audience=https://api.theopenshift.com"
                                  className="w-full px-4 py-3 text-sm font-medium text-white bg-[#67b5b5] rounded-md hover:bg-[#4a9e9e] transition-colors duration-200"
                                >
                                  Sign up as Organization
                                </a>
                                <a
                                  href="/api/auth/login?screen_hint=signup&audience=https://api.theopenshift.com"
                                  className="w-full px-4 py-3 text-sm font-medium text-[#67b5b5] border border-[#67b5b5] rounded-md hover:bg-[#e6f2f2] transition-colors duration-200"
                                >
                                  Sign up as Staff
                                </a>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )
                )}
              </>
            )}
          </div>

          {/* Mobile menu button */}
          {!minimal && (
            <div className="md:hidden flex items-center">
              <button
                onClick={handleMobileMenuClick}
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
          )}
        </div>

        {/* Mobile Navigation */}
        {!minimal && (
          <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#features" className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900">Features</a>
              <a href="#how-it-works" className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900">How it Works</a>
              <a href="#contact" className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900">Contact</a>
              <Link href="/pricing" className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900">Pricing</Link>
            </div>

            <div className="pt-4 pb-3 border-t border-gray-200">
              {!isLoading && (
                <>
                  {user ? (
                    <>
                      <div className="flex flex-col items-center justify-center px-3 py-2">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-[#67b5b5] text-white flex items-center justify-center font-semibold mb-2">
                          {user.picture ? (
                            <Image
                              src={user.picture}
                              alt={user.name || 'User'}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl">{user.name?.[0]?.toUpperCase() || 'U'}</span>
                          )}
                        </div>
                        <span className="text-gray-700 text-base font-semibold">{user.name}</span>
                      </div>
                      <Link
                        href="/profile"
                        className="block px-3 py-2 text-base font-medium text-[#67b5b5] hover:text-[#4a9e9e]"
                      >
                        Profile
                      </Link>
                      <a
                        href="/api/auth/logout"
                        className="block px-3 py-2 text-base font-medium text-[#67b5b5] hover:text-[#4a9e9e]"
                      >
                        Sign out
                      </a>
                    </>
                  ) : (
                    !minimal && (
                      <>
                        <a
                          href="/api/auth/login?audience=https://api.theopenshift.com"
                          className="block px-3 py-2 text-base font-medium text-[#67b5b5] hover:text-[#4a9e9e]"
                        >
                          Log in
                        </a>
                        <a
                          href="/api/auth/login?screen_hint=signup&audience=https://api.theopenshift.com"
                          className="block px-3 py-2 text-base font-medium text-white bg-[#67b5b5] rounded-md hover:bg-[#4a9e9e]"
                        >
                          Sign up
                        </a>
                      </>
                    )
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
