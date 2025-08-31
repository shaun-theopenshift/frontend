"use client";

import React, { useState, useEffect, Fragment, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog } from '@headlessui/react';
import {
  ChevronLeftIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  BriefcaseIcon,
  ArrowRightOnRectangleIcon, // Added import for new icon
} from "@heroicons/react/24/outline";
import { api } from "@/utils/api";
import ConfettiExplosion from 'react-confetti-explosion';
import { useUser } from "@auth0/nextjs-auth0/client"; // Import useUser

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
    rate?: number; // Added rate to Job interface
    address?: string; // Added address to Job interface
    check_in_time?: string | null; // Added check_in_time
    check_out_time?: string | null; // Added check_out_time
    status?: 'approved' | 'rejected' | 'pending' | 'sent_for_approval' | 'completed' | 'in_progress' | 'cancelled' | 'pending_payment' | 'payment_received'; // Added payment_received status
}

interface TimesheetResponse {
    check_in_time: string;
    check_out_time: string | null;
    booking_id: string;
}

const API_BASE_URL = "https://api.theopenshift.com"; // Added API_BASE_URL to StartJobPage.tsx

const MIN_RECOMMENDED_RATE_EXAMPLE = 30.00; // Example: e.g., SCHADS Level 2 casual rate (replace with actual dynamic value)


const StartJobPage = ({ jobId, onBack }: { jobId: string, onBack: () => void }) => {
    const { user, isLoading: isAuth0Loading } = useUser(); // Use Auth0 hook
    const [jobDetails, setJobDetails] = useState<Job | null>(null);
    const [loadingJobDetails, setLoadingJobDetails] = useState(true);
    const [jobDetailsError, setJobDetailsError] = useState<string | null>(null);
    const [timer, setTimer] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [checkInTime, setCheckInTime] = useState<Date | null>(null);
    const [checkOutTime, setCheckOutTime] = useState<Date | null>(null);
    const [isTimesheetSubmitted, setIsTimesheetSubmitted] = useState(false);
    const [isExploding, setIsExploding] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false); // For success confirmation modal
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false); // For timesheet approval modal
    const [editedCheckInTime, setEditedCheckInTime] = useState<string>('');
    const [editedCheckOutTime, setEditedCheckOutTime] = useState<string>('');
    const [editedRate, setEditedRate] = useState<number>(0);
    const [rateValidationError, setRateValidationError] = useState<string | null>(null); // New state for rate validation
    const [stripeDashboardUrl, setStripeDashboardUrl] = useState<string | null>(null);
    const [fetchingStripeLink, setFetchingStripeLink] = useState(false);
    const [stripeError, setStripeError] = useState<string | null>(null);

    // Function to fetch Stripe Dashboard Link
    const fetchStripeDashboardLink = useCallback(async (): Promise<string | null> => {
        setFetchingStripeLink(true);
        setStripeError(null);
        try {
            // api.getStripeDashboardLink uses apiRequest which internally handles accessToken
            const data = await api.getStripeDashboardLink();
            if (data && data.url) {
                setStripeDashboardUrl(data.url);
                return data.url;
            } else {
                setStripeError("Stripe dashboard link not found.");
                setStripeDashboardUrl(null);
                return null;
            }
        } catch (e: any) {
            setStripeError(e.message || "An unexpected error occurred while fetching Stripe dashboard link.");
            setStripeDashboardUrl(null);
            return null;
        } finally {
            setFetchingStripeLink(false);
        }
    }, []);

    // Fetch job details and handle authentication
    useEffect(() => {
        let isMounted = true;
        const fetchInitialData = async () => {
            if (!isMounted) return;

            setLoadingJobDetails(true);
            setJobDetailsError(null);

            if (isAuth0Loading) {
                return; // Wait for Auth0 to finish loading
            }

            if (!user) {
                if (isMounted) {
                    setJobDetailsError("User not authenticated. Please log in.");
                    setLoadingJobDetails(false);
                }
                return;
            }

            try {
                // api.getBookingById already handles accessToken internally via apiRequest
                const data = await api.getBookingById(jobId);

                if (data) {
                    setJobDetails(data);
                    if (data.check_in_time) {
                        setCheckInTime(new Date(data.check_in_time));
                        if (data.check_out_time) {
                            setCheckOutTime(new Date(data.check_out_time));
                            setIsRunning(false);
                            if (data.status === 'sent_for_approval' || data.status === 'completed' || data.status === 'pending_payment' || data.status === 'payment_received') {
                                setIsTimesheetSubmitted(true);
                            }
                        } else {
                            setIsRunning(true);
                            const now = new Date();
                            const checkIn = new Date(data.check_in_time);
                            setTimer(Math.floor((now.getTime() - checkIn.getTime()) / 1000));
                        }
                    }
                    // Fetch Stripe dashboard link if payment received and not already fetched
                    if (data.status === 'payment_received' && !stripeDashboardUrl && !fetchingStripeLink) {
                        fetchStripeDashboardLink();
                    }
                } else {
                    if (isMounted) {
                        setJobDetailsError("Job details not found for this ID.");
                    }
                }

            } catch (error: any) {
                if (isMounted) {
                    setJobDetailsError(error.message || "Failed to load job details.");
                }
            } finally {
                if (isMounted) {
                    setLoadingJobDetails(false);
                }
            }
        };
        fetchInitialData();

        return () => {
            isMounted = false;
        };
    }, [jobId, user, isAuth0Loading, fetchStripeDashboardLink, stripeDashboardUrl, fetchingStripeLink]); // Added dependencies

    // Timer logic (remains the same)
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isRunning) {
            interval = setInterval(() => {
                setTimer((prevTimer) => prevTimer + 1);
            }, 1000);
        } else if (!isRunning && timer !== 0) {
            if (interval) clearInterval(interval);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning, timer]);

    const formatTime = (totalSeconds: number): string => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return [hours, minutes, seconds]
            .map(unit => String(unit).padStart(2, '0'))
            .join(':');
    };

    const handleCheckIn = async () => {
        try {
            // api.checkInBooking already handles accessToken internally via apiRequest
            const response: TimesheetResponse = await api.checkInBooking(Number(jobId), false);
            setCheckInTime(new Date(response.check_in_time));
            setIsRunning(true);
            setTimer(0);
        } catch (error: any) {
            alert(`Check-in failed: ${error.message}`);
        }
    };

    const handleCheckOut = async () => {
        try {
            // api.checkInBooking already handles accessToken internally via apiRequest
            const response: TimesheetResponse = await api.checkInBooking(Number(jobId), true);
            setCheckOutTime(new Date(response.check_out_time || new Date()));
            setIsRunning(false);
        } catch (error: any) {
            alert(`Check-out failed: ${error.message}`);
        }
    };

    // Function to open the timesheet approval modal
    const openTimesheetApprovalModal = () => {
        if (!checkInTime || !checkOutTime || !jobDetails?.id) {
            alert("Please check in and check out before sending the timesheet.");
            return;
        }
        setEditedCheckInTime(checkInTime.toISOString().slice(0, 16)); // Format to YYYY-MM-DDTHH:MM
        setEditedCheckOutTime(checkOutTime.toISOString().slice(0, 16));
        setEditedRate(jobDetails.rate || 0);
        setRateValidationError(null); // Clear previous validation errors
        setIsApprovalModalOpen(true);
    };

    // Function to handle sending timesheet after final edits
    const handleConfirmSendTimesheet = async () => {
        // Client-side validation for rate
        if (editedRate < MIN_RECOMMENDED_RATE_EXAMPLE) {
            setRateValidationError(
                `The rate ($${editedRate.toFixed(2)}/hr) is below the recommended industry minimum ($${MIN_RECOMMENDED_RATE_EXAMPLE.toFixed(2)}/hr). Please revise.`
            );
            return; // Prevent submission
        }

        try {
            const payload = {
                check_in_time: new Date(editedCheckInTime).toISOString(),
                check_out_time: new Date(editedCheckOutTime).toISOString(),
                rate: editedRate,
            };
            // api.sendTimesheet already handles accessToken internally via apiRequest
            await api.sendTimesheet(Number(jobId), payload);

            setIsApprovalModalOpen(false); // Close the approval modal
            setIsTimesheetSubmitted(true);
            setIsExploding(true);
            setIsModalOpen(true); // Open the success modal

            setJobDetails(prevDetails => prevDetails ? { ...prevDetails, status: 'sent_for_approval' } : null);

            setTimeout(() => setIsExploding(false), 3000);
        } catch (error: any) {
            alert(`Timesheet submission failed: ${error.message}`);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        onBack();
    };

    const handleGoToStripeDashboard = () => {
        if (stripeDashboardUrl) {
            window.open(stripeDashboardUrl, '_blank');
        }
    };

    const renderTopHalfContent = () => {
        if (jobDetails?.status === 'payment_received') {
            return (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <p className="text-2xl font-bold text-gray-800">Payment Received! 🎉</p>
                    <p className="text-gray-600 mt-2">
                        Hey, you have received payment for this job successfully!
                    </p>
                    {checkInTime && checkOutTime && (
                        <div className="mt-4 text-gray-700">
                            <p>Check-in: {checkInTime.toLocaleString()}</p>
                            <p>Check-out: {checkOutTime.toLocaleString()}</p>
                        </div>
                    )}
                    {fetchingStripeLink ? (
                        <p className="text-sm text-gray-500 mt-4">Fetching Stripe dashboard link...</p>
                    ) : stripeError ? (
                        <p className="text-sm text-red-500 mt-4">{stripeError}</p>
                    ) : stripeDashboardUrl && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleGoToStripeDashboard}
                            className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold shadow-md hover:bg-indigo-700 transition-colors flex items-center justify-center mx-auto"
                        >
                            <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" /> Go to Stripe Dashboard
                        </motion.button>
                    )}
                </motion.div>
            );
        } else if (jobDetails?.status === 'pending_payment') {
            return (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <p className="text-2xl font-bold text-gray-800">Timesheet Approved!</p>
                    <p className="text-gray-600 mt-2">Your payment is on the way. We'll notify you when it's processed.</p>
                    {checkInTime && checkOutTime && (
                        <div className="mt-4 text-gray-700">
                            <p>Check-in: {checkInTime.toLocaleString()}</p>
                            <p>Check-out: {checkOutTime.toLocaleString()}</p>
                        </div>
                    )}
                </motion.div>
            );
        } else if (isTimesheetSubmitted || jobDetails?.status === 'sent_for_approval' || jobDetails?.status === 'completed') {
            return (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <p className="text-2xl font-bold text-gray-800">Job Session Concluded</p>
                    <p className="text-gray-600 mt-2">Timesheet sent for approval. We'll notify you once it's reviewed.</p>
                    {checkInTime && checkOutTime && (
                        <div className="mt-4 text-gray-700">
                            <p>Check-in: {checkInTime.toLocaleString()}</p>
                            <p>Check-out: {checkOutTime.toLocaleString()}</p>
                        </div>
                    )}
                </motion.div>
            );
        } else {
            return (
                <>
                    <div className="text-6xl font-mono font-bold text-indigo-700 mb-6">
                        {formatTime(timer)}
                    </div>
                    <div className="flex gap-4">
                        {!checkInTime && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleCheckIn}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold shadow-md hover:bg-indigo-700 transition-colors"
                            >
                                Check In
                            </motion.button>
                        )}
                        {checkInTime && !checkOutTime && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleCheckOut}
                                disabled={!isRunning}
                                className="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold shadow-md hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                                Check Out
                            </motion.button>
                        )}
                    </div>
                    {checkInTime && checkOutTime && !isTimesheetSubmitted && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={openTimesheetApprovalModal} // Changed to open modal
                            className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold shadow-md hover:bg-green-700 transition-colors"
                        >
                            Send Timesheet for Approval
                        </motion.button>
                    )}
                </>
            );
        }
    };


    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-white rounded-xl shadow-lg border border-gray-200/80"
        >
            <button
                onClick={onBack}
                className="mb-6 flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
            >
                <ChevronLeftIcon className="w-5 h-5 mr-2" /> Back to Jobs
            </button>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Job Session</h2>

            {loadingJobDetails || isAuth0Loading ? ( // Also show loading if Auth0 is still loading
                <p className="text-lg text-gray-500">Loading job details...</p>
            ) : jobDetailsError ? (
                <div className="bg-red-50 text-black p-4 rounded-lg"><h3 className="text-xl font-semibold">Error</h3><p>{jobDetailsError}</p></div>
            ) : jobDetails ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Top Half: Timer and Controls */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg shadow-inner border border-gray-200"
                    >
                        {renderTopHalfContent()}
                    </motion.div>

                    {/* Bottom Half: Job Details */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-6 bg-white rounded-lg shadow-md border border-gray-200"
                    >
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Job Details</h3>
                        <div className="space-y-3 text-gray-700">
                            <p className="flex items-center gap-2">
                                <BriefcaseIcon className="w-5 h-5 text-gray-500" />
                                <span className="font-semibold">Title:</span> {jobDetails.title}
                            </p>
                            <p className="flex items-center gap-2">
                                <MapPinIcon className="w-5 h-5 text-gray-500" />
                                <span className="font-semibold">Address:</span> {jobDetails.address || jobDetails.suburb}
                            </p>
                            {jobDetails.start_time && (
                                <p className="flex items-center gap-2">
                                    <CalendarIcon className="w-5 h-5 text-gray-500" />
                                    <span className="font-semibold">Start Time:</span> {new Date(jobDetails.start_time).toLocaleString()}
                                </p>
                            )}
                            {jobDetails.end_time && (
                                <p className="flex items-center gap-2">
                                    <CalendarIcon className="w-5 h-5 text-gray-500" />
                                    <span className="font-semibold">End Time:</span> {new Date(jobDetails.end_time).toLocaleString()}
                                </p>
                            )}
                            <p className="flex items-start gap-2">
                                <InformationCircleIcon className="w-5 h-5 text-gray-500 mt-1" />
                                <span className="font-semibold">Description:</span> {jobDetails.description}
                            </p>
                            {jobDetails.rate !== undefined && (
                                <p className="flex items-center gap-2">
                                    <ClockIcon className="w-5 h-5 text-gray-500" />
                                    <span className="font-semibold">Agreed Rate:</span> ${jobDetails.rate}/hr
                                </p>
                            )}
                            {jobDetails.status && (
                                <p className="flex items-center gap-2">
                                    <InformationCircleIcon className="w-5 h-5 text-gray-500" />
                                    <span className="font-semibold">Current Status:</span>
                                    <span className={`font-semibold px-2 py-1 rounded-full text-xs uppercase ${
                                        jobDetails.status === 'approved' ? 'bg-green-100 text-green-800' :
                                        jobDetails.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                                        jobDetails.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                        jobDetails.status === 'sent_for_approval' ? 'bg-purple-100 text-purple-800' :
                                        jobDetails.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                        jobDetails.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-800' :
                                        jobDetails.status === 'payment_received' ? 'bg-teal-100 text-teal-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {jobDetails.status.replace(/_/g, ' ')}
                                    </span>
                                </p>
                            )}
                        </div>
                    </motion.div>
                </div>
            ) : (
                <p className="text-lg text-gray-500">Job details not found.</p>
            )}

            {/* Timesheet Approval Modal */}
            <AnimatePresence>
                {isApprovalModalOpen && (
                    <Dialog as={motion.div} className="relative z-10" onClose={() => setIsApprovalModalOpen(false)} open={isApprovalModalOpen}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30"
                            aria-hidden="true"
                        />
                        <div className="fixed inset-0 flex items-center justify-center p-4">
                            <Dialog.Panel
                                as={motion.div}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="relative bg-white rounded-lg p-6 shadow-xl max-w-md mx-auto text-center"
                            >
                                <Dialog.Title as="h3" className="text-2xl font-bold text-gray-900 mb-4">
                                    Confirm Timesheet Details
                                </Dialog.Title>
                                <p className="text-gray-700 mb-6">Review and adjust the details before sending for approval.</p>

                                <div className="space-y-4 text-left mb-6">
                                    <div>
                                        <label htmlFor="check-in-time" className="block text-sm font-medium text-gray-700">Check-in Time</label>
                                        <input
                                            type="datetime-local"
                                            id="check-in-time"
                                            value={editedCheckInTime}
                                            onChange={(e) => setEditedCheckInTime(e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="check-out-time" className="block text-sm font-medium text-gray-700">Check-out Time</label>
                                        <input
                                            type="datetime-local"
                                            id="check-out-time"
                                            value={editedCheckOutTime}
                                            onChange={(e) => setEditedCheckOutTime(e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="rate" className="block text-sm font-medium text-gray-700">Rate ($/hr)</label>
                                        <input
                                            type="number"
                                            id="rate"
                                            value={editedRate}
                                            onChange={(e) => {
                                                setEditedRate(parseFloat(e.target.value));
                                                setRateValidationError(null); // Clear error on change
                                            }}
                                            step="0.01"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-black"
                                        />
                                        {rateValidationError && (
                                            <p className="mt-2 text-sm text-red-600">{rateValidationError}</p>
                                        )}
                                        <p className="text-xs text-yellow-700 mt-2 p-2 bg-yellow-50 rounded-md border border-yellow-200">
                                            Recommended Minimum Rate (Award-based): ${MIN_RECOMMENDED_RATE_EXAMPLE.toFixed(2)}/hr. Please ensure the entered rate complies with Australian industrial awards. You can charge above, but not below, the recommended minimum.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-center gap-4">
                                    <button
                                        onClick={() => setIsApprovalModalOpen(false)}
                                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleConfirmSendTimesheet}
                                        className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                                    >
                                        Confirm and Send
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </div>
                    </Dialog>
                )}
            </AnimatePresence>

            {/* Success Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <Dialog as={motion.div} className="relative z-10" onClose={closeModal} open={isModalOpen}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30"
                            aria-hidden="true"
                        />
                        <div className="fixed inset-0 flex items-center justify-center p-4">
                            <Dialog.Panel
                                as={motion.div}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="relative bg-white rounded-lg p-6 shadow-xl max-w-sm mx-auto text-center"
                            >
                                {isExploding && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <ConfettiExplosion
                                            force={0.8}
                                            duration={3000}
                                            particleCount={200}
                                            width={1000}
                                            height={1000}
                                        />
                                    </div>
                                )}
                                <Dialog.Title as="h3" className="text-2xl font-bold text-green-600 mb-4">
                                    Hurray! 🎉
                                </Dialog.Title>
                                <p className="text-lg text-gray-700">Your job was done and timesheet has been sent successfully!</p>
                                <button
                                    onClick={closeModal}
                                    className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
                                >
                                    Great!
                                </button>
                            </Dialog.Panel>
                        </div>
                    </Dialog>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default StartJobPage;