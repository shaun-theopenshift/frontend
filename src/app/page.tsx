"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  ChangeEvent,
  FocusEvent,
  FormEvent,
} from "react";
import {
  ArrowRightIcon,
  CalendarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  PlusIcon, 
  MinusIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  QuestionMarkCircleIcon, 
} from "@heroicons/react/24/outline";
import Navigation from "./components/Navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { Tab, Disclosure } from "@headlessui/react"; 
import RotatingText from "./components/RotatingText/RotatingText";

// Define interfaces
interface FormDataState {
  name: string;
  email: string;
  message: string;
}

interface FormErrorsState {
  name: boolean;
  email: boolean;
  message: boolean;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("organization");
  const { user, isLoading } = useUser();

  const ctaFooterRef = useRef(null);

  // Form states for contact form
  const [formData, setFormData] = useState<FormDataState>({
    name: "",
    email: "",
    message: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrorsState>({
    name: false,
    email: false,
    message: false,
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  //twak.to
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://embed.tawk.to/6876316f7f202b19181eb4e7/1j06r26po";
    script.async = true;
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Data for the feature cards
  const featureCards = [
    {
      title: "Easy Shift Management:",
      description:
        "Effortlessly post, manage, and fill shifts with our intuitive and user-friendly platform.",
      icon: "https://cdn-icons-png.flaticon.com/512/3069/3069176.png",
    },
    {
      title: "Qualified Staff:",
      description:
        "Access a vast pool of verified and highly qualified aged care professionals ready to work.",
      icon: "https://cdn-icons-png.flaticon.com/512/3069/3069177.png",
    },
    {
      title: "Organization Solutions:",
      description:
        "Streamline your workforce management with powerful tools designed for aged care facilities.",
      icon: "https://cdn-icons-png.flaticon.com/512/3069/3069178.png",
    },
    {
      title: "Dedicated Support:",
      description:
        "Receive 24/7 assistance and guidance from our dedicated support team, ensuring smooth operations.",
      icon: "https://cdn-icons-png.flaticon.com/512/3069/3069179.png",
    },
  ];

  // Data for the FAQ section
  const faqItems = [
    {
      question: "What is TheOpenServices?",
      answer:
        "TheOpenServices is a platform designed to streamline the process of finding and managing shifts in aged care facilities, connecting qualified staff with organizations seamlessly.",
    },
    {
      question: "How do I sign up as a staff member?",
      answer:
        "You can sign up as a staff member by clicking on the 'Sign Up' button in the hero section and creating your profile with your qualifications and preferences.",
    },
    {
      question: "How do organizations post shifts?",
      answer:
        "Organizations can easily set up their profile, define staffing requirements, and then quickly create and publish shifts with all necessary details.",
    },
    {
      question: "Is there support available?",
      answer:
        "Yes, we offer 24/7 dedicated support to ensure smooth operations for both staff and organizations.",
    },
    {
      question: "What kind of professionals can join TheOpenServices?",
      answer:
        "Our platform is for verified and highly qualified aged care professionals looking for work opportunities.",
    },
    {
      question: "Can I manage my shifts through the platform?",
      answer:
        "Yes, staff members can browse a wide range of shifts and apply for those that best fit their schedule and expertise, and organizations can efficiently review applications and manage their workforce.",
    },
  ];

  // For the parallax effect on the illustration image
  const { scrollYProgress } = useScroll();
  const imageParallaxY = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"]);

  // Ref for the new curved background element
  const curvedBgRef = useRef(null);
  const { scrollYProgress: curvedBgScrollYProgress } = useScroll({
    target: curvedBgRef,
    offset: ["start end", "end start"],
  });
  const curvedBgScale = useTransform(
    curvedBgScrollYProgress,
    [0, 1], 
    [0.1, 2]
  );
  const curvedBgOpacity = useTransform(
    curvedBgScrollYProgress,
    [1, 0], 
    [1, 0] 
  );

  // Rotating text logic for "How We Work" section
  const rotatingWords = ["Work", "Think", "Build", "Deliver"];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex(
        (prevIndex: number) => (prevIndex + 1) % rotatingWords.length
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Form validation and submission logic
  const validateField = useCallback(
    (name: keyof FormDataState, value: string): boolean => {
      let isValid = true;
      if (name === "email") {
        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      } else {
        isValid = value.trim() !== "";
      }
      setFormErrors((prev) => ({ ...prev, [name]: !isValid })); 
      return isValid;
    },
    []
  );

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name as keyof FormDataState]: value })); 
    
    validateField(name as keyof FormDataState, value); 
  };

  const handleBlur = (
    e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    
    const { name, value } = e.target;
    validateField(name as keyof FormDataState, value); e
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage("");
    setIsSubmitted(false);

    let allFieldsValid = true;
    const newFormErrors: FormErrorsState = {
      name: false,
      email: false,
      message: false,
    }; 
    for (const key in formData) {
      const typedKey = key as keyof FormDataState;
      const isValid = validateField(typedKey, formData[typedKey]); 
      if (!isValid) {
        newFormErrors[typedKey] = true;
        allFieldsValid = false;
      }
    }
    setFormErrors(newFormErrors);

    if (!allFieldsValid) {
      setIsSubmitting(false);
      setSubmitMessage("Please fill in all required fields correctly.");
      setIsSubmitted(true);
      return;
    }

    try {
      // Submit to your new API route
      const response = await fetch("/api/submit-contact-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitMessage(
          "Message sent successfully! We'll get back to you soon."
        );
        setFormData({ name: "", email: "", message: "" }); // Clear form
        setFormErrors({ name: false, email: false, message: false });
      } else {
        console.error("Submission error:", result);
        setSubmitMessage(
          result.message || "Failed to send message. Please try again later."
        );
      }
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };

  return (
    <main className="flex min-h-screen flex-col font-ubuntu pb-16 md:pb-0">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap");
        .font-ubuntu {
          font-family: "Ubuntu", sans-serif;
        }
        #tawkchat-minimized-box,
        .tawk-min-container {
          bottom: 80px !important;
          right: 16px !important;
          z-index: 9999 !important;
        }
      `}</style>
      <Navigation />
      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#fff5e2] to-white relative overflow-hidden">
        {/* New curved element behind the image */}
        <motion.div
          ref={curvedBgRef}
          className="absolute right-0 bottom-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#fe7239] rounded-full z-0"
          style={{ scale: curvedBgScale, opacity: curvedBgOpacity }}
        ></motion.div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-8 sm:gap-12">
            <div className="text-center lg:text-left flex-1 w-full">
              <motion.h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#454640] mb-4 leading-tight"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                Thoughtful care for every life - powered by{" "}
                <span className="text-[#3464b4]">purpose</span> and
                <span className="text-[#3464b4]"> intelligence</span>
              </motion.h1>

              <motion.p
                className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto lg:mx-0"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                TheOpenServices streamlines the process of finding and managing
                shifts in aged care facilities. Join our platform to connect
                staff with organizations seamlessly.
              </motion.p>

              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                {!isLoading &&
                  (user ? (
                    <motion.a
                      href="/profile"
                      className="w-full sm:w-auto px-8 py-3 text-base sm:text-lg font-medium text-white bg-[#3464b4] rounded-lg hover:bg-blue-800 flex items-center justify-center shadow-md"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Profile
                    </motion.a>
                  ) : (
                    <>
                      <motion.a
                        href="/api/auth/login?screen_hint=signup"
                        className="w-full sm:w-auto px-8 py-3 text-base sm:text-lg font-medium text-white bg-[#3464b4] rounded-lg hover:bg-blue-800 flex items-center justify-center shadow-md"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Sign Up
                        <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                      </motion.a>
                      <motion.a
                        href="/api/auth/login"
                        className="w-full sm:w-auto px-8 py-3 text-base sm:text-lg font-medium text-gray-700 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center justify-center shadow-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Log In
                      </motion.a>
                    </>
                  ))}
              </div>
            </div>

            <motion.div
              className="flex-1 w-full flex justify-center lg:justify-end" 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              style={{ y: imageParallaxY }}
            >
              <img
                src="/illus1.png"
                alt="TheOpenServices Illustration"
                className="w-full h-auto max-w-lg mx-auto lg:mx-0 rounded-3xl shadow-lg"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section - Changed background for visibility */}
      <section
        id="features"
        className="py-20 text-gray-900 relative bg-[#ffeecf]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          <div className="text-center mb-16">
            <motion.p
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#454640] mb-2 flex flex-col sm:flex-row items-center justify-center gap-2"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6 }}
            >
              <span>Why Choose</span>
              <span className="bg-[#3464b4] text-white px-4 py-2 rounded-full whitespace-nowrap">
                TheOpenServices
              </span>
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-8">
            {featureCards.map((card, index) => (
              <motion.div
                key={index}
                className="p-6 bg-white rounded-xl shadow-md border border-gray-100 flex flex-col sm:flex-row items-center text-center sm:text-left"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <img
                  src={card.icon}
                  alt={card.title.replace(":", " Icon")}
                  className="w-20 h-20 sm:w-24 sm:h-24 mb-4 sm:mb-0 sm:mr-6"
                />
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">
                    {card.title}
                  </h3>
                  <p className="text-gray-600">{card.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 bg-[#fff5e2] rounded-3xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 flex flex-col sm:flex-row items-center justify-center gap-2"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6 }}
            >
              <span>How We</span>
              <RotatingText
                texts={["Work ?", "Think ?", "Build ?", "Deliver ?"]}
                mainClassName="px-2 sm:px-2 md:px-3 bg-[#3464b4] text-white overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-lg"
                staggerFrom={"last"}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-120%" }}
                staggerDuration={0.025}
                splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                rotationInterval={2000}
              />
            </motion.h2>
            <motion.p
              className="mt-4 text-xl text-gray-600"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Simple steps to get started
            </motion.p>

            <Tab.Group
              defaultIndex={activeTab === "organization" ? 0 : 1}
              onChange={(index) =>
                setActiveTab(index === 0 ? "staff" : "organization")
              }
            >
              <Tab.List className="flex justify-center space-x-4 sm:space-x-8 mt-8 p-1 bg-white rounded-full shadow-lg max-w-md mx-auto">
                <Tab
                  as={motion.button}
                  className={({ selected }) =>
                    `relative w-1/2 py-2.5 text-sm sm:text-base leading-5 font-medium rounded-full transition-colors duration-300 focus:outline-none ${
                      selected
                        ? "text-white"
                        : "text-[#3464b4] hover:bg-blue-50"
                    }`
                  }
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {({ selected }) => (
                    <>
                      {selected && (
                        <motion.span
                          className="absolute inset-0 z-0 bg-[#3464b4] rounded-full"
                          layoutId="bubble"
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                          }}
                        />
                      )}
                      <span className="relative z-10">For Staff</span>
                    </>
                  )}
                </Tab>
                <Tab
                  as={motion.button}
                  className={({ selected }) =>
                    `relative w-1/2 py-2.5 text-sm sm:text-base leading-5 font-medium rounded-full transition-colors duration-300 focus:outline-none ${
                      selected
                        ? "text-white"
                        : "text-[#3464b4] hover:bg-blue-50"
                    }`
                  }
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {({ selected }) => (
                    <>
                      {selected && (
                        <motion.span
                          className="absolute inset-0 z-0 bg-[#3464b4] rounded-full"
                          layoutId="bubble"
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30,
                          }}
                        />
                      )}
                      <span className="relative z-10">For Organization</span>
                    </>
                  )}
                </Tab>
              </Tab.List>

              <Tab.Panels className="mt-12">
                <Tab.Panel>
                  <motion.div
                    key="staff-panel"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start"
                  >
                    <motion.div
                      className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-lg border border-[#fac8b4]"
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{ duration: 0.6 }}
                    >
                      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-[#3464b4] text-3xl font-bold mb-6 shadow-md border-4 border-[#fe7239]">
                        <UserGroupIcon className="w-10 h-10" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3 text-gray-900">
                        Create Your Profile
                      </h3>
                      <p className="text-gray-600">
                        Sign up and complete your profile with your
                        qualifications and preferences to showcase your skills.
                      </p>
                    </motion.div>
                    <motion.div
                      className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-lg border border-[#fac8b4]"
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    >
                      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-[#3464b4] text-3xl font-bold mb-6 shadow-md border-4 border-[#fe7239]">
                        <CalendarIcon className="w-10 h-10" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3 text-gray-900">
                        Browse Opportunities
                      </h3>
                      <p className="text-gray-600">
                        Explore a wide range of shifts and apply for those that
                        best fit your schedule and expertise.
                      </p>
                    </motion.div>
                    <motion.div
                      className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-lg border border-[#fac8b4]"
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                    >
                      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-[#3464b4] text-3xl font-bold mb-6 shadow-md border-4 border-[#fe7239]">
                        <ArrowRightIcon className="w-10 h-10" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3 text-gray-900">
                        Start Working
                      </h3>
                      <p className="text-gray-600">
                        Get verified quickly and effortlessly, so you can start
                        your shifts with confidence and without unnecessary
                        delays.
                      </p>
                    </motion.div>
                  </motion.div>
                </Tab.Panel>

                <Tab.Panel>
                  <motion.div
                    key="organization-panel"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start"
                  >
                    <motion.div
                      className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-lg border border-[#fac8b4]"
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{ duration: 0.6 }}
                    >
                      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-[#3464b4] text-3xl font-bold mb-6 shadow-md border-4 border-[#fe7239]">
                        <BuildingOfficeIcon className="w-10 h-10" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3 text-gray-900">
                        Create Your Organization Profile
                      </h3>
                      <p className="text-gray-600">
                        Easily set up your organization's profile and define
                        your specific staffing requirements.
                      </p>
                    </motion.div>
                    <motion.div
                      className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-lg border border-[#fac8b4]"
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    >
                      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-[#3464b4] text-3xl font-bold mb-6 shadow-md border-4 border-[#fe7239]">
                        <CalendarIcon className="w-10 h-10" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3 text-gray-900">
                        Post Shifts
                      </h3>
                      <p className="text-gray-600">
                        Quickly create and publish shifts, specifying all
                        necessary details and preferred schedules.
                      </p>
                    </motion.div>
                    <motion.div
                      className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-lg border border-[#fac8b4]"
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                    >
                      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-[#3464b4] text-3xl font-bold mb-6 shadow-md border-4 border-[#fe7239]">
                        <UserGroupIcon className="w-10 h-10" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3 text-gray-900">
                        Manage Your Workforce
                      </h3>
                      <p className="text-gray-600">
                        Efficiently review applications, manage your staff, and
                        track shift fulfillment with ease.
                      </p>
                    </motion.div>
                  </motion.div>
                  <div className="text-center mt-12">
                    <motion.button
                      className="px-8 py-3 text-lg font-medium text-[#3464b4] border border-[#fe7239] hover:text-white rounded-lg hover:bg-[#fe7239] shadow-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Know More
                    </motion.button>
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-[#1a4154]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-start gap-12">
            {/* Left side: Heading */}
            <div className="lg:w-1/3 text-center lg:text-left mb-8 lg:mb-0">
              <motion.p
                className="text-lg font-semibold text-[#fe7239] mb-2 flex items-center justify-center lg:justify-start gap-2"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5 }}
              >
                <QuestionMarkCircleIcon className="w-5 h-5" />
                Clear your doubts
              </motion.p>
              <motion.h2
                className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                Frequently Asked Questions?
              </motion.h2>
            </div>

            {/* Right side: FAQ Items */}
            <div className="lg:w-2/3 space-y-4">
              {faqItems.map((item, index) => (
                <motion.div
                  key={index}
                  className="bg-gray-50 rounded-xl shadow-sm border border-gray-100"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Disclosure>
                    {({ open }) => (
                      <>
                        <Disclosure.Button className="flex justify-between items-center w-full px-6 py-4 text-lg font-semibold text-left text-gray-900 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
                          <span>
                            <span className="text-[#3464b4] mr-2">{`0${
                              index + 1
                            }.`}</span>
                            {item.question}
                          </span>
                          <motion.span
                            initial={false}
                            animate={{ rotate: open ? 45 : 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 260,
                              damping: 20,
                            }}
                          >
                            {open ? (
                              <MinusIcon className="w-6 h-6 text-[#3464b4]" />
                            ) : (
                              <PlusIcon className="w-6 h-6 text-[#3464b4]" />
                            )}
                          </motion.span>
                        </Disclosure.Button>
                        <AnimatePresence>
                          {open && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <Disclosure.Panel className="px-6 pb-4 text-gray-600">
                                {item.answer}
                              </Disclosure.Panel>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </Disclosure>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="py-20 bg-[#fff5e2] text-[#454640]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-12 items-center lg:items-start">
            {/* Left side: Form */}
            <motion.form
              onSubmit={handleSubmit}
              className="w-full lg:w-1/2 bg-white p-6 sm:p-8 rounded-xl shadow-lg space-y-6 relative"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7 }}
            >
              {/* Name Input */}
              <motion.div
                className="relative pb-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <label htmlFor="name" className="sr-only">
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-5 py-3 border rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 ${
                    formErrors.name
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : formData.name.trim() !== ""
                      ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  }`}
                  required
                />
                {formErrors.name && (
                  <p className="text-red-500 text-sm mt-1 absolute bottom-0 left-0">
                    Name is required.
                  </p>
                )}
              </motion.div>

              {/* Email Input */}
              <motion.div
                className="relative pb-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <label htmlFor="email" className="sr-only">
                  Your Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Your Email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-5 py-3 border rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 ${
                    formErrors.email
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : formData.email.trim() !== "" && !formErrors.email
                      ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  }`}
                  required
                />
                {formErrors.email && (
                  <p className="text-red-500 text-sm mt-1 absolute bottom-0 left-0">
                    Valid email is required.
                  </p>
                )}
              </motion.div>

              {/* Message Textarea */}
              <motion.div
                className="relative pb-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <label htmlFor="message" className="sr-only">
                  Your Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  placeholder="Your Message"
                  value={formData.message}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-5 py-3 border rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 ${
                    formErrors.message
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : formData.message.trim() !== ""
                      ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  }`}
                  required
                ></textarea>
                {formErrors.message && (
                  <p className="text-red-500 text-sm mt-1 absolute bottom-0 left-0">
                    Message is required.
                  </p>
                )}
              </motion.div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                className="w-full px-8 py-3 text-lg font-medium text-white bg-[#3464b4] rounded-lg hover:bg-blue-800 flex items-center justify-center shadow-md transition-colors duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white mr-3"
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
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  "Send Message"
                )}
              </motion.button>

              {/* Submission Message */}
              <AnimatePresence>
                {isSubmitted && submitMessage && (
                  <motion.p
                    className={`text-center font-medium mt-4 ${
                      submitMessage.includes("successfully")
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {submitMessage}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.form>

            {/* Right side: Contact Info */}
            <div className="w-full lg:w-1/2 text-center lg:text-left">
              <motion.h2
                className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6 }}
              >
                Have more questions?
              </motion.h2>
              <motion.p
                className="text-lg sm:text-xl text-[#fe7239] mb-8"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                Reach out to us directly or through the contact information
                below.
              </motion.p>

              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <p className="text-xl text-[#454640] flex items-center justify-center lg:justify-start gap-2">
                  <PhoneIcon className="w-6 h-6 text-[#fe7239]" /> +61 438 143
                  059
                </p>
                <p className="text-xl text-[#454640] flex items-center justify-center lg:justify-start gap-2">
                  <EnvelopeIcon className="w-6 h-6 text-[#fe7239]" />{" "}
                  contact@theopenservices.com
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a4154] text-gray-600 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-white">
                TheOpenServices
              </h3>
              <p className="text-white">
                Thoughtful care for every life - powered by purpose and
                intelligence
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#features"
                    className="text-white hover:text-blue-200 transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="text-white hover:text-blue-200 transition-colors"
                  >
                    How it Works
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="text-white hover:text-blue-200 transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-white hover:text-blue-200 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-white hover:text-blue-200 transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Contact</h4>
              <ul className="space-y-2">
                <li className="text-white">Email: contact@theopenservices.com</li>
                <li className="text-white">Phone: +61 438 143 059</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white mt-8 pt-8 text-center text-white">
            <p>
              &copy; {new Date().getFullYear()} TheOpenServices. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
