'use client';
import React, { useState, useEffect } from 'react';
import SidebarProfile from '../../../components/SidebarProfile';
import TopNav from '../../../components/TopNav';
import { MapPinIcon, ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Player from 'lottie-react';
import searchWorkerLottie from './Search-Worker.json';
import Navigation from '../../../components/Navigation';
import RecommendedProfiles from '../RecommendedProfiles';

const sidebarUser = { name: 'Organization' };

export default function SearchWorkerPage() {
  const [address, setAddress] = useState('');
  const [previousSearch, setPreviousSearch] = useState<string | null>(null);
  const [services, setServices] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Helper to trigger search
  const triggerSearch = async (searchAddress: string, searchServices: string[], searchPreferences: string[]) => {
    if (!searchAddress.trim() && searchServices.length === 0 && searchPreferences.length === 0) return;
    setPreviousSearch(searchAddress);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchAddress.trim()) params.append('address', searchAddress);
      searchServices.forEach(s => params.append('services', s));
      searchPreferences.forEach(p => params.append('preferences', p));
      // Fetch Auth0 access token from session
      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();
      if (!session?.accessToken) throw new Error('No access token available');
      const res = await fetch(`https://api.theopenshift.com/v1/orgs/search?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Accept': 'application/json',
        },
      });
      const data = await res.json();
      setResults(data.items || []);
    } catch (err) {
      setResults([]);
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSearch(address, services, preferences);
  };

  // Trigger search when filters change
  useEffect(() => {
    if (services.length > 0 || preferences.length > 0) {
      triggerSearch(address, services, preferences);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services, preferences]);

  return (
    <div className="min-h-screen bg-white">
      <div className="block md:hidden">
        <Navigation />
      </div>
      <div className="hidden md:block">
        <TopNav />
      </div>
      <div className="hidden md:block">
        <SidebarProfile userType="organization" user={sidebarUser} />
      </div>
      <div className="block md:hidden mb-4">
        <RecommendedProfiles />
      </div>
      <main className="md:pl-72 pt-16 bg-[#f7f7f7] min-h-screen px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row">
        <div className="max-w-2xl mx-auto py-10 flex-1">
          <h1 className="text-2xl font-bold mb-6">Search workers</h1>
          <div className="mb-2 text-gray-700 font-semibold">Near your location</div>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center mb-8 gap-4">
            <input
              type="text"
              placeholder="Enter your Suburb or Postcode"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="flex-1 px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#2954bd] focus:outline-none bg-white text-gray-900 w-full sm:w-auto"
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-2 bg-[#2954bd] text-white font-semibold rounded-md hover:bg-[#1d3e8a] transition flex items-center justify-center gap-2"
            >
              <MagnifyingGlassIcon className="h-5 w-5 text-white" />
              Search
            </button>
          </form>
          <div className="mb-2 text-gray-700 font-semibold">Previous search</div>
          {previousSearch && (
            <div className="flex items-center bg-white rounded-lg shadow px-4 py-3 mb-4 border border-gray-100">
              <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
              <span className="flex-1 text-gray-900">{previousSearch}</span>
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
            </div>
          )}
          {/* Services Filter */}
          <div className="mb-4">
            <div className="font-semibold mb-1">Services</div>
            <div className="flex flex-wrap gap-2">
              {["everyday", "self_care", "nursing", "healthcare"].map(service => {
                const selected = services.includes(service);
                return (
                  <button
                    type="button"
                    key={service}
                    onClick={() => setServices(s => selected ? s.filter(x => x !== service) : [...s, service])}
                    className={`relative px-4 py-2 rounded-full border transition-all duration-150 text-sm font-medium
                      ${selected ? 'bg-[#2954bd] text-white border-[#2954bd]' : 'bg-white text-[#2954bd] border-[#2954bd]'}
                      shadow-sm flex items-center min-w-[90px] justify-center`}
                  >
                    {selected && (
                      <span className="absolute left-2 top-2">
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#fff"/><path d="M6 10.5l3 3 5-5" stroke="#2954bd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                    )}
                    <span className="ml-4 mr-2 capitalize">{service.replace('_', ' ')}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {/* Preferences Filter */}
          <div className="mb-4">
            <div className="font-semibold mb-1">Preferences</div>
            <div className="flex flex-wrap gap-2">
              {["non_smoker", "no_pets", "male_only", "female_only"].map(pref => {
                const selected = preferences.includes(pref);
                return (
                  <button
                    type="button"
                    key={pref}
                    onClick={() => setPreferences(p => selected ? p.filter(x => x !== pref) : [...p, pref])}
                    className={`relative px-4 py-2 rounded-full border transition-all duration-150 text-sm font-medium
                      ${selected ? 'bg-[#2954bd] text-white border-[#2954bd]' : 'bg-white text-[#2954bd] border-[#2954bd]'}
                      shadow-sm flex items-center min-w-[90px] justify-center`}
                  >
                    {selected && (
                      <span className="absolute left-2 top-2">
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#fff"/><path d="M6 10.5l3 3 5-5" stroke="#2954bd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                    )}
                    <span className="ml-4 mr-2 capitalize">{pref.replace('_', ' ')}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {/* Results */}
          {loading && <div>Loading...</div>}
          {results.length > 0 && (
            <div className="mt-6">
              <h2 className="font-bold mb-2">Results</h2>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {results.map((user: any) => (
                  <div key={user.user_id || user.id} className="bg-white border rounded-lg shadow p-4 flex flex-col items-start">
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 rounded-full bg-[#2954bd] flex items-center justify-center text-white text-xl font-bold mr-4">
                        {`${user.fname?.[0] || ''}${user.lname?.[0] || ''}`.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-gray-900">{`${user.fname || ''} ${user.lname || ''}`.trim() || 'No Name'}</div>
                        {user.role && <div className="text-sm text-gray-500">{user.role}</div>}
                        {user.address && <div className="text-sm text-gray-500">{user.address}</div>}
                      </div>
                    </div>
                    {/* Add more user info as needed */}
                    <button
                      className="mt-2 px-4 py-2 bg-[#2954bd] text-white rounded hover:bg-[#1d3e8a] transition font-semibold"
                      onClick={() => window.location.href = `/profile/organization/search-worker/profile/${user.user_id || user.id}`}
                    >
                      View Profile
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Lottie animation only if no results */}
          {results.length === 0 && !loading && (
            <div className="flex justify-center mt-8">
              <div className="w-[400px] h-[400px]">
                <Player autoplay loop animationData={searchWorkerLottie} />
              </div>
            </div>
          )}
        </div>
        <div className="hidden md:block md:pl-8 md:w-80">
          <RecommendedProfiles />
        </div>
      </main>
    </div>
  );
} 