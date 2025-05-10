'use client';

import { useState } from 'react';
import { ArrowRightIcon, CalendarIcon, UserGroupIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import Navigation from './components/Navigation';

export default function Home() {
  const [activeTab, setActiveTab] = useState('organization');

  return (
    <main className="flex min-h-screen flex-col">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#e6f2f2] to-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-12">
            <div className="text-center lg:text-left flex-1 w-full">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-2">
                Bridging Aged Care Organizations and Staff through Meaningful{' '}
                <span className="text-[#67b5b5]">Opportunities</span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto lg:mx-0">
                TheOpenShift streamlines the process of finding and managing shifts in aged care facilities.
                Join our platform to connect staff with organizations seamlessly.
              </p>
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 sm:gap-4">
                <button className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg font-medium text-white bg-[#67b5b5] rounded-md hover:bg-[#4a9e9e] flex items-center justify-center">
                  Sign Up
                  <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </button>
                <button className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg font-medium text-[#67b5b5] border border-[#67b5b5] rounded-md hover:bg-[#e6f2f2]">
                  Log In
                </button>
              </div>
            </div>

            <div className="hidden lg:block flex-1">
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 500 500"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-auto max-w-lg mx-auto"
              >
                <path d="M250 50C138.5 50 50 138.5 50 250C50 361.5 138.5 450 250 450C361.5 450 450 361.5 450 250C450 138.5 361.5 50 250 50ZM250 400C166.5 400 100 333.5 100 250C100 166.5 166.5 100 250 100C333.5 100 400 166.5 400 250C400 333.5 333.5 400 250 400Z" fill="#67b5b5" fillOpacity="0.2" />
                <path d="M250 150C194.8 150 150 194.8 150 250C150 305.2 194.8 350 250 350C305.2 350 350 305.2 350 250C350 194.8 305.2 150 250 150ZM250 300C211.4 300 200 288.6 200 250C200 211.4 211.4 200 250 200C288.6 200 300 211.4 300 250C300 288.6 288.6 300 250 300Z" fill="#67b5b5" fillOpacity="0.3" />
                <path d="M250 200C228.9 200 200 228.9 200 250C200 271.1 228.9 300 250 300C271.1 300 300 271.1 300 250C300 228.9 271.1 200 250 200Z" fill="#67b5b5" fillOpacity="0.4" />
                <path d="M250 225C238.4 225 225 238.4 225 250C225 261.6 238.4 275 250 275C261.6 275 275 261.6 275 250C275 238.4 261.6 225 250 225Z" fill="#67b5b5" />
                <path d="M150 150L200 200M300 200L350 150M150 350L200 300M300 300L350 350" stroke="#67b5b5" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose TheOpenShift?</h2>
            <p className="mt-4 text-xl text-gray-600">Streamline your aged care staffing needs</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <CalendarIcon className="w-12 h-12 text-[#67b5b5] mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Easy Shift Management</h3>
              <p className="text-gray-600">Post and manage shifts effortlessly with our intuitive platform.</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <UserGroupIcon className="w-12 h-12 text-[#67b5b5] mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Qualified Staff</h3>
              <p className="text-gray-600">Access a pool of verified and qualified aged care professionals.</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <BuildingOfficeIcon className="w-12 h-12 text-[#67b5b5] mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Organization Solutions</h3>
              <p className="text-gray-600">Comprehensive tools for aged care facilities to manage their workforce.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 bg-[#f5f9f9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-4 text-xl text-gray-600">Simple steps to get started</p>

            {/* Toggle Buttons */}
            <div className=" flex justify-center space-x-8 mt-8">
              <button
                className={`text-lg font-medium pb-2 transition-all duration-200 ${activeTab === 'staff'
                  ? 'text-[#67b5b5] border-b-2 border-[#67b5b5]'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
                onClick={() => setActiveTab('staff')}
              >
                For Staff
              </button>
              <button
                className={`text-lg font-medium pb-2 transition-all duration-200 ${activeTab === 'organization'
                  ? 'text-[#67b5b5] border-b-2 border-[#67b5b5]'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
                onClick={() => setActiveTab('organization')}
              >
                For Organization
              </button>
            </div>
          </div>

          {/* Organization Steps */}
          {activeTab === 'organization' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center ">
                  <div className="w-16 h-16 bg-[#67b5b5] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">1</div>
                  <div className="h-60 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                    <img src="/icons/svg_og_1.svg" alt="Create Profile" className="w-60 h-60" />
                  </div>

                  <h3 className="text-xl font-semibold mb-2 text-gray-900">Create Your Organization Profile</h3>
                  <p className="text-gray-600">Set up your organizations profile and specify your staffing needs.</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#67b5b5] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">2</div>
                  <div className="h-60 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                    <img src="/icons/svg_og_2.svg" alt="Create Profile" className="w-60 h-60" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">Post Shifts</h3>
                  <p className="text-gray-600">Create and manage shifts with specific requirements and schedules.</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#67b5b5] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">3</div>
                  <div className="h-60 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                    <img src="/icons/svg_og_3.svg" alt="Create Profile" className="w-60 h-60" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">Manage Your Workforce</h3>
                  <p className="text-gray-600">Review applications, manage staff, and track shift fulfillment.</p>
                </div>
              </div>
              <div className="text-center mt-12">
                <button className="px-8 py-3 text-lg font-medium text-[#67b5b5] border border-[#67b5b5] rounded-md hover:bg-[#e6f2f2]">
                  Know More
                </button>
              </div>
            </>
          )}

          {/* Staff Steps */}
          {activeTab === 'staff' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#67b5b5] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">1</div>
                <div className="h-60 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                  <img src="/icons/svg_hiw_1.svg" alt="Create Profile" className="w-60 h-60" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Create Your Profile</h3>
                <p className="text-gray-600">Sign up and complete your profile with your qualifications and preferences.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#67b5b5] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">2</div>
                <div className="h-60 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                  <img src="/icons/svg_hiw_2.svg" alt="Create Profile" className="w-70 h-70" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Browse Opportunities</h3>
                <p className="text-gray-600">Find and apply for shifts that match your skills and availability.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-[#67b5b5] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">3</div>
                <div className="h-60 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                  <img src="/icons/svg_hiw_3.svg" alt="Create Profile" className="w-60 h-60" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">Start Working</h3>
                <p className="text-gray-600">Get confirmed and start your shift with our seamless process.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20 bg-[#67b5b5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-[#e6f2f2] mb-8">Join TheOpenShift today and transform how you manage aged care staffing.</p>
          <button className="px-8 py-3 text-lg font-medium text-[#67b5b5] bg-white rounded-md hover:bg-[#f5f9f9]">
            Sign Up Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">TheOpenShift</h3>
              <p className="text-gray-400">Connecting aged care staff with opportunities.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white">Features</a></li>
                <li><a href="#how-it-works" className="text-gray-400 hover:text-white">How it Works</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2">
                <li className="text-gray-400">Email: contact@theopenshift.com</li>
                <li className="text-gray-400">Phone: (123) 456-7890</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} TheOpenShift. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
