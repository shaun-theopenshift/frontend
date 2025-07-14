"use client";

import React, { useState, useEffect, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Listbox, Transition, Dialog } from "@headlessui/react"; // Import Dialog from Headless UI
import {
  MapPinIcon,
  BriefcaseIcon,
  CalendarIcon,
  ChevronUpDownIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  Bars3Icon, // For hamburger menu
  XMarkIcon, // For close icon
} from "@heroicons/react/24/outline";
import { api } from "@/utils/api";
import SidebarProfile from "@/app/components/SidebarProfile";
import StartJobPage from "@/app/profile/staff/jobs/StartJobPage";

// --- TYPE DEFINITIONS ---
interface Job {
  id: string;
  title: string;
  created_at: string;
  service: string;
  suburb: string;
  start_time?: string;
  end_time?: string;
  description?: string;
  rate?: number;
}

interface JobRequest {
  id: string;
  booking_id: string;
  comment: string;
  rate: number;
  status:
    | "approved"
    | "rejected"
    | "pending"
    | "sent_for_approval"
    | "pending_payment";
}

// --- CONSTANTS ---
const SERVICE_TYPES = [
  { key: "", label: "All Services" },
  { key: "everyday", label: "Daily living" },
  { key: "self_care", label: "Personal care" },
  { key: "nursing", label: "Nursing" },
  { key: "healthcare", label: "Allied health" },
];

// --- UTILITY FUNCTIONS ---
const timeAgo = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return "just now";
};

// --- UI COMPONENTS ---

const CustomDropdown = ({
  selected,
  setSelected,
  options,
  label,
}: {
  selected: string;
  setSelected: (value: string) => void;
  options: { key: string; label: string }[];
  label: string;
}) => (
  <div className="w-full">
    <Listbox value={selected} onChange={setSelected}>
      <div className="relative">
        <Listbox.Label className="block text-sm font-medium text-gray-500 mb-1">
          {label}
        </Listbox.Label>
        <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-3 pl-3 pr-10 text-left shadow-sm focus:outline-none focus-visible:border-[#3464b4] focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-[#3464b4] sm:text-sm">
          <span className="block truncate">
            {options.find((o) => o.key === selected)?.label}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </span>
        </Listbox.Button>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-10">
            {options.map((option) => (
              <Listbox.Option
                key={option.key}
                className={({ active }) =>
                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                    active ? "bg-[#e6ebf3] text-[#2a508f]" : "text-gray-900"
                  }`
                }
                value={option.key}
              >
                {({ selected }) => (
                  <>
                    <span
                      className={`block truncate ${
                        selected ? "font-medium" : "font-normal"
                      }`}
                    >
                      {option.label}
                    </span>
                    {selected ? (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#3464b4]">
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    ) : null}
                  </>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  </div>
);

const JobCard = ({
  job,
  index,
  isExpanded,
  onToggleExpand,
  onApply,
  requestStatus,
  requestError,
  myRequests,
}: {
  job: Job;
  index: number;
  isExpanded: boolean;
  onToggleExpand: (jobId: string) => void;
  onApply: (jobId: string, rate: number, comment: string) => void;
  requestStatus: string;
  requestError: string;
  myRequests: JobRequest[];
}) => {
  const [rateInput, setRateInput] = useState("");
  const [commentInput, setCommentInput] = useState("");

  // Find the current user's request for this job, if any
  const existingRequest = myRequests.find(
    (request) => request.booking_id === job.id
  );

  // Determine if the user has an 'active' (pending or approved) request, which prevents re-applying
  // Now also excludes 'sent_for_approval' from allowing re-application
  const hasActiveRequest =
    existingRequest &&
    (existingRequest.status === "pending" ||
      existingRequest.status === "approved" ||
      existingRequest.status === "sent_for_approval" ||
      existingRequest.status === "pending_payment");

  const handleApplySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!rateInput) return;
    onApply(job.id, Number(rateInput), commentInput);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-200/80 ubuntu"
    >
      <div
        className="p-6 cursor-pointer"
        onClick={() => onToggleExpand(job.id)}
      >
        <style jsx global>{`
          @import url("https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap");
          .font-ubuntu {
            font-family: "Ubuntu", sans-serif;
          }
        `}</style>
        <div className="flex justify-between items-start ubuntu">
          <div className="flex-grow">
            <div className="flex items-center gap-3 ubuntu">
              <div className="bg-[#e6ebf3] p-2 rounded-lg">
                <BriefcaseIcon className="w-6 h-6 text-[#3464b4]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">{job.title}</h3>
                <p className="text-sm text-gray-500">
                  {timeAgo(job.created_at)}
                </p>
              </div>
            </div>
          </div>
          <span className="text-xs font-semibold text-[#3464b4] bg-[#e6ebf3] py-1 px-3 rounded-full">
            {job.service}
          </span>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-x-6 gap-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <MapPinIcon className="w-5 h-5 text-gray-400" />
            <span>{job.suburb}</span>
          </div>
          {job.start_time && (
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-gray-400" />
              <span>
                {new Date(job.start_time).toLocaleDateString()}
                {", "}
                {new Date(job.start_time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {job.end_time &&
                  ` - ${new Date(job.end_time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`}
              </span>
            </div>
          )}
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: "1.5rem" }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-gray-700 mb-4">
                {job.description || "No description provided."}
              </p>

              {hasActiveRequest ? ( // If there's a pending, approved, or sent_for_approval request
                <div
                  className={`mt-6 p-4 rounded-md flex items-center justify-center
                                    ${
                                      existingRequest?.status === "approved"
                                        ? "bg-green-50 border border-green-200 text-green-700"
                                        : existingRequest?.status === "pending"
                                        ? "bg-blue-50 border border-blue-200 text-blue-700"
                                        : existingRequest?.status ===
                                          "sent_for_approval"
                                        ? "bg-purple-50 border border-purple-200 text-purple-700"
                                        : existingRequest?.status ===
                                          "pending_payment"
                                        ? "bg-yellow-50 border border-yellow-200 text-yellow-700"
                                        : ""
                                    }`}
                >
                  <div className="flex items-center">
                    <InformationCircleIcon className="w-5 h-5 mr-2" />
                    <span>
                      {existingRequest?.status === "approved" &&
                        "Your request for this job has been approved."}
                      {existingRequest?.status === "pending" &&
                        "You have a pending request for this job."}
                      {existingRequest?.status === "sent_for_approval" &&
                        "Timesheet sent for approval."}
                      {existingRequest?.status === "pending_payment" &&
                        "Timesheet approved, payment pending."}
                    </span>
                  </div>
                </div>
              ) : (
                // No active request (either no request or it was rejected)
                <form
                  className="mt-6 flex flex-col sm:flex-row gap-4 items-end"
                  onSubmit={handleApplySubmit}
                >
                  <div className="w-full sm:w-1/3">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Rate ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full border-gray-300 rounded-md p-2 text-black shadow-sm focus:ring-[#3464b4] focus:border-[#3464b4]"
                      value={rateInput}
                      onChange={(e) => setRateInput(e.target.value)}
                      placeholder="e.g. 30"
                      required
                    />
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Comment (Optional)
                    </label>
                    <input
                      type="text"
                      className="w-full border-gray-300 rounded-md p-2 text-black shadow-sm focus:ring-[#3464b4] focus:border-[#3464b4]"
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      placeholder="Add a comment"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2 rounded-lg bg-[#3464b4] text-white font-semibold hover:bg-[#2a508f] transition disabled:opacity-50 flex-shrink-0"
                    disabled={
                      requestStatus === "loading" || requestStatus === "success"
                    }
                  >
                    {requestStatus === "loading"
                      ? "Sending..."
                      : requestStatus === "success"
                      ? "Sent!"
                      : "Send Request"}
                  </button>
                </form>
              )}
              {requestStatus === "error" && (
                <p className="text-red-500 text-sm mt-2">{requestError}</p>
              )}
              {requestStatus === "success" && (
                <p className="text-green-500 text-sm mt-2">
                  Your request has been sent successfully!
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  if (totalPages <= 1) return null;
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      className="flex items-center justify-center gap-4 mt-12"
      aria-label="Pagination"
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2">
        {pageNumbers.map((number) => (
          <button
            key={number}
            onClick={() => onPageChange(number)}
            className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
              currentPage === number
                ? "bg-[#3464b4] text-white shadow-lg"
                : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            {number}
          </button>
        ))}
      </div>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
      >
        <ChevronRightIcon className="w-5 h-5" />
      </button>
    </nav>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function RedesignedJobsPage() {
  const [suburb, setSuburb] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<
    "active" | "myrequests" | "history"
  >("active");

  const [myRequests, setMyRequests] = useState<JobRequest[]>([]);
  const [myRequestsLoading, setMyRequestsLoading] = useState(false);
  const [myRequestsError, setErrorMyRequests] = useState(""); // Renamed to avoid conflict

  const [requestStatus, setRequestStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [requestError, setRequestError] = useState("");
  const [activeRequestJobId, setActiveRequestJobId] = useState<string | null>(
    null
  );
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  // State for navigation
  const [currentPageView, setCurrentPageView] = useState<
    "jobsList" | "startJob"
  >("jobsList");
  const [jobIdToStart, setJobIdToStart] = useState<string | null>(null);
  //
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for mobile sidebar

  // Fetch active jobs
  useEffect(() => {
    if (activeTab !== "active" || currentPageView !== "jobsList") return;
    async function fetchJobs() {
      setLoading(true);
      setError("");
      try {
        const params = {
          page: String(page),
          page_size: "6",
          ...(suburb ? { suburb } : {}),
          ...(serviceType ? { service: serviceType } : {}),
        };
        const data = await api.searchBookings(params);
        const sortedJobs = Array.isArray(data.items)
          ? data.items.sort(
              (a: Job, b: Job) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            )
          : [];
        setJobs(sortedJobs);
        setTotalPages(data.total_pages || 1);
      } catch (err: any) {
        setError(err.message || "Error fetching jobs");
        setJobs([]);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, [suburb, serviceType, page, activeTab, currentPageView]);

  // Fetch "My Requests"
  useEffect(() => {
    if (currentPageView === "startJob") return;
    setMyRequestsLoading(true);
    setErrorMyRequests(""); // Use renamed setter
    api
      .getMyRequests()
      .then((data) => {
        setMyRequests(Array.isArray(data) ? data : data.items || []);
      })
      .catch((e: any) =>
        setErrorMyRequests(e.message || "Failed to fetch requests")
      ) // Use renamed setter
      .finally(() => setMyRequestsLoading(false));
  }, [activeTab, currentPageView]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSendRequest = async (
    jobId: string,
    rate: number,
    comment: string
  ) => {
    setActiveRequestJobId(jobId);
    setRequestStatus("loading");
    setRequestError("");
    try {
      const newRequest = await api.sendJobRequest(Number(jobId), rate, comment);
      setRequestStatus("success");
      setMyRequests((prevRequests) => [
        ...prevRequests,
        { ...newRequest, booking_id: jobId },
      ]);

      setTimeout(() => {
        setRequestStatus("idle");
        setActiveRequestJobId(null);
        setExpandedJobId(null);
      }, 2000);
    } catch (e: any) {
      setRequestStatus("error");
      setRequestError(e.message || "Failed to send request");
    }
  };

  const handleToggleExpand = (jobId: string) => {
    setExpandedJobId((prevId) => (prevId === jobId ? null : jobId));
  };

  const handleStartJobClick = (jobId: string) => {
    setJobIdToStart(jobId);
    setCurrentPageView("startJob");
    setIsSidebarOpen(false); // Close sidebar on navigation
  };

  const handleBackToJobsList = () => {
    setCurrentPageView("jobsList");
    setJobIdToStart(null);
    api
      .getMyRequests()
      .then((data) => {
        setMyRequests(Array.isArray(data) ? data : data.items || []);
      })
      .catch((e: any) =>
        console.error(
          "Failed to refresh requests after returning from StartJobPage:",
          e
        )
      );
  };

  const renderContent = () => {
    if (currentPageView === "startJob" && jobIdToStart) {
      return (
        <StartJobPage jobId={jobIdToStart} onBack={handleBackToJobsList} />
      );
    }

    switch (activeTab) {
      case "active":
        return (
          <>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-10 border border-gray-200/80">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div>
                  <label
                    htmlFor="search"
                    className="block text-sm font-medium text-gray-500 mb-1"
                  >
                    Suburb or Postcode
                  </label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      id="search"
                      placeholder="Where would you like to work?"
                      value={suburb}
                      onChange={(e) => {
                        setSuburb(e.target.value);
                        setPage(1);
                      }}
                      className="w-full border-gray-200 rounded-lg p-3 pl-12 shadow-sm focus:ring-[#3464b4] focus:border-[#3464b4]"
                    />
                  </div>
                </div>
                <CustomDropdown
                  label="Service Type"
                  selected={serviceType}
                  setSelected={(value) => {
                    setServiceType(value);
                    setPage(1);
                  }}
                  options={SERVICE_TYPES}
                />
              </div>
            </div>

            <AnimatePresence>
              {loading ? (
                <motion.div className="text-center py-20">
                  <p className="text-lg text-gray-500">Loading jobs...</p>
                </motion.div>
              ) : error ? (
                <motion.div className="text-center py-20 bg-red-50 text-red-700 p-4 rounded-lg">
                  <h3 className="text-xl font-semibold">An Error Occurred</h3>
                  <p>{error}</p>
                </motion.div>
              ) : jobs.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {jobs.map((job, index) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      index={index}
                      isExpanded={expandedJobId === job.id}
                      onToggleExpand={handleToggleExpand}
                      onApply={handleSendRequest}
                      requestStatus={
                        activeRequestJobId === job.id ? requestStatus : "idle"
                      }
                      requestError={
                        activeRequestJobId === job.id ? requestError : ""
                      }
                      myRequests={myRequests}
                    />
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-20"
                >
                  <h3 className="text-2xl font-semibold text-gray-700">
                    No Jobs Found
                  </h3>
                  <p className="mt-2 text-gray-500">
                    Try adjusting your search filters.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        );
      case "myrequests":
        const myActiveRequests = myRequests.filter(
          (req) =>
            req.status === "pending" ||
            req.status === "approved" ||
            req.status === "pending_payment" ||
            req.status === "sent_for_approval"
        );
        return myRequestsLoading ? (
          <div className="text-center py-20">
            <p className="text-lg text-gray-500">Loading requests...</p>
          </div>
        ) : myRequestsError ? (
          <div className="text-center py-20 bg-red-50 text-red-700 p-4 rounded-lg">
            <h3 className="text-xl font-semibold">An Error Occurred</h3>
            <p>{myRequestsError}</p>
          </div>
        ) : myActiveRequests.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-2xl font-semibold text-gray-700">
              No Active Requests Found
            </h3>
            <p className="mt-2 text-gray-500">
              You don't have any pending, approved, or payment-pending job
              requests.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {myActiveRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white border rounded-xl shadow-md p-6"
              >
                <h3 className="font-bold text-lg text-gray-800">
                  Request for Booking #{req.booking_id}
                </h3>
                <p className="text-gray-600 mt-2">
                  Comment:{" "}
                  {req.comment || <span className="italic">No comment</span>}
                </p>
                <div className="flex items-center justify-between mt-4 text-sm">
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">Rate: ${req.rate}</span>
                    <span
                      className={`font-semibold px-3 py-1 rounded-full text-xs uppercase ${
                        req.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : req.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : req.status === "sent_for_approval"
                          ? "bg-purple-100 text-purple-800"
                          : req.status === "pending_payment"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {req.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  {req.status === "approved" ? (
                    <button
                      onClick={() => handleStartJobClick(req.booking_id)}
                      className="ml-4 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition"
                    >
                      Start Job
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartJobClick(req.booking_id)}
                      className="ml-4 px-4 py-2 rounded-lg bg-[#3464b4] text-white font-semibold hover:bg-[#2a508f] transition"
                    >
                      View Details
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        );
      case "history":
        const myHistoryRequests = myRequests.filter(
          (req) =>
            req.status === "rejected" || req.status === "sent_for_approval"
        );
        return myRequestsLoading ? (
          <div className="text-center py-20">
            <p className="text-lg text-gray-500">Loading history...</p>
          </div>
        ) : myRequestsError ? (
          <div className="text-center py-20 bg-red-50 text-red-700 p-4 rounded-lg">
            <h3 className="text-xl font-semibold">An Error Occurred</h3>
            <p>{myRequestsError}</p>
          </div>
        ) : myHistoryRequests.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-2xl font-semibold text-gray-700">
              No History Found
            </h3>
            <p className="mt-2 text-gray-500">
              Your rejected or completed jobs will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {myHistoryRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white border rounded-xl shadow-md p-6"
              >
                <h3 className="font-bold text-lg text-gray-800">
                  Request for Booking #{req.booking_id}
                </h3>
                <p className="text-gray-600 mt-2">
                  Comment:{" "}
                  {req.comment || <span className="italic">No comment</span>}
                </p>
                <div className="flex items-center gap-4 mt-4 text-sm">
                  <span className="font-semibold">Rate: ${req.rate}</span>
                  <span
                    className={`font-semibold px-3 py-1 rounded-full text-xs uppercase ${
                      req.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : req.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : req.status === "sent_for_approval"
                        ? "bg-purple-100 text-purple-800"
                        : req.status === "pending_payment"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {req.status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap");
        body {
          font-family: "Ubuntu", sans-serif;
        }
      `}</style>
      <div className="min-h-screen bg-gray-50 text-gray-800 flex">
        {/* Mobile Sidebar (off-canvas) */}
        <Dialog
          as="div"
          className="relative z-40 md:hidden"
          open={isSidebarOpen}
          onClose={setIsSidebarOpen}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20"
            aria-hidden="true"
          />

          <div className="fixed inset-0 flex">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              exit={{ x: "-100%" }}
              transition={{ ease: "easeOut", duration: 0.2 }}
              className="relative flex w-full max-w-xs flex-1 flex-col bg-white"
            >
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <XMarkIcon
                    className="h-6 w-6 text-white"
                    aria-hidden="true"
                  />
                </button>
              </div>
              <SidebarProfile userType="staff" />
            </motion.div>
          </div>
        </Dialog>

        {/* Desktop Sidebar */}
        <div className="w-64 bg-white shadow-lg hidden md:block">
          <SidebarProfile userType="staff" />
        </div>

        <main className="flex-1">
          <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <header className="flex justify-between items-center mb-6">
              <div className="text-left">
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">
                  Jobs
                </h1>
              </div>
              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  type="button"
                  className="-ml-0.5 -mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#3464b4]"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <span className="sr-only">Open sidebar</span>
                  <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
            </header>

            <div className="border-b border-gray-200 mb-8">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab("active")}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "active"
                      ? "border-[#3464b4] text-[#3464b4]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Active Jobs
                </button>
                <button
                  onClick={() => setActiveTab("myrequests")}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "myrequests"
                      ? "border-[#3464b4] text-[#3464b4]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  My Requests
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "history"
                      ? "border-[#3464b4] text-[#3464b4]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  History
                </button>
              </nav>
            </div>

            {renderContent()}
          </div>
        </main>
      </div>
    </>
  );
}
