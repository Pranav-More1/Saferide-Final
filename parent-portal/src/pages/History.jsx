import { useState, useEffect } from 'react';
import { childrenAPI } from '../services/api';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  Bus,
  ArrowUp,
  ArrowDown,
  Filter,
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
    }
  };

  const fetchHistory = async (childId) => {
    setLoading(true);
    try {
      const response = await childrenAPI.getHistory(childId, { period: dateFilter });
      setHistory(response.data?.history || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (dateStr) => {
    setExpandedDays((prev) => ({
      ...prev,
      [dateStr]: !prev[dateStr],
    }));
  };

  const groupedHistory = history.reduce((acc, item) => {
    const dateKey = format(new Date(item.date), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: item.date,
        events: [],
      };
    }
    acc[dateKey].events.push(...(item.events || []));
    return acc;
  }, {});

  if (loading && children.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
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
            Time Period
          </label>
          <div className="flex gap-2">
            {[
              { value: 'week', label: 'This Week' },
              { value: 'month', label: 'This Month' },
              { value: 'all', label: 'All Time' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setDateFilter(option.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  dateFilter === option.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : Object.keys(groupedHistory).length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <Clock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No history found</h3>
          <p className="text-gray-500 mt-1">No pickup or dropoff records for this period</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedHistory)
            .sort(([a], [b]) => new Date(b) - new Date(a))
            .map(([dateKey, dayData]) => {
              const isExpanded = expandedDays[dateKey] !== false;
              const dateObj = new Date(dayData.date);
              const isToday = format(dateObj, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

              return (
                <div
                  key={dateKey}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => toggleDay(dateKey)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isToday ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div className="text-left">
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
                    </div>
                  </button>

                  {isExpanded && (
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
