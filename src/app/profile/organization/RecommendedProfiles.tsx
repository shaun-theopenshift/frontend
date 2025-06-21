import React from 'react';

const dummyProfiles = [
  { name: 'Alice Johnson', designation: 'Senior Plumber', service: 'Pipe Repair', address: '123 Main St, Sydney' },
  { name: 'Bob Smith', designation: 'Master Electrician', service: 'Wiring & Lighting', address: '456 Queen St, Melbourne' },
  { name: 'Carol Lee', designation: 'Lead Carpenter', service: 'Custom Furniture', address: '789 King St, Brisbane' },
  { name: 'David Kim', designation: 'Professional Painter', service: 'Interior & Exterior', address: '321 River Rd, Perth' },
  { name: 'Eva Brown', designation: 'Expert Gardener', service: 'Landscaping', address: '654 Park Ave, Adelaide' },
  { name: 'Frank White', designation: 'Cleaning Specialist', service: 'Home & Office', address: '987 Beach Rd, Gold Coast' },
];

// Duplicate the list for seamless looping
const scrollingProfiles = [...dummyProfiles, ...dummyProfiles];

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export default function RecommendedProfiles() {
  return (
    <aside
      className="w-full md:w-80 md:fixed md:right-0 md:top-16 md:h-[calc(100vh-4rem)] z-20 flex flex-col items-center px-2 md:px-0"
    >
      <div className="w-full max-w-xs mx-auto bg-white rounded-xl shadow-md p-4 mb-4 mt-2 md:mt-8 h-full flex flex-col">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
          Recommended for you <span role="img" aria-label="star">⭐</span>
        </h2>
        <div className="relative flex-1 overflow-hidden">
          <div
            className="flex flex-col md:flex-col animate-scroll-vertical-full h-full md:h-full mobile-horizontal-scroll"
            style={{
              animation: 'scroll-vertical-full 18s linear infinite',
            }}
          >
            {scrollingProfiles.map((profile, idx) => (
              <div
                key={idx}
                className="bg-[#f7f7f7] rounded-lg shadow p-4 mb-4 flex items-center border border-gray-100 min-h-[90px] md:min-w-0 md:mr-0 min-w-[260px] mr-4 mobile-profile-card"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#2954bd] flex items-center justify-center text-white font-bold text-lg mr-4">
                  {getInitials(profile.name)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 text-base">{profile.name}</div>
                  <div className="text-xs text-gray-600">{profile.designation}</div>
                  <div className="text-xs text-[#2954bd] font-medium">{profile.service}</div>
                  <div className="text-xs text-gray-400 mt-1">{profile.address}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes scroll-vertical-full {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-scroll-vertical-full {
          will-change: transform;
        }
        @media (max-width: 767px) {
          .md\\:fixed {
            position: static !important;
          }
          .md\\:top-16 {
            top: 0 !important;
          }
          .md\\:h-\[calc\(100vh-4rem\)\] {
            height: auto !important;
          }
          .max-w-xs {
            max-width: 100% !important;
          }
          .h-full, .flex-1 {
            height: auto !important;
          }
          /* Horizontal marquee for mobile */
          .mobile-horizontal-scroll {
            flex-direction: row !important;
            height: auto !important;
            animation: scroll-horizontal-full 18s linear infinite !important;
          }
          .mobile-profile-card {
            margin-bottom: 0 !important;
          }
          @keyframes scroll-horizontal-full {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        }
      `}</style>
    </aside>
  );
} 