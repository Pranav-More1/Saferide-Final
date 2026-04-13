import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { parentAPI } from '../services/api';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  Users,
  Bus,
  ScanLine,
  CheckCircle2,
  Activity,
  Clock,
  ArrowUpRight,
  MapPin,
  TrendingUp,
  AlertTriangle,
  Heart
} from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await parentAPI.getChildren();
      setChildren(res.data?.children || []);
    } catch (error) {
      console.error('Failed to fetch children:', error);
      // Mock data for demo
      setChildren([
        {
          _id: '1',
          name: 'Aanya Sharma',
          grade: '5th Grade',
          section: 'A',
          studentId: 'STU-001',
          attendanceStatus: 'present',
          assignedBus: { busNumber: 'BUS-101', routeName: 'Route 4A', status: 'active', driverName: 'Rajesh Kumar' },
          lastScan: { type: 'boarding', timestamp: new Date(Date.now() - 3600000) }
        },
        {
          _id: '2',
          name: 'Arjun Sharma',
          grade: '3rd Grade',
          section: 'B',
          studentId: 'STU-002',
          attendanceStatus: 'present',
          assignedBus: { busNumber: 'BUS-101', routeName: 'Route 4A', status: 'active', driverName: 'Rajesh Kumar' },
          lastScan: { type: 'alighting', timestamp: new Date(Date.now() - 1800000) }
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useGSAP(() => {
    if (loading) return;

    gsap.fromTo('.stat-card', 
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out'
      }
    );

    gsap.fromTo('.section-card', 
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        delay: 0.2
      }
    );

  }, [loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  const activeBuses = [...new Set(children.filter(c => c.assignedBus).map(c => c.assignedBus?.busNumber))].length;
  const presentCount = children.filter(c => c.attendanceStatus === 'present' || c.lastScan).length;
  const attendanceRate = children.length > 0 ? Math.round((presentCount / children.length) * 100) : 0;

  const statCards = [
    { key: 'children', label: 'My Children', value: children.length, icon: Users },
    { key: 'buses', label: 'Buses Tracked', value: activeBuses, icon: Bus },
    { key: 'present', label: 'Present Today', value: presentCount, icon: CheckCircle2 },
    { key: 'attendance', label: 'Attendance Rate', value: `${attendanceRate}%`, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full" ref={containerRef}>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white tracking-tight">Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor your children's daily transportation safely.</p>
        </div>
        <div className="flex bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-1 shadow-sm w-max">
          <button className="px-4 py-1.5 text-sm font-medium rounded-lg bg-black text-white dark:bg-white dark:text-black shadow">Today</button>
          <button className="px-4 py-1.5 text-sm font-medium rounded-lg text-gray-500 hover:text-black dark:hover:text-white transition-colors">This Week</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((card) => (
          <div
            key={card.key}
            className="stat-card bg-white dark:bg-[#111] rounded-2xl p-5 sm:p-6 border border-gray-100 dark:border-[#222] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] hover:shadow-lg hover:border-black/10 dark:hover:border-white/20 transition-all duration-300 relative group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#222]">
                <card.icon className="w-5 h-5 text-gray-800 dark:text-gray-200" />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-50 dark:bg-[#1a1a1a] text-black dark:text-white border border-gray-100 dark:border-[#222]">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Active</span>
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-black dark:text-white tracking-tight truncate">
                {card.value}
              </p>
              <p className="text-sm text-gray-500 font-medium mt-1 truncate">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Children Cards + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
        {/* Children Quick View */}
        <div className="section-card bg-white dark:bg-[#111] rounded-3xl p-5 sm:p-8 border border-gray-100 dark:border-[#222] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] w-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-black dark:text-white">Children Status</h3>
            <Link to="/children" className="text-sm text-gray-500 hover:text-black dark:hover:text-white font-medium transition-all bg-gray-50 dark:bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-gray-100 dark:border-[#222]">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {children.length > 0 ? (
              children.map((child) => (
                <div
                  key={child._id}
                  className="flex items-center gap-3 sm:gap-4 p-3 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] rounded-2xl transition-colors group cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-[#333]"
                >
                  <div className="p-2.5 sm:p-3 rounded-xl bg-gray-50 dark:bg-[#222] text-black dark:text-white border border-gray-100 dark:border-[#333] shadow-sm shrink-0">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-black dark:text-white truncate">
                      {child.name}
                    </p>
                    <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                      {child.grade} • {child.assignedBus?.busNumber || 'No bus'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-sm shrink-0 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] text-black dark:text-white">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                      {child.lastScan?.type === 'boarding' ? 'On Bus' : child.lastScan?.type === 'alighting' ? 'Dropped Off' : 'No scan'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 p-6 bg-gray-50 dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#222]">
                <Users className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                <p className="text-sm font-medium">No children linked to your account yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="section-card bg-black dark:bg-[#fafafa] rounded-3xl p-5 sm:p-8 text-white dark:text-black relative overflow-hidden shadow-xl shadow-black/10 dark:shadow-none border border-black dark:border-gray-200">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            Safety Alerts
            <span className="flex h-2.5 w-2.5 relative ml-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white dark:bg-black opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white dark:bg-black"></span>
            </span>
          </h3>
          
          <div className="space-y-4 mb-8">
            <div className="bg-[#1a1a1a] dark:bg-white rounded-2xl p-4 flex gap-4 border border-[#333] dark:border-gray-200 shadow-sm transition-colors cursor-pointer group">
               <div className="p-2 sm:p-2.5 bg-[#333] dark:bg-gray-100 text-white dark:text-black rounded-xl h-fit border border-[#444] dark:border-gray-200 shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-5 h-5"/>
               </div>
               <div className="min-w-0">
                  <h4 className="font-bold text-sm truncate">All Children Safe</h4>
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-1.5 leading-relaxed line-clamp-2">All your children have been safely scanned today. Attendance records are up to date.</p>
               </div>
            </div>
            
            <div className="bg-[#1a1a1a] dark:bg-white rounded-2xl p-4 flex gap-4 border border-[#333] dark:border-gray-200 shadow-sm transition-colors cursor-pointer group">
               <div className="p-2 sm:p-2.5 bg-[#333] dark:bg-gray-100 text-white dark:text-black rounded-xl h-fit border border-[#444] dark:border-gray-200 shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <Clock className="w-5 h-5"/>
               </div>
               <div className="min-w-0">
                  <h4 className="font-bold text-sm truncate">Bus ETA Update</h4>
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-1.5 leading-relaxed line-clamp-2">BUS-101 is currently on route. Expected arrival at your stop in approximately 15 minutes.</p>
               </div>
            </div>
          </div>

          <div className="mt-auto">
             <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Quick Navigation</p>
             <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/tracking" className="flex-1 text-center bg-white text-black dark:bg-black dark:text-white border border-transparent shadow shadow-white/10 dark:shadow-black/10 hover:opacity-90 py-3 rounded-xl text-sm font-bold transition-opacity">
                   Track Bus Live
                </Link>
                <Link to="/attendance" className="flex-1 text-center bg-[#1a1a1a] dark:bg-white text-white dark:text-black border border-[#333] dark:border-gray-200 shadow-sm hover:border-[#555] dark:hover:border-gray-400 py-3 rounded-xl text-sm font-bold transition-colors">
                   View Attendance
                </Link>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
