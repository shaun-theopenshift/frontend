"use client";

import { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';
import {
  HomeIcon,
  UserGroupIcon,
  CalendarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import TopNav from '@/app/components/TopNav';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import LoadingScreen from '../../../components/LoadingScreen';

const SIDEBAR_ITEMS = [
  { label: "Dashboard", icon: <HomeIcon className="w-5 h-5" />, href: "/profile/organization" },
  { label: "Staff", icon: <UserGroupIcon className="w-5 h-5" />, href: "/profile/organization/staff" },
  { label: "Shifts", icon: <CalendarIcon className="w-5 h-5" />, href: "/profile/organization/shifts" },
  { label: "Documents", icon: <DocumentTextIcon className="w-5 h-5" />, href: "/profile/organization/documents" },
  { label: "Analytics", icon: <ChartBarIcon className="w-5 h-5" />, href: "/profile/organization/analytics" },
  { label: "Settings", icon: <Cog6ToothIcon className="w-5 h-5" />, href: "/profile/organization/settings" },
];

// Mock staff data
const mockStaff = [
  { id: 1, name: 'Sarah Johnson', role: 'Registered Nurse', rating: 4.8, profilePic: '', availableDays: ['Monday', 'Tuesday'] },
  { id: 2, name: 'Michael Smith', role: 'Senior Caregiver', rating: 4.7, profilePic: '', availableDays: ['Monday', 'Wednesday'] },
  { id: 3, name: 'Daniel Lee', role: 'Care Assistant', rating: 4.5, profilePic: '', availableDays: ['Monday', 'Thursday'] },
];

export default function OrganizationShiftsPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Shift form state
  const [jobDescription, setJobDescription] = useState('');
  const [shiftDay, setShiftDay] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [comments, setComments] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Staff search/selection state
  const [staffSearch, setStaffSearch] = useState('');
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedStaff, setSelectedStaff] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Filter staff by search and day
  const filteredStaff = mockStaff.filter(
    s =>
      s.availableDays.includes(selectedDay) &&
      (s.name.toLowerCase().includes(staffSearch.toLowerCase()) || s.role.toLowerCase().includes(staffSearch.toLowerCase()))
  );

  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedStaff([]);
      setSelectAll(false);
    } else {
      setSelectedStaff(filteredStaff.map(s => s.id));
      setSelectAll(true);
    }
  };

  // Handle individual staff select
  const handleStaffSelect = (id: number) => {
    if (selectedStaff.includes(id)) {
      setSelectedStaff(selectedStaff.filter(sid => sid !== id));
      setSelectAll(false);
    } else {
      setSelectedStaff([...selectedStaff, id]);
      if (selectedStaff.length + 1 === filteredStaff.length) setSelectAll(true);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:static lg:block`}>
          <div className="h-16 flex items-center justify-center border-b">
            <div className="text-2xl font-bold text-black">TheOpenShift</div>
          </div>
          <nav className="mt-5 px-2">
            {SIDEBAR_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-black hover:bg-gray-50 hover:text-black"
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </a>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          <TopNav onMobileMenu={() => setMobileSidebarOpen(true)} />
          <main className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full">
            <h1 className="text-2xl font-bold mb-6">Staff Shift Management</h1>

            {/* Shift Creation Form */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-black text-lg font-semibold mb-4">Create a Shift</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-medium text-black">Job Description</label>
                  <textarea className="border rounded p-2 text-black placeholder-black" rows={3} value={jobDescription} onChange={e => setJobDescription(e.target.value)} placeholder="Describe the job..." />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-medium text-black">Select Day</label>
                  <Calendar
                    value={shiftDay ? new Date(shiftDay) : null}
                    onChange={(value) => {
                      if (value instanceof Date) {
                        const local = new Date(value.getTime() - value.getTimezoneOffset() * 60000)
                          .toISOString().split('T')[0];
                        setShiftDay(local);
                      }
                    }}
                    className="border rounded p-2"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-medium text-black">Start Time</label>
                  <select
                    className="border rounded p-2 text-black"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                  >
                    {Array.from({ length: 48 }, (_, i) => {
                      const hour = Math.floor(i / 2).toString().padStart(2, '0');
                      const min = i % 2 === 0 ? '00' : '30';
                      const val = `${hour}:${min}`;
                      return (
                        <option key={val} value={val}>{val}</option>
                      );
                    })}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-medium text-black">End Time</label>
                  <select
                    className="border rounded p-2 text-black"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                  >
                    {Array.from({ length: 48 }, (_, i) => {
                      const hour = Math.floor(i / 2).toString().padStart(2, '0');
                      const min = i % 2 === 0 ? '00' : '30';
                      const val = `${hour}:${min}`;
                      return (
                        <option key={val} value={val}>{val}</option>
                      );
                    })}
                  </select>
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="font-medium text-black">Additional Comments</label>
                  <textarea className="border rounded p-2 text-black placeholder-black" rows={2} value={comments} onChange={e => setComments(e.target.value)} placeholder="Any additional comments..." />
                </div>
              </div>
              <button
                className="mt-4 px-6 py-2 bg-brand-dark text-white rounded hover:bg-brand-accent font-semibold"
                onClick={() => setShowPreview(true)}
              >
                Review Job Listing
              </button>
            </div>

            {/* Job Listing Preview */}
            {showPreview && (
              <div className="bg-gradient-to-br from-brand-bgLight to-brand-mint rounded-xl shadow-lg p-8 mb-8 border border-brand-dark">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-brand-dark">
                  <DocumentTextIcon className="w-7 h-7" /> Job Listing Preview
                </h2>
                <div className="flex flex-col gap-4 text-black">
                  <div className="flex items-center gap-3">
                    <ChatBubbleLeftRightIcon className="w-6 h-6 text-brand-dark" />
                    <span className="font-semibold">Description:</span>
                    <span>{jobDescription || <span className="italic text-gray-400">No description</span>}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CalendarDaysIcon className="w-6 h-6 text-brand-dark" />
                    <span className="font-semibold">Day:</span>
                    <span>{shiftDay || <span className="italic text-gray-400">No date</span>}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ClockIcon className="w-6 h-6 text-brand-dark" />
                    <span className="font-semibold">Time:</span>
                    <span>{startTime && endTime ? `${startTime} - ${endTime}` : <span className="italic text-gray-400">No time</span>}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ChatBubbleLeftRightIcon className="w-6 h-6 text-brand-dark" />
                    <span className="font-semibold">Comments:</span>
                    <span>{comments || <span className="italic text-gray-400">No comments</span>}</span>
                  </div>
                </div>
                <button
                  className="mt-6 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
                  onClick={() => setShowPreview(false)}
                >
                  Edit
                </button>
              </div>
            )}

            {/* Staff Search & Selection */}
            {showPreview && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-black text-lg font-semibold mb-4">Select Staff to Send Shift Request</h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                  <input
                    type="text"
                    className="border rounded p-2 text-black placeholder-black flex-1"
                    placeholder="Search staff by name or role..."
                    value={staffSearch}
                    onChange={e => setStaffSearch(e.target.value)}
                  />
                  <select
                    className="border rounded p-2 text-black"
                    value={selectedDay}
                    onChange={e => setSelectedDay(e.target.value)}
                  >
                    <option>Monday</option>
                    <option>Tuesday</option>
                    <option>Wednesday</option>
                    <option>Thursday</option>
                    <option>Friday</option>
                    <option>Saturday</option>
                    <option>Sunday</option>
                  </select>
                  <button
                    className={`px-4 py-2 rounded font-semibold ${selectAll ? 'bg-gray-300 text-gray-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    onClick={handleSelectAll}
                  >
                    {selectAll ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="text-black grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredStaff.map(staff => (
                    <div key={staff.id} className={`border rounded-lg p-4 flex flex-col gap-2 shadow-sm ${selectedStaff.includes(staff.id) ? 'ring-2 ring-blue-400' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-black">
                          {staff.name[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-lg">{staff.name}</div>
                          <div className="text-black text-sm">{staff.role}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-yellow-500 text-lg">★</span>
                        <span className="font-semibold">{staff.rating}</span>
                      </div>
                      <button
                        className={`mt-2 px-4 py-2 rounded font-semibold ${selectedStaff.includes(staff.id) ? 'bg-gray-300 text-gray-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                        onClick={() => handleStaffSelect(staff.id)}
                      >
                        {selectedStaff.includes(staff.id) ? 'Selected' : 'Send Request'}
                      </button>
                    </div>
                  ))}
                </div>
                {filteredStaff.length === 0 && (
                  <div className="text-black mt-4">No staff found for the selected day.</div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
      <style jsx global>{`
        .react-calendar, .react-calendar * {
          color: #000 !important;
        }
      `}</style>
    </>
  );
} 