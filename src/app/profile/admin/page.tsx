"use client";
import React, { useState, useEffect } from "react";
import LoadingScreen from '../../components/LoadingScreen';
import { UserGroupIcon, BuildingOfficeIcon, ChartBarIcon, Cog6ToothIcon, UsersIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const SIDEBAR_TABS = [
  { label: "Dashboard", icon: ChartBarIcon },
  { label: "Staff Management", icon: UserGroupIcon },
  { label: "Organization Management", icon: BuildingOfficeIcon },
  { label: "Analytics", icon: ChartBarIcon },
  { label: "Settings", icon: Cog6ToothIcon },
];

// Base URL is same ---
const API_BASE_URL = "https://api.theopenshift.com";

async function apiRequest<T>(endpoint: string, method: "GET" | "POST" | "PATCH" = "GET", body?: any): Promise<T> {
  try {
    const session = await fetch("/api/auth/session").then((res) => res.json());
    if (!session?.accessToken) throw new Error("No access token available");
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${session.accessToken}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  } catch (error) {
    throw error;
  }
}
// --- END API utility ---

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [loading, setLoading] = useState(true); // Start loading by default
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalStaff: null as number | null,
    totalOrgs: null as number | null,
    activeUsers: null as number | null,
  });
  const [users, setUsers] = useState<any[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const [activeInactiveData, setActiveInactiveData] = useState<any[]>([]);
  // Staff edit modal state
  const [editStaff, setEditStaff] = useState<any | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  // 1. Add state for Auth0 user data and loading
  const [auth0User, setAuth0User] = useState<any | null>(null);
  const [auth0Loading, setAuth0Loading] = useState(false);
  const [auth0Error, setAuth0Error] = useState<string | null>(null);

  // Helper to open modal and reset messages
  async function handleOpenEditStaff(staff: any) {
    setEditError(null);
    setEditSuccess(null);
    setEditStaff(staff);
    setAuth0User(null);
    setAuth0Loading(true);
    setAuth0Error(null);
    try {
      const data = await apiRequest(`/v1/admin/auth0_user?user_id=${encodeURIComponent(staff.user_id)}`);
      setAuth0User(data);
    } catch (e: any) {
      setAuth0Error(e.message || 'Failed to fetch Auth0 user');
    } finally {
      setAuth0Loading(false);
    }
  }

  async function fetchStats() {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, orgs] = await Promise.all([
        apiRequest<any>("/v1/admin/all_users"),
        apiRequest<any>("/v1/admin/all_orgs"),
      ]);
      const userArr = Array.isArray(usersRes) ? usersRes : usersRes?.users ?? [];
      setUsers(userArr);
      setStats({
        totalStaff: userArr.length,
        totalOrgs: Array.isArray(orgs) ? orgs.length : orgs?.orgs?.length ?? null,
        activeUsers: userArr.length, // fallback
      });
      // --- User Growth Data ---
      const growthMap: Record<string, number> = {};
      userArr.forEach((u: any) => {
        if (u.createdAt) {
          const date = new Date(u.createdAt);
          // Group by month (YYYY-MM)
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          growthMap[key] = (growthMap[key] || 0) + 1;
        }
      });
      // Sort by date
      const growthData = Object.entries(growthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({ month, count }));
      setUserGrowthData(growthData);
      // --- Active/Inactive Data ---
      const now = new Date();
      let active = 0, inactive = 0;
      userArr.forEach((u: any) => {
        if (u.lastLogin) {
          const last = new Date(u.lastLogin);
          const days = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
          if (days <= 30) active++; else inactive++;
        } else {
          inactive++;
        }
      });
      setActiveInactiveData([
        { name: 'Active (30d)', value: active },
        { name: 'Inactive', value: inactive },
      ]);
    } catch (err: any) {
      setError(err.message || "Failed to fetch admin stats");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  // Edit staff handler
  async function handleEditStaffSave(updated: any) {
    setEditLoading(true);
    setEditError(null);
    setEditSuccess(null);
    try {
      await apiRequest(`/v1/admin/user`, "PATCH", updated);
      setEditSuccess("Staf details updated successfully.");
      // Refetch all users from backend for latest data
      await fetchStats();
      setTimeout(() => setEditStaff(null), 1000);
    } catch (err: any) {
      setEditError(err.message || "Failed to update staff");
    } finally {
      setEditLoading(false);
    }
  }

  if (loading) return <LoadingScreen message="Loading admin dashboard..." />;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen flex bg-[#f6f8fa]">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col py-6 px-4 min-h-screen relative border-r border-gray-200">
        <div className="text-2xl font-bold text-[#2954bd] mb-8">Admin Panel</div>
        <nav className="flex flex-col gap-2">
          {SIDEBAR_TABS.map(tab => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label)}
              className={`flex items-center gap-3 px-4 py-3 rounded-md text-lg font-bold transition-colors text-left w-full border-l-4 ${activeTab === tab.label ? 'bg-black text-white border-black' : 'text-black bg-white border-white hover:bg-gray-100 hover:border-black'}`}
            >
              <tab.icon className="w-6 h-6" />
              <span className="text-left">{tab.label}</span>
            </button>
          ))}
        </nav>
        {/* Logout button at the bottom */}
        <div className="absolute bottom-0 left-0 w-full p-4 border-t bg-white">
          <a
            href="/api/auth/logout"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 transition text-base"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            Logout
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Top: Summary Cards */}
        {activeTab === "Dashboard" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
              <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center border border-gray-200">
                <UserGroupIcon className="w-8 h-8 text-black mb-2" />
                <div className="text-2xl font-bold text-black">{stats.totalStaff ?? '--'}</div>
                <div className="text-gray-700">Total Staff</div>
              </div>
              <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center border border-gray-200">
                <BuildingOfficeIcon className="w-8 h-8 text-black mb-2" />
                <div className="text-2xl font-bold text-black">{stats.totalOrgs ?? '--'}</div>
                <div className="text-gray-700">Total Organizations</div>
              </div>
              <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center border border-gray-200">
                <ChartBarIcon className="w-8 h-8 text-black mb-2" />
                <div className="text-2xl font-bold text-black">{stats.activeUsers ?? '--'}</div>
                <div className="text-gray-700">Active Users</div>
              </div>
              <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center border border-gray-200">
                <UsersIcon className="w-8 h-8 text-black mb-2" />
                <div className="text-2xl font-bold text-black">{stats.totalStaff ?? '--'}</div>
                <div className="text-gray-700">Users</div>
              </div>
            </div>
            {/* Charts/Graphs */}
            <div className="bg-white rounded-xl shadow p-8 mb-10 min-h-[250px] grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* User Growth Line Chart */}
              <div className="flex flex-col items-center w-full">
                <div className="font-semibold text-brand-dark mb-2">User Growth Over Time</div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={userGrowthData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#67b5b5" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {/* Active vs Inactive Pie Chart */}
              <div className="flex flex-col items-center w-full">
                <div className="font-semibold text-brand-dark mb-2">Active vs Inactive Users</div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={activeInactiveData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      fill="#67b5b5"
                      label
                    >
                      {activeInactiveData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={idx === 0 ? '#67b5b5' : '#e6f2f2'} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
        {activeTab === "Staff Management" && (
          <div className="bg-white rounded-xl shadow p-8 min-h-[400px]">
            <div className="text-2xl font-bold text-black mb-4 flex items-center gap-2">
              <UserGroupIcon className="w-7 h-7 text-black" /> Staff Management
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider">First Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider">Last Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider">Skills</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider">F2W Certified</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {users.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">No staff found.</td></tr>
                  )}
                  {users.map((user: any) => [
                    <tr key={user.user_id} className="hover:bg-gray-100 transition">
                      <td className="px-4 py-3 whitespace-nowrap text-black">{user.fname}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-black">{user.lname}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-black">{user.phone}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-black">{Array.isArray(user.skills) ? user.skills.join(', ') : ''}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-black">{user.f2w_certified ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          className="inline-flex items-center px-3 py-1.5 rounded-md border border-black bg-white text-black font-bold text-sm shadow-sm transition"
                          onClick={() => handleOpenEditStaff(user)}
                        >Edit/View More</button>
                      </td>
                    </tr>,
                    editStaff && editStaff.user_id === user.user_id && (
                      <tr key={user.user_id + '-expanded'} className="bg-white border-t border-b border-black">
                        <td colSpan={6} className="p-6">
                  <form
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    onSubmit={e => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const formData = new FormData(form);
                      const updated: any = {};
                      formData.forEach((value, key) => {
                        if (key === 'skills') {
                          updated.skills = String(value).split(',').map((s: string) => s.trim()).filter(Boolean);
                        } else if (key === 'f2w_certified') {
                          updated.f2w_certified = value === 'on';
                        } else {
                          updated[key] = value;
                        }
                      });
                      updated.user_id = editStaff.user_id;
                      handleEditStaffSave({ ...editStaff, ...updated });
                    }}
                  >
                    <div>
                      <label className="block text-sm font-medium text-black">First Name</label>
                      <input name="fname" defaultValue={editStaff.fname} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-black focus:border-black text-black" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black">Last Name</label>
                      <input name="lname" defaultValue={editStaff.lname} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-black focus:border-black text-black" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black">Address</label>
                      <input name="address" defaultValue={editStaff.address} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-black focus:border-black text-black" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black">DOB</label>
                      <input name="dob" type="date" defaultValue={editStaff.dob} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-black focus:border-black text-black" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black">Gender</label>
                      <input name="gender" defaultValue={editStaff.gender} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-black focus:border-black text-black" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black">Phone</label>
                      <input name="phone" defaultValue={editStaff.phone} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-black focus:border-black text-black" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black">Bio</label>
                      <textarea name="bio" defaultValue={editStaff.bio} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-black focus:border-black text-black" rows={2} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black">Emergency Contact</label>
                      <input name="emergency_contact" defaultValue={editStaff.emergency_contact} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-black focus:border-black text-black" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black">Emergency Contact Phone</label>
                      <input name="emergency_contact_phone" defaultValue={editStaff.emergency_contact_phone} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-black focus:border-black text-black" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black">Skills (comma separated)</label>
                      <input name="skills" defaultValue={Array.isArray(editStaff.skills) ? editStaff.skills.join(', ') : ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-black focus:border-black text-black" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black">TFN</label>
                      <input name="tfn" defaultValue={editStaff.tfn} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-black focus:border-black text-black" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black">User ID</label>
                      <input name="user_id" defaultValue={editStaff.user_id} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-black focus:border-black text-black" readOnly />
                    </div>
                    <div className="flex items-center mt-6">
                      <input name="f2w_certified" type="checkbox" defaultChecked={!!editStaff.f2w_certified} className="h-4 w-4 text-black border-gray-300 rounded focus:ring-black" />
                      <label className="ml-2 block text-sm font-medium text-black">F2W Certified</label>
                    </div>
                    {editError && <div className="text-red-600 text-sm col-span-2">{editError}</div>}
                    {editSuccess && <div className="text-green-600 text-sm col-span-2">{editSuccess}</div>}
                    <div className="flex gap-2 mt-4 col-span-2">
                      <button
                        type="submit"
                                className="py-2 px-4 rounded border border-black bg-white text-black font-bold mr-2"
                        disabled={editLoading}
                      >{editLoading ? 'Saving...' : 'Save'}</button>
                      <button
                        type="button"
                                className="py-2 px-4 rounded border border-black bg-white text-black font-bold"
                        onClick={() => setEditStaff(null)}
                        disabled={editLoading}
                      >Cancel</button>
                    </div>
                  </form>
                          {/* Auth0 Management Section */}
                          <div className="mt-8 border-t pt-6">
                            <div className="text-lg font-bold text-black mb-2">Auth0 Management</div>
                            <div className="flex flex-wrap gap-4 mb-4">
                              {/* Verify Email Button */}
                              {!editStaff.email_verified && (
                                <button className="px-4 py-2 rounded bg-[#2954bd] text-white font-semibold hover:bg-[#1d3e8a] transition" onClick={() => {/* TODO: call verify email API */}}>Verify Email</button>
                              )}
                              {/* Send Verification Email Button */}
                              <button className="px-4 py-2 rounded bg-[#e6f2f2] text-[#2954bd] font-semibold hover:bg-[#2954bd] hover:text-white transition" onClick={() => {/* TODO: call send verification email API */}}>Send Verification Email</button>
                              {/* Change Role Dropdown */}
                              <form className="flex items-center gap-2" onSubmit={e => {e.preventDefault(); /* TODO: call change role API */}}>
                                <label className="font-medium text-black">Role:</label>
                                <select className="border rounded px-2 py-1 text-black" defaultValue={editStaff.role}>
                                  <option value="staff">Staff</option>
                                  <option value="organization">Organization</option>
                                  <option value="admin">Admin</option>
                                </select>
                                <button type="submit" className="px-3 py-1 rounded bg-[#2954bd] text-white font-semibold hover:bg-[#1d3e8a] transition">Change</button>
                              </form>
                            </div>
                            {/* Raw Auth0 JSON Viewer */}
                            <details className="bg-gray-50 rounded p-4 mt-4">
                              <summary className="cursor-pointer font-semibold text-[#2954bd] mb-2">View Raw Auth0 JSON</summary>
                              <pre className="overflow-x-auto text-xs text-black bg-gray-100 rounded p-2 mt-2 max-h-64">{JSON.stringify(editStaff, null, 2)}</pre>
                            </details>
                          </div>
                          {/* 3. In the expanded row, show Auth0 user UI if loaded */}
                          {auth0Loading ? (
                            <div className="text-black">Loading Auth0 user...</div>
                          ) : auth0Error ? (
                            <div className="text-red-600">{auth0Error}</div>
                          ) : auth0User ? (
                            <div className="max-w-3xl mx-auto bg-white border border-black rounded-lg p-6">
                              <div className="flex items-center gap-4 mb-6">
                                <img
                                  src={auth0User.picture}
                                  alt={auth0User.name}
                                  className="w-16 h-16 rounded-full border border-gray-300"
                                />
                                <div>
                                  <div className="text-xl font-bold text-black">{auth0User.name}</div>
                                  <div className="text-black">{auth0User.email}</div>
                                  <div className={`text-sm font-semibold ${auth0User.email_verified ? 'text-green-700' : 'text-red-700'}`}>{auth0User.email_verified ? 'Email Verified' : 'Email Not Verified'}</div>
                </div>
              </div>
                              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-black">
                                <div><dt className="font-semibold">User ID</dt><dd className="break-all">{auth0User.user_id}</dd></div>
                                <div><dt className="font-semibold">Nickname</dt><dd>{auth0User.nickname}</dd></div>
                                <div><dt className="font-semibold">Created At</dt><dd>{new Date(auth0User.created_at).toLocaleString()}</dd></div>
                                <div><dt className="font-semibold">Updated At</dt><dd>{new Date(auth0User.updated_at).toLocaleString()}</dd></div>
                                <div><dt className="font-semibold">Last Login</dt><dd>{new Date(auth0User.last_login).toLocaleString()}</dd></div>
                                <div><dt className="font-semibold">Last IP</dt><dd>{auth0User.last_ip}</dd></div>
                                <div><dt className="font-semibold">Logins Count</dt><dd>{auth0User.logins_count}</dd></div>
                              </dl>
                              {/* Identities */}
                              <details className="mt-4">
                                <summary className="font-semibold cursor-pointer">Identities</summary>
                                <ul className="pl-4 mt-2 text-black text-sm">
                                  {auth0User.identities?.map((id: any, idx: number) => (
                                    <li key={idx} className="mb-2 border-b border-gray-200 pb-2">
                                      <div><span className="font-semibold">Provider:</span> {id.provider}</div>
                                      <div><span className="font-semibold">Connection:</span> {id.connection}</div>
                                      <div><span className="font-semibold">User ID:</span> {id.user_id}</div>
                                      <div><span className="font-semibold">Is Social:</span> {id.isSocial ? 'Yes' : 'No'}</div>
                                    </li>
                                  ))}
                                </ul>
                              </details>
                              {/* Passkeys */}
                              {auth0User.passkeys && auth0User.passkeys.length > 0 && (
                                <details className="mt-4">
                                  <summary className="font-semibold cursor-pointer">Passkeys</summary>
                                  <ul className="pl-4 mt-2 text-black text-sm">
                                    {auth0User.passkeys.map((pk: any, idx: number) => (
                                      <li key={idx} className="mb-2 border-b border-gray-200 pb-2">
                                        <div><span className="font-semibold">ID:</span> {pk.id}</div>
                                        <div><span className="font-semibold">Type:</span> {pk.type}</div>
                                        <div><span className="font-semibold">Confirmed:</span> {pk.confirmed ? 'Yes' : 'No'}</div>
                                        <div><span className="font-semibold">Key ID:</span> {pk.key_id}</div>
                                        <div><span className="font-semibold">Credential Device Type:</span> {pk.credential_device_type}</div>
                                        <div><span className="font-semibold">Credential Backed Up:</span> {pk.credential_backed_up ? 'Yes' : 'No'}</div>
                                        <div><span className="font-semibold">User Agent:</span> {pk.user_agent}</div>
                                        <div><span className="font-semibold">Created At:</span> {new Date(pk.created_at).toLocaleString()}</div>
                                        <div><span className="font-semibold">Last Auth At:</span> {new Date(pk.last_auth_at).toLocaleString()}</div>
                                        {/* public_key intentionally omitted */}
                                      </li>
                                    ))}
                                  </ul>
                                </details>
                              )}
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    )
                  ])}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === "Organization Management" && (
          <div className="bg-white rounded-xl shadow p-8 min-h-[400px]">
            <div className="text-2xl font-bold text-brand-dark mb-4">Organization Management</div>
            <div className="text-gray-500 mb-4">[Organization table, filters, and actions will go here]</div>
            {/* Placeholder for org table */}
            <div className="border-2 border-dashed border-brand-dark rounded-lg p-8 text-center text-gray-400">Organization table placeholder</div>
          </div>
        )}
        {activeTab === "Analytics" && (
          <div className="bg-white rounded-xl shadow p-8 min-h-[400px] flex items-center justify-center text-gray-400 text-lg">[Analytics content coming soon]</div>
        )}
        {activeTab === "Settings" && (
          <div className="bg-white rounded-xl shadow p-8 min-h-[400px] flex items-center justify-center text-gray-400 text-lg">[Settings content coming soon]</div>
        )}
      </main>
    </div>
  );
} 