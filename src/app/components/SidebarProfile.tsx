import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
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
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: React.ForwardRefExoticComponent<any>;
}

const organizationNav: NavItem[] = [
  { name: 'Dashboard', href: '/profile', icon: HomeIcon },
  { name: 'My Clients', href: '/clients', icon: UsersIcon },
  { name: 'Search Worker', href: '/profile/organization/search-worker', icon: MagnifyingGlassIcon },
  { name: 'Manage Jobs', href: '/profile/organization/manage-job', icon: BriefcaseIcon },
  { name: 'Compliance', href: '/compliance', icon: ClipboardDocumentCheckIcon },
  { name: 'Account', href: '/account', icon: Cog6ToothIcon },
];

// Add this export so the nav can be reused in mobile
export const staffNav: NavItem[] = [
  { name: 'Profile', href: '/profile', icon: HomeIcon },
  { name: 'Jobs', href: '/profile/staff/jobs', icon: BriefcaseIcon },
  { name: 'Inbox', href: '/inbox', icon: InboxIcon },
  { name: 'Billing', href: '/billing', icon: BanknotesIcon },
  {name: 'Compliance', href: '/compliance', icon: ClipboardDocumentCheckIcon },
  { name: 'Account', href: '/account', icon: Cog6ToothIcon },
];

export default function SidebarProfile({ userType }: { userType: 'organization' | 'staff'; user?: { name?: string; picture?: string } | null }) {
  const pathname = usePathname();
  const navigation = userType === 'organization' ? organizationNav : staffNav;

  return (
    <div className="hidden md:fixed md:top-0 md:left-0 md:flex md:w-72 md:flex-col h-screen bg-white border-r border-gray-200 z-40 shadow-sm">
      {/* Logo at the top, centered */}
      <div className="flex flex-col items-center justify-center pt-8 pb-6">
        <Link href="/" className="flex items-center justify-center">
          <Image src="/Logo_TJ.png" alt="Logo" width={80} height={80} className="object-contain" priority />
        </Link>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto pb-6 items-stretch">
        <nav className="flex-1 w-full flex flex-col gap-2 items-stretch">
          {navigation.map((item) => {
            const isActive =
              (item.href === '/profile' && (pathname === '/profile' || pathname === '/profile/staff' || pathname === '/profile/organization'))
                ? true
                : pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center gap-4 px-8 py-3 w-full rounded-l-2xl text-lg font-semibold transition-all ${
                  isActive
                    ? 'bg-[#e6f2f2] text-[#2954bd] shadow rounded-l-2xl'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-[#2954bd]'
                }`}
              >
                <item.icon
                  className={`h-7 w-7 flex-shrink-0 ${
                    isActive ? 'text-[#2954bd]' : 'text-gray-400 group-hover:text-[#2954bd]'
                  }`}
                  aria-hidden="true"
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
        {/* Logout button at the bottom */}
        <div className="mt-auto w-full flex flex-col items-stretch p-4">
          <a
            href="/api/auth/logout"
            className="group flex items-center gap-4 px-8 py-3 w-full rounded-lg text-lg font-semibold text-white bg-[#f07057] hover:bg-[#d95c3c] transition justify-start"
          >
            <ArrowRightOnRectangleIcon className="h-7 w-7 flex-shrink-0 text-white group-hover:text-white" aria-hidden="true" />
            Log out
          </a>
        </div>
      </div>
    </div>
  );
}