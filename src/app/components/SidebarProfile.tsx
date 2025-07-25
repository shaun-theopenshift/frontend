import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, Transition, Variants } from 'framer-motion'; // Added AnimatePresence, Transition, Variants
import { useState } from 'react';
import {
  HomeIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  BriefcaseIcon,
  ClipboardDocumentCheckIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  InboxIcon,
  UserIcon,
  BanknotesIcon,
  ChevronLeftIcon, // Keep ChevronLeftIcon for sidebar toggle
} from '@heroicons/react/24/outline'; // Still using Heroicons here for sidebar

interface NavItem {
  name: string;
  href: string;
  icon: React.ForwardRefExoticComponent<any>;
}

const organizationNav: NavItem[] = [
  { name: 'Dashboard', href: '/profile', icon: HomeIcon },
  { name: 'Search Worker', href: '/profile/organization/search-worker', icon: MagnifyingGlassIcon },
  { name: 'Manage Jobs', href: '/profile/organization/manage-job', icon: BriefcaseIcon },
  { name: 'Inbox', href: '/profile/organization/inbox', icon: InboxIcon },
  { name: 'Account', href: '/account', icon: Cog6ToothIcon },
];

export const staffNav: NavItem[] = [
  { name: 'Profile', href: '/profile', icon: UserIcon }, // Changed icon to UserIcon for 'Profile'
  { name: 'Jobs', href: '/profile/staff/jobs', icon: BriefcaseIcon },
  { name: 'Inbox', href: '/profile/staff/inbox', icon: InboxIcon },
  { name: 'Compliance', href: '/compliance', icon: ClipboardDocumentCheckIcon },
  { name: 'Account', href: '/profile/staff/account', icon: Cog6ToothIcon },
];

// Framer Motion variants for sidebar and text animations
const sidebarVariants: Variants = {
  expanded: { width: '18rem', transition: { duration: 0.3, ease: 'easeInOut' } as Transition },
  collapsed: { width: '5rem', transition: { duration: 0.3, ease: 'easeInOut' } as Transition },
};

const textVariants: Variants = {
  expanded: { opacity: 1, x: 0, transition: { duration: 0.2, delay: 0.1 } as Transition },
  collapsed: { opacity: 0, x: -20, transition: { duration: 0.2 } as Transition },
};

const iconHoverVariants = {
  hover: { scale: 1.1 },
  tap: { scale: 0.95 }
};

export default function SidebarProfile({ userType }: { userType: 'organization' | 'staff'; user?: { name?: string; picture?: string } | null }) {
  const currentPathname = usePathname();
  const pathname = currentPathname || ''; // Fix: Ensure pathname is always a string

  const navigation = userType === 'organization' ? organizationNav : staffNav;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div
        className="hidden md:fixed md:top-0 md:left-0 md:flex md:flex-col h-screen bg-[#1a4154] border-r border-[#1a4154] z-40 shadow-sm relative font-ubuntu rounded-tr-xl rounded-br-xl"
        initial={false}
        animate={isSidebarOpen ? 'expanded' : 'collapsed'}
        variants={sidebarVariants}
      >
        {/* New Logo for collapsed/expanded state if desired, otherwise remove this div entirely */}
        <div className="flex flex-col items-center justify-center pt-8 pb-6">
          <Link href="/" className="flex items-center justify-center">
            <Image
              src="/New_TOS_Logo.png" // Placeholder, replace with actual path to your icon-only logo
              alt="The Open Shift Logo"
              width={isSidebarOpen ? 120 : 40} // Adjust size based on sidebar state
              height={isSidebarOpen ? 120 : 40} // Adjust size based on sidebar state
              className="object-contain transition-all duration-300 ease-in-out"
              priority
            />
          </Link>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto pb-6 items-stretch">
          <nav className="flex-1 w-full flex flex-col gap-2 items-stretch pr-0">
            {navigation.map((item) => {
              // Ensure path comparison handles nested routes correctly for active state
              const isActive = item.href === pathname ||
                               (item.href === '/profile' && (pathname === '/profile' || pathname.startsWith('/profile/staff') || pathname.startsWith('/profile/organization')))
                               && !(item.href === '/profile' && (pathname.startsWith('/profile/staff/jobs') || pathname.startsWith('/compliance') || pathname.startsWith('/inbox') || pathname.startsWith('/billing') || pathname.startsWith('/account')))
                               ? true
                               : pathname.startsWith(item.href) && item.href !== '/profile';

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  passHref
                >
                  <motion.div
                    className={`group flex items-center gap-4 px-4 py-3 w-full text-lg font-semibold transition-all duration-200 ease-in-out cursor-pointer ${
                      isActive
                        ? 'bg-[#3464b4] text-white rounded-tr-2xl rounded-br-2xl shadow-sm'
                        : 'text-blue-100 hover:bg-[#3464b4] hover:text-white'
                    } ${isSidebarOpen ? 'pl-4' : 'justify-center'}`}
                    whileHover={{ backgroundColor: isActive ? '#2563eb' : '#2563eb', scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div variants={iconHoverVariants} whileHover="hover" whileTap="tap">
                      <item.icon
                        className={`h-7 w-7 flex-shrink-0 transition-all duration-200 ease-in-out ${
                          isActive ? 'text-white' : 'text-blue-300 group-hover:text-white'
                        }`}
                        aria-hidden="true"
                      />
                    </motion.div>
                    <AnimatePresence>
                      {isSidebarOpen && (
                        <motion.span
                          variants={textVariants}
                          initial="collapsed"
                          animate="expanded"
                          exit="collapsed"
                          className="origin-left whitespace-nowrap"
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </Link>
              );
            })}
          </nav>
          {/* Logout button at the bottom */}
          <div className="mt-auto w-full flex flex-col items-stretch p-4">
            <a
              href="/api/auth/logout"
              className="group flex items-center gap-4 px-4 py-3 w-full rounded-lg text-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition-all duration-200 ease-in-out justify-start"
            >
              <motion.div variants={iconHoverVariants} whileHover="hover" whileTap="tap">
                <ArrowRightOnRectangleIcon className="h-7 w-7 flex-shrink-0 text-white" aria-hidden="true" />
              </motion.div>
              <AnimatePresence>
                {isSidebarOpen && (
                  <motion.span
                    variants={textVariants}
                    initial="collapsed"
                    animate="expanded"
                    exit="collapsed"
                    className="origin-left whitespace-nowrap"
                  >
                    Log out
                  </motion.span>
                )}
              </AnimatePresence>
            </a>
          </div>
        </div>

        {/* Arrow Button to Toggle Sidebar */}
        <button
          onClick={toggleSidebar}
          className="absolute top-1/2 -right-4 bg-gray-200 p-1.5 rounded-full shadow-md z-50 transform -translate-y-1/2 focus:outline-none focus:ring-2 focus:ring-[#2954bd] focus:ring-opacity-50"
          aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <motion.div
            animate={{ rotate: isSidebarOpen ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-700" />
          </motion.div>
        </button>
      </motion.div>

      {/* Mobile Bottom Navigation Bar */}
      <div
        className="fixed inset-x-0 bottom-0 md:hidden bg-[#1a4154] border-t border-[#dbe9fe] z-40 shadow-lg font-ubuntu rounded-tr-lg rounded-tl-lg"
      >
        <nav className="flex justify-around py-2">
          {navigation.map((item) => {
            const isActive =
              (item.href === '/profile' && (pathname === '/profile' || pathname.startsWith('/profile/staff') || pathname.startsWith('/profile/organization')))
                ? true
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                passHref
              >
                <motion.div
                  className={`flex flex-col items-center justify-center p-2 text-sm font-medium cursor-pointer ${
                    isActive ? 'text-white' : 'text-blue-100' // Changed text color for active/inactive
                  }`}
                  whileHover={{ y: -3, color: '#FFFFFF' }} // White text on hover for contrast
                  whileTap={{ scale: 0.95 }}
                >
                  <item.icon
                    className={`h-6 w-6 flex-shrink-0 transition-all duration-200 ease-in-out ${
                      isActive ? 'text-white' : 'text-blue-300' // Changed icon color for active/inactive
                    }`}
                    aria-hidden="true"
                  />
                  <span className="mt-1">{item.name}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}