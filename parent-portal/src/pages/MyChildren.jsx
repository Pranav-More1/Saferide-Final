import { useState, useEffect } from 'react';
import { parentAPI } from '../services/api';
import {
  Users,
  Bus,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Clock,
  Heart,
  MapPin,
  Phone,
  Mail,
  Search,
  RefreshCw,
} from 'lucide-react';

export default function MyChildren() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    setLoading(true);
    try {
      const res = await parentAPI.getChildren();
      setChildren(res.data?.children || []);
    } catch (error) {
      console.error('Failed to fetch children:', error);
      setChildren([
        {
          _id: '1',
          name: 'Aanya Sharma',
          grade: '5th Grade',
          section: 'A',
          studentId: 'STU-001',
          age: 10,
          bloodGroup: 'B+',
          attendanceStatus: 'present',
          assignedBus: { busNumber: 'BUS-101', routeName: 'Route 4A', status: 'active', driverName: 'Rajesh Kumar' },
          pickupPoint: 'Sector 15 Gate',
          dropoffPoint: 'Green Valley School',
          parentPhone: '+91 9876543210',
          parentEmail: 'parent@example.com',
        },
        {
          _id: '2',
          name: 'Arjun Sharma',
          grade: '3rd Grade',
          section: 'B',
          studentId: 'STU-002',
          age: 8,
          bloodGroup: 'A+',
          attendanceStatus: 'present',
          assignedBus: { busNumber: 'BUS-101', routeName: 'Route 4A', status: 'active', driverName: 'Rajesh Kumar' },
          pickupPoint: 'Sector 15 Gate',
          dropoffPoint: 'Green Valley School',
          parentPhone: '+91 9876543210',
          parentEmail: 'parent@example.com',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredChildren = children.filter(child =>
    child.name?.toLowerCase().includes(search.toLowerCase()) ||
    child.studentId?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white tracking-tight">My Children</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage your children's information</p>
        </div>
        <button
          onClick={fetchChildren}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:opacity-90 transition-all text-sm font-medium shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or student ID..."
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition-all text-black dark:text-white placeholder:text-gray-400"
        />
      </div>

      {/* Children Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredChildren.map((child) => (
          <div
            key={child._id}
            className="bg-white dark:bg-[#111] rounded-3xl border border-gray-100 dark:border-[#222] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 overflow-hidden"
          >
            {/* Card Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-[#222]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] flex items-center justify-center text-black dark:text-white text-xl font-bold shadow-sm">
                  {child.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-black dark:text-white truncate">{child.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-gray-500 bg-gray-50 dark:bg-[#1a1a1a] px-2 py-0.5 rounded-md border border-gray-100 dark:border-[#333]">{child.studentId}</span>
                    <span className="text-xs font-medium text-gray-500">{child.grade} {child.section ? `• ${child.section}` : ''}</span>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
                  child.attendanceStatus === 'present' 
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                    : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30'
                }`}>
                  {child.attendanceStatus === 'present' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {child.attendanceStatus === 'present' ? 'Present' : 'Absent'}
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-5 sm:p-6 space-y-4">
              {/* Bus Info */}
              {child.assignedBus && (
                <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-2xl p-4 border border-gray-100 dark:border-[#222]">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bus Information</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Bus className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-black dark:text-white">{child.assignedBus.busNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-black dark:text-white">{child.assignedBus.routeName || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Driver: <span className="font-medium text-black dark:text-white">{child.assignedBus.driverName || 'Not assigned'}</span></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                {child.pickupPoint && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Pickup</p>
                      <p className="text-sm font-medium text-black dark:text-white">{child.pickupPoint}</p>
                    </div>
                  </div>
                )}
                {child.bloodGroup && (
                  <div className="flex items-start gap-2">
                    <Heart className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Blood Group</p>
                      <p className="text-sm font-medium text-black dark:text-white">{child.bloodGroup}</p>
                    </div>
                  </div>
                )}
                {child.age && (
                  <div className="flex items-start gap-2">
                    <GraduationCap className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Age</p>
                      <p className="text-sm font-medium text-black dark:text-white">{child.age} years</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredChildren.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-[#111] rounded-3xl border border-gray-100 dark:border-[#222]">
          <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
          <h3 className="text-lg font-bold text-black dark:text-white mb-2">No Children Found</h3>
          <p className="text-gray-500 text-sm">No children are linked to your account yet. Contact your school administrator.</p>
        </div>
      )}
    </div>
  );
}
