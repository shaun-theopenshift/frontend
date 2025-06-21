"use client";

import SidebarProfile from '@/app/components/SidebarProfile';
import { useState, useEffect, useRef } from 'react';
import { PlusIcon, UsersIcon, HomeIcon, BriefcaseIcon, HeartIcon, CheckCircleIcon, UserIcon, ClipboardDocumentCheckIcon, CalendarDaysIcon, ClockIcon, MapPinIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { useLottie, LottieOptions } from 'lottie-react';
import jobHistoryAnimation from './jobHistory.json'; // Corrected import
import ReactDOM from 'react-dom';
import { api } from '@/utils/api';
import { useRouter } from 'next/navigation';
import { AU_STATES_SUBURBS, AU_STATE_LABELS } from '@/data/au-states-suburbs';
import React from "react";
import jsPDF from "jspdf";
import { logoBase64 } from "../../staff/jobs/logoBase64";

type GeoapifySuggestion = {
  properties: {
    place_id: string;
    formatted: string;
  };
};

function GeoapifyAutocomplete({ value, onChange }: { value: string; onChange: (address: string) => void }) {
	const [input, setInput] = useState(value || '');
	const [suggestions, setSuggestions] = useState<GeoapifySuggestion[]>([]);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	// Update input when value prop changes
	useEffect(() => {
		setInput(value || '');
	}, [value]);

	// Fetch suggestions from Geoapify API
	useEffect(() => {
		if (!input || input.length < 3) {
			setSuggestions([]);
			return;
		}

		const controller = new AbortController();
		setIsLoading(true);

		const timeout = setTimeout(() => {
			const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
			const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(input)}&limit=5&format=json&apiKey=${apiKey}`;
			
			console.log('Fetching suggestions for:', input);
			console.log('API URL:', url);
			
			fetch(url, { signal: controller.signal })
				.then(res => {
					console.log('Response status:', res.status);
					return res.json();
				})
				.then(data => {
					console.log('API Response:', data);
					setSuggestions(data.results || []);
					setIsLoading(false);
				})
				.catch(error => {
					console.error('Geoapify Error:', error);
					setSuggestions([]);
					setIsLoading(false);
				});
		}, 350); // debounce

		return () => {
			clearTimeout(timeout);
			controller.abort();
		};
	}, [input]);

	// Update parent state when input changes
	useEffect(() => {
		onChange(input);
	}, [input, onChange]);

	return (
		<div className="relative w-full">
			<input
				className="w-full border rounded-md p-2 text-black"
				value={input}
				onChange={e => {
					const newValue = e.target.value;
					setInput(newValue);
					setShowSuggestions(true);
				}}
				onFocus={() => setShowSuggestions(true)}
				onBlur={() => {
					// Delay hiding suggestions to allow for click events
					setTimeout(() => setShowSuggestions(false), 200);
				}}
				placeholder="Start typing address..."
				autoComplete="off"
			/>
			{showSuggestions && (suggestions.length > 0 || isLoading) && (
				<div
					className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
					style={{
						boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
					}}
				>
					{isLoading ? (
						<div className="px-4 py-2 text-gray-500 text-sm">Loading suggestions...</div>
					) : (
						<ul className="divide-y divide-gray-200">
							{suggestions.map((suggestion, index) => {
								const props = suggestion.properties;
								let display = '';
								if (props?.formatted) {
									display = props.formatted;
								} else if (props) {
									const parts = [
										(props as any)?.name,
										(props as any)?.city,
										(props as any)?.state,
										(props as any)?.country
									].filter(Boolean);
									display = parts.join(', ');
								}
								if (!display) return null;

								return (
									<li
										key={props?.place_id || index}
										className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm text-gray-800 transition-colors duration-150"
										onClick={() => {
											onChange(display);
											setInput(display);
											setShowSuggestions(false);
										}}
									>
										<div className="flex items-center gap-2">
											<MapPinIcon className="w-4 h-4 text-gray-400" />
											<span>{display}</span>
										</div>
									</li>
								);
							})}
						</ul>
					)}
				</div>
			)}
		</div>
	);
}

const SERVICE_TYPES = [
	{
		key: 'everyday',
		label: 'Daily living, social and community activities',
		icon: HomeIcon,
		description: 'Social support, housework, gardening, transport, meal prep and more.',
	},
	{
		key: 'self_care',
		label: 'Personal care',
		icon: HeartIcon,
		description: 'Showering, hoist and transfer, assistance with medication and more.',
		badge: 'Qualifications verified',
	},
	{
		key: 'nursing',
		label: 'Nursing',
		icon: ClipboardDocumentCheckIcon,
		description: 'Wound care, catheter care and more.',
		badge: 'Qualifications verified',
	},
	{
		key: 'healthcare',
		label: 'Allied health',
		icon: BriefcaseIcon,
		description: 'Occupational therapy, psychology, physiotherapy and speech therapy.',
		badge: 'Qualifications verified',
	},
];

const DAYS = [
	'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export default function ManageJobsPage() {
	const [activeTab, setActiveTab] = useState<'active' | 'history' | 'timesheet' | 'payments'>('active');
	const [showJobForm, setShowJobForm] = useState(false);
	const [step, setStep] = useState(1);
	const totalSteps = 4;
	const [selectedService, setSelectedService] = useState<string | null>(null);
	const [expandedService, setExpandedService] = useState<string | null>(null);
	const [location, setLocation] = useState('');
	const [suburb, setSuburb] = useState('');
	const [day, setDay] = useState('');
	const [startTime, setStartTime] = useState('');
	const [endTime, setEndTime] = useState('');
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [showExamples, setShowExamples] = useState(false);
	const [touched, setTouched] = useState<{title: boolean; description: boolean}>({title: false, description: false});
	const [showSuccessMessage, setShowSuccessMessage] = useState(false);
	const [activeJobs, setActiveJobs] = useState<any[]>([]); // State to hold active jobs
	const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
	const dropdownButtonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});
	const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
	const [errorMessage, setErrorMessage] = useState('');
	const [actionLoading, setActionLoading] = useState(false);
	const [editJob, setEditJob] = useState<any | null>(null);
	const [selectedState, setSelectedState] = useState<keyof typeof AU_STATES_SUBURBS | ''>('');
	const [expandedApplicantsJobId, setExpandedApplicantsJobId] = useState<number | null>(null);
	const [applicants, setApplicants] = useState<{ [jobId: number]: any[] }>({});
	const [applicantsLoading, setApplicantsLoading] = useState<{ [jobId: number]: boolean }>({});
	const [applicantsError, setApplicantsError] = useState<{ [jobId: number]: string }>({});
	const [applicantProfiles, setApplicantProfiles] = useState<{ [userId: string]: { fname: string; lname: string } | null }>({});
	const [profileLoading, setProfileLoading] = useState<{ [userId: string]: boolean }>({});
	const [timesheetActionLoading, setTimesheetActionLoading] = useState<{ [id: number]: boolean }>({});
	const [timesheetActionSuccess, setTimesheetActionSuccess] = useState<{ [id: number]: string }>({});
	const router = useRouter();

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				openDropdownId !== null &&
				dropdownButtonRefs.current[openDropdownId] &&
				!dropdownButtonRefs.current[openDropdownId]!.contains(event.target as Node) &&
				!(document.getElementById('dropdown-portal-menu')?.contains(event.target as Node))
			) {
				setOpenDropdownId(null);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [openDropdownId]);

	useEffect(() => {
		if (openDropdownId !== null && dropdownButtonRefs.current[openDropdownId]) {
			const rect = dropdownButtonRefs.current[openDropdownId]!.getBoundingClientRect();
			setDropdownPosition({
				top: rect.bottom + window.scrollY,
				left: rect.right - 224 + window.scrollX // 224px is the width of the dropdown
			});
		}
	}, [openDropdownId]);

	// Responsive: stack sidebar on mobile
	// Only one service can be selected
	const handleServiceSelect = (key: string) => {
		setSelectedService(key);
		setExpandedService(key);
	};

	// Fetch jobs from backend on mount
	useEffect(() => {
		api.getMyBookings()
			.then((data) => {
				const jobs = Array.isArray(data) ? data : (data.bookings || []);
				setActiveJobs(jobs);
			})
			.catch((err) => {
				console.error('Failed to fetch jobs:', err);
				setErrorMessage(err.message || 'Failed to fetch jobs');
			});
	}, []);

	// Utility to get correct start and end Date objects for overnight shifts
	const getShiftDateTimes = (dateStr: string, startTime: string, endTime: string) => {
		// dateStr: YYYY-MM-DD
		// startTime, endTime: HH:mm
		const [year, month, day] = dateStr.split('-').map(Number);
		const [startHour, startMinute] = startTime.split(':').map(Number);
		const [endHour, endMinute] = endTime.split(':').map(Number);

		const start = new Date(year, month - 1, day, startHour, startMinute);
		let end = new Date(year, month - 1, day, endHour, endMinute);

		// If end time is less than or equal to start time, add 1 day to end
		if (end <= start) {
			end.setDate(end.getDate() + 1);
		}

		return { start, end };
	};

	const handleSubmitJob = async () => {
		setErrorMessage('');
		// Validate required fields
		if (!selectedService || !location || !suburb || !day || !startTime || !endTime || !title || !description) {
			setErrorMessage('All fields are required.');
			return;
		}
		try {
			const { start, end } = getShiftDateTimes(day, startTime, endTime);
			const payload = {
				service: selectedService,
				start_time: start.toISOString(),
				end_time: end.toISOString(),
				address: location,
				suburb: suburb,
				title: title,
				description: description,
				notes: '',
			};
			if (editJob) {
				await api.editBooking(editJob.id, payload);
			} else {
				await api.createBooking(payload);
			}
			setShowSuccessMessage(true);
			setShowJobForm(false);
			setStep(1);
			setSelectedService(null);
			setLocation('');
			setSuburb('');
			setDay('');
			setStartTime('');
			setEndTime('');
			setTitle('');
			setDescription('');
			setTouched({ title: false, description: false });
			setEditJob(null);
			// Refetch jobs
			api.getMyBookings().then((data) => {
				setActiveJobs(Array.isArray(data) ? data : (data.bookings || []));
			});
			setTimeout(() => {
				setShowSuccessMessage(false);
				setShowJobForm(false);
				setActiveTab('active');
				router.push('/profile/organization/manage-job');
			}, 3000);
		} catch (err: any) {
			setErrorMessage(err.message || 'Failed to save job');
		}
	};

	const formatDateForInput = (dateString: string) => {
		// First, check if the date is already in YYYY-MM-DD format
		if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
			return dateString;
		}
		
		// Try parsing DD.MM.YYYY format
		const parts = dateString.split('.');
		if (parts.length === 3) {
			const [day, month, year] = parts;
			if (!isNaN(parseInt(day)) && !isNaN(parseInt(month)) && !isNaN(parseInt(year))) {
				return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
			}
		}
		
		// If all else fails, try to create a valid date string
		try {
			const date = new Date(dateString);
			if (!isNaN(date.getTime())) {
				return date.toISOString().split('T')[0];
			}
		} catch (e) {
			console.error('Error parsing date:', e);
		}
		
		return dateString;
	};

	// Debug function to check form values
	const debugFormValues = () => {
		console.log('Form Values:', {
			step,
			location,
			day,
			startTime,
			endTime,
			selectedService
		});
	};

	interface LottieAnimationProps {
		animationData: object;
		loop?: boolean;
		autoplay?: boolean;
		style?: React.CSSProperties;
	}

	const LottieAnimation = ({ animationData, loop = true, autoplay = true, style = {} }: LottieAnimationProps) => {
		const defaultOptions: LottieOptions = {
			animationData: animationData,
			loop: loop,
			autoplay: autoplay,
			rendererSettings: {
				preserveAspectRatio: 'xMidYMid slice'
			}
		};
	
		const { View } = useLottie(defaultOptions, style);
	
		return View;
	};

	// Cancel job handler
	const handleCancelJob = async (jobId: number) => {
		setActionLoading(true);
		setErrorMessage('');
		try {
			await api.cancelBooking(jobId);
			// Refresh jobs
			const data = await api.getMyBookings();
			setActiveJobs(Array.isArray(data) ? data : (data.bookings || []));
			setOpenDropdownId(null);
		} catch (err: any) {
			setErrorMessage(err.message || 'Failed to cancel job');
		} finally {
			setActionLoading(false);
		}
	};

	// Edit job handler (simple prompt for demo)
	const handleEditJob = (job: any) => {
		setEditJob(job);
		setShowJobForm(true);
		setStep(1);
		setSelectedService(job.service);
		setLocation(job.address);
		setSuburb(job.suburb);
		// Try to guess state from suburb
		let foundState = '';
		Object.entries(AU_STATES_SUBURBS).forEach(([state, suburbs]) => {
			if (suburbs.includes(job.suburb)) foundState = state;
		});
		setSelectedState(foundState as keyof typeof AU_STATES_SUBURBS | '');
		setDay(job.start_time ? job.start_time.slice(0, 10) : '');
		setStartTime(job.start_time ? job.start_time.slice(11, 16) : '');
		setEndTime(job.end_time ? job.end_time.slice(11, 16) : '');
		setTitle(job.title);
		setDescription(job.notes || '');
		setTouched({ title: false, description: false });
		setOpenDropdownId(null);
	};

	// Filter jobs for active and history tabs
	const nonHistoryStatuses = ['active', 'pending', 'confirmed', 'sent_for_approval'];
	const activeJobsList = activeJobs.filter((job: any) => !job.status || nonHistoryStatuses.includes(job.status));
	
	const timesheetHistoryJobs = activeJobs.filter((job: any) => 
		(job.status === 'pending_payment' || job.status === 'checked_out' || job.status === 'paid' || job.status === 'completed' || job.status === 'checked_in') 
		&& job.check_in_time
	);
	const canceledJobs = activeJobs.filter((job: any) => job.status === 'canceled' || job.status === 'cancelled');
	const historyJobsList = [...timesheetHistoryJobs, ...canceledJobs];

	// Fetch applicants for a job
	const handleViewApplicants = async (jobId: number) => {
		if (expandedApplicantsJobId === jobId) {
			setExpandedApplicantsJobId(null);
			return;
		}
		setExpandedApplicantsJobId(jobId);
		if (!applicants[jobId]) {
			setApplicantsLoading(a => ({ ...a, [jobId]: true }));
			setApplicantsError(a => ({ ...a, [jobId]: '' }));
			try {
				const data = await api.getApplicantsForJob(jobId);
				setApplicants(a => ({ ...a, [jobId]: Array.isArray(data) ? data : (data.items || []) }));
			} catch (e: any) {
				setApplicantsError(a => ({ ...a, [jobId]: e.message || 'Failed to fetch applicants' }));
			} finally {
				setApplicantsLoading(a => ({ ...a, [jobId]: false }));
			}
		}
	};

	// Add this helper function to refresh applicants for all expanded jobs
	const refreshApplicantsForVisibleJobs = async () => {
		if (expandedApplicantsJobId) {
			try {
				const data = await api.getApplicantsForJob(expandedApplicantsJobId);
				setApplicants(a => ({ ...a, [expandedApplicantsJobId]: Array.isArray(data) ? data : (data.items || []) }));
			} catch (e) {
				// Optionally handle error
			}
		}
	};

	// In handleRespondToApplicant, after setApplicants, also refresh applicants for visible jobs
	const handleRespondToApplicant = async (requestId: number, approve: boolean, jobId: number) => {
		setApplicantsLoading(a => ({ ...a, [jobId]: true }));
		try {
			await api.respondToRequest(requestId, approve);
			// Refresh applicants for this job
			const data = await api.getApplicantsForJob(jobId);
			setApplicants(a => ({ ...a, [jobId]: Array.isArray(data) ? data : (data.items || []) }));
			// Also refresh applicants for visible jobs (in case of check-in/check-out)
			await refreshApplicantsForVisibleJobs();
		} catch (e: any) {
			setApplicantsError(a => ({ ...a, [jobId]: e.message || 'Failed to update applicant' }));
		} finally {
			setApplicantsLoading(a => ({ ...a, [jobId]: false }));
		}
	};

	// Fetch applicant profile if not already loaded
	const fetchApplicantProfile = async (userId: string) => {
		if (applicantProfiles[userId] || profileLoading[userId]) return;
		setProfileLoading(p => ({ ...p, [userId]: true }));
		try {
			const profile = await api.getUserProfileById(userId);
			setApplicantProfiles(p => ({ ...p, [userId]: { fname: profile.fname, lname: profile.lname } }));
		} catch {
			setApplicantProfiles(p => ({ ...p, [userId]: null }));
		} finally {
			setProfileLoading(p => ({ ...p, [userId]: false }));
		}
	};

	// Remove useEffect from inside map and add this effect:
	React.useEffect(() => {
		if (!expandedApplicantsJobId || typeof expandedApplicantsJobId !== 'number') return;
		const applicantList = applicants[expandedApplicantsJobId] || [];
		applicantList.forEach((applicant: any) => {
			if (!applicantProfiles[applicant.user_id] && !profileLoading[applicant.user_id]) {
				fetchApplicantProfile(applicant.user_id);
			}
		});
		// eslint-disable-next-line
	}, [expandedApplicantsJobId, expandedApplicantsJobId ? applicants[expandedApplicantsJobId] : undefined]);

	// Add the downloadTimesheetPDF function
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

	// --- Amount Calculation Logic: tweak this if you want to change how the total amount is calculated ---
	const getAmountForJob = (job: any) => {
		const checkIn = job.check_in_time ? new Date(job.check_in_time) : null;
		const checkOut = job.check_out_time ? new Date(job.check_out_time) : null;
		const totalHours =
			checkIn && checkOut
				? ((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)).toFixed(2)
				: "0.00";
		return job.rate && totalHours
			? (job.rate * parseFloat(totalHours)).toFixed(2)
			: "0.00";
	};

	return (
		<div className="min-h-screen bg-white flex flex-col md:flex-row">
			<SidebarProfile userType="organization" />
			<main className="flex-1 md:pl-72 pt-8 px-2 sm:px-6">
				<div className="max-w-5xl mx-auto py-4 sm:py-8">
					{!showJobForm ? (
						<>
							{showSuccessMessage && (
								<div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
									<strong className="font-bold">Success!</strong>
									<span className="block sm:inline"> Your job has been listed successfully.</span>
								</div>
							)}
							{errorMessage && (
								<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
									<strong className="font-bold">Error:</strong>
									<span className="block sm:inline"> {errorMessage}</span>
								</div>
							)}
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
								<h1 className="text-2xl font-bold text-black">Manage Jobs</h1>
								<button
									className="flex items-center gap-2 px-5 py-2 rounded-md bg-[#2954bd] text-white font-semibold hover:bg-[#1d3e8a] transition"
									onClick={() => setShowJobForm(true)}
								>
									<PlusIcon className="w-5 h-5" />
									Create Job Listing
								</button>
							</div>
							{/* Tabs */}
							<div className="flex gap-4 border-b mb-6">
								<button
									className={`pb-2 px-2 text-lg font-medium border-b-2 transition-colors ${activeTab === 'active' ? 'border-[#2954bd] text-[#2954bd]' : 'border-transparent text-gray-500 hover:text-[#2954bd]'}`}
									onClick={() => setActiveTab('active')}
								>
									Active Jobs
								</button>
								<button
									className={`pb-2 px-2 text-lg font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-[#2954bd] text-[#2954bd]' : 'border-transparent text-gray-500 hover:text-[#2954bd]'}`}
									onClick={() => setActiveTab('history')}
								>
									History
								</button>
								<button
									className={`pb-2 px-2 text-lg font-medium border-b-2 transition-colors ${activeTab === 'timesheet' ? 'border-[#2954bd] text-[#2954bd]' : 'border-transparent text-gray-500 hover:text-[#2954bd]'}`}
									onClick={() => setActiveTab('timesheet')}
								>
									Timesheet Approval Requests
								</button>
								<button
									className={`pb-2 px-2 text-lg font-medium border-b-2 transition-colors ${activeTab === 'payments' ? 'border-[#2954bd] text-[#2954bd]' : 'border-transparent text-gray-500 hover:text-[#2954bd]'}`}
									onClick={() => setActiveTab('payments')}
								>
									Payments
								</button>
							</div>
							{/* Content */}
							<div>
								{activeTab === 'active' ? (
									activeJobsList.length === 0 ? (
										<div className="py-8 text-center text-gray-500 flex flex-col items-center justify-center">
											<div className="w-64 h-64">
												<LottieAnimation animationData={jobHistoryAnimation} loop={true} autoplay={true} />
											</div>
											<p className="mt-4 text-lg">No current Job listings.</p>
										</div>
									) : (
										<div className="w-full">
											<table className="min-w-full divide-y divide-gray-200 shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
												<thead className="bg-gray-50">
													<tr>
														<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job details</th>
														<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
														<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
														<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicants</th>
														<th scope="col" className="relative px-6 py-3 text-gray-500"><span className="sr-only">Edit</span>Action items</th>
													</tr>
												</thead>
												<tbody className="bg-white divide-y divide-gray-200">
													{activeJobsList.map((job) => {
														const applicantList = applicants[job.id] || [];
														const applicantCount = applicantList.length;
														return (
															<React.Fragment key={job.id}>
																<tr>
																	<td className="px-6 py-4 whitespace-nowrap">
																		<div className="text-sm text-gray-900">{job.title}</div>
																		<div className="text-sm text-gray-500">Date posted: {job.created_at ? new Date(job.created_at).toLocaleDateString() : ''}</div>
																	</td>
																	<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.status}</td>
																	<td className="px-6 py-4 whitespace-nowrap">
																		<div className="flex flex-wrap gap-2">
																			{job.service && (
																				<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
																					{job.service}
																				</span>
																			)}
																		</div>
																	</td>
																	<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
																		<button
																			className={`font-semibold underline hover:text-[#2954bd] transition ${expandedApplicantsJobId === job.id ? 'text-[#2954bd]' : ''}`}
																			onClick={() => {
																				console.log('Viewing applicants for job:', job);
																				handleViewApplicants(job.id);
																			}}
																			aria-expanded={expandedApplicantsJobId === job.id}
																			aria-controls={`applicants-list-${job.id}`}
																			type="button"
																		>
																			{applicantCount}
																		</button>
																	</td>
																	<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
																		<div className="relative inline-block text-left">
																			<button
																				type="button"
																				className="flex items-center text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
																				id={`options-menu-${job.id}`}
																				aria-expanded={openDropdownId === job.id ? "true" : "false"}
																				aria-haspopup="true"
																				onClick={() => setOpenDropdownId(openDropdownId === job.id ? null : job.id)}
																				ref={el => { dropdownButtonRefs.current[job.id] = el; }}
																			>
																				<span className="sr-only">Open options</span>
																				<EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
																			</button>
																			{openDropdownId === job.id && dropdownPosition && ReactDOM.createPortal(
																				<div
																					id="dropdown-portal-menu"
																					className="origin-top-right absolute z-50 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
																					role="menu"
																					aria-orientation="vertical"
																					aria-labelledby={`options-menu-${job.id}`}
																					style={{ top: dropdownPosition.top, left: dropdownPosition.left, position: 'absolute' }}
																				>
																					<div className="py-1" role="none">
																						<button
																							className="text-gray-700 block px-4 py-2 text-sm w-full text-left hover:bg-gray-100"
																							disabled={actionLoading}
																							onClick={() => handleCancelJob(job.id)}
																							role="menuitem"
																						>
																							Cancel job
																						</button>
																						<button
																							className="text-gray-700 block px-4 py-2 text-sm w-full text-left hover:bg-gray-100"
																							disabled={actionLoading}
																							onClick={() => handleEditJob(job)}
																							role="menuitem"
																						>
																							Edit job
																						</button>
																						<a href="#" className="text-gray-700 block px-4 py-2 text-sm" role="menuitem">Mark job as filled</a>
																					</div>
																				</div>,
																				document.body
																			)}
																		</div>
																	</td>
																</tr>
																{/* Inline applicants expansion */}
																{expandedApplicantsJobId === job.id && (
																	<tr>
																		<td colSpan={5} className="bg-gray-50 border-b border-gray-200">
																			<div className="p-6">
																				{applicantsLoading[job.id] ? (
																					<div className="text-gray-500">Loading applicants...</div>
																				) : applicantsError[job.id] ? (
																					<div className="text-red-500">{applicantsError[job.id]}</div>
																				) : applicantList.length === 0 ? (
																					<div className="text-gray-500">No applicants yet.</div>
																				) : (
																					<div className="space-y-4">
																						{applicantList.map((applicant: any) => {
																							const profile = applicantProfiles[applicant.user_id];
																							const loading = profileLoading[applicant.user_id];
																							// Find the job for this applicant
																							const jobForApplicant = activeJobsList.find((j: any) => j.id === applicant.booking_id) || historyJobsList.find((j: any) => j.id === applicant.booking_id);
																							const bookingStatus = jobForApplicant ? jobForApplicant.status : applicant.status;
																							// Check if any applicant is already approved for this job
																							const alreadyApproved = applicantList.some((a: any) => a.status === 'approved');
																							return (
																								<div key={applicant.id} className="bg-white border rounded-lg shadow p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
																									<div>
																										<div className="font-bold text-black">
																											Applicant: {loading ? <span className='text-gray-400'>Loading...</span> : profile ? `${profile.fname} ${profile.lname}` : <span className='text-gray-400'>Unknown</span>}
																										</div>
																										<div className="text-gray-700 text-sm mb-1">Comment: {applicant.comment || <span className='italic text-gray-400'>No comment</span>}</div>
																										<div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-2">
																											<span>Rate: <span className="font-semibold text-black">{applicant.rate}</span></span>
																											<span>Status: <span className={
																												applicant.status === 'approved' ? 'rounded-full px-2 py-1 bg-green-100 text-green-700 font-semibold' :
																												applicant.status === 'checked_in' ? 'rounded-full px-2 py-1 bg-green-100 text-green-700 font-semibold' :
																												applicant.status === 'pending' ? 'rounded-full px-2 py-1 bg-yellow-100 text-yellow-700 font-semibold' :
																												applicant.status === 'rejected' ? 'rounded-full px-2 py-1 bg-red-100 text-red-700 font-semibold' :
																												'rounded-full px-2 py-1 bg-gray-100 text-gray-700 font-semibold'
																											}>{applicant.status}</span></span>
																											<span>Request ID: <span className="font-semibold text-black">{applicant.id}</span></span>
																										</div>
																										<a
																											href={`/profile/organization/search-worker/profile/${applicant.user_id}`}
																											target="_blank"
																											rel="noopener noreferrer"
																											className="inline-block mt-1 px-4 py-1 rounded bg-[#2954bd] text-white font-semibold hover:bg-[#1d3e8a] transition text-xs"
																										>
																											View Profile
																										</a>
																									</div>
																									<div className="flex gap-2">
																										<button
																											className="px-4 py-1 rounded bg-green-600 text-white font-semibold hover:bg-green-700 transition disabled:opacity-50"
																											disabled={applicant.status !== 'pending' || applicantsLoading[job.id] || (alreadyApproved && applicant.status !== 'approved')}
																											onClick={() => handleRespondToApplicant(applicant.id, true, job.id)}
																										>
																											Approve
																										</button>
																										<button
																											className="px-4 py-1 rounded bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-50"
																											disabled={applicant.status !== 'pending' || applicantsLoading[job.id]}
																											onClick={() => handleRespondToApplicant(applicant.id, false, job.id)}
																										>
																											Reject
																										</button>
																									</div>
																								</div>
																							);
																						})}
																					</div>
																				)}
																			</div>
																		</td>
																	</tr>
																)}
															</React.Fragment>
														);
													})}
												</tbody>
											</table>
										</div>
									)
								) : activeTab === 'history' ? (
									historyJobsList.length === 0 ? (
										<div className="py-8 text-center text-gray-500 flex flex-col items-center justify-center">
											<div className="w-64 h-64">
												<LottieAnimation animationData={jobHistoryAnimation} loop={true} autoplay={true} />
											</div>
											<p className="mt-4 text-lg">No job history yet.</p>
										</div>
									) : (
										<div className="space-y-6">
											{historyJobsList.map((job) => (
												<div
													key={job.id}
													className="bg-white border rounded-2xl shadow-md p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
												>
													<div className="flex-1">
														<div className="mb-2 flex flex-col sm:flex-row sm:items-center sm:gap-4">
															<span className="font-bold text-lg text-[#2954bd]">{job.title}</span>
															<span className="text-xs text-gray-500 ml-2">Booking ID: <span className="font-semibold">{job.id}</span></span>
														</div>
														{job.check_in_time ? (
															<div className="flex flex-wrap gap-4 text-sm text-gray-700 mb-2">
																<span>
																	<span className="font-semibold">Check-in:</span>{' '}
																	{new Date(job.check_in_time).toLocaleString()}
																</span>
																<span>
																	<span className="font-semibold">Check-out:</span>{' '}
																	{job.check_out_time ? new Date(job.check_out_time).toLocaleString() : "-"}
																</span>
																<span>
																	<span className="font-semibold">Rate:</span> ${job.rate}
																</span>
																<span>
																	<span className="font-semibold">Amount:</span> ${job.amount}
																</span>
															</div>
														) : (
															<div className="text-sm text-gray-500">{job.notes}</div>
														)}
													</div>
													<div className="flex flex-col gap-2 min-w-[160px] items-end">
														<span className={`px-3 py-1 rounded-full text-xs font-semibold
															${job.status === 'pending_payment' ? 'bg-blue-100 text-blue-800' :
															job.status === 'checked_out' ? 'bg-yellow-100 text-yellow-800' :
															job.status === 'paid' || job.status === 'completed' || job.status === 'checked_in' ? 'bg-green-100 text-green-800' :
															'bg-gray-100 text-gray-800'
															}`}
														>
															{job.status}
														</span>
													</div>
												</div>
											))}
										</div>
									)
								) : activeTab === 'timesheet' ? (
									<div className="space-y-6">
										{activeJobs.filter(job => job.status === 'sent_for_approval').length === 0 ? (
											<div className="py-8 text-center text-gray-500 flex flex-col items-center justify-center">
												<p className="mt-4 text-lg">No timesheet approval requests.</p>
											</div>
										) : (
											activeJobs
												.filter(job => job.status === 'sent_for_approval')
												.map(job => (
													<div
														key={job.id}
														className="bg-white border rounded-2xl shadow-md p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
													>
														<div className="flex-1">
															<div className="mb-2 flex flex-col sm:flex-row sm:items-center sm:gap-4">
																<span className="font-bold text-lg text-[#2954bd]">{job.title}</span>
																<span className="text-xs text-gray-500 ml-2">Booking ID: <span className="font-semibold">{job.id}</span></span>
															</div>
															<div className="flex flex-wrap gap-4 text-sm text-gray-700 mb-2">
																<span>
																	<span className="font-semibold">Check-in:</span>{' '}
																	{job.check_in_time ? new Date(job.check_in_time).toLocaleString() : "-"}
																</span>
																<span>
																	<span className="font-semibold">Check-out:</span>{' '}
																	{job.check_out_time ? new Date(job.check_out_time).toLocaleString() : "-"}
																</span>
																<span>
																	<span className="font-semibold">Rate:</span> ${job.rate}
																</span>
																<span>
																	<span className="font-semibold">Amount:</span> ${job.amount}
																</span>
															</div>
														</div>
														<div className="flex flex-col gap-2 min-w-[160px] items-end">
															{timesheetActionSuccess[job.id] && (
																<div className="text-green-600 text-sm font-semibold mb-1">{timesheetActionSuccess[job.id]}</div>
															)}
															{job.status === 'pending_payment' && (
																<button className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition mt-2">Proceed to Pay</button>
															)}
															<button
																className="px-4 py-2 rounded bg-gray-200 text-[#2954bd] font-semibold hover:bg-gray-300 transition"
																onClick={() => downloadTimesheetPDF(job)}
															>
																Download Timesheet
															</button>
															<button
																className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 transition disabled:opacity-50"
																disabled={timesheetActionLoading[job.id]}
																onClick={async () => {
																	setTimesheetActionLoading(l => ({ ...l, [job.id]: true }));
																	setTimesheetActionSuccess(s => ({ ...s, [job.id]: '' }));
																	try {
																		const amount = getAmountForJob(job);
																		await api.approveTimesheet(job.id, true, amount);
																		setTimesheetActionSuccess(s => ({ ...s, [job.id]: 'Timesheet was approved successfully.' }));
																		// Update job status in UI
																		job.status = 'pending_payment';
																	} catch (e) {
																		setTimesheetActionSuccess(s => ({ ...s, [job.id]: 'Error approving.' }));
																	} finally {
																		setTimesheetActionLoading(l => ({ ...l, [job.id]: false }));
																	}
																}}
															>
																{timesheetActionLoading[job.id] ? 'Approving...' : 'Approve'}
															</button>
															<button
																className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-50"
																disabled={timesheetActionLoading[job.id]}
																onClick={async () => {
																	setTimesheetActionLoading(l => ({ ...l, [job.id]: true }));
																	setTimesheetActionSuccess(s => ({ ...s, [job.id]: '' }));
																	try {
																		const amount = getAmountForJob(job);
																		await api.approveTimesheet(job.id, false, amount);
																		setTimesheetActionSuccess(s => ({ ...s, [job.id]: 'Timesheet was denied.' }));
																		// Update job status in UI
																		job.status = 'checked_out';
																	} catch (e) {
																		setTimesheetActionSuccess(s => ({ ...s, [job.id]: 'Error rejecting.' }));
																	} finally {
																		setTimesheetActionLoading(l => ({ ...l, [job.id]: false }));
																	}
																}}
															>
																{timesheetActionLoading[job.id] ? 'Rejecting...' : 'Reject'}
															</button>
														</div>
													</div>
												))
										)}
									</div>
								) : activeTab === 'payments' ? (
									<div className="space-y-6">
										{activeJobs.filter(job => job.status === 'pending_payment').length === 0 ? (
											<div className="py-8 text-center text-gray-500 flex flex-col items-center justify-center">
												<p className="mt-4 text-lg">No pending payments.</p>
											</div>
										) : (
											activeJobs
												.filter(job => job.status === 'pending_payment')
												.map(job => (
													<div
														key={job.id}
														className="bg-white border rounded-2xl shadow-md p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
													>
														<div className="flex-1">
															<div className="mb-2 flex flex-col sm:flex-row sm:items-center sm:gap-4">
																<span className="font-bold text-lg text-[#2954bd]">{job.title}</span>
																<span className="text-xs text-gray-500 ml-2">Booking ID: <span className="font-semibold">{job.id}</span></span>
															</div>
															<div className="flex flex-wrap gap-4 text-sm text-gray-700 mb-2">
																<span>
																	<span className="font-semibold">Check-in:</span>{' '}
																	{job.check_in_time ? new Date(job.check_in_time).toLocaleString() : "-"}
																</span>
																<span>
																	<span className="font-semibold">Check-out:</span>{' '}
																	{job.check_out_time ? new Date(job.check_out_time).toLocaleString() : "-"}
																</span>
																<span>
																	<span className="font-semibold">Rate:</span> ${job.rate}
																</span>
																<span>
																	<span className="font-semibold">Amount:</span> ${job.amount}
																</span>
															</div>
														</div>
														<div className="flex flex-col gap-2 min-w-[160px] items-end">
															<button className="px-4 py-2 rounded bg-gray-200 text-[#2954bd] font-semibold hover:bg-gray-300 transition"
																onClick={() => downloadTimesheetPDF(job)}
															>
																Download Timesheet
															</button>
														</div>
													</div>
												))
										)}
									</div>
								) : null}
							</div>
						</>
					) : (
						<div className="flex flex-col md:flex-row gap-6 md:gap-8">
							{/* Stepper Sidebar */}
							<aside className="w-full md:w-1/3 max-w-xs mb-8 md:mb-0">
								<h2 className="text-2xl font-bold mb-8 text-black">Post a job</h2>
								<ol className="space-y-6">
									<li className="flex items-center gap-3">
										<div className={`rounded-full w-8 h-8 flex items-center justify-center font-bold border-2 ${step === 1 ? 'bg-[#2954bd] text-white border-[#2954bd]' : 'bg-white text-[#2954bd] border-[#2954bd]'}`}>1</div>
										<span className={step === 1 ? 'font-bold text-[#2954bd]' : 'text-gray-700'}>Service Types</span>
									</li>
									<li className="flex items-center gap-3">
										<div className={`rounded-full w-8 h-8 flex items-center justify-center font-bold border-2 ${step === 2 ? 'bg-[#2954bd] text-white border-[#2954bd]' : 'bg-white text-[#2954bd] border-[#2954bd]'}`}>2</div>
										<span className={step === 2 ? 'font-bold text-[#2954bd]' : 'text-gray-700'}>Location & Time</span>
									</li>
									<li className="flex items-center gap-3">
										<div className={`rounded-full w-8 h-8 flex items-center justify-center font-bold border-2 ${step === 3 ? 'bg-[#2954bd] text-white border-[#2954bd]' : 'bg-white text-[#2954bd] border-[#2954bd]'}`}>3</div>
										<span className={step === 3 ? 'font-bold text-[#2954bd]' : 'text-gray-700'}>Details</span>
									</li>
									<li className="flex items-center gap-3">
										<div className={`rounded-full w-8 h-8 flex items-center justify-center font-bold border-2 ${step === 4 ? 'bg-[#2954bd] text-white border-[#2954bd]' : 'bg-white text-[#2954bd] border-[#2954bd]'}`}>4</div>
										<span className={step === 4 ? 'font-bold text-[#2954bd]' : 'text-gray-700'}>Preview</span>
									</li>
								</ol>
							</aside>
							{/* Main Form Step */}
							<section className="flex-1 w-full max-w-2xl mx-auto">
								{step === 1 && (
									<>
										<div className="flex items-center justify-between mb-6 flex-wrap gap-2">
											<h1 className="text-2xl sm:text-3xl font-bold text-black border-2 border-[#2954bd] rounded px-4 py-2">Service Types</h1>
											<button className="text-[#2954bd] border border-[#2954bd] rounded px-4 py-1 font-semibold hover:bg-[#2954bd]/10 transition text-sm" onClick={() => setShowJobForm(false)}>Exit</button>
										</div>
										<p className="font-semibold text-lg mb-6 text-black/100">Select the support service you want to include.</p>
										<div className="flex flex-col gap-4">
											{SERVICE_TYPES.map((service) => {
												const checked = selectedService === service.key;
												return (
													<div
														key={service.key}
														className={`border rounded-xl p-5 flex flex-col sm:flex-row items-start gap-4 cursor-pointer transition shadow-sm ${checked ? 'border-[#2954bd] bg-[#e6f2f2]/60' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
														onClick={() => handleServiceSelect(service.key)}
													>
														<div className="flex items-center pt-1">
															<input
																type="radio"
																checked={checked}
																onChange={() => handleServiceSelect(service.key)}
																className="accent-[#2954bd] w-5 h-5 mr-3"
																onClick={e => e.stopPropagation()}
															/>
															<service.icon className="w-7 h-7 text-[#2954bd]" />
														</div>
														<div className="flex-1">
															<div className="flex items-center gap-2 mb-1">
																<span className="font-bold text-lg text-black">{service.label}</span>
																{service.badge && (
																	<span className="ml-2 px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 text-xs font-semibold flex items-center gap-1">
																		<CheckCircleIcon className="w-4 h-4 inline-block text-yellow-600" /> {service.badge}
																	</span>
																)}
															</div>
															<div className="text-gray-700 text-base">{service.description}</div>
														</div>
														{expandedService === service.key && (
															<div className="ml-0 sm:ml-4 mt-2 text-sm text-gray-600 w-full sm:w-56">
																<span className="block font-semibold mb-1">Included:</span>
																{service.description}
															</div>
														)}
													</div>
												);
											})}
										</div>
									</>
								)}
								{step === 2 && (
									<>
										<div className="flex items-center justify-between mb-6 flex-wrap gap-2">
											<h1 className="text-2xl sm:text-3xl font-bold text-black border-2 border-[#2954bd] rounded px-4 py-2 flex items-center gap-2"><MapPinIcon className="w-7 h-7 text-[#2954bd]" />Location</h1>
											<button className="text-[#2954bd] border border-[#2954bd] rounded px-4 py-1 font-semibold hover:bg-[#2954bd]/10 transition text-sm" onClick={() => setShowJobForm(false)}>Exit</button>
										</div>
										<div className="mb-6">
											<label className="block font-semibold mb-2 text-black">State</label>
											<select
												className="w-full border rounded-md p-2 text-black"
												value={selectedState}
												onChange={e => {
													setSelectedState(e.target.value as keyof typeof AU_STATES_SUBURBS | '');
													setSuburb('');
												}}
											>
												<option value="">Select state</option>
												{Object.entries(AU_STATE_LABELS).map(([code, label]) => (
													<option key={code} value={code}>{label}</option>
												))}
											</select>
										</div>
										{selectedState && (
											<div className="mb-6">
												<label className="block font-semibold mb-2 text-black">Suburb</label>
												<select
													className="w-full border rounded-md p-2 text-black"
													value={suburb}
													onChange={e => setSuburb(e.target.value)}
												>
													<option value="">Select suburb</option>
													{(selectedState ? AU_STATES_SUBURBS[selectedState] : []).map((s: string) => (
														<option key={s} value={s}>{s}</option>
													))}
												</select>
											</div>
										)}
										<div className="mb-6">
											<label className="block font-semibold mb-2 text-black">Where do you want support?</label>
											<p className="text-gray-600 mb-2">The starting suburb where support will take place. Start typing the suburb or postcode and select from the list.</p>
											<GeoapifyAutocomplete value={location} onChange={setLocation} />
										</div>
										<div className="flex flex-col sm:flex-row gap-4 mb-6">
											<div className="flex-1">
												<label className="block font-semibold mb-2 text-black">Date</label>
												<div className="flex items-center gap-2">
													<CalendarDaysIcon className="w-5 h-5 text-[#2954bd]" />
													<input
														type="date"
														className="w-full border rounded-md p-2 text-black"
														value={day}
														onChange={e => {
															const formattedDate = formatDateForInput(e.target.value);
															console.log('Date Input:', {
																original: e.target.value,
																formatted: formattedDate
															});
															setDay(formattedDate);
														}}
														min={new Date().toISOString().split('T')[0]}
													/>
												</div>
											</div>
											<div className="flex-1">
												<label className="block font-semibold mb-2 text-black">Start Time</label>
												<div className="flex items-center gap-2">
													<ClockIcon className="w-5 h-5 text-[#2954bd]" />
													<input type="time" className="w-full border rounded-md p-2 text-black" value={startTime} onChange={e => setStartTime(e.target.value)} />
												</div>
											</div>
											<div className="flex-1">
												<label className="block font-semibold mb-2 text-black">End Time</label>
												<div className="flex items-center gap-2">
													<ClockIcon className="w-5 h-5 text-[#2954bd]" />
													<input type="time" className="w-full border rounded-md p-2 text-black" value={endTime} onChange={e => setEndTime(e.target.value)} />
												</div>
											</div>
										</div>
									</>
								)}
								{step === 3 && (
									<>
										<div className="flex items-center justify-between mb-6 flex-wrap gap-2">
											<h1 className="text-2xl sm:text-3xl font-bold text-black border-2 border-[#2954bd] rounded px-4 py-2">Support details</h1>
											<button className="text-[#2954bd] border border-[#2954bd] rounded px-4 py-1 font-semibold hover:bg-[#2954bd]/10 transition text-sm" onClick={() => setShowJobForm(false)}>Exit</button>
										</div>
										<div className="mb-8">
											<label className="block font-bold text-lg mb-1 text-[#2954bd]">Job Title</label>
											<p className="text-gray-700 mb-2">Summarise the support activities you want e.g. 'Help a female teenager get ready for school and share a passion for Star Wars!'</p>
											<input
												className={`w-full border rounded-md p-3 text-black text-base mb-1 ${touched.title && !title ? 'border-red-500' : 'border-gray-300'}`}
												placeholder="E.g. personal carer for an adult"
												value={title}
												onChange={e => setTitle(e.target.value)}
												onBlur={() => setTouched(t => ({...t, title: true}))}
												maxLength={100}
											/>
											{touched.title && !title && (
												<div className="text-red-600 text-sm flex items-center gap-1 mb-1"><span>⚠️</span> Please enter a title</div>
											)}
										</div>
										<div className="mb-8">
											<label className="block font-bold text-lg mb-1 text-[#2954bd]">What will the support worker do?</label>
											<p className="text-gray-700 mb-2">Describe key activities and requirements in detail.</p>
											<textarea
												className={`w-full border rounded-md p-3 text-black text-base mb-1 resize-none min-h-[120px] ${touched.description && (description.length < 10) ? 'border-red-500' : 'border-gray-300'}`}
												placeholder="To help..."
												value={description}
												onChange={e => setDescription(e.target.value)}
												onBlur={() => setTouched(t => ({...t, description: true}))}
												maxLength={1500}
											/>
											<div className="flex justify-between text-xs text-gray-500 mb-1">
												<span>Minimum 10 characters</span>
												<span>{description.length}/255</span>
											</div>
											{touched.description && description.length < 10 && (
												<div className="text-red-600 text-sm flex items-center gap-1 mb-1"><span>⚠️</span> Please enter a description</div>
											)}
											
										</div>
										{/* Tips block */}
										<div className="bg-gray-100 border rounded-lg p-5 mb-8 flex flex-col gap-2 text-gray-800 max-w-md mx-auto">
											<div className="flex items-center gap-2 font-semibold text-base"><span>💡</span> Tips for writing support details</div>
											<ul className="list-disc pl-5 text-sm mt-1">
												<li><span className="font-semibold">Include all relevant information</span> – The more information you provide, the better your matches will be. Workers can't read your profile until you enter an agreement with them.</li>
												<li><span className="font-semibold">Read the examples</span> – Below each text box are example responses to use as a guide.</li>
												<li><span className="font-semibold">Use dot points</span> – If you prefer, you can write your support details in short dot points.</li>
											</ul>
										</div>
									</>
								)}
								{step === 4 && (
									<>
										<div className="flex items-center justify-between mb-6 flex-wrap gap-2">
											<h1 className="text-2xl sm:text-3xl font-bold text-black border-2 border-[#2954bd] rounded px-4 py-2">Preview Your Job</h1>
											<button className="text-[#2954bd] border border-[#2954bd] rounded px-4 py-1 font-semibold hover:bg-[#2954bd]/10 transition text-sm" onClick={() => setShowJobForm(false)}>Exit</button>
										</div>
										<div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
											<h2 className="text-xl font-bold text-black mb-4">{title}</h2>
											<div className="text-gray-700 mb-6 whitespace-pre-wrap">{description}</div>

											<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-800">
												<div>
													<p className="font-semibold text-sm text-gray-500">Service Type</p>
													<p className="font-medium text-lg text-black">{SERVICE_TYPES.find(s => s.key === selectedService)?.label}</p>
												</div>
												<div>
													<p className="font-semibold text-sm text-gray-500">Location</p>
													<p className="font-medium text-lg text-black">{location}</p>
												</div>
												<div>
													<p className="font-semibold text-sm text-gray-500">Date</p>
													<p className="font-medium text-lg text-black">{day}</p>
												</div>
												<div>
													<p className="font-semibold text-sm text-gray-500">Time</p>
													<p className="font-medium text-lg text-black">{startTime} - {endTime}</p>
												</div>
											</div>
										</div>
									</>
								)}
								{/* Progress bar and navigation */}
								<div className="mt-10 flex flex-col gap-4">
									<div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
										<div className="h-full bg-[#2954bd] transition-all" style={{ width: `${(step / totalSteps) * 100}%` }} />
									</div>
									<div className="flex flex-col sm:flex-row justify-between items-center mt-2 gap-4">
										<button
											className="px-6 py-2 rounded border border-[#2954bd] text-[#2954bd] font-semibold hover:bg-[#2954bd]/10 transition w-full sm:w-auto"
											onClick={() => step === 1 ? setShowJobForm(false) : setStep(step - 1)}
										>
											Back
										</button>
										<span className="text-gray-500 text-sm">{Math.round((step / totalSteps) * 100)}% complete</span>
										<button
											className="px-8 py-2 rounded bg-[#2954bd] text-white font-semibold hover:bg-[#1d3e8a] transition disabled:opacity-50 w-full sm:w-auto"
											disabled={
												(step === 1 && !selectedService) ||
												(step === 2 && (!location || !day || !startTime || !endTime)) ||
												(step === 3 && (!title || description.length < 10))
											}
											onClick={() => {
												debugFormValues(); // Add debug logging
												step === totalSteps ? handleSubmitJob() : setStep(step + 1);
											}}
										>
											{step === totalSteps ? 'Submit Job' : 'Continue'}
										</button>
									</div>
								</div>
							</section>
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
