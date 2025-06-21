"use client";

import { useState, useEffect } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  PencilIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  BriefcaseIcon,
  ClipboardDocumentCheckIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import LoadingScreen from "../../components/LoadingScreen";
import SidebarProfile from "../../components/SidebarProfile";
import TopNav from "../../components/TopNav";
import { usePathname } from "next/navigation";

interface OrganizationProfile {
  name: string;
  abn: string;
  address: string;
  phone: string;
  website: string;
  description: string;
  logo?: string;
  services?: string[];
  certifications?: string[];
}

export default function OrganizationProfile() {
  const { user, error: authError, isLoading: authLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [orgData, setOrgData] = useState<OrganizationProfile | null>(null);
  const [abnStatus, setAbnStatus] = useState<"active" | "inactive" | null>(
    null
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/api/auth/login");
      return;
    }

    if (user) {
      fetch("/api/auth/session")
        .then((res) => res.json())
        .then((session) => {
          if (!session?.accessToken) throw new Error("No access token");
          return fetch("https://api.theopenshift.com/v1/orgs/me", {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
              Accept: "application/json",
            },
          });
        })
        .then((res) => res.json())
        .then((data) => {
          setOrgData(data);
          // ABN status check
          console.log("ABN status from API:", data.abn_status);
          if (typeof data.abn_status === "string") {
            setAbnStatus(data.abn_status === "active" ? "active" : "inactive");
          } else if (typeof data.abn_status?.is_active === "boolean") {
            setAbnStatus(data.abn_status.is_active ? "active" : "inactive");
          } else {
            setAbnStatus(null);
          }
        })
        .catch((e) => {
          console.error("Error fetching profile:", e);
        })
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  if (!orgData) {
    return <div>Error loading organization profile</div>;
  }

  // Compose sidebar user for organization
  const sidebarUser = orgData ? { name: orgData.name } : null;

  return (
    <div className="min-h-screen bg-white">
      <TopNav onMobileMenu={() => setMobileMenuOpen(true)} />
      <SidebarProfile userType="organization" user={sidebarUser} />
      <div className="md:pl-72 pt-16"> {/* pt-16 for TopNav height, pl-72 for wider sidebar */}
        {/* Mobile menu button is now in TopNav */}
        {/* Approval Banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-rose-50 p-4 rounded-lg mt-4">
            <p className="text-rose-700 text-sm">
              Your profile isn't visible to Care Workers until your account is
              approved
            </p>
          </div>

          {/* Profile Header Card */}
          <div className="bg-[#2954bd] text-white rounded-lg p-6 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {orgData.name?.[0]?.toUpperCase() || "O"}
                </div>
                <div>
                  <h1 className="text-2xl font-semibold">{orgData.name}</h1>
                  <p className="text-white/80">Organization</p>
                </div>
              </div>
              <Link
                href="/profile/organization/edit"
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-md flex items-center space-x-2"
              >
                <PencilIcon className="h-4 w-4" />
                <span>Edit Profile</span>
              </Link>
            </div>
          </div>

          {/* Main Content Sections */}
          <div className="py-8">
            {/* About Section 
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-black">
                  About Organization
                </h2>
                <Link
                  href="/profile/organization/edit"
                  className="text-[#2954bd] text-sm hover:underline"
                >
                  Edit
                </Link>
              </div>
              <p className="text-gray-600">
                {orgData.description || "No description provided"}
              </p>
            </section>
            */}

            {/* Email Section */}

            {/* Business Details */}
            <section>
              <div className="flex items-center justify-between mb-1 mt-6">
                <h2 className="text-xl font-semibold text-black">
                  Business Details
                </h2>
                <div className="flex items-center gap-1">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      abnStatus === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    ABN {abnStatus === "active" ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-gray-500 text-sm mb-1 font-semibold">ABN</p>
                  <p className="text-gray-900">{orgData.abn}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1 font-semibold">Phone</p>
                  <p className="text-gray-900">{orgData.phone}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1 font-semibold">Address</p>
                  <p className="text-gray-900">{orgData.address}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1 font-semibold">Website</p>
                  <p className="text-gray-900">
                    {orgData.website || "Not provided"}
                  </p>
                </div>
              </div>
            </section>

            {/* Services 
            <section>
              <div className="flex items-center justify-between mb-4 mt-6">
                <h2 className="text-xl font-semibold text-black">Services</h2>
                <Link
                  href="/profile/organization/edit"
                  className="text-[#2954bd] text-sm hover:underline"
                >
                  Edit
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {orgData.services?.length ? (
                  orgData.services.map((service, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-[#e6f2f2] text-[#2954bd] rounded-full text-sm"
                    >
                      {service}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">No services listed</p>
                )}
              </div>
            </section>
            */}
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <div className={`${mobileMenuOpen ? "block" : "hidden"} md:hidden`}>
        <div
          className="fixed inset-0 z-50 bg-white/80"
          onClick={() => setMobileMenuOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10 pt-16">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="-m-1.5 p-1.5">
              <span className="text-2xl font-semibold text-[#2954bd]">
                TheOpenShift
              </span>
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Close menu</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          {/* SidebarProfile nav items for mobile */}
          <nav className="mt-6 space-y-1">
            {[
              { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
              { name: "My Clients", href: "/clients", icon: UsersIcon },
              { name: "Search Worker", href: "/search", icon: MagnifyingGlassIcon },
              { name: "Manage Jobs", href: "/jobs", icon: BriefcaseIcon },
              { name: "Compliance", href: "/compliance", icon: ClipboardDocumentCheckIcon },
              { name: "Account", href: "/account", icon: Cog6ToothIcon },
            ].map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-base font-medium rounded-md ${
                    isActive
                      ? "bg-[#e6f2f2] text-[#2954bd]"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon
                    className={`mr-4 h-6 w-6 flex-shrink-0 ${
                      isActive
                        ? "text-[#2954bd]"
                        : "text-gray-400 group-hover:text-gray-500"
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
            {/* Logout button for mobile */}
            <a
              href="/api/auth/logout"
              className="group flex items-center px-3 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-red-600 mt-4"
            >
              <ArrowRightOnRectangleIcon className="mr-4 h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-red-600" aria-hidden="true" />
              Log out
            </a>
          </nav>
        </div>
      </div>
    </div>
  );
}
