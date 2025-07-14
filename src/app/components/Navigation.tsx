// src/app/components/Navigation.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import {
  UserCircleIcon,
  HomeIcon,
  InformationCircleIcon,
  RectangleGroupIcon,
  EnvelopeIcon,
  ArrowRightOnRectangleIcon // For login/signup on mobile
} from '@heroicons/react/24/outline'; // Add icons for bottom nav
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { user, isLoading } = useUser();
  const pathname = usePathname();

  // Handle scroll for shrinking effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50; // Shrink after 50px scroll
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Features', href: '#features', icon: InformationCircleIcon },
    { name: 'How We Work', href: '#how-it-works', icon: RectangleGroupIcon },
    { name: 'Contact', href: '#contact', icon: EnvelopeIcon },
  ];

  // Determine if a link is active for highlighting
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    // For hash links, check if we are on the home page and the hash matches
    if (href.startsWith('#')) {
      return pathname === '/' && window.location.hash === href;
    }
    // For other routes, direct match
    return pathname === href;
  };

  return (
    <>
      {/* Desktop Navigation (Top Bar) */}
      <motion.nav
        className={`fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-200 transition-all duration-300 ease-in-out ${scrolled ? 'md:rounded-b-xl' : ''}`}
        initial={false}
        animate={scrolled ? "scrolled" : "top"}
        variants={{
          top: { height: 64, paddingTop: 16, paddingBottom: 16 },
          scrolled: { height: 56, paddingTop: 8, paddingBottom: 8 },
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-full items-center">
          {/* Logo */}
          <motion.div
            className="flex-shrink-0"
            variants={{
              top: { scale: 1 },
              scrolled: { scale: 0.9 },
            }}
            transition={{ duration: 0.3 }}
          >
            <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-700 whitespace-nowrap">
              TheOpenShift
            </Link>
          </motion.div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`relative text-gray-600 hover:text-blue-700 font-medium transition-colors ${
                  isActive(link.href) ? 'text-blue-700' : ''
                }`}
              >
                {link.name}
                {isActive(link.href) ? (
                  <motion.span
                    layoutId="underline"
                    className="absolute left-0 right-0 bottom-[-5px] h-[2px] bg-blue-700"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                ) : null}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {!isLoading && (
              user ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="w-10 h-10 rounded-full overflow-hidden bg-blue-700 text-white flex items-center justify-center font-semibold hover:bg-blue-800 transition-colors"
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
                      user.name?.[0]?.toUpperCase() || <UserCircleIcon className="w-6 h-6" />
                    )}
                  </button>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
                    >
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
                    </motion.div>
                  )}
                </div>
              ) : (
                <>
                  <motion.a
                    href="/api/auth/login?audience=https://api.theopenshift.com"
                    className="px-4 py-2 text-sm font-medium text-blue-700 hover:text-blue-800 rounded-md transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Log in
                  </motion.a>
                  <motion.a
                    href="/api/auth/login?screen_hint=signup&audience=https://api.theopenshift.com"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-md hover:bg-blue-800 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Sign up
                  </motion.a>
                </>
              )
            )}
          </div>
        </div>
      </motion.nav>

      {/* Mobile Navigation (Fixed Bottom Bar) */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 md:hidden z-50 rounded-t-xl shadow-lg">
        <div className="h-full flex justify-around items-center">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`flex flex-col items-center justify-center p-2 text-xs font-medium transition-colors ${
                isActive(link.href) ? 'text-blue-700' : 'text-gray-500 hover:text-blue-700'
              }`}
            >
              <link.icon className="h-6 w-6 mb-1" />
              {link.name}
            </Link>
          ))}
          {/* Conditional Profile/Login for mobile */}
          {!isLoading && (
            user ? (
              <Link
                href="/profile"
                className={`flex flex-col items-center justify-center p-2 text-xs font-medium transition-colors ${
                  isActive('/profile') ? 'text-blue-700' : 'text-gray-500 hover:text-blue-700'
                }`}
              >
                {user.picture ? (
                  <Image
                    src={user.picture}
                    alt={user.name || 'User'}
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded-full object-cover mb-1"
                  />
                ) : (
                  <UserCircleIcon className="h-6 w-6 mb-1" />
                )}
                Profile
              </Link>
            ) : (
              <a
                href="/api/auth/login"
                className={`flex flex-col items-center justify-center p-2 text-xs font-medium transition-colors ${
                  isActive('/api/auth/login') ? 'text-blue-700' : 'text-gray-500 hover:text-blue-700'
                }`}
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6 mb-1" />
                Login
              </a>
            )
          )}
        </div>
      </div>
    </>
  );
}