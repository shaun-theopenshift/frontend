'use client';

import React, { useState, useEffect, Fragment } from 'react';
import SidebarProfile from '../../../components/SidebarProfile';
import { MapPinIcon, MagnifyingGlassIcon, ChevronDownIcon, ChevronUpIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Player from 'lottie-react';
import searchWorkerLottie from './Search-Worker.json';
import { Disclosure, Listbox, Transition, Dialog } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';

const sidebarUser = { name: 'Organization' };

// Define filter options
const genderOptions = ['Male', 'Female', 'Other'];
const badgeOptions = ['lgbtq', 'non_smoker', 'pet_friendly'];
const vaccinationOptions = ['covid_19', 'flu', 'tetanus'];
const languageOptions = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Other'];
const interestOptions = ['cooking', 'movies', 'pets', 'sports', 'gardening', 'music', 'photography', 'travel', 'art', 'reading', 'games', 'festivities', 'fitness'];
const preferenceOptions = ['non_smoker', 'no_pets', 'male_only', 'female_only'];
const serviceOptions = ["everyday", "self_care", "nursing", "healthcare"];
const availabilityOptions = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function SearchWorkerPage() {
  const [address, setAddress] = useState('');
  const [previousSearch, setPreviousSearch] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  // Filter states
  const [gender, setGender] = useState<string[]>([]);
  const [badges, setBadges] = useState<string[]>([]);
  const [vaccinations, setVaccinations] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [availability, setAvailability] = useState<string[]>([]);

  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);

  // Helper to trigger search
  const triggerSearch = async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (address.trim()) params.append('suburb', address);
      params.append('page', page.toString());
      params.append('page_size', pageSize.toString());

      gender.forEach(g => params.append('gender', g.toLowerCase()));
      badges.forEach(b => params.append('badges', b));
      vaccinations.forEach(v => params.append('vaccinations', v));
      languages.forEach(l => params.append('languages', l));
      interests.forEach(i => params.append('interests', i));
      preferences.forEach(p => params.append('preferences', p));
      services.forEach(s => params.append('services', s));
      availability.forEach(a => params.append('availability', a));

      console.log("Fetching with params:", params.toString()); // Log parameters for debugging

      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();
      if (!session?.accessToken) throw new Error('No access token available');

      const res = await fetch(`https://api.theopenshift.com/v1/orgs/search_users?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Accept': 'application/json',
        },
      });
      const data = await res.json();
      setResults(data.items || []);
      setTotalItems(data.total || 0);
      setTotalPages(Math.ceil((data.total || 0) / pageSize));
      setCurrentPage(page);
      setPreviousSearch(address);
    } catch (err) {
      console.error("Failed to fetch search results:", err);
      setResults([]);
      setTotalItems(0);
      setTotalPages(1);
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    triggerSearch(1);
  };

  useEffect(() => {
    // Added 'address' to the dependency array to trigger search when address changes
    triggerSearch(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, gender, badges, vaccinations, languages, interests, preferences, services, availability, currentPage]);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const toggleFilter = (filterArray: string[], setFilterArray: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setFilterArray(prev =>
      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
    );
  };

  const clearAllFilters = () => {
    setGender([]);
    setBadges([]);
    setVaccinations([]);
    setLanguages([]);
    setInterests([]);
    setPreferences([]);
    setServices([]);
    setAvailability([]);
    setAddress(''); // Clear address as well
    setCurrentPage(1);
    triggerSearch(1);
  };

  interface FilterSectionProps {
    title: string;
    options: string[];
    selected: string[];
    onToggle: (item: string) => void;
  }

  const FilterSection: React.FC<FilterSectionProps> = ({ title, options, selected, onToggle }) => (
    <Disclosure as="div" className="mb-4 bg-white rounded-lg shadow-sm border border-gray-100">
      {({ open }) => (
        <>
          <Disclosure.Button className="flex justify-between w-full px-4 py-3 text-left text-lg font-medium text-gray-800 hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-[#3464b4] focus-visible:ring-opacity-75 rounded-t-lg">
            <span>{title}</span>
            {open ? (
              <ChevronUpIcon className="h-6 w-6 text-gray-500" />
            ) : (
              <ChevronDownIcon className="h-6 w-6 text-gray-500" />
            )}
          </Disclosure.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 -translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 -translate-y-1"
          >
            <Disclosure.Panel className="px-4 pt-2 pb-4 text-sm text-gray-600 border-t border-gray-100">
              <div className="flex flex-wrap gap-2">
                {options.map((item: string) => {
                  const isSelected = selected.includes(item);
                  return (
                    <motion.button
                      key={item}
                      type="button"
                      onClick={() => onToggle(item)}
                      className={`relative px-4 py-2 rounded-full border transition-all duration-150 text-sm font-medium
                        ${isSelected ? 'bg-[#3464b4] text-white border-[#3464b4]' : 'bg-white text-[#3464b4] border-[#3464b4]'}
                        shadow-sm flex items-center justify-center`}
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      {isSelected && (
                        <span className="absolute left-2 top-1/2 -translate-y-1/2">
                          <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#fff"/><path d="M6 10.5l3 3 5-5" stroke="#3464b4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </span>
                      )}
                      <span className={`${isSelected ? 'ml-4' : ''} mr-2 capitalize`}>{item.replace(/_/g, ' ')}</span>
                    </motion.button>
                  );
                })}
              </div>
            </Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  );

  const allAppliedFilters = [
    ...gender.map(g => ({ type: 'Gender', value: g })),
    ...badges.map(b => ({ type: 'Badge', value: b })),
    ...vaccinations.map(v => ({ type: 'Vaccination', value: v })),
    ...languages.map(l => ({ type: 'Language', value: l })),
    ...interests.map(i => ({ type: 'Interest', value: i })),
    ...preferences.map(p => ({ type: 'Preference', value: p })),
    ...services.map(s => ({ type: 'Service', value: s })),
    ...availability.map(a => ({ type: 'Availability', value: a })),
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      {/* SidebarProfile for all screen sizes */}
      <div>
        <SidebarProfile userType="organization" user={sidebarUser} />
      </div>

      <main className="md:pl-72 pt-16 bg-gray-50 min-h-screen px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:justify-center md:items-start md:gap-8">
        {/* Desktop Filters Section */}
        <div className="hidden md:block md:w-72 lg:w-80 flex-shrink-0 py-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Filters</h2>
          <div className="space-y-4">
            {/* Top Filters */}
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Top Filters</h3>
            <FilterSection
              title="Availability"
              options={availabilityOptions}
              selected={availability}
              onToggle={(item) => toggleFilter(availability, setAvailability, item)}
            />
            <FilterSection
              title="Services"
              options={serviceOptions}
              selected={services}
              onToggle={(item) => toggleFilter(services, setServices, item)}
            />
            <FilterSection
              title="Preferences"
              options={preferenceOptions}
              selected={preferences}
              onToggle={(item) => toggleFilter(preferences, setPreferences, item)}
            />

            <div className="border-t border-gray-200 my-6"></div> {/* Separator Line */}

            {/* Additional Filters - Wrapped in Disclosure */}
            <Disclosure as="div">
              {({ open }) => (
                <>
                  <Disclosure.Button className="flex justify-between w-full px-0 py-3 text-left text-xl font-semibold text-gray-800 focus:outline-none focus-visible:ring focus-visible:ring-[#3464b4] focus-visible:ring-opacity-75">
                    <span>Additional Filters</span>
                    {open ? (
                      <ChevronUpIcon className="h-6 w-6 text-gray-500" />
                    ) : (
                      <ChevronDownIcon className="h-6 w-6 text-gray-500" />
                    )}
                  </Disclosure.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 -translate-y-1"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in duration-150"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 -translate-y-1"
                  >
                    <Disclosure.Panel className="pt-2 pb-4 text-sm text-gray-600">
                      <div className="space-y-4">
                        <FilterSection
                          title="Gender"
                          options={genderOptions}
                          selected={gender}
                          onToggle={(item) => toggleFilter(gender, setGender, item)}
                        />
                        <FilterSection
                          title="Badges"
                          options={badgeOptions}
                          selected={badges}
                          onToggle={(item) => toggleFilter(badges, setBadges, item)}
                        />
                        <FilterSection
                          title="Vaccinations"
                          options={vaccinationOptions}
                          selected={vaccinations}
                          onToggle={(item) => toggleFilter(vaccinations, setVaccinations, item)}
                        />
                        <FilterSection
                          title="Languages"
                          options={languageOptions}
                          selected={languages}
                          onToggle={(item) => toggleFilter(languages, setLanguages, item)}
                        />
                        <FilterSection
                          title="Interests"
                          options={interestOptions}
                          selected={interests}
                          onToggle={(item) => toggleFilter(interests, setInterests, item)}
                        />
                      </div>
                    </Disclosure.Panel>
                  </Transition>
                </>
              )}
            </Disclosure>
          </div>
        </div>

        {/* Main Content Area (Search Form, Applied Filters, Results) */}
        <div className="w-full max-w-2xl lg:max-w-3xl flex-grow py-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-6 text-center md:text-left">Search Workers</h1>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="bg-white rounded-lg shadow p-6 mb-8 border border-gray-100">
            <div className="mb-4 text-gray-700 font-semibold">Location Search</div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <input
                type="text"
                placeholder="Enter Suburb or Postcode"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="flex-1 px-4 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#3464b4] focus:outline-none bg-white text-gray-900 w-full sm:w-auto transition duration-150 ease-in-out"
              />
              <motion.button
                type="submit"
                className="w-full sm:w-auto px-8 py-2 bg-[#3464b4] text-white font-semibold rounded-md hover:bg-[#2a5196] transition flex items-center justify-center gap-2 shadow-md"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MagnifyingGlassIcon className="h-5 w-5 text-white" />
                Search
              </motion.button>
            </div>
            {previousSearch && (
              <motion.div
                className="flex items-center bg-gray-50 rounded-lg px-4 py-3 mt-4 border border-gray-200 text-gray-700"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="flex-1">Previous search: <span className="font-medium">{previousSearch}</span></span>
              </motion.div>
            )}
          </form>

          {/* Filter Button for Mobile/Tablet */}
          <div className="md:hidden mb-6">
            <motion.button
              onClick={() => setIsFilterSidebarOpen(true)}
              className="w-full px-6 py-3 bg-[#3464b4] text-white font-semibold rounded-md flex items-center justify-center gap-2 shadow-md hover:bg-[#2a5196] transition"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FunnelIcon className="h-5 w-5" />
              Show Filters
            </motion.button>
          </div>

          {/* Mobile Filter Sidebar (Dialog) */}
          <Transition.Root show={isFilterSidebarOpen} as={Fragment}>
            <Dialog as="div" className="relative z-40 md:hidden" onClose={setIsFilterSidebarOpen}>
              <Transition.Child
                as={Fragment}
                enter="transition-opacity ease-linear duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition-opacity ease-linear duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black bg-opacity-25" />
              </Transition.Child>

              <div className="fixed inset-0 flex">
                <Transition.Child
                  as={Fragment}
                  enter="transition ease-in-out duration-300 transform"
                  enterFrom="-translate-x-full"
                  enterTo="translate-x-0"
                  leave="transition ease-in-out duration-300 transform"
                  leaveFrom="translate-x-0"
                  leaveTo="-translate-x-full"
                >
                  <Dialog.Panel className="relative mr-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-gray-50 py-4 pb-12 shadow-xl">
                    <div className="flex items-center justify-between px-4">
                      <h2 className="text-2xl font-bold text-gray-900">Filters</h2>
                      <button
                        type="button"
                        className="-mr-2 flex h-10 w-10 items-center justify-center rounded-md bg-white p-2 text-gray-400"
                        onClick={() => setIsFilterSidebarOpen(false)}
                      >
                        <span className="sr-only">Close menu</span>
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>

                    {/* Filters in Mobile Sidebar */}
                    <div className="mt-4 border-t border-gray-200 px-4">
                      {/* Top Filters */}
                      <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">Top Filters</h3>
                      <FilterSection
                        title="Availability"
                        options={availabilityOptions}
                        selected={availability}
                        onToggle={(item) => toggleFilter(availability, setAvailability, item)}
                      />
                      <FilterSection
                        title="Services"
                        options={serviceOptions}
                        selected={services}
                        onToggle={(item) => toggleFilter(services, setServices, item)}
                      />
                      <FilterSection
                        title="Preferences"
                        options={preferenceOptions}
                        selected={preferences}
                        onToggle={(item) => toggleFilter(preferences, setPreferences, item)}
                      />

                      <div className="border-t border-gray-200 my-6"></div> {/* Separator Line */}

                      {/* Additional Filters - Wrapped in Disclosure */}
                      <Disclosure as="div">
                        {({ open }) => (
                          <>
                            <Disclosure.Button className="flex justify-between w-full px-0 py-3 text-left text-xl font-semibold text-gray-800 focus:outline-none focus-visible:ring focus-visible:ring-[#3464b4] focus-visible:ring-opacity-75">
                              <span>Additional Filters</span>
                              {open ? (
                                <ChevronUpIcon className="h-6 w-6 text-gray-500" />
                              ) : (
                                <ChevronDownIcon className="h-6 w-6 text-gray-500" />
                              )}
                            </Disclosure.Button>
                            <Transition
                              as={Fragment}
                              enter="transition ease-out duration-200"
                              enterFrom="opacity-0 -translate-y-1"
                              enterTo="opacity-100 translate-y-0"
                              leave="transition ease-in duration-150"
                              leaveFrom="opacity-100 translate-y-0"
                              leaveTo="opacity-0 -translate-y-1"
                            >
                              <Disclosure.Panel className="pt-2 pb-4 text-sm text-gray-600">
                                <div className="space-y-4">
                                  <FilterSection
                                    title="Gender"
                                    options={genderOptions}
                                    selected={gender}
                                    onToggle={(item) => toggleFilter(gender, setGender, item)}
                                  />
                                  <FilterSection
                                    title="Badges"
                                    options={badgeOptions}
                                    selected={badges}
                                    onToggle={(item) => toggleFilter(badges, setBadges, item)}
                                  />
                                  <FilterSection
                                    title="Vaccinations"
                                    options={vaccinationOptions}
                                    selected={vaccinations}
                                    onToggle={(item) => toggleFilter(vaccinations, setVaccinations, item)}
                                  />
                                  <FilterSection
                                    title="Languages"
                                    options={languageOptions}
                                    selected={languages}
                                    onToggle={(item) => toggleFilter(languages, setLanguages, item)}
                                  />
                                  <FilterSection
                                    title="Interests"
                                    options={interestOptions}
                                    selected={interests}
                                    onToggle={(item) => toggleFilter(interests, setInterests, item)}
                                  />
                                </div>
                              </Disclosure.Panel>
                            </Transition>
                          </>
                        )}
                      </Disclosure>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </Dialog>
          </Transition.Root>

          {/* Applied Filters Display */}
          {allAppliedFilters.length > 0 && (
            <motion.div
              className="bg-white rounded-lg shadow p-4 mb-8 border border-gray-100"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-800">Applied Filters</h3>
                <motion.button
                  onClick={clearAllFilters}
                  className="text-sm text-[#3464b4] hover:text-[#2a5196] font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Clear All
                </motion.button>
              </div>
              <div className="flex flex-wrap gap-2">
                {allAppliedFilters.map((filter, index) => (
                  <span
                    key={index}
                    className="flex items-center bg-[#e0e9f8] text-[#3464b4] text-sm font-medium px-3 py-1 rounded-full"
                  >
                    {filter.type}: {filter.value.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Results */}
          {loading && (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3464b4]"></div>
              <p className="ml-4 text-gray-700">Loading results...</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <motion.div
              className="mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/*<h2 className="text-2xl font-bold text-gray-900 mb-4">Search Results ({totalItems} found)</h2>*/}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <AnimatePresence>
                  {results.map((user: any) => (
                    <motion.div
                      key={user.user_id || user.id}
                      className="bg-white border border-gray-100 rounded-lg shadow-md p-4 flex flex-col items-start hover:shadow-lg transition-shadow duration-200"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      layout
                    >
                      <div className="flex items-center mb-3">
                        <div className="w-14 h-14 rounded-full bg-[#3464b4] flex items-center justify-center text-white text-xl font-bold mr-4 flex-shrink-0">
                          {`${user.fname?.[0] || ''}${user.lname?.[0] || ''}`.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-gray-900">{`${user.fname || ''} ${user.lname || ''}`.trim() || 'No Name'}</div>
                          {user.role && <div className="text-sm text-gray-600">{user.role}</div>}
                          {user.address && <div className="text-sm text-gray-600">{user.address}</div>}
                        </div>
                      </div>
                      <motion.button
                        className="mt-2 px-4 py-2 bg-[#3464b4] text-white rounded-md hover:bg-[#2a5196] transition font-semibold shadow-sm"
                        onClick={() => window.location.href = `/profile/organization/search-worker/profile/${user.user_id || user.id}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        View Profile
                      </motion.button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-8 space-x-2">
                  <motion.button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white text-gray-700 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Previous
                  </motion.button>
                  {[...Array(totalPages)].map((_, index) => (
                    <motion.button
                      key={index}
                      onClick={() => handlePageChange(index + 1)}
                      className={`px-4 py-2 rounded-md transition ${
                        currentPage === index + 1
                          ? 'bg-[#3464b4] text-white font-bold'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {index + 1}
                    </motion.button>
                  ))}
                  <motion.button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white text-gray-700 rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Next
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {/* Lottie animation only if no results and not loading */}
          {results.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center mt-8 bg-white p-6 rounded-lg shadow-md border border-gray-100">
              <div className="w-[300px] h-[300px] sm:w-[400px] sm:h-[400px]">
                <Player autoplay loop animationData={searchWorkerLottie} />
              </div>
              <p className="text-xl font-semibold text-gray-700 mt-4">No workers found matching your criteria.</p>
              <p className="text-gray-500 mt-2 text-center">Try adjusting your search filters or location.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
