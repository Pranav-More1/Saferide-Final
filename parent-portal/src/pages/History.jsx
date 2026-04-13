import { useState, useEffect } from 'react';
import { childrenAPI } from '../services/api';
<<<<<<< HEAD
import { format } from 'date-fns';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { useRef } from 'react';
=======
import { format, formatDistanceToNow } from 'date-fns';
>>>>>>> friend/main
import {
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  Bus,
  ArrowUp,
  ArrowDown,
<<<<<<< HEAD
=======
  Filter,
>>>>>>> friend/main
} from 'lucide-react';

export default function History() {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState({});
  const [dateFilter, setDateFilter] = useState('week');

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchHistory(selectedChild._id);
    }
  }, [selectedChild, dateFilter]);

  const fetchChildren = async () => {
    try {
      const response = await childrenAPI.getAll();
      const childrenData = response.data?.children || [];
      setChildren(childrenData);
      if (childrenData.length > 0) {
        setSelectedChild(childrenData[0]);
      }
    } catch (error) {
      console.error('Failed to fetch children:', error);
<<<<<<< HEAD
      const mockChildren = [
        { _id: '1', name: 'John Smith Jr.', grade: '5th' },
        { _id: '2', name: 'Emily Smith', grade: '3rd' },
      ];
      setChildren(mockChildren);
      setSelectedChild(mockChildren[0]);
=======
>>>>>>> friend/main
    }
  };

  const fetchHistory = async (childId) => {
    setLoading(true);
    try {
      const response = await childrenAPI.getHistory(childId, { period: dateFilter });
      setHistory(response.data?.history || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
<<<<<<< HEAD
      const mockHistory = generateMockHistory();
      setHistory(mockHistory);
=======
>>>>>>> friend/main
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  const generateMockHistory = () => {
    const history = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        const pickupTime = new Date(date);
        pickupTime.setHours(7, 30 + Math.floor(Math.random() * 15), 0);
        
        const dropoffTime = new Date(date);
        dropoffTime.setHours(8, 10 + Math.floor(Math.random() * 10), 0);
        
        const afternoonPickup = new Date(date);
        afternoonPickup.setHours(15, 15 + Math.floor(Math.random() * 15), 0);
        
        const afternoonDropoff = new Date(date);
        afternoonDropoff.setHours(16, Math.floor(Math.random() * 30), 0);

        history.push({
          date: date.toISOString(),
          events: [
            { type: 'pickup', time: pickupTime.toISOString(), bus: 'BUS-101', location: 'Home Stop' },
            { type: 'dropoff', time: dropoffTime.toISOString(), bus: 'BUS-101', location: 'School' },
            { type: 'pickup', time: afternoonPickup.toISOString(), bus: 'BUS-101', location: 'School' },
            { type: 'dropoff', time: afternoonDropoff.toISOString(), bus: 'BUS-101', location: 'Home Stop' },
          ],
        });
      }
    }
    return history;
  };

=======
>>>>>>> friend/main
  const toggleDay = (dateStr) => {
    setExpandedDays((prev) => ({
      ...prev,
      [dateStr]: !prev[dateStr],
    }));
  };

<<<<<<< HEAD
  useGSAP(() => {
    if (loading) return;
    gsap.fromTo('.stagger-card',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
    );
  }, [loading, history]);

  const groupedHistory = history.reduce((acc, item) => {
    const dateKey = format(new Date(item.date), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = { date: item.date, events: [] };
=======
  const groupedHistory = history.reduce((acc, item) => {
    const dateKey = format(new Date(item.date), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: item.date,
        events: [],
      };
>>>>>>> friend/main
    }
    acc[dateKey].events.push(...(item.events || []));
    return acc;
  }, {});

  if (loading && children.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
<<<<<<< HEAD
        <div className="animate-spin w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full" />
=======
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
>>>>>>> friend/main
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-black dark:text-white tracking-tight">Trip History</h1>
        <p className="text-sm font-medium text-gray-500 mt-1">Review pickup and dropoff records</p>
      </div>

      {/* Filters */}
      <div className="stagger-card flex flex-col sm:flex-row gap-4 bg-white dark:bg-[#111] p-5 sm:p-6 rounded-3xl border border-gray-100 dark:border-[#222] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)]">
        {/* Child Selector */}
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
            Select Child
          </label>
          <div className="relative">
            <select
              value={selectedChild?._id || ''}
              onChange={(e) => {
                const child = children.find((c) => c._id === e.target.value);
                setSelectedChild(child);
              }}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-black dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-shadow appearance-none font-bold shadow-sm"
            >
              {children.map((child) => (
                <option key={child._id} value={child._id} className="font-medium">
                  {child.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Date Filter */}
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
=======
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">History</h1>
        <p className="text-gray-500 mt-1">View pickup and dropoff history</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Child Selector */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Child
          </label>
          <select
            value={selectedChild?._id || ''}
            onChange={(e) => {
              const child = children.find((c) => c._id === e.target.value);
              setSelectedChild(child);
            }}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {children.map((child) => (
              <option key={child._id} value={child._id}>
                {child.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
>>>>>>> friend/main
            Time Period
          </label>
          <div className="flex gap-2">
            {[
<<<<<<< HEAD
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
              { value: 'all', label: 'All' },
=======
              { value: 'week', label: 'This Week' },
              { value: 'month', label: 'This Month' },
              { value: 'all', label: 'All Time' },
>>>>>>> friend/main
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setDateFilter(option.value)}
<<<<<<< HEAD
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all shadow-sm border ${
                  dateFilter === option.value
                    ? 'bg-black text-white dark:bg-white dark:text-black border-transparent shadow-md'
                    : 'bg-white dark:bg-[#111] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] border-gray-200 dark:border-[#333]'
=======
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  dateFilter === option.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
>>>>>>> friend/main
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* History List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
<<<<<<< HEAD
          <div className="animate-spin w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full" />
        </div>
      ) : Object.keys(groupedHistory).length === 0 ? (
        <div className="stagger-card text-center py-16 bg-white dark:bg-[#111] rounded-3xl border border-gray-100 dark:border-[#222]">
          <Clock className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
          <h3 className="text-xl font-bold text-black dark:text-white">No history found</h3>
          <p className="text-gray-500 mt-2 font-medium">No pickup or dropoff records for this period</p>
=======
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : Object.keys(groupedHistory).length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <Clock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No history found</h3>
          <p className="text-gray-500 mt-1">No pickup or dropoff records for this period</p>
>>>>>>> friend/main
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedHistory)
            .sort(([a], [b]) => new Date(b) - new Date(a))
<<<<<<< HEAD
            .map(([dateKey, dayData], index) => {
=======
            .map(([dateKey, dayData]) => {
>>>>>>> friend/main
              const isExpanded = expandedDays[dateKey] !== false;
              const dateObj = new Date(dayData.date);
              const isToday = format(dateObj, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

              return (
                <div
                  key={dateKey}
<<<<<<< HEAD
                  className="stagger-card bg-white dark:bg-[#111] rounded-3xl border border-gray-100 dark:border-[#222] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-300"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <button
                    onClick={() => toggleDay(dateKey)}
                    className={`w-full flex items-center justify-between p-5 sm:p-6 transition-colors ${
                      isExpanded ? 'bg-gray-50/50 dark:bg-[#151515]/50' : 'hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border border-transparent ${
                        isToday 
                        ? 'bg-black text-white dark:bg-white dark:text-black font-bold' 
                        : 'bg-gray-50 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#333]'
=======
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => toggleDay(dateKey)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isToday ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
>>>>>>> friend/main
                      }`}>
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div className="text-left">
<<<<<<< HEAD
                        <p className="font-bold text-lg text-black dark:text-white tracking-tight">
                          {isToday ? 'Today' : format(dateObj, 'EEEE')}
                        </p>
                        <p className="text-sm font-medium text-gray-500 mt-0.5">{format(dateObj, 'MMMM d, yyyy')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="hidden sm:inline-block px-3 py-1 bg-gray-100 dark:bg-[#222] text-xs font-bold uppercase tracking-widest text-black dark:text-white rounded-full">
                        {dayData.events.length} events
                      </span>
                      <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-[#222] flex items-center justify-center text-black dark:text-white transition-transform">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
=======
                        <p className="font-semibold text-gray-900">
                          {isToday ? 'Today' : format(dateObj, 'EEEE')}
                        </p>
                        <p className="text-sm text-gray-500">{format(dateObj, 'MMMM d, yyyy')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">
                        {dayData.events.length} events
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
>>>>>>> friend/main
                    </div>
                  </button>

                  {isExpanded && (
<<<<<<< HEAD
                    <div className="border-t border-gray-100 dark:border-[#222] p-5 sm:p-6 bg-white dark:bg-[#111]">
                      <div className="space-y-4">
                        {dayData.events
                          .sort((a, b) => new Date(a.time) - new Date(b.time))
                          .map((event, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-4 sm:gap-6 p-4 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#333] rounded-2xl group hover:border-black/20 dark:hover:border-white/20 transition-all"
                            >
                              <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-sm ${
                                  event.type === 'pickup'
                                    ? 'bg-white dark:bg-black border-gray-200 dark:border-[#444] text-black dark:text-white'
                                    : 'bg-black dark:bg-white border-transparent text-white dark:text-black'
                                }`}
                              >
                                {event.type === 'pickup' ? (
                                  <ArrowUp className="w-6 h-6" />
                                ) : (
                                  <ArrowDown className="w-6 h-6" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-black dark:text-white text-base">
                                  {event.type === 'pickup' ? 'Safe Pick-up' : 'Safe Drop-off'}
                                </p>
                                <p className="text-sm font-medium text-gray-500 mt-0.5 truncate">{event.location}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-black text-black dark:text-white text-base">
                                  {format(new Date(event.time), 'h:mm')}
                                  <span className="text-xs font-semibold text-gray-500 ml-1">{format(new Date(event.time), 'a')}</span>
                                </p>
                                <div className="flex items-center justify-end gap-1.5 text-xs font-semibold text-gray-500 mt-1 uppercase tracking-widest">
                                  <Bus className="w-3.5 h-3.5" />
=======
                    <div className="border-t border-gray-100 p-4">
                      <div className="space-y-3">
                        {dayData.events
                          .sort((a, b) => new Date(a.time) - new Date(b.time))
                          .map((event, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl"
                            >
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  event.type === 'pickup'
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-blue-100 text-blue-600'
                                }`}
                              >
                                {event.type === 'pickup' ? (
                                  <ArrowUp className="w-5 h-5" />
                                ) : (
                                  <ArrowDown className="w-5 h-5" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {event.type === 'pickup' ? 'Picked up' : 'Dropped off'}
                                </p>
                                <p className="text-sm text-gray-500">{event.location}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-gray-900">
                                  {format(new Date(event.time), 'h:mm a')}
                                </p>
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <Bus className="w-3 h-3" />
>>>>>>> friend/main
                                  {event.bus}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
