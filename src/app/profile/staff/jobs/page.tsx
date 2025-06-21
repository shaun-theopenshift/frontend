"use client";

import SidebarProfile from "@/app/components/SidebarProfile";
import { useState, useEffect, useRef } from "react";
import {
  MapPinIcon,
  ChevronDownIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  ClockIcon,
  TagIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { api } from "@/utils/api";
import { Dialog } from "@headlessui/react";
import jsPDF from "jspdf";
import { logoBase64 } from "./logoBase64";

const SERVICE_TYPES = [
  { key: "everyday", label: "Daily living" },
  { key: "self_care", label: "Personal care" },
  { key: "nursing", label: "Nursing" },
  { key: "healthcare", label: "Allied health" },
];

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function StaffJobsPage() {
  const [suburb, setSuburb] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [day, setDay] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [descExpanded, setDescExpanded] = useState<{ [id: string]: boolean }>(
    {}
  );
  const [activeTab, setActiveTab] = useState<
    "active" | "myrequests" | "history" | "activity"
  >("active");
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [expandedOrgDetails, setExpandedOrgDetails] = useState<any | null>(
    null
  );
  const [expandedLoading, setExpandedLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [requestError, setRequestError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [rateInput, setRateInput] = useState<{ [id: string]: string }>({});
  const [commentInput, setCommentInput] = useState<{ [id: string]: string }>(
    {}
  );
  const [requestResponse, setRequestResponse] = useState<any>(null);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [myRequestsLoading, setMyRequestsLoading] = useState(false);
  const [myRequestsError, setMyRequestsError] = useState("");
  const [activityTimers, setActivityTimers] = useState<{
    [bookingId: number]: {
      running: boolean;
      start: number | null;
      elapsed: number;
    };
  }>({});
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [checkoutDetails, setCheckoutDetails] = useState<{
    [bookingId: number]: any;
  }>({});

  // Fetch jobs from backend
  useEffect(() => {
    async function fetchJobs() {
      setLoading(true);
      setError("");
      try {
        const params = {
          page: String(page),
          page_size: "10",
          ...(suburb ? { suburb } : {}),
          ...(serviceType ? { service: serviceType } : {}),
          ...(day ? { day } : {}),
        };
        const data = await api.searchBookings(params);
        setJobs(data.items || []);
        setTotalPages(data.total_pages || 1);
      } catch (err: any) {
        setError(err.message || "Error fetching jobs");
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, [suburb, serviceType, day, page]);

  // Always fetch myRequests on mount
  useEffect(() => {
    setMyRequestsLoading(true);
    setMyRequestsError("");
    api
      .getMyRequests()
      .then((data) => {
        setMyRequests(Array.isArray(data) ? data : data.items || []);
      })
      .catch((e) => setMyRequestsError(e.message || "Failed to fetch requests"))
      .finally(() => setMyRequestsLoading(false));
  }, []);

  // Fetch myBookings on mount
  useEffect(() => {
    api.getMyBookings().then((data) => {
      setMyBookings(
        Array.isArray(data) ? data : data.items || data.bookings || []
      );
    });
  }, []);

  // Split jobs into active/history
  const activeJobs = jobs.filter(
    (job: any) => job.status !== "canceled" && job.status !== "cancelled"
  );
  const historyJobs = jobs.filter(
    (job: any) => job.status === "canceled" || job.status === "cancelled"
  );

  // Expand/collapse job and fetch org details
  const handleExpandJob = async (job: any) => {
    if (expandedJobId === job.id) {
      setExpandedJobId(null);
      setExpandedOrgDetails(null);
      setRequestStatus("idle");
      setRequestError("");
      return;
    }
    setExpandedJobId(job.id);
    setExpandedLoading(true);
    setExpandedOrgDetails(null);
    setRequestStatus("idle");
    setRequestError("");
    try {
      const org = await api.getOrgById(job.org_id);
      setExpandedOrgDetails(org);
    } catch (e) {
      setExpandedOrgDetails(null);
    }
    setExpandedLoading(false);
  };

  // Send request for job
  const handleSendRequest = async (job: any) => {
    if (!job) return;
    setRequestStatus("loading");
    setRequestError("");
    setRequestResponse(null);
    try {
      const rate = Number(rateInput[job.id] || 0);
      const comment = commentInput[job.id] || "";
      const response = await api.sendJobRequest(job.id, rate, comment);
      setRequestStatus("success");
      setRequestResponse(response);
    } catch (e: any) {
      setRequestStatus("error");
      setRequestError(e.message || "Failed to send request");
    }
  };

  // Responsive hamburger menu
  const handleMobileMenu = () => setMobileMenuOpen(true);
  const handleCloseMobileMenu = () => setMobileMenuOpen(false);

  const myRequestsArray = Array.isArray(myRequests)
    ? myRequests
    : Object.values(myRequests);
  const approvedRequests = myRequestsArray.filter(
    (req: any) => req.status === "approved"
  );

  // Timer logic have to check
  const startTimer = async (bookingId: number) => {
    setActivityTimers((prev) => ({
      ...prev,
      [bookingId]: {
        running: true,
        start: Date.now(),
        elapsed: prev[bookingId]?.elapsed || 0,
      },
    }));
    try {
      await api.checkInBooking(bookingId, false);
      const data = await api.getMyBookings();
      setMyBookings(
        Array.isArray(data) ? data : data.items || data.bookings || []
      );
    } catch (e: any) {
      alert(e.message || "Check-in failed");
    }
    if (timerInterval.current) clearInterval(timerInterval.current);
    timerInterval.current = setInterval(() => {
      setActivityTimers((prev) => {
        const timer = prev[bookingId];
        if (!timer || !timer.running) return prev;
        return {
          ...prev,
          [bookingId]: {
            ...timer,
            elapsed: timer.elapsed + 1,
          },
        };
      });
    }, 1000);
  };
  const stopTimer = async (bookingId: number) => {
    setActivityTimers((prev) => ({
      ...prev,
      [bookingId]: {
        ...prev[bookingId],
        running: false,
      },
    }));
    try {
      const response = await api.checkInBooking(bookingId, true);
      setCheckoutDetails((prev) => ({ ...prev, [bookingId]: response }));
      const data = await api.getMyBookings();
      setMyBookings(
        Array.isArray(data) ? data : data.items || data.bookings || []
      );
      setCheckoutMessage("Successfully checked out!");
      setTimeout(() => setCheckoutMessage(""), 3000);
      console.log("Check-out response:", response);
    } catch (e: any) {
      alert(e.message || "Check-out failed");
    }
    if (timerInterval.current) clearInterval(timerInterval.current);
  };

  const downloadTimesheetPDF = (details: any) => {
    const doc = new jsPDF();

    // Colors
    const primaryColor = [41, 84, 189];
    const secondaryColor = [242, 110, 87];

    // Dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const logoWidth = 30;
    const logoHeight = 30;

    // Add Logo (top-right corner)
    doc.addImage(
      logoBase64,
      "PNG",
      pageWidth - logoWidth - 10,
      10,
      logoWidth,
      logoHeight
    );

    const companyInfoX = pageWidth - 10;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Company Details maybe", companyInfoX, 45, { align: "right" });
    doc.text("123 Example St, City, ZIP", companyInfoX, 50, { align: "right" });
    doc.text("Phone: 123-456-7890", companyInfoX, 55, { align: "right" });

    // Title
    doc.setFontSize(20);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text("Timesheet", 10, 30);

    // Section background header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(10, 65, 190, 10, "F");
    doc.setTextColor(255);
    doc.setFontSize(12);
    doc.text("Timesheet Details", 12, 72);

    // Table-style layout
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");

    const startY = 80;
    const lineHeight = 8;
    let y = startY;

    const rows = [
      ["Booking ID", details.id],
      ["User ID", details.user_id],
      ["Service", details.service],
      ["Suburb", details.suburb],
      ["Address", details.address],
      ["Title", details.title],
      ["Shift", `${details.start_time} - ${details.end_time}`],
      ["Check-in", details.check_in_time],
      ["Check-out", details.check_out_time],
      ["Rate", `$${details.rate}`],
      ["Amount", `$${details.amount}`],
    ];

    rows.forEach(([label, value]) => {
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(`${label}:`, 12, y);
      doc.setTextColor(0);
      doc.text(`${value}`, 60, y);
      y += lineHeight;
    });

    // Footer text (small)
    doc.setFontSize(8);
    doc.setTextColor(100);
    const footerText = [
      "This timesheet is auto-generated and should be verified by an authorized manager before payroll processing.",
    ];
    doc.text(footerText, 10, 260);

    // Save
    doc.save(`${details.id}_${details.user_id}.pdf`);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      {/* Hamburger for mobile */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b">
        <h1 className="text-2xl font-bold text-black">Jobs</h1>
        <button
          onClick={handleMobileMenu}
          className="text-[#2954bd] focus:outline-none"
        >
          <Bars3Icon className="w-7 h-7" />
        </button>
      </div>
      {/* Sidebar */}
      <div className={mobileMenuOpen ? "block md:block" : "hidden md:block"}>
        <SidebarProfile userType="staff" />
        {/* Overlay for mobile */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={handleCloseMobileMenu}
          />
        )}
        {mobileMenuOpen && (
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xl font-bold text-[#2954bd]">Menu</span>
              <button onClick={handleCloseMobileMenu} className="text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <SidebarProfile userType="staff" />
          </div>
        )}
      </div>
      <main className="flex-1 md:pl-72 pt-8 px-2 sm:px-6">
        <div className="max-w-4xl mx-auto py-4 sm:py-8">
          {/* Tabs */}
          <div className="flex gap-4 border-b mb-6">
            <button
              className={`pb-2 px-2 text-lg font-medium border-b-2 transition-colors ${
                activeTab === "active"
                  ? "border-[#2954bd] text-[#2954bd]"
                  : "border-transparent text-gray-500 hover:text-[#2954bd]"
              }`}
              onClick={() => setActiveTab("active")}
            >
              Active Jobs
            </button>
            <button
              className={`pb-2 px-2 text-lg font-medium border-b-2 transition-colors ${
                activeTab === "myrequests"
                  ? "border-[#2954bd] text-[#2954bd]"
                  : "border-transparent text-gray-500 hover:text-[#2954bd]"
              }`}
              onClick={() => setActiveTab("myrequests")}
            >
              My Requests
            </button>
            <button
              className={`pb-2 px-2 text-lg font-medium border-b-2 transition-colors ${
                activeTab === "history"
                  ? "border-[#2954bd] text-[#2954bd]"
                  : "border-transparent text-gray-500 hover:text-[#2954bd]"
              }`}
              onClick={() => setActiveTab("history")}
            >
              History
            </button>
            {approvedRequests.length > 0 && (
              <button
                className={`pb-2 px-2 text-lg font-medium border-b-2 transition-colors ${
                  activeTab === "activity"
                    ? "border-[#2954bd] text-[#2954bd]"
                    : "border-transparent text-gray-500 hover:text-[#2954bd]"
                }`}
                onClick={() => setActiveTab("activity")}
              >
                Activity
              </button>
            )}
          </div>
          {/* Filters */}
          {activeTab !== "activity" && (
            <div className="bg-gray-50 rounded-xl p-6 mb-8 shadow flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex-1 w-full">
                  <label className="block text-sm font-semibold mb-1 text-black">
                    Suburb or postcode
                  </label>
                  <div className="relative">
                    <input
                      className="w-full border rounded-md p-2 pl-10 text-black"
                      placeholder="Where would you like to work?"
                      value={suburb}
                      onChange={(e) => setSuburb(e.target.value)}
                    />
                    <MapPinIcon className="w-5 h-5 text-gray-400 absolute left-2 top-2.5" />
                  </div>
                </div>
                <div className="w-full sm:w-48">
                  <label className="block text-sm font-semibold mb-1 text-black">
                    Service Type
                  </label>
                  <select
                    className="w-full border rounded-md p-2 text-black"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                  >
                    <option value="">All</option>
                    {SERVICE_TYPES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full sm:w-40">
                  <label className="block text-sm font-semibold mb-1 text-black">
                    Days
                  </label>
                  <select
                    className="w-full border rounded-md p-2 text-black"
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                  >
                    <option value="">All</option>
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
          {activeTab === "activity" ? (
            <>
              <div className="text-center text-blue-500 py-2">
                Activity tab is rendering
              </div>
              {myRequestsLoading || loading ? (
                <div className="text-center text-gray-500 py-12">
                  Loading...
                </div>
              ) : approvedRequests.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  No approved jobs yet.
                </div>
              ) : (
                <div className="space-y-6">
                  {approvedRequests.map((req: any) => {
                    const booking: any = myBookings.find(
                      (b: any) => b.id === req.booking_id
                    );
                    if (!booking) {
                      return (
                        <div
                          key={req.id}
                          className="bg-yellow-50 border border-yellow-200 rounded-2xl shadow-md p-6 text-yellow-800"
                        >
                          Approved job (Booking ID: {req.booking_id}) not found
                          in your bookings. Please contact support.
                        </div>
                      );
                    }

                    // booking.status we use
                    const isSummaryState =
                      booking.status === "sent_for_approval" ||
                      booking.status === "checked_out";

                    // Timer logic
                    const canCheckIn = booking.status === "confirmed";
                    const canCheckOut = booking.status === "checked_in";
                    const timer = activityTimers[booking.id] || {
                      running: false,
                      start: null,
                      elapsed: 0,
                    };
                    const hours = Math.floor(timer.elapsed / 3600);
                    const minutes = Math.floor((timer.elapsed % 3600) / 60);
                    const seconds = timer.elapsed % 60;

                    // Details for summary state
                    const summaryDetails =
                      checkoutDetails[booking.id] || booking;
                    // Calculate total hours worked
                    const checkIn = summaryDetails.check_in_time
                      ? new Date(summaryDetails.check_in_time)
                      : null;
                    const checkOut = summaryDetails.check_out_time
                      ? new Date(summaryDetails.check_out_time)
                      : null;
                    // --- Amount Calculation Logic: tweak this if you want to change how the total amount is calculated ---
                    const totalHours =
                      checkIn && checkOut
                        ? ((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)).toFixed(2)
                        : "0.00";
                    const amount =
                      summaryDetails.rate && totalHours
                        ? (summaryDetails.rate * parseFloat(totalHours)).toFixed(2)
                        : "0.00";

                    if (isSummaryState) {
                      return (
                        <div
                          key={booking.id}
                          className="bg-white p-6 border rounded-2xl shadow-md flex flex-col gap-4 items-center"
                        >
                          <div className="flex items-center gap-2 text-2xl font-bold text-[#2954bd]">
                            <ClockIcon className="w-8 h-8" />
                            Shift Complete!
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-black">
                            <div className="flex items-center gap-2">
                              <CalendarDaysIcon className="w-5 h-5 text-[#2954bd]" />
                              <span>
                                Shift:{" "}
                                <b>
                                  {summaryDetails.start_time
                                    ? new Date(
                                        summaryDetails.start_time
                                      ).toLocaleString()
                                    : "-"}{" "}
                                  -{" "}
                                  {summaryDetails.end_time
                                    ? new Date(
                                        summaryDetails.end_time
                                      ).toLocaleString()
                                    : "-"}
                                </b>
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ClockIcon className="w-5 h-5 text-[#2954bd]" />
                              <span>
                                Check-in:{" "}
                                <b>
                                  {checkIn ? checkIn.toLocaleString() : "-"}
                                </b>
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ClockIcon className="w-5 h-5 text-[#2954bd]" />
                              <span>
                                Check-out:{" "}
                                <b>
                                  {checkOut ? checkOut.toLocaleString() : "-"}
                                </b>
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TagIcon className="w-5 h-5 text-[#2954bd]" />
                              <span>
                                Total hours: <b>{totalHours}h</b>
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <BriefcaseIcon className="w-5 h-5 text-[#2954bd]" />
                              <span>
                                Booking ID:{" "}
                                <b>{summaryDetails.id || booking.id}</b>
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TagIcon className="w-5 h-5 text-[#2954bd]" />
                              <span>
                                Amount: <b>${amount}</b>
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TagIcon className="w-5 h-5 text-[#2954bd]" />
                              <span>
                                Status:{" "}
                                <b>{summaryDetails.status || booking.status}</b>
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-4 mt-6">
                            <button
                              className="px-6 py-2 rounded bg-[#2954bd] text-white font-semibold hover:bg-[#1d3e8a] transition"
                              onClick={async () => {
                                await api.sendTimesheet(
                                  summaryDetails.id || booking.id,
                                  {
                                    ...summaryDetails,
                                    amount,
                                    status: "sent_for_approval",
                                  }
                                );
                                setCheckoutDetails((prev) => ({
                                  ...prev,
                                  [booking.id]: {
                                    ...summaryDetails,
                                    amount,
                                    status: "sent_for_approval",
                                  },
                                }));
                              }}
                              disabled={
                                summaryDetails.status === "sent_for_approval"
                              }
                            >
                              {summaryDetails.status === "sent_for_approval"
                                ? "Timesheet Sent"
                                : "Send Timesheet for Review"}
                            </button>
                            <button
                              className="px-6 py-2 rounded bg-green-500 text-white font-semibold hover:bg-green-700 transition"
                              onClick={() =>
                                downloadTimesheetPDF({
                                  ...summaryDetails,
                                  amount,
                                })
                              }
                            >
                              Download Timesheet
                            </button>
                          </div>
                          {(summaryDetails.status || booking.status) ===
                            "sent_for_approval" && (
                            <div
                              className="w-full bg-yellow-100 border-t-2 border-b-2 border-yellow-400 text-yellow-800 flex items-center h-12"
                              style={{ margin: 0, padding: 0 }}
                            >
                              <svg
                                className="w-5 h-5 ml-4 mr-2 text-yellow-500 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  fill="none"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 8v4m0 4h.01"
                                />
                              </svg>
                              <span>
                                Your timesheet is under review, you will be notified
                                once the status is updated.
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Timer card (not summary state)
                    if (booking.status === 'pending_payment') {
                      return (
                        <div
                          key={booking.id}
                          className="bg-white border rounded-2xl shadow-md p-6 flex flex-col gap-4 items-center"
                        >
                          <h2 className="text-lg font-bold text-black mb-1 w-full text-left">{booking.title}</h2>
                          <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-1 w-full">
                            <span>
                              Start: <span className="font-semibold text-black">{booking.start_time ? new Date(booking.start_time).toLocaleString() : "-"}</span>
                            </span>
                            <span>
                              End: <span className="font-semibold text-black">{booking.end_time ? new Date(booking.end_time).toLocaleString() : "-"}</span>
                            </span>
                            <span>
                              Booking Status: <span className="font-semibold text-black">{booking.status}</span>
                            </span>
                          </div>
                          {/* Horizontal Stepper */}
                          <div className="flex flex-col items-center w-full max-w-md mx-auto mt-6">
                            <div className="flex items-center w-full justify-center gap-0">
                              {/* Step 1: Pending Payment */}
                              <div className="flex flex-col items-center flex-1 min-w-0">
                                <div className="w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center text-white font-bold">1</div>
                                <div className="font-semibold text-yellow-700 mt-2">Pending Payment</div>
                                <div className="text-xs text-gray-500 text-center mt-1">Your timesheet has been approved and is awaiting payment.</div>
                              </div>
                              {/* Connector */}
                              <div className="flex-0 w-12 h-1 bg-gray-300 mx-2 rounded-full" />
                              {/* Step 2: Payment Received */}
                              <div className="flex flex-col items-center flex-1 min-w-0">
                                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold">2</div>
                                <div className="font-semibold text-gray-400 mt-2">Payment Received</div>
                                <div className="text-xs text-gray-400 text-center mt-1">You will be notified once payment is processed.</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={booking.id}
                        className="bg-white border rounded-2xl shadow-md p-6 flex flex-col gap-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <h2 className="text-lg font-bold text-black mb-1">
                              {booking.title}
                            </h2>
                            <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-1">
                              <span>
                                Start:{" "}
                                <span className="font-semibold text-black">
                                  {booking.start_time
                                    ? new Date(
                                        booking.start_time
                                      ).toLocaleString()
                                    : "-"}
                                </span>
                              </span>
                              <span>
                                End:{" "}
                                <span className="font-semibold text-black">
                                  {booking.end_time
                                    ? new Date(
                                        booking.end_time
                                      ).toLocaleString()
                                    : "-"}
                                </span>
                              </span>
                              <span>
                                Booking Status:{" "}
                                <span className="font-semibold text-black">
                                  {booking.status}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-center mt-4 text-black">
                          <div className="text-3xl font-mono mb-2">
                            {hours.toString().padStart(2, "0")}:
                            {minutes.toString().padStart(2, "0")}:
                            {seconds.toString().padStart(2, "0")}
                          </div>
                          <div className="flex gap-4">
                            <button
                              className="px-6 py-2 rounded bg-green-500 text-white font-semibold hover:bg-green-700 transition disabled:opacity-50"
                              onClick={() => startTimer(booking.id)}
                              disabled={timer.running || !canCheckIn}
                              title={
                                !canCheckIn
                                ? "You can only check in when the booking is confirmed."
                                  : ""
                              }
                            >
                              ▶ Check In
                            </button>
                            <button
                              className="px-6 py-2 rounded bg-red-500 text-white font-semibold hover:bg-red-700 transition disabled:opacity-50"
                              onClick={() => stopTimer(booking.id)}
                              disabled={!canCheckOut}
                              title={
                                !canCheckOut
                                ? "You can only check out when the booking is checked in."
                                  : ""
                              }
                            >
                              ■ Check Out
                            </button>
                          </div>
                          <div className="mt-2 text-gray-500 text-xs">
                            Total recorded: {hours}h {minutes}m {seconds}s
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Job List */}
              {activeTab === "myrequests" ? (
                myRequestsLoading ? (
                  <div className="text-center text-gray-500 py-12">
                    Loading requests...
                  </div>
                ) : myRequestsError ? (
                  <div className="text-center text-red-500 py-12">
                    {myRequestsError}
                  </div>
                ) : myRequestsArray.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    No requests found.
                  </div>
                ) : (
                  <>
                    <div className="space-y-6">
                      {myRequestsArray.map((req: any, idx: number) => (
                        <div
                          key={req.id || idx}
                          className="bg-white border rounded-2xl shadow-md p-6 flex flex-col gap-2"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <h2 className="text-lg font-bold text-black mb-1">
                                Request for Booking #{req.booking_id}
                              </h2>
                              <div className="text-gray-700 text-sm mb-1">
                                Comment:{" "}
                                {req.comment || (
                                  <span className="italic text-gray-400">
                                    No comment
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                <span>
                                  Rate:{" "}
                                  <span className="font-semibold text-black">
                                    {req.rate}
                                  </span>
                                </span>
                                <span>
                                  Status:{" "}
                                  <span
                                    className={
                                      req.status === "approved"
                                        ? "rounded-full px-2 py-1 bg-green-100 text-green-700 font-semibold"
                                        : req.status === "rejected"
                                        ? "rounded-full px-2 py-1 bg-red-100 text-red-700 font-semibold"
                                        : req.status === "pending"
                                        ? "rounded-full px-2 py-1 bg-yellow-100 text-yellow-700 font-semibold"
                                        : "rounded-full px-2 py-1 bg-gray-100 text-gray-700 font-semibold"
                                    }
                                  >
                                    {req.status}
                                  </span>
                                </span>
                                <span>
                                  Request ID:{" "}
                                  <span className="font-semibold text-black">
                                    {req.id}
                                  </span>
                                </span>
                              </div>
                            </div>
                            <div className="text-xs text-gray-400 text-right">
                              User: {req.user_id}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )
              ) : activeTab === "history" ? (
                myBookings.filter(
                  (booking) => booking.status === "sent_for_approval"
                ).length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    No bookings sent for approval.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {myBookings
                      .filter(
                        (booking) => booking.status === "sent_for_approval"
                      )
                      .map((booking) => {
                        const start = booking.start_time
                          ? new Date(booking.start_time)
                          : null;
                        const end = booking.end_time
                          ? new Date(booking.end_time)
                          : null;
                        const totalHours =
                          start && end
                            ? (
                                (end.getTime() - start.getTime()) /
                                (1000 * 60 * 60)
                              ).toFixed(2)
                            : "0.00";
                        return (
                          <div
                            key={booking.id}
                            className="bg-white border rounded-2xl shadow-md p-6 flex flex-col gap-4"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div>
                                <h2 className="text-lg font-bold text-black mb-1">
                                  {booking.title}
                                </h2>
                                <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-1">
                                  <span>
                                    Start:{" "}
                                    <span className="font-semibold text-black">
                                      {start ? start.toLocaleString() : "-"}
                                    </span>
                                  </span>
                                  <span>
                                    End:{" "}
                                    <span className="font-semibold text-black">
                                      {end ? end.toLocaleString() : "-"}
                                    </span>
                                  </span>
                                  <span>
                                    Booking Status:{" "}
                                    <span className="font-semibold text-black">
                                      {booking.status}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div className="text-gray-700">
                                <span className="font-semibold">
                                  Total hours:
                                </span>{" "}
                                {totalHours}h
                              </div>
                              <div className="text-gray-700">
                                <span className="font-semibold">
                                  Booking ID:
                                </span>{" "}
                                {booking.id}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )
              ) : loading ? (
                <div className="text-center text-gray-500 py-12">
                  Loading jobs...
                </div>
              ) : error ? (
                <div className="text-center text-red-500 py-12">{error}</div>
              ) : (activeTab === "active" ? activeJobs : historyJobs).length ===
                0 ? (
                <div className="text-center text-gray-500 py-12">
                  No jobs match your filters.
                </div>
              ) : (
                <div className="space-y-6">
                  {(activeTab === "active" ? activeJobs : historyJobs).map(
                    (job: any) => {
                      const isExpanded = expandedJobId === job.id;
                      const toggleDesc = (id: string) =>
                        setDescExpanded((prev) => ({
                          ...prev,
                          [id]: !prev[id],
                        }));
                      const hasDescription =
                        job.description && job.description.trim().length > 0;
                      const isLong =
                        hasDescription && job.description.length > 80;
                      return (
                        <div key={job.id} className="w-full">
                          <button
                            className="w-full text-left bg-white border rounded-2xl shadow-md p-6 flex flex-col gap-4 hover:shadow-lg transition-shadow duration-200 group focus:outline-none"
                            onClick={() => handleExpandJob(job)}
                            aria-expanded={isExpanded}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <BriefcaseIcon className="w-6 h-6 text-[#2954bd]" />
                                  <h2 className="text-2xl font-extrabold text-gray-900 group-hover:text-[#2954bd] transition-colors truncate">
                                    {job.title}
                                  </h2>
                                </div>
                                <div className="flex flex-wrap gap-2 items-center mb-2">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#e6f2f2] text-[#2954bd]">
                                    <TagIcon className="w-4 h-4 mr-1 text-[#2954bd]" />
                                    {job.service}
                                  </span>
                                  <span className="inline-flex items-center text-sm text-gray-700">
                                    <MapPinIcon className="w-4 h-4 mr-1 text-gray-400" />
                                    <span className="font-semibold text-black">
                                      {job.suburb}
                                    </span>
                                  </span>
                                  {job.start_time && (
                                    <span className="inline-flex items-center text-sm text-black">
                                      <ClockIcon className="w-4 h-4 mr-1 text-gray-400" />
                                      <span>
                                      {new Date(
                                        job.start_time
                                        ).toLocaleDateString()}{" "}
                                      {new Date(
                                        job.start_time
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                      </span>
                                    </span>
                                  )}
                                  {job.end_time && (
                                    <>
                                      <span className="mx-1 text-sm text-black">
                                        -
                                      </span>
                                      <ClockIcon className="w-4 h-4 mr-1 text-gray-400" />
                                      <span className="text-black text-sm">
                                        {new Date(
                                          job.end_time
                                        ).toLocaleDateString()}{" "}
                                      {new Date(
                                        job.end_time
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                    </>
                                  )}
                                </div>
                                <div
                                  className={
                                    isExpanded
                                      ? "text-gray-800 text-base mt-1"
                                      : isLong
                                      ? "text-gray-800 text-base mt-1 line-clamp-2"
                                      : "text-gray-800 text-base mt-1"
                                  }
                                >
                                  {hasDescription ? (
                                    job.description
                                  ) : (
                                    <span className="italic text-gray-400">
                                      No description provided.
                                    </span>
                                  )}
                                  {isLong && (
                                    <button
                                      className="ml-2 text-[#2954bd] font-semibold text-xs focus:outline-none hover:underline"
                                      onClick={() => toggleDesc(job.id)}
                                    >
                                      {isExpanded ? "Show less" : "Read more"}
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end min-w-[120px]">
                                <span className="text-xs text-gray-400">
                                  Posted{" "}
                                  {job.created_at
                                    ? Math.round(
                                        (Date.now() -
                                          new Date(job.created_at).getTime()) /
                                          (1000 * 60 * 60 * 24)
                                      )
                                    : 0}{" "}
                                  days ago
                                </span>
                              </div>
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="bg-gray-50 border-l-4 border-[#2954bd] rounded-b-2xl shadow-inner p-5 mt-[-1.5rem] mb-6">
                              {expandedLoading ? (
                                <div className="text-center py-8 text-gray-500">
                                  Loading organisation details...
                                </div>
                              ) : (
                                <>
                                  <div className="mt-2">
                                    <h3 className="text-lg font-bold mb-2 text-[#2954bd]">
                                      Organisation Details
                                    </h3>
                                    {expandedOrgDetails ? (
                                      <div className="space-y-1">
                                        <div className="font-semibold text-black">
                                          {expandedOrgDetails.name}
                                        </div>
                                        <div className="text-gray-700 text-sm">
                                          {expandedOrgDetails.description}
                                        </div>
                                        <div className="text-gray-600 text-sm">
                                          Address: {expandedOrgDetails.address}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-gray-400 text-sm">
                                        No organisation details found.
                                      </div>
                                    )}
                                  </div>
                                  {/* Send Request Form */}
                                  <form
                                    className="mt-6 flex flex-col sm:flex-row gap-3 items-end"
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      handleSendRequest(job);
                                    }}
                                  >
                                    <div className="flex-1 flex flex-col gap-2">
                                      <label className="text-xs font-semibold text-gray-700">
                                        Rate
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="w-full border rounded-md p-2 text-black"
                                        value={rateInput[job.id] || ""}
                                        onChange={(e) =>
                                          setRateInput((r) => ({
                                            ...r,
                                            [job.id]: e.target.value,
                                          }))
                                        }
                                        placeholder="Enter your rate (e.g. 30)"
                                        required
                                      />
                                    </div>
                                    <div className="flex-1 flex flex-col gap-2">
                                      <label className="text-xs font-semibold text-gray-700">
                                        Comment
                                      </label>
                                      <input
                                        type="text"
                                        className="w-full border rounded-md p-2 text-black"
                                        value={commentInput[job.id] || ""}
                                        onChange={(e) =>
                                          setCommentInput((c) => ({
                                            ...c,
                                            [job.id]: e.target.value,
                                          }))
                                        }
                                        placeholder="Add a comment (optional)"
                                      />
                                    </div>
                                    <button
                                      type="submit"
                                      className="flex-1 px-6 py-2 rounded bg-[#2954bd] text-white font-semibold hover:bg-[#1d3e8a] transition disabled:opacity-50"
                                      disabled={
                                        requestStatus === "loading" ||
                                        requestStatus === "success"
                                      }
                                    >
                                      {requestStatus === "loading"
                                        ? "Sending..."
                                        : requestStatus === "success"
                                        ? "Request Sent!"
                                        : "Send Request"}
                                    </button>
                                  </form>
                                  {/* Visual response */}
                                  {requestStatus === "success" &&
                                    requestResponse && (
                                      <div className="mt-4 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800">
                                        <div className="font-bold mb-1">
                                          Request Sent!
                                        </div>
                                        <div className="text-xs">
                                          Booking ID:{" "}
                                          {requestResponse.booking_id}
                                        </div>
                                        <div className="text-xs">
                                          Rate: {requestResponse.rate}
                                        </div>
                                        <div className="text-xs">
                                          Comment: {requestResponse.comment}
                                        </div>
                                        <div className="text-xs">
                                          Status: {requestResponse.status}
                                        </div>
                                      </div>
                                    )}
                                  {requestStatus === "error" && (
                                    <div className="text-red-500 text-sm mt-2">
                                      {requestError}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </>
          )}
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                className="px-3 py-1 rounded border text-[#2954bd] border-[#2954bd] font-semibold disabled:opacity-50"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span className="text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                className="px-3 py-1 rounded border text-[#2954bd] border-[#2954bd] font-semibold disabled:opacity-50"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
          {checkoutMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded mb-4 text-center">
              {checkoutMessage}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
