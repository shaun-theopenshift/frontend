"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import {
  UserGroupIcon,
  BuildingOfficeIcon,
  UserCircleIcon,
  IdentificationIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  DocumentIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import LoadingScreen from "../../components/LoadingScreen";
import { api, StaffProfile } from "@/utils/api";
import ErrorToast from "@/app/components/ErrorToast";
import InfoTooltip from "@/app/components/InfoTooltip";
import { AU_STATES_SUBURBS, AU_STATE_LABELS } from "@/data/au-states-suburbs";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/utils/cropImage";
import { Area } from "react-easy-crop";
import { getAccessToken } from "@/utils/api";

// Framer Motion & Headless UI Imports
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Transition, Listbox } from "@headlessui/react";
import {
  CheckIcon,
  ChevronUpDownIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";

const STEPS = [
  {
    id: "Profile",
    label: "Personal Info",
    icon: <UserCircleIcon className="w-5 h-5" />,
  },
  {
    id: "Account",
    label: "Account Details",
    icon: <IdentificationIcon className="w-5 h-5" />,
  },
  {
    id: "Submit",
    label: "Review & Submit",
    icon: <CheckCircleIcon className="w-5 h-5" />,
  },
];

interface Experience {
  companyName: string;
  position: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
}

// Add TFN validation function
function validateTFN(tfn: string): boolean {
  // Remove any non-digit characters
  const digits = tfn.replace(/\D/g, "");

  // Check if length is 9 digits
  if (digits.length !== 9) return false;

  // TFN validation algorithm
  const weights = [1, 4, 3, 7, 5, 8, 6, 9, 10];
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * weights[i];
  }

  return sum % 11 === 0;
}

function calculateExperience(
  startDate: string,
  endDate: string,
  isCurrent: boolean
): string {
  if (!startDate) return "";

  const start = new Date(startDate);
  const end = isCurrent ? new Date() : new Date(endDate);

  if (isNaN(start.getTime()) || (!isCurrent && isNaN(end.getTime()))) return "";

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
  const diffMonths = Math.floor(
    (diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30)
  );

  let result = "";
  if (diffYears > 0) {
    result += `${diffYears} year${diffYears > 1 ? "s" : ""}`;
  }
  if (diffMonths > 0) {
    if (result) result += " and ";
    result += `${diffMonths} month${diffMonths > 1 ? "s" : ""}`;
  }

  return result || "Less than a month";
}

export default function ProfileCompletion() {
  const { user, error, isLoading: authLoading } = useUser();
  const searchParams = useSearchParams();

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  // Manage object URL for selectedImage to prevent infinite loop and memory leaks
  useEffect(() => {
    if (selectedImage) {
      const url = URL.createObjectURL(selectedImage);
      setSelectedImageUrl(url);
      return () => {
        URL.revokeObjectURL(url);
        setSelectedImageUrl(null);
      };
    } else {
      setSelectedImageUrl(null);
    }
  }, [selectedImage]);

  // @ts-expect-error Next.js useSearchParams never returns null
  const isEditMode = searchParams.get("edit") === "1";
  const [loading, setLoading] = useState(isEditMode);
  const [activeTab, setActiveTab] = useState("Profile");
  const [aboutMe, setAboutMe] = useState("");
  const [personalDetails, setPersonalDetails] = useState({
    firstName: "",
    lastName: "",
    address: "",
    dob: "",
    gender: "",
    phone: "",
  });
  const [emergencyContact, setEmergencyContact] = useState({
    name: "",
    phone: "",
  });
  const [tfn, setTfn] = useState({ number: "" });
  const [showToast, setShowToast] = useState(false); // This seems to be replaced by errorToast/submissionStatus

  // Add these missing states and refs
  const [profilePic, setProfilePic] = useState<string | null>(null);
  // const [showAvatarMenu, setShowAvatarMenu] = useState(false); // Replaced by Headless UI Menu
  const avatarRef = useRef<HTMLDivElement>(null); // Still useful for general ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  const [submissionStatus, setSubmissionStatus] = useState<{
    type: "success" | "error" | "info" | null; // Added 'info' type
    message: string;
  }>({ type: null, message: "" });

  const [skills, setSkills] = useState("");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [skillsInput, setSkillsInput] = useState("");
  const [skillsList, setSkillsList] = useState<string[]>([]);

  const [errorToast, setErrorToast] = useState<{
    message: string;
    isVisible: boolean;
  }>({
    message: "",
    isVisible: false,
  });

  const [selectedState, setSelectedState] = useState("");
  const [selectedSuburb, setSelectedSuburb] = useState("");

  // Add the profile picture handler

  // Max file size: 5MB, allowed types: jpeg, png, jpg
  const validatePhoto = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
        resolve("Only JPG and PNG images are allowed.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        // Corrected to 5MB
        resolve("Image must be less than 5MB.");
        return;
      }
      // Optional: Check dimensions
      const img = new window.Image();
      img.onload = () => {
        if (img.width < 200 || img.height < 200) {
          resolve("Image must be at least 200x200 pixels.");
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve("Invalid image file.");
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadProfilePic = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    const token = await getAccessToken();
    const res = await fetch("https://img.theopenshift.com/v1/upload/", {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error("Could not parse server response.");
    }
    if (!res.ok) {
      throw new Error(data?.error || data?.message || "Failed to upload image");
    }
    return data.image_url || data.url || data;
  };

  const handleProfilePic = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const error = await validatePhoto(file);
      if (error) {
        setErrorToast({ message: error, isVisible: true });
        return;
      }
      setSelectedImage(file);
      setShowCropper(true);
    }
  };

  // Removed click outside handler for avatar menu as Headless UI handles it

  // Validation functions
  const validateName = (name: string): boolean => {
    return /^[A-Za-z\s'-]{2,50}$/.test(name);
  };

  function toE164AU(input: string): string {
    let cleaned = input.replace(/[^\d]/g, "");
    if (cleaned.startsWith("0")) cleaned = cleaned.substring(1);
    if (cleaned && !cleaned.startsWith("61")) cleaned = "61" + cleaned;
    return "+" + cleaned;
  }

  const validatePhone = (phone: string): boolean => {
    // Accept only E.164 AU format
    return /^\+61[2-4789]\d{8}$/.test(phone.replace(/[\s-]/g, ""));
  };

  const validateDateOfBirth = (dob: string): boolean => {
    const date = new Date(dob);
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < date.getDate())
    ) {
      return age - 1 >= 18;
    }
    return age >= 18;
  };

  // Required fields check
  const allFilled =
    aboutMe &&
    personalDetails.firstName &&
    validateName(personalDetails.firstName) &&
    personalDetails.lastName &&
    validateName(personalDetails.lastName) &&
    personalDetails.address &&
    personalDetails.dob &&
    validateDateOfBirth(personalDetails.dob) &&
    personalDetails.gender &&
    personalDetails.phone &&
    validatePhone(personalDetails.phone) &&
    emergencyContact.name &&
    validateName(emergencyContact.name) &&
    emergencyContact.phone &&
    validatePhone(emergencyContact.phone) &&
    tfn.number &&
    validateTFN(tfn.number);

  // Check user type and redirect if necessary
  useEffect(() => {
    if (user) {
      const userType = user["https://theopenshift.com/user_type"];
      if (userType === "organization") {
        router.push("/profile-completion/organization");
      }
    }
  }, [user, router]);

  // Prefill form in edit mode
  useEffect(() => {
    if (isEditMode && user) {
      setLoading(true);
      fetch("/api/auth/session")
        .then((res) => res.json())
        .then((session) => {
          if (!session?.accessToken) throw new Error("No access token");
          return fetch("https://api.theopenshift.com/v1/users/me", {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
              Accept: "application/json",
            },
          });
        })
        .then((res) => res.json())
        .then((profile) => {
          setAboutMe(profile.bio || "");
          setPersonalDetails({
            firstName: profile.fname || "",
            lastName: profile.lname || "",
            address: profile.address || "",
            dob: profile.dob || "",
            gender: profile.gender || "",
            phone: profile.phone || "",
          });
          setEmergencyContact({
            name: profile.emergency_contact || "",
            phone: profile.emergency_contact_phone || "",
          });
          setTfn({ number: profile.tfn || "" });
          const skillsArray = profile.skills || [];
          setSkillsList(skillsArray);
          setSkills(skillsArray.join(", "));
          if (profile.profile_picture) {
            setProfilePic(profile.profile_picture);
          }

          // Pre-select state and suburb if address is set
          if (profile.address) {
            const foundState = Object.entries(AU_STATES_SUBURBS).find(
              ([stateCode, suburbs]) => suburbs.includes(profile.address)
            );
            if (foundState) {
              setSelectedState(foundState[0]);
              setSelectedSuburb(profile.address);
            }
          }
        })
        .catch((e) => {
          setSubmissionStatus({
            type: "error",
            message: "Failed to load profile for editing.",
          });
        })
        .finally(() => setLoading(false));
    }
  }, [isEditMode, user]);

  // Update the handleFinish function to use the new error toast
  const handleFinish = async () => {
    if (!user) {
      setErrorToast({
        message: "You must be logged in to submit your profile.",
        isVisible: true,
      });
      return;
    }
    try {
      setSubmissionStatus({
        type: "info", // Set to 'info' for loading state
        message: isEditMode
          ? "Updating your profile..."
          : "Creating your profile...",
      });
      const skillsArray = skillsList.map((s) => s.trim()).filter(Boolean);
      const profileData: StaffProfile = {
        fname: String(personalDetails.firstName),
        lname: String(personalDetails.lastName),
        address: String(personalDetails.address),
        dob: String(personalDetails.dob),
        gender: String(personalDetails.gender),
        phone: String(personalDetails.phone),
        bio: String(aboutMe),
        emergency_contact: String(emergencyContact.name),
        emergency_contact_phone: String(emergencyContact.phone),
        tfn: String(tfn.number),
        skills: skillsArray,
        //profile_picture: profilePic || undefined, // Include profile pic
      };
      console.log(
        "Sending profile data:",
        JSON.stringify(profileData, null, 2)
      );
      let result;
      if (isEditMode) {
        result = await api.updateStaffProfile(profileData);
      } else {
        result = await api.updateStaffProfile(profileData);
      }
      console.log(result);
      setSubmissionStatus({
        type: "success",
        message: isEditMode
          ? "Profile updated successfully!"
          : "Profile created successfully!",
      });
      // setShowToast(true); // Replaced by submissionStatus
      setTimeout(() => {
        // setShowToast(false); // Replaced by submissionStatus
        setSubmissionStatus({ type: null, message: "" }); // Clear submission status
        router.push("/profile");
      }, 3000);
    } catch (error: unknown) {
      console.error("Error creating profile:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      setErrorToast({
        message: `Failed to ${
          isEditMode ? "update" : "create"
        } profile: ${errorMessage}. Please try again or contact support if the problem persists.`,
        isVisible: true,
      });
      setSubmissionStatus({
        type: "error",
        message: "",
      });
    }
  };

  // Add function to check if a step is completed
  const isStepCompleted = (stepId: string) => {
    if (stepId === "Profile") {
      return Boolean(
        aboutMe &&
          personalDetails.firstName &&
          validateName(personalDetails.firstName) &&
          personalDetails.lastName &&
          validateName(personalDetails.lastName) &&
          personalDetails.address &&
          personalDetails.dob &&
          validateDateOfBirth(personalDetails.dob) &&
          personalDetails.gender &&
          personalDetails.phone &&
          validatePhone(personalDetails.phone) &&
          skillsList.length > 0
      );
    }
    if (stepId === "Account") {
      return Boolean(
        emergencyContact.name &&
          validateName(emergencyContact.name) &&
          emergencyContact.phone &&
          validatePhone(emergencyContact.phone) &&
          tfn.number &&
          validateTFN(tfn.number)
      );
    }
    return false;
  };

  // Update completed steps when form data changes
  useEffect(() => {
    const newCompletedSteps = STEPS.filter((step) =>
      isStepCompleted(step.id)
    ).map((step) => step.id);
    setCompletedSteps(newCompletedSteps);
  }, [aboutMe, personalDetails, emergencyContact, tfn, skillsList]);

  // Add function to handle skills
  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && skillsInput.trim()) {
      e.preventDefault();
      const newSkill = skillsInput.trim();
      if (!skillsList.includes(newSkill)) {
        setSkillsList([...skillsList, newSkill]);
      }
      setSkillsInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const newSkillsList = skillsList.filter((skill) => skill !== skillToRemove);
    setSkillsList(newSkillsList);
  };

  if (authLoading) {
    return <LoadingScreen />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg">
        Loading profile for editing...
      </div>
    );
  }

  const GENDERS = [
    { id: "male", name: "Male" },
    { id: "female", name: "Female" },
    { id: "other", name: "Other" },
    { id: "", name: "Select gender" }, // Placeholder option
  ];

  return (
    <div className="min-h-screen bg-white text-black">
      <main className="flex-1 flex flex-col items-center">
        {/* Navbar with logo and avatar */}
        <nav className="w-full flex justify-between items-center h-16 px-4 sm:px-8 bg-white border-b shadow-sm">
          <div className="text-2xl font-bold text-[#2954bd] tracking-tight">
            TheOpenShift
          </div>
          <Menu as="div" className="relative z-20">
            <div>
              <Menu.Button
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#67b5b5] border border-gray-200"
                aria-label="Open user menu"
                tabIndex={0}
              >
                {profilePic ? (
                  <Image
                    src={profilePic}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="object-cover w-10 h-10"
                  />
                ) : (
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="/api/auth/logout"
                        className={`${
                          active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                        } block px-4 py-2 text-sm`}
                      >
                        Sign out
                      </a>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </nav>

        <AnimatePresence>
          {showCropper && selectedImage && selectedImageUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
            >
              <motion.div
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 50 }}
                className="bg-white p-6 rounded-lg shadow-lg relative flex flex-col items-center"
                style={{ width: 350, maxWidth: "90vw" }}
              >
                <div
                  style={{
                    position: "relative",
                    width: 250,
                    height: 250,
                    background: "#111",
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  <Cropper
                    image={selectedImageUrl}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_, croppedAreaPixels) =>
                      setCroppedAreaPixels(croppedAreaPixels)
                    }
                  />
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full mt-4"
                />
                <div className="flex justify-end gap-2 mt-4 w-full">
                  <button
                    className="px-4 py-2 bg-gray-200 rounded"
                    onClick={() => setShowCropper(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-[#2954bd] text-white rounded"
                    onClick={async () => {
                      if (
                        !croppedAreaPixels ||
                        !selectedImageUrl ||
                        !selectedImage
                      )
                        return;
                      const croppedBlob = await getCroppedImg(
                        selectedImageUrl,
                        croppedAreaPixels
                      );
                      try {
                        setSubmissionStatus({
                          type: "info",
                          message: "Uploading photo...",
                        });
                        const formData = new FormData();
                        formData.append(
                          "file",
                          croppedBlob,
                          selectedImage.name
                        );
                        const res = await fetch(
                          "https://img.theopenshift.com/v1/upload/",
                          {
                            method: "POST",
                            body: formData,
                          }
                        );
                        const data = await res.json();
                        if (!res.ok)
                          throw new Error(
                            data?.error ||
                              data?.message ||
                              "Failed to upload image"
                          );
                        setProfilePic(data.url || data);
                        setShowCropper(false);
                        setSelectedImage(null);
                        setSubmissionStatus({
                          type: "success",
                          message: "Photo uploaded successfully!",
                        });
                        setTimeout(
                          () =>
                            setSubmissionStatus({ type: null, message: "" }),
                          3000
                        ); // Clear success message
                      } catch (err: any) {
                        setErrorToast({
                          message:
                            err?.message ||
                            "Failed to upload image. Please try again.",
                          isVisible: true,
                        });
                        setSubmissionStatus({ type: "error", message: "" });
                        setTimeout(
                          () =>
                            setSubmissionStatus({ type: null, message: "" }),
                          3000
                        ); // Clear error message
                      }
                    }}
                  >
                    Crop & Upload
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Banner */}
        <AnimatePresence>
          {submissionStatus.type && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`w-full text-center py-3 font-medium text-sm ${
                submissionStatus.type === "success"
                  ? "bg-green-50 text-green-700 border-b border-green-100"
                  : submissionStatus.type === "error"
                  ? "bg-red-50 text-red-700 border-b border-red-100"
                  : "bg-blue-50 text-blue-700 border-b border-blue-100" // For 'info' loading state
              }`}
            >
              {submissionStatus.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Stepper */}
        <div className="w-full bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-8">
              <div className="relative">
                {/* Progress Bar */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2">
                  <div
                    className="h-full bg-[#2954bd] transition-all duration-300"
                    style={{
                      width: `${
                        (completedSteps.length / (STEPS.length - 1)) * 100
                      }%`,
                      maxWidth: activeTab === "Submit" ? "100%" : "50%",
                    }}
                  />
                </div>

                {/* Steps */}
                <div className="relative flex justify-between">
                  {STEPS.map((step, index) => {
                    const isActive = activeTab === step.id;
                    const isCompleted = completedSteps.includes(step.id);
                    const isClickable =
                      index <= STEPS.findIndex((s) => s.id === activeTab) + 1;

                    return (
                      <div key={step.id} className="flex flex-col items-center">
                        <button
                          onClick={() => isClickable && setActiveTab(step.id)}
                          disabled={!isClickable}
                          className={`group relative flex flex-col items-center ${
                            isClickable
                              ? "cursor-pointer"
                              : "cursor-not-allowed opacity-50"
                          }`}
                        >
                          {/* Step Circle */}
                          <div
                            className={`
                                                        w-10 h-10 rounded-full flex items-center justify-center
                                                        transition-colors duration-200
                                                        ${
                                                          isActive
                                                            ? "bg-[#2954bd] text-white ring-4 ring-[#2954bd]/20"
                                                            : isCompleted
                                                            ? "bg-[#2954bd] text-white"
                                                            : "bg-gray-100 text-gray-400"
                                                        }
                                                    `}
                          >
                            {isCompleted ? (
                              <CheckIcon className="w-5 h-5" />
                            ) : (
                              step.icon
                            )}
                          </div>

                          {/* Step Label */}
                          <span
                            className={`
                                                        mt-2 text-sm font-medium
                                                        ${
                                                          isActive
                                                            ? "text-[#2954bd]"
                                                            : isCompleted
                                                            ? "text-black"
                                                            : "text-gray-500"
                                                        }
                                                    `}
                          >
                            {step.label}
                          </span>

                          {/* Step Number */}
                          <span className="absolute -top-1 -right-1 w-5 h-5 text-xs font-medium flex items-center justify-center rounded-full bg-gray-100">
                            {index + 1}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold">
              {activeTab === "Profile" && "Personal Information"}
              {activeTab === "Account" && "Account Details"}
              {activeTab === "Submit" && "Review & Submit"}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {activeTab === "Profile" &&
                "Tell us about yourself and your professional background."}
              {activeTab === "Account" &&
                "Provide your account and emergency contact details."}
              {activeTab === "Submit" &&
                "Review your information before submitting your profile."}
            </p>
          </div>

          {/* Content Sections */}
          <motion.div
            key={activeTab} // Key changes to re-mount and animate on tab change
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8"
          >
            {activeTab === "Profile" && (
              <div className="flex flex-col gap-8">
                {/* Profile Picture Section */}
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative w-24 h-24">
                    <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-200">
                      {profilePic ? (
                        <Image
                          src={profilePic}
                          alt="Profile"
                          width={96}
                          height={96}
                          className="object-cover w-24 h-24"
                        />
                      ) : (
                        <svg
                          className="w-16 h-16 text-gray-300"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute bottom-0 right-0 w-8 h-8 opacity-0 cursor-pointer"
                      onChange={handleProfilePic}
                      ref={fileInputRef}
                    />
                    <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#2954bd] rounded-full flex items-center justify-center text-white cursor-pointer pointer-events-none shadow-sm">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-lg font-semibold mb-2">
                      Profile Picture
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Upload a professional photo of yourself
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block font-semibold">About Me</label>
                      <InfoTooltip content="Share your professional background, experience, and what makes you unique. This helps organizations understand your expertise and personality. Aim for 2-3 sentences that highlight your key strengths and career goals." />
                    </div>
                    <textarea
                      value={aboutMe}
                      onChange={(e) => setAboutMe(e.target.value)}
                      className="w-full border rounded-md p-2"
                      rows={4}
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  {/* Personal Details Section */}
                  <div className="border-t pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-lg font-semibold">
                        Personal Details
                      </h3>
                      <InfoTooltip content="Your personal information helps us verify your identity and ensure proper communication. All information is kept secure and confidential in accordance with privacy laws." />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold mb-2">
                          First Name
                        </label>
                        <input
                          className={`w-full border rounded-md p-2 ${
                            personalDetails.firstName
                              ? validateName(personalDetails.firstName)
                                ? "border-green-500"
                                : "border-red-500"
                              : ""
                          }`}
                          value={personalDetails.firstName}
                          onChange={(e) =>
                            setPersonalDetails({
                              ...personalDetails,
                              firstName: e.target.value,
                            })
                          }
                          placeholder="First name"
                        />
                        {personalDetails.firstName &&
                          !validateName(personalDetails.firstName) && (
                            <p className="text-red-500 text-sm mt-1">
                              Please enter a valid first name (letters only)
                            </p>
                          )}
                      </div>
                      <div>
                        <label className="block font-semibold mb-2">
                          Last Name
                        </label>
                        <input
                          className={`w-full border rounded-md p-2 ${
                            personalDetails.lastName
                              ? validateName(personalDetails.lastName)
                                ? "border-green-500"
                                : "border-red-500"
                              : ""
                          }`}
                          value={personalDetails.lastName}
                          onChange={(e) =>
                            setPersonalDetails({
                              ...personalDetails,
                              lastName: e.target.value,
                            })
                          }
                          placeholder="Last name"
                        />
                        {personalDetails.lastName &&
                          !validateName(personalDetails.lastName) && (
                            <p className="text-red-500 text-sm mt-1">
                              Please enter a valid last name (letters only)
                            </p>
                          )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block font-semibold mb-2">State</label>
                      <Listbox
                        value={selectedState}
                        onChange={(value) => {
                          setSelectedState(value);
                          setSelectedSuburb("");
                          setPersonalDetails({
                            ...personalDetails,
                            address: "",
                          });
                        }}
                      >
                        {({ open }) => (
                          <div className="relative mt-1">
                            <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-[#2954bd] focus:outline-none focus:ring-1 focus:ring-[#2954bd] sm:text-sm">
                              <span className="block truncate">
                                {selectedState
                                  ? AU_STATE_LABELS[
                                      selectedState as keyof typeof AU_STATE_LABELS
                                    ]
                                  : "Select state"}
                              </span>
                              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                <ChevronUpDownIcon
                                  className="h-5 w-5 text-gray-400"
                                  aria-hidden="true"
                                />
                              </span>
                            </Listbox.Button>
                            <Transition
                              show={open}
                              as={Fragment}
                              leave="transition ease-in duration-100"
                              leaveFrom="opacity-100"
                              leaveTo="opacity-0"
                            >
                              <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                <Listbox.Option
                                  className={({ active }) =>
                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                      active
                                        ? "bg-[#2954bd]/10 text-[#2954bd]"
                                        : "text-gray-900"
                                    }`
                                  }
                                  value=""
                                >
                                  {({ selected }) => (
                                    <>
                                      <span
                                        className={`block truncate ${
                                          selected
                                            ? "font-medium"
                                            : "font-normal"
                                        }`}
                                      >
                                        Select state
                                      </span>
                                    </>
                                  )}
                                </Listbox.Option>
                                {Object.entries(AU_STATE_LABELS).map(
                                  ([code, label]) => (
                                    <Listbox.Option
                                      key={code}
                                      className={({ active }) =>
                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                          active
                                            ? "bg-[#2954bd]/10 text-[#2954bd]"
                                            : "text-gray-900"
                                        }`
                                      }
                                      value={code}
                                    >
                                      {({ selected }) => (
                                        <>
                                          <span
                                            className={`block truncate ${
                                              selected
                                                ? "font-medium"
                                                : "font-normal"
                                            }`}
                                          >
                                            {label}
                                          </span>
                                          {selected ? (
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#2954bd]">
                                              <CheckIcon
                                                className="h-5 w-5"
                                                aria-hidden="true"
                                              />
                                            </span>
                                          ) : null}
                                        </>
                                      )}
                                    </Listbox.Option>
                                  )
                                )}
                              </Listbox.Options>
                            </Transition>
                          </div>
                        )}
                      </Listbox>
                    </div>
                    {selectedState && (
                      <div className="mt-4">
                        <label className="block font-semibold mb-2">
                          Suburb
                        </label>
                        <Listbox
                          value={selectedSuburb}
                          onChange={(value) => {
                            setSelectedSuburb(value);
                            setPersonalDetails({
                              ...personalDetails,
                              address: value,
                            });
                          }}
                        >
                          {({ open }) => (
                            <div className="relative mt-1">
                              <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-[#2954bd] focus:outline-none focus:ring-1 focus:ring-[#2954bd] sm:text-sm">
                                <span className="block truncate">
                                  {selectedSuburb || "Select suburb"}
                                </span>
                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                  <ChevronUpDownIcon
                                    className="h-5 w-5 text-gray-400"
                                    aria-hidden="true"
                                  />
                                </span>
                              </Listbox.Button>
                              <Transition
                                show={open}
                                as={Fragment}
                                leave="transition ease-in duration-100"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                              >
                                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                  <Listbox.Option
                                    className={({ active }) =>
                                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                        active
                                          ? "bg-[#2954bd]/10 text-[#2954bd]"
                                          : "text-gray-900"
                                      }`
                                    }
                                    value=""
                                  >
                                    {({ selected }) => (
                                      <>
                                        <span
                                          className={`block truncate ${
                                            selected
                                              ? "font-medium"
                                              : "font-normal"
                                          }`}
                                        >
                                          Select suburb
                                        </span>
                                      </>
                                    )}
                                  </Listbox.Option>
                                  {(
                                    AU_STATES_SUBURBS[
                                      selectedState as keyof typeof AU_STATES_SUBURBS
                                    ] || []
                                  ).map((suburb: string) => (
                                    <Listbox.Option
                                      key={suburb}
                                      className={({ active }) =>
                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                          active
                                            ? "bg-[#2954bd]/10 text-[#2954bd]"
                                            : "text-gray-900"
                                        }`
                                      }
                                      value={suburb}
                                    >
                                      {({ selected }) => (
                                        <>
                                          <span
                                            className={`block truncate ${
                                              selected
                                                ? "font-medium"
                                                : "font-normal"
                                            }`}
                                          >
                                            {suburb}
                                          </span>
                                          {selected ? (
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#2954bd]">
                                              <CheckIcon
                                                className="h-5 w-5"
                                                aria-hidden="true"
                                              />
                                            </span>
                                          ) : null}
                                        </>
                                      )}
                                    </Listbox.Option>
                                  ))}
                                </Listbox.Options>
                              </Transition>
                            </div>
                          )}
                        </Listbox>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block font-semibold mb-2">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          className={`w-full border rounded-md p-2 ${
                            personalDetails.dob
                              ? validateDateOfBirth(personalDetails.dob)
                                ? "border-green-500"
                                : "border-red-500"
                              : ""
                          }`}
                          value={personalDetails.dob}
                          onChange={(e) =>
                            setPersonalDetails({
                              ...personalDetails,
                              dob: e.target.value,
                            })
                          }
                        />
                        {personalDetails.dob &&
                          !validateDateOfBirth(personalDetails.dob) && (
                            <p className="text-red-500 text-sm mt-1">
                              You must be at least 18 years old
                            </p>
                          )}
                      </div>
                      <div>
                        <label className="block font-semibold mb-2">
                          Gender
                        </label>
                        <Listbox
                          value={personalDetails.gender}
                          onChange={(value) =>
                            setPersonalDetails({
                              ...personalDetails,
                              gender: value,
                            })
                          }
                        >
                          {({ open }) => (
                            <div className="relative mt-1">
                              <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-[#2954bd] focus:outline-none focus:ring-1 focus:ring-[#2954bd] sm:text-sm">
                                <span className="block truncate">
                                  {personalDetails.gender
                                    ? GENDERS.find(
                                        (g) => g.id === personalDetails.gender
                                      )?.name
                                    : "Select gender"}
                                </span>
                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                  <ChevronUpDownIcon
                                    className="h-5 w-5 text-gray-400"
                                    aria-hidden="true"
                                  />
                                </span>
                              </Listbox.Button>
                              <Transition
                                show={open}
                                as={Fragment}
                                leave="transition ease-in duration-100"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                              >
                                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                  {GENDERS.map((gender) => (
                                    <Listbox.Option
                                      key={gender.id}
                                      className={({ active }) =>
                                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                          active
                                            ? "bg-[#2954bd]/10 text-[#2954bd]"
                                            : "text-gray-900"
                                        }`
                                      }
                                      value={gender.id}
                                    >
                                      {({ selected }) => (
                                        <>
                                          <span
                                            className={`block truncate ${
                                              selected
                                                ? "font-medium"
                                                : "font-normal"
                                            }`}
                                          >
                                            {gender.name}
                                          </span>
                                          {selected ? (
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#2954bd]">
                                              <CheckIcon
                                                className="h-5 w-5"
                                                aria-hidden="true"
                                              />
                                            </span>
                                          ) : null}
                                        </>
                                      )}
                                    </Listbox.Option>
                                  ))}
                                </Listbox.Options>
                              </Transition>
                            </div>
                          )}
                        </Listbox>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block font-semibold mb-2">
                        Phone Number
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 border rounded-l-md">
                          <span className="text-lg">🇦🇺</span>
                        </div>
                        <input
                          className={`flex-1 border rounded-r-md p-2 ${
                            personalDetails.phone
                              ? validatePhone(personalDetails.phone)
                                ? "border-green-500"
                                : "border-red-500"
                              : ""
                          }`}
                          value={personalDetails.phone}
                          onChange={(e) =>
                            setPersonalDetails({
                              ...personalDetails,
                              phone: toE164AU(e.target.value),
                            })
                          }
                          placeholder="Enter phone number"
                        />
                      </div>
                      {personalDetails.phone &&
                        !validatePhone(personalDetails.phone) && (
                          <p className="text-red-500 text-sm mt-1">
                            Please enter a valid Australian phone number
                            (+61xxxxxxxx)
                          </p>
                        )}
                    </div>
                  </div>

                  {/* Healthcare Skills Section */}
                  <div className="border-t pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-lg font-semibold">
                        Healthcare Skills
                      </h3>
                      <InfoTooltip content="List your healthcare-related skills and certifications. Include both technical skills (e.g., patient care, medical procedures) and soft skills (e.g., communication, teamwork). This helps match you with suitable opportunities." />
                    </div>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {skillsList.map((skill, index) => (
                          <div
                            key={index}
                            className="group flex items-center gap-1 px-3 py-1.5 bg-[#2954bd]/10 rounded-full"
                          >
                            <span className="text-sm">{skill}</span>
                            <button
                              onClick={() => handleRemoveSkill(skill)}
                              className="ml-1 p-0.5 rounded-full hover:bg-[#2954bd]/20 transition-colors"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={skillsInput}
                        onChange={(e) => setSkillsInput(e.target.value)}
                        onKeyDown={handleAddSkill}
                        className="w-full border rounded-md p-2"
                        placeholder="Type a skill and press Enter to add"
                      />
                      <p className="text-sm text-gray-500">
                        Press Enter to add each skill
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Account" && (
              <div className="flex flex-col gap-8">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-lg font-semibold">
                        Emergency Contact
                      </h3>
                      <InfoTooltip content="Provide details of someone we can contact in case of an emergency. This should be a trusted person who can be reached quickly if needed. Their information is kept strictly confidential and only used in emergency situations." />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold mb-2">
                          Contact Name
                        </label>
                        <input
                          className={`w-full border rounded-md p-2 ${
                            emergencyContact.name
                              ? validateName(emergencyContact.name)
                                ? "border-green-500"
                                : "border-red-500"
                              : ""
                          }`}
                          value={emergencyContact.name}
                          onChange={(e) =>
                            setEmergencyContact({
                              ...emergencyContact,
                              name: e.target.value,
                            })
                          }
                          placeholder="Emergency contact name"
                        />
                        {emergencyContact.name &&
                          !validateName(emergencyContact.name) && (
                            <p className="text-red-500 text-sm mt-1">
                              Please enter a valid name
                            </p>
                          )}
                      </div>
                      <div>
                        <label className="block font-semibold mb-2">
                          Contact Phone
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 border rounded-l-md">
                            <span className="text-lg">🇦🇺</span>
                          </div>
                          <input
                            className={`flex-1 border rounded-r-md p-2 ${
                              emergencyContact.phone
                                ? validatePhone(emergencyContact.phone)
                                  ? "border-green-500"
                                  : "border-red-500"
                                : ""
                            }`}
                            value={emergencyContact.phone}
                            onChange={(e) =>
                              setEmergencyContact({
                                ...emergencyContact,
                                phone: toE164AU(e.target.value),
                              })
                            }
                            placeholder="Enter phone number"
                          />
                        </div>
                        {emergencyContact.phone &&
                          !validatePhone(emergencyContact.phone) && (
                            <p className="text-red-500 text-sm mt-1">
                              Please enter a valid Australian phone number
                              (+61xxxxxxxx)
                            </p>
                          )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="text-lg font-semibold">Tax File Number</h3>
                      <InfoTooltip content="Your TFN is required for employment purposes. We ensure your TFN is stored securely and only used for legitimate tax and employment purposes. Never share your TFN with anyone else." />
                    </div>
                    <div>
                      <label className="block font-semibold mb-2">TFN</label>
                      <input
                        className={`w-full border rounded-md p-2 ${
                          tfn.number
                            ? validateTFN(tfn.number)
                              ? "border-green-500"
                              : "border-red-500"
                            : ""
                        }`}
                        value={tfn.number}
                        onChange={(e) => setTfn({ number: e.target.value })}
                        placeholder="Enter your TFN"
                      />
                      {tfn.number && !validateTFN(tfn.number) && (
                        <p className="text-red-500 text-sm mt-1">
                          Please enter a valid 9-digit TFN
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Submit" && (
              <div className="flex flex-col gap-8">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Review Your Information
                  </h3>
                  <p className="text-gray-600 mb-8">
                    Please review all your information before submitting. You
                    can go back to previous tabs to make changes.
                  </p>
                  <button
                    onClick={handleFinish}
                    disabled={!allFilled || submissionStatus.type === "success"}
                    className={`px-6 py-2 text-sm font-medium rounded-md ${
                      allFilled && submissionStatus.type !== "success"
                        ? "bg-[#2954bd] text-white hover:bg-[#2954bd]/90"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {submissionStatus.type === "success"
                      ? "Profile Created!"
                      : submissionStatus.type === "error"
                      ? "Try Again"
                      : submissionStatus.message === "Creating your profile..."
                      ? "Creating Profile..."
                      : "Submit Profile"}
                  </button>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => {
                  const currentIndex = STEPS.findIndex(
                    (step) => step.id === activeTab
                  );
                  if (currentIndex > 0) {
                    setActiveTab(STEPS[currentIndex - 1].id);
                  }
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === "Profile"
                    ? "invisible"
                    : "bg-white border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Previous
              </button>

              {activeTab !== "Submit" ? (
                <button
                  onClick={() => {
                    const currentIndex = STEPS.findIndex(
                      (step) => step.id === activeTab
                    );
                    if (currentIndex < STEPS.length - 1) {
                      setActiveTab(STEPS[currentIndex + 1].id);
                    }
                  }}
                  disabled={!isStepCompleted(activeTab)}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    isStepCompleted(activeTab)
                      ? "bg-[#2954bd] text-white hover:bg-[#2954bd]/90"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  disabled={!allFilled || submissionStatus.type === "success"}
                  className={`px-6 py-2 text-sm font-medium rounded-md ${
                    allFilled && submissionStatus.type !== "success"
                      ? "bg-[#2954bd] text-white hover:bg-[#2954bd]/90"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {submissionStatus.type === "success"
                    ? "Profile Created!"
                    : submissionStatus.type === "error"
                    ? "Try Again"
                    : submissionStatus.message === "Creating your profile..."
                    ? "Creating Profile..."
                    : "Submit Profile"}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Error Toast */}
      <ErrorToast
        message={errorToast.message}
        isVisible={errorToast.isVisible}
        onClose={() => setErrorToast((prev) => ({ ...prev, isVisible: false }))}
        duration={6000}
      />
    </div>
  );
}