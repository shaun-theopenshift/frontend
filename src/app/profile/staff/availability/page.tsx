"use client";
import { useState, useMemo } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css"; // import default calendar styles
import Sidebar from '../../../components/Sidebar';
import TopNav from '../../../components/TopNav';
import { XMarkIcon } from '@heroicons/react/24/outline';
import LoadingScreen from '../../../components/LoadingScreen';

export default function AvailabilityPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [saveMessage, setSaveMessage] = useState('');
  const [note, setNote] = useState('');
  const [savedNote, setSavedNote] = useState('');

  // Handle selecting multiple days
  const handleDateChange = (date: Date | Date[]) => {
    let newDates: Date[] = Array.isArray(date) ? date : [date];
    // Toggle selection: if already selected, remove; else add
    const updated = [...availableDates];
    newDates.forEach(d => {
      const exists = updated.find(
        (ad) => ad.toDateString() === d.toDateString()
      );
      if (exists) {
        // Remove
        const idx = updated.findIndex(ad => ad.toDateString() === d.toDateString());
        updated.splice(idx, 1);
      } else {
        updated.push(d);
      }
    });
    setAvailableDates(updated);
  };

  // Save handler (MVP: just show a message)
  const handleSave = () => {
    setSaveMessage('Availability saved!');
    setTimeout(() => setSaveMessage(''), 2000);
    // Here you would send availableDates to your backend
  };

  // Remove a single date
  const removeDate = (date: Date) => {
    setAvailableDates(availableDates.filter(d => d.toDateString() !== date.toDateString()));
  };

  // Clear all selected dates
  const clearSelection = () => {
    setAvailableDates([]);
  };

  // Calendar tile highlight
  const tileClassName = ({ date }: { date: Date }) =>
    availableDates.some(
      (d) =>
        d.getDate() === date.getDate() &&
        d.getMonth() === date.getMonth() &&
        d.getFullYear() === date.getFullYear()
    )
      ? 'bg-brand-dark text-white rounded-full font-bold' : '';

  // Days available this week
  const daysAvailableThisWeek = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    return availableDates.filter(d => d >= startOfWeek && d <= endOfWeek).length;
  }, [availableDates]);

  // Upcoming approved shifts (mock data)
  const approvedShifts = [
    { date: '2025-06-05', time: '09:00 - 17:00', status: 'approved' },
    { date: '2025-06-08', time: '13:00 - 21:00', status: 'approved' },
  ];

  // Total hours committed (calculated from approvedShifts)
  const totalHoursCommitted = approvedShifts.reduce((sum, shift) => {
    const [start, end] = shift.time.split(' - ');
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let hours = endH + endM / 60 - (startH + startM / 60);
    if (hours < 0) hours += 24; // handle overnight shifts
    return sum + hours;
  }, 0);

  // Save note handler
  const handleSaveNote = () => {
    setSavedNote(note);
  };

  return (
    <>
      <Sidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />
      <TopNav onMobileMenu={() => setMobileSidebarOpen(true)} />
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-tr from-brand-bgLight via-brand-light to-brand-mint sm:pl-64 pt-16 sm:pt-20">
        <div className="w-full max-w-3xl bg-white shadow-2xl rounded-2xl p-6 sm:p-10 flex flex-col items-center mt-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-dark mb-6">Set Your Availability</h2>
          <Calendar
            onClickDay={handleDateChange}
            value={null}
            tileClassName={tileClassName}
            selectRange={false}
            showNeighboringMonth={false}
            className="w-full max-w-2xl mx-auto border-none"
          />
          {/* Summary Section */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-1 gap-4 mt-8 mb-4">
            {/* Summary Section 
            <div className="bg-[#e6f2f2] rounded-lg p-4 flex flex-col items-center">
              <div className="text-lg font-semibold text-[#67b5b5]">Total hours committed</div>
              <div className="text-2xl font-bold text-black mt-2">{totalHoursCommitted.toFixed(1)}</div>
            </div>
            */}
            <div className="bg-brand-bgLight rounded-lg p-4 flex flex-col items-center">
              <div className="text-lg font-semibold text-brand-dark">Upcoming approved shifts</div>
              <ul className="mt-2 text-black text-center">
                {approvedShifts.length > 0 ? approvedShifts.map((shift, idx) => (
                  <li key={idx} className="text-sm mb-1">
                    <span className="font-semibold">{shift.date}</span> <span className="text-gray-500">|</span> {shift.time}
                  </li>
                )) : <li className="text-gray-400">None</li>}
              </ul>
            </div>
          </div>
          {/* Custom Note Section */}
          <div className="w-full mt-4 mb-6">
            <label className="block font-semibold text-black mb-2">Custom Note</label>
            <textarea
              className="w-full border rounded p-2 text-black placeholder-black"
              rows={2}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add a note for your manager or yourself..."
            />
            <button
              className="mt-2 px-6 py-2 bg-[#67b5b5] text-white rounded font-semibold hover:bg-[#4a9e9e] transition"
              onClick={handleSaveNote}
            >
              Save Note
            </button>
            {savedNote && (
              <div className="mt-2 text-[#67b5b5] font-medium">Saved Note: <span className="text-black">{savedNote}</span></div>
            )}
          </div>
          <div className="flex flex-wrap gap-4 mt-4 w-full justify-between items-center">
            <button
              className="px-8 py-3 bg-[#67b5b5] text-white rounded-lg font-semibold text-lg shadow hover:bg-[#4a9e9e] transition"
              onClick={handleSave}
            >
              Save Availability
            </button>
            <button
              className="px-6 py-3 bg-gray-200 text-[#67b5b5] rounded-lg font-semibold text-lg shadow hover:bg-gray-300 transition"
              onClick={clearSelection}
              disabled={availableDates.length === 0}
            >
              Clear Selection
            </button>
          </div>
          {saveMessage && <div className="mt-3 text-green-600 font-semibold">{saveMessage}</div>}
          <div className="mt-6 w-full">
            <h3 className="text-lg font-semibold mb-2 text-black">Selected Days:</h3>
            {availableDates.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availableDates
                  .sort((a, b) => a.getTime() - b.getTime())
                  .map((d) => (
                    <span key={d.toISOString()} className="bg-brand-bgLight text-brand-dark px-3 py-1 rounded-full text-sm font-medium border border-brand-dark flex items-center gap-1">
                      {d.toLocaleDateString()}
                      <button
                        className="ml-1 p-0.5 hover:bg-brand-dark hover:text-white rounded-full"
                        onClick={() => removeDate(d)}
                        aria-label="Remove date"
                        type="button"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
              </div>
            ) : (
              <div className="text-gray-400">No days selected.</div>
            )}
          </div>
        </div>
      </main>
      <style jsx global>{`
        .react-calendar {
          border: none !important;
          font-family: inherit;
        }
        .react-calendar__tile--active,
        .react-calendar__tile--range,
        .react-calendar__tile--rangeStart,
        .react-calendar__tile--rangeEnd {
          background: #2954bd !important;
          color: #fff !important;
          border-radius: 9999px !important;
        }
        .react-calendar__tile {
          font-size: 1rem;
          padding: 0.75em 0.5em;
        }
        .bg-brand-dark {
          background: #2954bd !important;
          color: #fff !important;
          font-weight: bold;
        }
      `}</style>
    </>
  );
}