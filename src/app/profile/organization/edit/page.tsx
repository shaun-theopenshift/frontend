"use client";

import { useState, useEffect } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import SidebarProfile from "../../../components/SidebarProfile";
import TopNav from "../../../components/TopNav";
import LoadingScreen from "../../../components/LoadingScreen";
import Link from "next/link";
import {
  HomeIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  BriefcaseIcon,
  ClipboardDocumentCheckIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";
import { AU_STATES_SUBURBS, AU_STATE_LABELS } from '@/data/au-states-suburbs';

export default function OrganizationEditProfile() {
  const { user, error: authError, isLoading: authLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [orgData, setOrgData] = useState({
    name: "",
    abn: "",
    address: "",
    suburb: "",
    phone: "",
    website: "",
    description: "",
    logo: "",
    services: [],
    certifications: [],
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedState, setSelectedState] = useState('');
  const [selectedSuburb, setSelectedSuburb] = useState('');

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
          setOrgData({
            name: data.name || "",
            abn: data.abn || "",
            address: data.address || "",
            suburb: data.suburb || "",
            phone: data.phone || "",
            website: data.website || "",
            description: data.description || "",
            logo: data.logo || "",
            services: data.services || [],
            certifications: data.certifications || [],
          });
          setSelectedState(data.address || '');
          setSelectedSuburb(data.suburb || '');
        })
        .catch((e) => {
          setError("Error loading organization profile");
        })
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setOrgData((prev) => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (field: keyof typeof orgData, value: string) => {
    setOrgData((prev) => ({ ...prev, [field]: value.split(",").map((s: string) => s.trim()).filter(Boolean) }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      if (!session?.accessToken) throw new Error("No access token");
      const res = await fetch("https://api.theopenshift.com/v1/orgs/org", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(orgData),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      setSuccess("Profile updated successfully");
      setTimeout(() => router.push("/profile/organization"), 1200);
    } catch (e) {
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) return <LoadingScreen />;

  // Compose sidebar user for organization
  const sidebarUser = orgData ? { name: orgData.name } : null;

  return (
    <div className="min-h-screen bg-white">
      <TopNav onMobileMenu={() => setMobileMenuOpen(true)} />
      <SidebarProfile userType="organization" user={sidebarUser} />
      <div className="md:pl-72 pt-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold mb-6 text-[#2954bd]">Edit Organization Profile</h1>
          <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
            <div>
              <label className="block text-xl font-medium text-gray-700">Organization Name</label>
              <input
                type="text"
                name="name"
                value={orgData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#2954bd] focus:ring-[#2954bd] text-gray-500 placeholder:text-gray-400"
                required
              />
            </div>
            <div>
              <label className="block text-xl font-medium text-gray-700">ABN</label>
              <input
                type="text"
                name="abn"
                value={orgData.abn}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#2954bd] focus:ring-[#2954bd] text-gray-500 placeholder:text-gray-400"
                required
              />
            </div>
            <div>
              <label className="block text-xl font-medium text-gray-700">State</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#2954bd] focus:ring-[#2954bd] text-gray-500 placeholder:text-gray-400"
                value={selectedState}
                onChange={e => {
                  setSelectedState(e.target.value);
                  setSelectedSuburb('');
                  setOrgData(prev => ({ ...prev, address: '' }));
                }}
              >
                <option value="">Select state</option>
                {Object.entries(AU_STATE_LABELS).map(([code, label]) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>
            </div>
            {selectedState && (
              <>
                <label className="block text-xl font-medium text-gray-700 mt-4">Suburb</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#2954bd] focus:ring-[#2954bd] text-gray-500 placeholder:text-gray-400"
                  value={selectedSuburb}
                  onChange={e => {
                    setSelectedSuburb(e.target.value);
                    setOrgData(prev => ({ ...prev, address: e.target.value }));
                  }}
                >
                  <option value="">Select suburb</option>
                  {(AU_STATES_SUBURBS[selectedState as keyof typeof AU_STATES_SUBURBS] || []).map((suburb: string) => (
                    <option key={suburb} value={suburb}>{suburb}</option>
                  ))}
                </select>
              </>
            )}
            <div>
              <label className="block text-xl font-medium text-gray-700">Phone</label>
              <input
                type="text"
                name="phone"
                value={orgData.phone}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#2954bd] focus:ring-[#2954bd] text-gray-500 placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-xl font-medium text-gray-700">Website</label>
              <input
                type="text"
                name="website"
                value={orgData.website}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#2954bd] focus:ring-[#2954bd] text-gray-500 placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-xl font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={orgData.description}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#2954bd] focus:ring-[#2954bd] text-gray-500 placeholder:text-gray-400"
              />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            {success && <div className="text-green-600 text-sm">{success}</div>}
            <div className="flex items-center gap-4">
              <button
                type="submit"
                className="bg-[#2954bd] text-white px-6 py-2 rounded-md hover:bg-[#183a7a] disabled:opacity-60"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <Link
                href="/profile/organization"
                className="text-gray-500 hover:underline"
              >
                Cancel
              </Link>
            </div>
          </form>
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
