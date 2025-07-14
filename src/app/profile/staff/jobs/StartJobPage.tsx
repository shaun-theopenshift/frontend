"use client";

import React, { useState, useEffect, Fragment } from "react";
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
} from "@heroicons/react/24/outline";
import { api } from "@/utils/api"; // Assuming your API utility is at this path
import ConfettiExplosion from 'react-confetti-explosion'; // For the party popper effect

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
    status?: 'approved' | 'rejected' | 'pending' | 'sent_for_approval' | 'completed' | 'in_progress' | 'cancelled' | 'pending_payment'; // Added pending_payment status
}

interface TimesheetResponse {
    check_in_time: string;
    check_out_time: string | null;
    booking_id: string;
    // Add any other relevant fields from your API response
}

// --- StartJobPage COMPONENT ---
const StartJobPage = ({ jobId, onBack }: { jobId: string, onBack: () => void }) => {
    const [jobDetails, setJobDetails] = useState<Job | null>(null);
    const [loadingJobDetails, setLoadingJobDetails] = useState(true);
    const [jobDetailsError, setJobDetailsError] = useState<string | null>(null);
    const [timer, setTimer] = useState(0); // Timer in seconds
    const [isRunning, setIsRunning] = useState(false);
    const [checkInTime, setCheckInTime] = useState<Date | null>(null);
    const [checkOutTime, setCheckOutTime] = useState<Date | null>(null);
    const [isTimesheetSubmitted, setIsTimesheetSubmitted] = useState(false);
    const [isExploding, setIsExploding] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Fetch job details on component mount
    useEffect(() => {
        const fetchJob = async () => {
            setLoadingJobDetails(true);
            setJobDetailsError(null);
            try {
                const data = await api.getBookingById(jobId); 
                
                if (data) {
                    setJobDetails(data);
                    // Initialize check-in/out times if already present in booking data
                    if (data.check_in_time) {
                        setCheckInTime(new Date(data.check_in_time));
                        if (data.check_out_time) {
                            setCheckOutTime(new Date(data.check_out_time));
                            setIsRunning(false); // Timer should not be running if checked out
                            // If status is 'sent_for_approval' or 'completed' or 'pending_payment', mark as submitted
                            if (data.status === 'sent_for_approval' || data.status === 'completed' || data.status === 'pending_payment') {
                                setIsTimesheetSubmitted(true);
                            }
                        } else {
                            // If checked in but not checked out, timer should be running
                            setIsRunning(true);
                            // Calculate initial timer value if check_in_time is available
                            const now = new Date();
                            const checkIn = new Date(data.check_in_time);
                            setTimer(Math.floor((now.getTime() - checkIn.getTime()) / 1000));
                        }
                    }
                } else {
                    setJobDetailsError("Job details not found for this ID.");
                }

            } catch (error: any) {
                setJobDetailsError(error.message || "Failed to load job details.");
            } finally {
                setLoadingJobDetails(false);
            }
        };
        fetchJob();
    }, [jobId]);

    // Timer logic
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
            const response: TimesheetResponse = await api.checkInBooking(Number(jobId), false);
            setCheckInTime(new Date(response.check_in_time));
            setIsRunning(true);
            setTimer(0); // Reset timer on fresh check-in
        } catch (error: any) {
            alert(`Check-in failed: ${error.message}`);
        }
    };

    const handleCheckOut = async () => {
        try {
            const response: TimesheetResponse = await api.checkInBooking(Number(jobId), true);
            setCheckOutTime(new Date(response.check_out_time || new Date()));
            setIsRunning(false);
        } catch (error: any) {
            alert(`Check-out failed: ${error.message}`);
        }
    };

    const handleSendTimesheet = async () => {
        if (!checkInTime || !checkOutTime || !jobDetails?.id) {
            alert("Please check in and check out before sending the timesheet.");
            return;
        }

        try {
            const payload = {
                check_in_time: checkInTime.toISOString(),
                check_out_time: checkOutTime.toISOString(),
                rate: jobDetails.rate || 0,
            };
            await api.sendTimesheet(Number(jobId), payload); 

            setIsTimesheetSubmitted(true);
            setIsExploding(true);
            setIsModalOpen(true);

            // Update job status locally to reflect timesheet sent for approval
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

    const renderTopHalfContent = () => {
        if (jobDetails?.status === 'pending_payment') {
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
                        {!checkInTime && ( // Show Check In if not checked in
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleCheckIn}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold shadow-md hover:bg-indigo-700 transition-colors"
                            >
                                Check In
                            </motion.button>
                        )}
                        {checkInTime && !checkOutTime && ( // Show Check Out if checked in but not checked out
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
                    {checkInTime && checkOutTime && !isTimesheetSubmitted && ( // Show Send Timesheet if checked in and out, but not yet submitted
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleSendTimesheet}
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

            {loadingJobDetails ? (
                <p className="text-lg text-gray-500">Loading job details...</p>
            ) : jobDetailsError ? (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg"><h3 className="text-xl font-semibold">Error</h3><p>{jobDetailsError}</p></div>
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
                            {/* Display rate if available */}
                            {jobDetails.rate !== undefined && (
                                <p className="flex items-center gap-2">
                                    <ClockIcon className="w-5 h-5 text-gray-500" />
                                    <span className="font-semibold">Agreed Rate:</span> ${jobDetails.rate}/hr
                                </p>
                            )}
                            {/* Display current job status */}
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
                                        jobDetails.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-800' : // New style for pending_payment
                                        'bg-gray-100 text-gray-800' // Default/fallback
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
