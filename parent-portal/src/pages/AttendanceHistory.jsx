import { useState, useEffect } from 'react';
import { parentAPI, scanAPI } from '../services/api';
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Bus,
  Calendar,
  Search,
  ChevronDown,
  ArrowUpCircle,
  ArrowDownCircle,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';

export default function AttendanceHistory() {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const res = await parentAPI.getChildren();
      const childrenData = res.data?.children || [];
      setChildren(childrenData);
      if (childrenData.length > 0) {
        setSelectedChild(childrenData[0]);
        fetchHistory(childrenData[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch children:', error);
      const mockChildren = [
        { _id: '1', name: 'Aanya Sharma', grade: '5th Grade', studentId: 'STU-001' },
        { _id: '2', name: 'Arjun Sharma', grade: '3rd Grade', studentId: 'STU-002' },
      ];
      setChildren(mockChildren);
      setSelectedChild(mockChildren[0]);
      setHistory(getMockHistory());
    } finally {
      setLoading(false);
    }
  };

  const getMockHistory = () => [
    { _id: '1', date: new Date().toISOString(), status: 'present', boardingTime: new Date(Date.now() - 7200000).toISOString(), alightingTime: new Date(Date.now() - 3600000).toISOString(), busNumber: 'BUS-101' },
    { _id: '2', date: new Date(Date.now() - 86400000).toISOString(), status: 'present', boardingTime: new Date(Date.now() - 86400000 - 7200000).toISOString(), alightingTime: new Date(Date.now() - 86400000 - 3600000).toISOString(), busNumber: 'BUS-101' },
    { _id: '3', date: new Date(Date.now() - 172800000).toISOString(), status: 'absent', boardingTime: null, alightingTime: null, busNumber: 'BUS-101' },
    { _id: '4', date: new Date(Date.now() - 259200000).toISOString(), status: 'present', boardingTime: new Date(Date.now() - 259200000 - 7200000).toISOString(), alightingTime: new Date(Date.now() - 259200000 - 3600000).toISOString(), busNumber: 'BUS-101' },
    { _id: '5', date: new Date(Date.now() - 345600000).toISOString(), status: 'present', boardingTime: new Date(Date.now() - 345600000 - 7200000).toISOString(), alightingTime: new Date(Date.now() - 345600000 - 3600000).toISOString(), busNumber: 'BUS-101' },
    { _id: '6', date: new Date(Date.now() - 432000000).toISOString(), status: 'present', boardingTime: new Date(Date.now() - 432000000 - 7200000).toISOString(), alightingTime: null, busNumber: 'BUS-101' },
    { _id: '7', date: new Date(Date.now() - 518400000).toISOString(), status: 'absent', boardingTime: null, alightingTime: null, busNumber: 'BUS-101' },
  ];

  const fetchHistory = async (childId) => {
    setHistoryLoading(true);
    try {
      const res = await parentAPI.getChildHistory(childId, { limit: 30 });
      setHistory(res.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
      setHistory(getMockHistory());
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleChildSelect = (child) => {
    setSelectedChild(child);
    fetchHistory(child._id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  const presentDays = history.filter(h => h.status === 'present').length;
  const absentDays = history.filter(h => h.status === 'absent').length;
  const totalDays = history.length;
  const attendancePercent = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white tracking-tight">Attendance History</h1>
          <p className="text-sm text-gray-500 mt-1">View your children's attendance and scan records</p>
        </div>
      </div>

      {/* Child Selector */}
      <div className="flex gap-2 flex-wrap">
        {children.map((child) => (
          <button
            key={child._id}
            onClick={() => handleChildSelect(child)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
              selectedChild?._id === child._id
                ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-md'
                : 'bg-white dark:bg-[#111] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-[#222] hover:border-black/20 dark:hover:border-white/20'
            }`}
          >
            {child.name}
          </button>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#111] rounded-2xl p-5 border border-gray-100 dark:border-[#222] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-sm font-medium text-gray-500">Present</span>
          </div>
          <p className="text-2xl font-bold text-black dark:text-white">{presentDays} <span className="text-sm font-normal text-gray-500">days</span></p>
        </div>
        <div className="bg-white dark:bg-[#111] rounded-2xl p-5 border border-gray-100 dark:border-[#222] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-sm font-medium text-gray-500">Absent</span>
          </div>
          <p className="text-2xl font-bold text-black dark:text-white">{absentDays} <span className="text-sm font-normal text-gray-500">days</span></p>
        </div>
        <div className="bg-white dark:bg-[#111] rounded-2xl p-5 border border-gray-100 dark:border-[#222] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333]">
              <History className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <span className="text-sm font-medium text-gray-500">Rate</span>
          </div>
          <p className="text-2xl font-bold text-black dark:text-white">{attendancePercent}%</p>
        </div>
      </div>

      {/* History List */}
      <div className="bg-white dark:bg-[#111] rounded-3xl border border-gray-100 dark:border-[#222] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-[#222]">
          <h3 className="text-lg font-bold text-black dark:text-white">Daily Records</h3>
          <p className="text-sm text-gray-500 mt-1">{selectedChild?.name}'s recent attendance</p>
        </div>
        
        {historyLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-6 h-6 border-4 border-black dark:border-white border-t-transparent rounded-full" />
          </div>
        ) : history.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-[#1a1a1a]">
            {history.map((record, index) => (
              <div
                key={record._id || index}
                className="flex items-center gap-3 sm:gap-4 p-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors"
              >
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  record.status === 'present' 
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                    : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30'
                }`}>
                  {record.status === 'present' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-black dark:text-white">
                      {format(new Date(record.date), 'EEEE, MMM d')}
                    </p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                      record.status === 'present' 
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'
                    }`}>
                      {record.status === 'present' ? 'Present' : 'Absent'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {record.boardingTime && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <ArrowUpCircle className="w-3 h-3" />
                        Board: {format(new Date(record.boardingTime), 'h:mm a')}
                      </span>
                    )}
                    {record.alightingTime && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <ArrowDownCircle className="w-3 h-3" />
                        Drop: {format(new Date(record.alightingTime), 'h:mm a')}
                      </span>
                    )}
                    {record.busNumber && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Bus className="w-3 h-3" />
                        {record.busNumber}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-400 font-medium hidden sm:block">
                  {format(new Date(record.date), 'yyyy')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <History className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
            <h3 className="text-lg font-bold text-black dark:text-white mb-2">No Records</h3>
            <p className="text-gray-500 text-sm">No attendance records found for this period.</p>
          </div>
        )}
      </div>
    </div>
  );
}
