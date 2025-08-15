"use client";

import SidebarProfile from '@/app/components/SidebarProfile';
import { useUser } from "@auth0/nextjs-auth0/client";
import Lottie from "lottie-react";
import comingSoonLottie from "./inboxAnimation.json"; // Place your Lottie file in this folder
import { motion } from "framer-motion"; // Import Framer Motion

export default function InboxPage() {
  const { user } = useUser();

  // Sanitize user for SidebarProfile
  const sidebarUser = user
    ? {
        name: typeof user.name === 'string' ? user.name : undefined,
        picture: typeof user.picture === 'string' ? user.picture : undefined,
        email: typeof user.email === 'string' ? user.email : undefined,
      }
    : null;

  return (
    <div className="flex min-h-screen bg-[#f6f8fa] relative overflow-hidden">
      <SidebarProfile user={sidebarUser} userType="staff" />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 z-10 pb-24 md:pb-0">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-6xl flex flex-col md:flex-row items-center md:items-center justify-center gap-16" // Increased max-w and gap, changed align to center
        >
          {/* Left Column: Lottie + Coming Soon Text */}
          <div className="flex flex-col items-center justify-center md:w-1/2 w-full mb-8 md:mb-0">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="w-96 h-96 mb-8" // Increased Lottie size for better visual balance
            >
              <Lottie animationData={comingSoonLottie} loop autoplay />
            </motion.div>
            <h1 className="text-4xl font-extrabold text-[#3464b4] mb-4 text-center leading-tight">
              Inbox: Coming Soon to You.
            </h1>
            <p className="text-xl text-gray-700 text-center max-w-md">
              Experience direct messages and seamless updates. Your pathway to effortless aged care communication is almost here.
            </p>
            {/* Removed "Get early access" section */}
          </div>

          {/* Right Column: Chat UI Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white rounded-xl shadow-2xl p-6 md:w-1/2 w-full flex flex-col justify-between max-h-[600px] overflow-hidden"
            style={{ minHeight: '500px' }}
          >
            <h2 className="text-xl font-bold text-[#3464b4] mb-4 text-center">Inbox</h2>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {/* Message 1: From other user */}
              <div className="flex items-start mb-4">
                <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm mr-3">L</div>
                <div className="bg-gray-100 p-3 rounded-xl max-w-[75%]">
                  <p className="text-sm font-semibold text-gray-800">Laura</p>
                  <p className="text-gray-700">Hi there! Are you available to chat?</p>
                </div>
              </div>

              {/* Message 2: From current user */}
              <div className="flex justify-end mb-4">
                <div className="bg-[#3464b4] text-white p-3 rounded-xl max-w-[75%]">
                  <p className="text-gray-100">Yes, let's connect!</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-400 text-white flex items-center justify-center font-bold text-sm ml-3">Y</div>
              </div>

              {/* Message 3: From other user (example) */}
              <div className="flex items-start mb-4">
                <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-sm mr-3">L</div>
                <div className="bg-gray-100 p-3 rounded-xl max-w-[75%]">
                  <p className="text-sm font-semibold text-gray-800">Laura</p>
                  <p className="text-gray-700">Great! I have a question about the shift details for tomorrow.</p>
                </div>
              </div>

              {/* Message 4: From current user (example) */}
              <div className="flex justify-end mb-4">
                <div className="bg-[#3464b4] text-white p-3 rounded-xl max-w-[75%]">
                  <p className="text-gray-100">Sure, I'm here to help. What do you need to know?</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-400 text-white flex items-center justify-center font-bold text-sm ml-3">Y</div>
              </div>

            </div>

            {/* Message Input Area (Disabled for Design) */}
            <div className="mt-4 flex items-center border-t border-gray-200 pt-4 opacity-70 cursor-not-allowed"> {/* Added opacity and cursor-not-allowed */}
              <input
                type="text"
                placeholder="Message"
                className="flex-1 p-3 rounded-lg border border-gray-300 mr-2 bg-gray-100" // Changed bg to gray-100
                disabled // Disabled the input field
              />
              <button
                className="bg-[#3464b4] text-white p-3 rounded-full hover:bg-[#2a5091] transition-colors duration-300"
                disabled // Disabled the button
              >
                <svg className="w-6 h-6 transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
              </button>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}