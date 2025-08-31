// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter, usePathname } from "next/navigation";
import SidebarProfile from "@/app/components/SidebarProfile";
import Image from "next/image";
import {
  PencilSquareIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  HomeIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import LoadingScreen from "../../components/LoadingScreen";
import Link from "next/link";
import SplitText from "../../components/SplitText/SplitText";
import { motion, Variants } from "framer-motion";
import CircularText from "../../components/Badge/Badge";

// Define staffNav directly in this file or import it if it's external
const staffNav = [
  { name: "Dashboard", href: "/staff/dashboard", icon: HomeIcon },
  { name: "Profile", href: "/profile/staff", icon: UserIcon },
  // Add other navigation items as needed
];

// Define Framer Motion variants for the card
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  hover: { scale: 1.01, boxShadow: "0px 12px 24px rgba(0, 0, 0, 0.08)" },
  tap: { scale: 0.99 },
};

// Variants for blob/tag items
const blobVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 15 },
  },
};

interface StaffProfile {
  fname: string;
  lname: string;
  address: string;
  dob: string;
  gender: string;
  phone: string;
  bio: string;
  emergency_contact: string;
  emergency_contact_phone: string;
  tfn: string;
  skills: string[];
  badges: string[];
  vaccinations: string[];
  languages: string[];
  interests: string[];
  preferences: string[];
  services: string[];
  charges_enabled?: boolean;
  has_custom_image?: boolean;
  image_url?: string;
}

const API_BASE_URL = "https://api.theopenshift.com";

// Re-evaluating icon usage for consistency, using simple spans for now where icons are missing or conflict
const BADGE_ICONS: Record<string, { icon: JSX.Element; label: string }> = {
  lgbtq: {
    icon: (
      <span className="text-xl" role="img" aria-label="LGBTQIA+">
        🏳️‍🌈
      </span>
    ),
    label: "LGBTQIA+ Friendly",
  },
  non_smoker: {
    icon: (
      <span className="text-xl" role="img" aria-label="Non Smoker">
        🚭
      </span>
    ),
    label: "Non-Smoker",
  },
  pet_friendly: {
    icon: (
      <span className="text-xl" role="img" aria-label="Pet Friendly">
        🐾
      </span>
    ),
    label: "Pet Friendly",
  },
};
const VACC_INFO: Record<string, { icon: JSX.Element; label: string }> = {
  covid_19: {
    icon: (
      <span className="text-xl" role="img" aria-label="COVID-19">
        💉
      </span>
    ),
    label: "COVID-19 vaccine - Self declared",
  },
  flu: {
    icon: (
      <span className="text-xl" role="img" aria-label="Flu">
        😷
      </span>
    ),
    label: "Seasonal flu vaccine - Self declared",
  },
  tetanus: {
    icon: (
      <span className="text-xl" role="img" aria-label="Tetanus">
        🩹
      </span>
    ),
    label: "Tetanus vaccine - Self declared",
  },
};
const LANGUAGE_LABELS: Record<string, string> = {
  english: "English",
  spanish: "Spanish",
  french: "French",
  german: "German",
  chinese: "Chinese",
  other: "Other",
};
const INTEREST_LABELS: Record<string, string> = {
  cooking: "Cooking",
  movies: "Movies",
  pets: "Pets",
  sports: "Sports",
  gardening: "Gardening",
  music: "Music",
  photography: "Photography",
  travel: "Travel",
  art: "Art",
  reading: "Reading",
  games: "Games",
  festivities: "Festivities",
  fitness: "Fitness",
};
const PREFERENCE_LABELS: Record<string, string> = {
  non_smoker: "Non-smoker",
  no_pets: "No pets",
  male_only: "Male only",
  female_only: "Female only",
};

const LANGUAGE_ICONS: Record<string, JSX.Element> = {
  english: (
    <span className="text-xl" role="img" aria-label="English">
      🇬🇧
    </span>
  ),
  spanish: (
    <span className="text-xl" role="img" aria-label="Spanish">
      🇪🇸
    </span>
  ),
  french: (
    <span className="text-xl" role="img" aria-label="French">
      🇫🇷
    </span>
  ),
  german: (
    <span className="text-xl" role="img" aria-label="German">
      🇩🇪
    </span>
  ),
  chinese: (
    <span className="text-xl" role="img" aria-label="Chinese">
      🇨🇳
    </span>
  ),
  other: (
    <span className="text-xl" role="img" aria-label="Other">
      🌐
    </span>
  ),
};
const INTEREST_ICONS: Record<string, JSX.Element> = {
  cooking: (
    <span className="text-xl" role="img" aria-label="Cooking">
      👩‍🍳
    </span>
  ),
  movies: (
    <span className="text-xl" role="img" aria-label="Movies">
      🎬
    </span>
  ),
  pets: (
    <span className="text-xl" role="img" aria-label="Pets">
      🐶
    </span>
  ),
  sports: (
    <span className="text-xl" role="img" aria-label="Sports">
      🏅
    </span>
  ),
  gardening: (
    <span className="text-xl" role="img" aria-label="Gardening">
      🌱
    </span>
  ),
  music: (
    <span className="text-xl" role="img" aria-label="Music">
      🎵
    </span>
  ),
  photography: (
    <span className="text-xl" role="img" aria-label="Photography">
      📷
    </span>
  ),
  travel: (
    <span className="text-xl" role="img" aria-label="Travel">
      ✈️
    </span>
  ),
  art: (
    <span className="text-xl" role="img" aria-label="Art">
      🎨
    </span>
  ),
  reading: (
    <span className="text-xl" role="img" aria-label="Reading">
      📚
    </span>
  ),
  games: (
    <span className="text-xl" role="img" aria-label="Games">
      🎲
    </span>
  ),
  festivities: (
    <span className="text-xl" role="img" aria-label="Festivities">
      🎉
    </span>
  ),
  fitness: (
    <span className="text-xl" role="img" aria-label="Fitness">
      💪
    </span>
  ),
};
const PREFERENCE_ICONS: Record<string, JSX.Element> = {
  non_smoker: (
    <span className="text-xl" role="img" aria-label="Non-smoker">
      🚭
    </span>
  ),
  no_pets: (
    <span className="text-xl" role="img" aria-label="No pets">
      🚫🐾
    </span>
  ),
  male_only: (
    <span className="text-xl" role="img" aria-label="Male only">
      👨
    </span>
  ),
  female_only: (
    <span className="text-xl" role="img" aria-label="Female only">
      👩‍
    </span>
  ),
};

const SERVICE_LABELS: Record<string, string> = {
  everyday: "Everyday Activities Support",
  self_care: "Personal Care Worker",
  nursing: "Nursing",
  healthcare: "Allied Health Services",
};

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function StaffPage() {
  const { user, isLoading: isAuth0Loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [role, setRole] = useState<string>("");
  const [availability, setAvailability] = useState<{ [day: string]: boolean }>(
    {}
  );
  // State to track completed steps by their IDs
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([]);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [stripeDashboardUrl, setStripeDashboardUrl] = useState<string | null>(
    null
  );

  //For Profile Picture
  const [imageVersion, setImageVersion] = useState(Date.now());
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", e.target.files[0]);

    try {
      const session = await fetch("/api/auth/session").then((res) =>
        res.json()
      );
      const accessToken = session?.accessToken;
      if (!accessToken) throw new Error("Not authenticated");

      const res = await fetch("https://img.theopenshift.com/v1/upload/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Image upload failed");
      }
      // Update profile state with new image_url from backend
      setProfile((prev) =>
        prev
          ? { ...prev, has_custom_image: true, image_url: data.image_url }
          : prev
      );
      setImageVersion(Date.now()); // cache-busting if needed
    } catch (err: any) {
      setUploadError(err.message || "Image upload failed");
    } finally {
      setUploading(false);
    }
  };
  const getProfileImageUrl = () => {
    if (user?.sub) {
      // Remove "auth0|" prefix if present
      const userId = user.sub.replace(/^auth0\|/, "");
      return `https://img.theopenshift.com/profile/${userId}.webp?v=${imageVersion}`;
    }
    return user?.picture || "/default-avatar.png";
  };

  const steps = [
    {
      id: "availability",
      name: "Availability",
      description:
        "Setting your availability helps organizations find you for shifts.",
      href: "/profile/staff/edit",
    },
    {
      id: "stripe-onboarding",
      name: "Stripe Onboarding",
      description:
        "Complete Stripe onboarding to receive payments for your services. This is crucial for financial transactions.",
      href: "/profile/staff/edit",
    },
    {
      id: "email-verification",
      name: "Email Verification",
      description:
        "Verify your email address to ensure secure communication and account integrity.",
      href: "/profile/staff/edit",
    },
    {
      id: "bgv",
      name: "Compliance",
      description:
        "A background check is required for all staff members to ensure safety and trust within the community.",
      href: "#bgv-page", // Placeholder for BGV page
    },
  ];

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (isMounted) {
        setLoading(true);
        setError("");
      }

      if (isAuth0Loading) {
        return;
      }

      if (!user) {
        if (isMounted) {
          setError("User not authenticated. Please log in.");
          setLoading(false);
        }
        return;
      }

      try {
        const session = await fetch("/api/auth/session").then((res) =>
          res.json()
        );
        const accessToken = session?.accessToken;
        if (!accessToken) {
          if (isMounted) {
            setError("Not authenticated. Please log in.");
            setLoading(false);
          }
          return;
        }

        // Fetch profile
        const profileRes = await fetch(`${API_BASE_URL}/v1/users/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        });

        let userProfileData: any = null;
        if (profileRes.ok) {
          userProfileData = await profileRes.json();
          if (isMounted) setProfile(userProfileData);
        } else {
          if (isMounted)
            setError((prev) =>
              prev
                ? `${prev} Error fetching user profile.`
                : "Error fetching user profile."
            );
        }

        // Fetch availability
        const availRes = await fetch(`${API_BASE_URL}/v1/users/availability`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        });
        let availData: any = null;
        if (availRes.ok) {
          availData = await availRes.json();
          if (availData && availData.availability && isMounted) {
            setAvailability(availData.availability);
          }
        } else {
          if (isMounted)
            setError((prev) =>
              prev
                ? `${prev} Error fetching availability.`
                : "Error fetching availability."
            );
        }

        // Fetch role
        const roleRes = await fetch(`${API_BASE_URL}/v1/roles/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        });
        if (roleRes.ok) {
          const roleData = await roleRes.json();
          if (isMounted && roleData?.role) {
            setRole(roleData.role);
          }
        } else {
          if (isMounted)
            setError((prev) =>
              prev ? `${prev} Error fetching role.` : "Error fetching role."
            );
        }

        // --- Completion logic ---
        if (isMounted) {
          const completed: string[] = [];

          // 1. Availability: at least one day true
          if (
            availData &&
            availData.availability &&
            Object.values(availData.availability).some(Boolean)
          ) {
            completed.push("availability");
          }

          // 2. Stripe Onboarding: charges_enabled true
          if (userProfileData && userProfileData.charges_enabled) {
            completed.push("stripe-onboarding");
            // Fetch Stripe dashboard URL
            const stripeRes = await fetch(
              `${API_BASE_URL}/v1/payments/dashboard`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  Accept: "application/json",
                },
              }
            );
            if (stripeRes.ok) {
              const stripeData = await stripeRes.json();
              setStripeDashboardUrl(stripeData.url);
            }
          }

          // 3. Email Verification: Auth0 user.email_verified true
          if (user?.email_verified === true) {
            console.log("Auth0 email_verified:", user?.email_verified);
            console.log("Auth0 user object:", user);
            completed.push("email-verification");
          }

          // 4. BGV: leave as is (manual or future logic)

          setCompletedStepIds(completed);
        }
      } catch (e: any) {
        if (isMounted) {
          setError(
            `An unexpected error occurred: ${e.message || "Unknown error"}`
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [user, isAuth0Loading]);

  // Effect to check if all steps are completed and show modal
  useEffect(() => {
    const allStepsCompleted = steps.every((step) =>
      completedStepIds.includes(step.id)
    );
    if (allStepsCompleted && !isProfileComplete) {
      setIsProfileComplete(true);
      setShowCompletionModal(true);
    } else if (!allStepsCompleted && isProfileComplete) {
      setIsProfileComplete(false); // If a step becomes incomplete, revert status
    }
  }, [completedStepIds, isProfileComplete, steps]);

  // Sanitize user for SidebarProfile
  const sidebarUser = user
    ? {
        name: typeof user.name === "string" ? user.name : undefined,
        picture: typeof user.picture === "string" ? user.picture : undefined,
        email: typeof user.email === "string" ? user.email : undefined,
      }
    : null;

  if (isAuth0Loading || loading) {
    return <LoadingScreen />;
  }
  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  const allStepsCompleted = steps.every((step) =>
    completedStepIds.includes(step.id)
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-ubuntu flex flex-col relative overflow-hidden">
      {/* Global styles for Ubuntu font */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap");
        .font-ubuntu {
          font-family: "Ubuntu", sans-serif;
        }
      `}</style>
      {/* Quarter circle design element */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#fe7239] rounded-tl-full z-0 opacity-80 xl:w-[700px] xl:h-[700px]"></div>
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#fe7239] rounded-br-full z-0 opacity-80 xl:w-[700px] xl:h-[700px]"></div>
      <SidebarProfile userType="staff" user={sidebarUser} />
      <div className="md:pl-72 pt-16 flex-grow relative z-10z-10 pb-24 md:pb-0">
        {" "}
        {/* Ensure content is above the background element */}
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8">
          {/* Big Greeting and Name at the Top */}
          <div className="relative bg-gradient-to-br from-[#3464b4] to-[#2a559c] p-8 sm:p-10 rounded-3xl shadow-xl text-white mb-12 flex flex-col sm:flex-row items-center justify-between">
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              <div className="flex-shrink-0 relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white flex items-center justify-center group">
                {getProfileImageUrl() ? (
                  <Image
                    src={getProfileImageUrl()}
                    alt={profile?.fname || "User"}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#e6f2f2] text-6xl text-[#3464b4] font-bold">
                    {(
                      profile?.fname?.[0] ||
                      user?.name?.[0] ||
                      "U"
                    ).toUpperCase()}
                  </div>
                )}

                {/* Upload Button Overlay */}
                <label
                  className="absolute bottom-2 right-2 bg-white border-2 border-[#3464b4] text-[#3464b4] rounded-full p-2 cursor-pointer shadow-lg hover:bg-[#3464b4] hover:text-white transition-all z-10 flex items-center group"
                  title="Upload new profile picture"
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 z-100"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12"
                    />
                  </svg>
                  <span className="absolute left-1/2 -translate-x-1/2 bottom-10 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                    Upload
                  </span>
                </label>

                {/* Loading Spinner */}
                {uploading && (
                  <div className="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center z-20">
                    <svg
                      className="animate-spin h-8 w-8 text-[#3464b4]"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      ></path>
                    </svg>
                  </div>
                )}
              </div>
              {uploadError && (
                <div className="text-red-600 text-sm mt-2">{uploadError}</div>
              )}
              <div className="mt-4 sm:mt-0">
                <h1 className="text-4xl sm:text-5xl font-extrabold mb-2 leading-tight">
                  <SplitText
                    text={`Hello, ${
                      profile ? `${profile.fname}` : user?.name || "User"
                    }!`}
                    delay={50}
                    duration={0.8}
                    ease="power3.out"
                    splitType="chars"
                    from={{ opacity: 0, y: 40 }}
                    to={{ opacity: 1, y: 0 }}
                  />
                </h1>
                {role && (
                  <span className="mt-3 bg-[#fe7239] text-white text-base font-semibold px-5 py-2 rounded-full shadow-md inline-block">
                    {role === "user"
                      ? "Independent Contractor"
                      : role.charAt(0).toUpperCase() + role.slice(1)}
                  </span>
                )}
              </div>
            </div>
            <motion.button
              onClick={() => router.push("/profile/staff/edit")}
              className="mt-6 sm:mt-0 flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-[#3464b4] font-semibold shadow-lg hover:bg-gray-100 transition-colors text-base"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <PencilSquareIcon className="w-5 h-5" />
              Edit Profile
            </motion.button>
          </div>
          {/* Conditional Profile Completion Status & Steps */}
          {!allStepsCompleted && (
            <motion.div
              className="bg-red-50 border border-red-200 text-red-800 px-6 py-5 rounded-2xl relative mb-12 shadow-md"
              role="alert"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-4 mb-4">
                <ExclamationTriangleIcon
                  className="h-8 w-8 flex-shrink-0 text-red-600"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="text-xl font-bold text-red-700">
                    Profile Incomplete!
                  </h3>
                  <p className="text-sm">
                    Please complete the following steps to unlock full features.
                  </p>
                </div>
              </div>
              <ol className="list-none p-0 space-y-3">
                {steps.map((step) => {
                  const isStepCompleted = completedStepIds.includes(step.id);
                  return (
                    <li key={step.id} className="flex items-center gap-3">
                      <span
                        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isStepCompleted
                            ? "bg-green-500 text-white"
                            : "bg-gray-300 text-gray-700"
                        }`}
                      >
                        {isStepCompleted ? (
                          <CheckCircleIcon className="h-4 w-4" />
                        ) : (
                          " "
                        )}
                      </span>
                      <div className="flex-1 flex justify-between items-center">
                        <p
                          className={`font-semibold text-base ${
                            isStepCompleted
                              ? "line-through text-gray-500"
                              : "text-gray-800"
                          }`}
                        >
                          {step.name}
                        </p>
                        <Link
                          href={step.href}
                          className="text-[#3464b4] hover:text-[#2a559c] font-semibold text-sm transition-colors flex items-center"
                        >
                          {isStepCompleted ? "View" : "Complete"}
                          <svg
                            className="w-3 h-3 ml-1"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 14 10"
                          >
                            <path
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M1 5h12m0 0L9 1m4 4L9 9"
                            />
                          </svg>
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </motion.div>
          )}
          {allStepsCompleted && (
            <motion.div
              className="bg-green-50 border border-green-200 text-green-800 px-6 py-5 rounded-2xl relative mb-12 shadow-md"
              role="alert"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-4">
                <CheckCircleIcon
                  className="h-8 w-8 flex-shrink-0 text-green-600"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="text-xl font-bold text-green-700">
                    Profile Complete!
                  </h3>
                  <span className="text-sm">
                    You are all set to start finding shifts!
                  </span>
                </div>
              </div>
            </motion.div>
          )}
          {/* Main Content Grid (rest of the cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* About Me Card */}
            <motion.div
              className="bg-white p-6 rounded-2xl shadow-lg flex flex-col gap-4 col-span-1 md:col-span-2 lg:col-span-1"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <h3 className="text-2xl font-bold text-[#3464b4] mb-3 border-b pb-2 border-gray-100">
                About Me
              </h3>
              <div className="flex flex-col gap-3 text-gray-700 text-base">
                <div>
                  <span className="font-semibold text-gray-800">Bio:</span>{" "}
                  {profile?.bio || (
                    <span className="italic text-gray-400">
                      No bio provided.
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <PhoneIcon className="w-5 h-5 text-[#3464b4]" />
                  <span className="font-semibold text-gray-800">
                    Phone:
                  </span>{" "}
                  {profile?.phone || (
                    <span className="italic text-gray-400">N/A</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-[#3464b4]" />
                  <span className="font-semibold text-gray-800">
                    Gender:
                  </span>{" "}
                  {profile?.gender || (
                    <span className="italic text-gray-400">N/A</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <HomeIcon className="w-5 h-5 text-[#3464b4]" />
                  <span className="font-semibold text-gray-800">
                    Address:
                  </span>{" "}
                  {profile?.address || (
                    <span className="italic text-gray-400">N/A</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-[#3464b4]" />
                  <span className="font-semibold text-gray-800">
                    Date of Birth:
                  </span>{" "}
                  {profile?.dob || (
                    <span className="italic text-gray-400">N/A</span>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Skills & Services Card */}
            <motion.div
              className="bg-white p-6 rounded-2xl shadow-lg"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <h3 className="text-2xl font-bold text-[#3464b4] mb-3 border-b pb-2 border-gray-100">
                Skills & Services
              </h3>
              {profile?.skills && profile.skills.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    Skills
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {profile.skills.map((skill, idx) => (
                      <motion.span
                        key={idx}
                        className="px-4 py-2 rounded-full bg-[#3464b4]/10 text-[#3464b4] font-medium text-sm inline-flex items-center"
                        variants={blobVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}
              {profile?.services && profile.services.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    Services Provided
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {profile.services.map((service) =>
                      SERVICE_LABELS[service] ? (
                        <motion.span
                          key={service}
                          className="inline-flex items-center justify-center rounded-full bg-[#3464b4]/10 text-[#3464b4] font-medium text-sm px-4 py-2 whitespace-nowrap"
                          variants={blobVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {SERVICE_LABELS[service]}
                        </motion.span>
                      ) : null
                    )}
                  </div>
                </div>
              )}
              {(!profile?.skills || profile.skills.length === 0) &&
                (!profile?.services || profile.services.length === 0) && (
                  <span className="italic text-gray-400">
                    No skills or services provided.
                  </span>
                )}
            </motion.div>

            {/* Health & Preferences Card */}
            <motion.div
              className="bg-white p-6 rounded-2xl shadow-lg"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <h3 className="text-2xl font-bold text-[#3464b4] mb-3 border-b pb-2 border-gray-100">
                Health & Preferences
              </h3>
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  Badges
                </h4>
                <div className="flex flex-wrap gap-3">
                  {profile?.badges && profile.badges.length > 0 ? (
                    profile.badges.map((badge) =>
                      BADGE_ICONS[badge] ? (
                        <motion.span
                          key={badge}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                            badge === "lgbtq"
                              ? "bg-[#f07057]/10 text-[#f07057]"
                              : "bg-[#3464b4]/10 text-[#3464b4]"
                          } text-sm font-medium`}
                          variants={blobVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {BADGE_ICONS[badge].icon}
                          {BADGE_ICONS[badge].label}
                        </motion.span>
                      ) : null
                    )
                  ) : (
                    <span className="italic text-gray-400">
                      No badges selected.
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  Immunisation
                </h4>
                {profile?.vaccinations && profile.vaccinations.length > 0 ? (
                  profile.vaccinations.map((vax) =>
                    VACC_INFO[vax] ? (
                      <div
                        key={vax}
                        className="flex items-center gap-2 text-gray-700 text-base mb-2"
                      >
                        {VACC_INFO[vax].icon}
                        <span>{VACC_INFO[vax].label}</span>
                      </div>
                    ) : null
                  )
                ) : (
                  <span className="italic text-gray-400">
                    No vaccinations declared.
                  </span>
                )}
              </div>

              {profile?.preferences && profile.preferences.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    Preferences
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {profile.preferences.map((pref) =>
                      PREFERENCE_LABELS[pref] ? (
                        <motion.span
                          key={pref}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#3464b4]/10 text-[#3464b4] text-sm font-medium"
                          variants={blobVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {PREFERENCE_ICONS[pref]}
                          {PREFERENCE_LABELS[pref]}
                        </motion.span>
                      ) : null
                    )}
                  </div>
                </div>
              )}
              {(!profile?.badges || profile.badges.length === 0) &&
                (!profile?.vaccinations || profile.vaccinations.length === 0) &&
                (!profile?.preferences || profile.preferences.length === 0) && (
                  <span className="italic text-gray-400">
                    No health or preference information available.
                  </span>
                )}
            </motion.div>

            {/* Availability & Rates Card */}
            <motion.div
              className="bg-white p-6 rounded-2xl shadow-lg"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <h3 className="text-2xl font-bold text-[#3464b4] mb-3 border-b pb-2 border-gray-100">
                Availability & Stripe
              </h3>
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  Preferred Hours
                </h4>
                <div className="text-gray-700 text-sm mb-3">
                  Support sessions don't need to fill each time slot completely.
                </div>
                {(() => {
                  const availableDays = DAYS.filter((day) => {
                    const val = availability[day.toLowerCase()];
                    if (Array.isArray(val)) return val.length > 0;
                    return val === true;
                  });
                  if (availableDays.length === 0) {
                    return (
                      <span className="italic text-gray-400">
                        No availability set.
                      </span>
                    );
                  }
                  return (
                    <div className="flex flex-wrap gap-2">
                      {availableDays.map((day) => (
                        <motion.span
                          key={day}
                          className="inline-block bg-[#3464b4]/10 text-[#3464b4] text-sm px-3 py-1 rounded-full font-semibold"
                          variants={blobVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {day}
                        </motion.span>
                      ))}
                    </div>
                  );
                })()}
              </div>
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  Stripe Onboarding
                </h4>
                {profile?.charges_enabled ? (
                  <div className="flex flex-col gap-2">
                    <span className="text-green-600 font-semibold">
                      Stripe onboarding completed.
                    </span>
                    {stripeDashboardUrl && (
                      <button
                        className="px-4 py-2 rounded-full bg-[#3464b4] text-white font-semibold hover:bg-[#2a559c] transition-colors"
                        onClick={() =>
                          window.open(stripeDashboardUrl, "_blank")
                        }
                      >
                        Go to Stripe Dashboard
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <span className="text-red-600 font-semibold">
                      Complete Stripe onboarding to receive payments.
                    </span>
                    <button
                      className="px-4 py-2 rounded-full bg-[#3464b4] text-white font-semibold hover:bg-[#2a559c] transition-colors"
                      onClick={() => router.push("/profile/staff/edit")}
                    >
                      Complete Stripe Onboarding
                    </button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Languages & Interests Card */}
            <motion.div
              className="bg-white p-6 rounded-2xl shadow-lg"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <h3 className="text-2xl font-bold text-[#3464b4] mb-3 border-b pb-2 border-gray-100">
                Languages & Interests
              </h3>
              {profile?.languages && profile.languages.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    Languages
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {profile.languages.map((lang) =>
                      LANGUAGE_LABELS[lang] ? (
                        <motion.span
                          key={lang}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#3464b4]/10 text-[#3464b4] text-sm font-medium"
                          variants={blobVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {LANGUAGE_ICONS[lang]}
                          {LANGUAGE_LABELS[lang]}
                        </motion.span>
                      ) : null
                    )}
                  </div>
                </div>
              )}
              {profile?.interests && profile.interests.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    Interests & Hobbies
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {profile.interests.map((interest) =>
                      INTEREST_LABELS[interest] ? (
                        <motion.span
                          key={interest}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#3464b4]/10 text-[#3464b4] text-sm font-medium"
                          variants={blobVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {INTEREST_ICONS[interest]}
                          {INTEREST_LABELS[interest]}
                        </motion.span>
                      ) : null
                    )}
                  </div>
                </div>
              )}
              {(!profile?.languages || profile.languages.length === 0) &&
                (!profile?.interests || profile.interests.length === 0) && (
                  <span className="italic text-gray-400">
                    No language or interest information available.
                  </span>
                )}
            </motion.div>

            {/* Emergency Contact Card */}
            <motion.div
              className="bg-white p-6 rounded-2xl shadow-lg"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <h3 className="text-2xl font-bold text-[#3464b4] mb-3 border-b pb-2 border-gray-100">
                Emergency Contact
              </h3>
              <div className="grid grid-cols-1 gap-y-2 text-gray-700 text-base">
                <div>
                  <span className="font-semibold text-gray-800">Name:</span>{" "}
                  {profile?.emergency_contact || (
                    <span className="italic text-gray-400">N/A</span>
                  )}
                </div>
                <div>
                  <span className="font-semibold text-gray-800">Phone:</span>{" "}
                  {profile?.emergency_contact_phone || (
                    <span className="italic text-gray-400">N/A</span>
                  )}
                </div>
              </div>
              <motion.button
                onClick={() => router.push("/profile/staff/edit")}
                className="mt-6 flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#3464b4] text-white font-semibold shadow-md hover:bg-[#2a559c] transition-colors text-base"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <PencilSquareIcon className="w-5 h-5" />
                Edit Emergency Contact
              </motion.button>
            </motion.div>

            {/* Experience Section
            <motion.div
              className="bg-white p-6 rounded-2xl shadow-lg col-span-1 md:col-span-2 lg:col-span-3"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <h3 className="text-2xl font-bold text-[#3464b4] mb-3 border-b pb-2 border-gray-100">
                Experience
              </h3>
              <div className="border border-dashed border-gray-300 rounded-lg p-4 text-gray-700 bg-gray-50">
                <div className="font-bold mb-1">Only visible to you</div>
                <div>Enter your main experience areas.</div>
                <motion.button
                  className="mt-4 px-4 py-2 rounded-full bg-[#3464b4] text-white text-base font-semibold hover:bg-[#2a559c] transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push("/profile/staff/edit")}
                >
                  Add experience
                </motion.button>
              </div>
            </motion.div> */}
          </div>{" "}
          {/* End Main Content Grid */}
        </div>{" "}
        {/* End px-4 sm:px-6 lg:px-8 */}
      </div>{" "}
      {/* End md:pl-72 pt-16 */}
      {/* Mobile menu overlay */}
      <div className={`${mobileMenuOpen ? "block" : "hidden"} md:hidden`}>
        <div
          className="fixed inset-0 z-50 bg-white/80"
          onClick={() => setMobileMenuOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10 pt-16">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="-m-1.5 p-1.5">
              <span className="text-2xl font-semibold text-[#3464b4]">
                TheOpenServies
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
            {staffNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-base font-medium rounded-md ${
                    isActive
                      ? "bg-[#e6f2f2] text-[#3464b4]"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon
                    className={`mr-4 h-6 w-6 flex-shrink-0 ${
                      isActive
                        ? "text-[#3464b4]"
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
              <ArrowRightOnRectangleIcon
                className="mr-4 h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-red-600"
                aria-hidden="true"
              />
              Log out
            </a>
          </nav>
        </div>
      </div>
      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full text-center"
          >
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-green-600 mb-4">
              Profile Complete! 🎉
            </h3>
            <p className="text-gray-700 mb-6">
              Congratulations! Your profile is now complete and ready for
              finding shifts.
            </p>
            <button
              onClick={() => setShowCompletionModal(false)}
              className="px-6 py-3 rounded-full bg-[#3464b4] text-white font-semibold hover:bg-[#2a559c] transition-colors"
            >
              Great!
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
