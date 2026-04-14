import { useState, useEffect, useRef } from 'react';
import { dashboardAPI } from '../services/api';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Users,
  Bus,
  UserCog,
  MapPin,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';
import { format } from 'date-fns';

gsap.registerPlugin(ScrollTrigger);

const statCards = [
  { key: 'students', label: 'Total Students', icon: Users },
  { key: 'drivers', label: 'Active Drivers', icon: UserCog },
  { key: 'buses', label: 'Active Buses', icon: Bus },
  { key: 'activeRoutes', label: 'Active Routes', icon: MapPin },
];

export default function Dashboard() {
  const [stats, setStats] = useState({
    students: 0,
    drivers: 0,
    buses: 0,
    activeRoutes: 0,
    scansToday: 0,
    pickups: 0,
    dropoffs: 0,
  });
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentActivity(),
      ]);
      setStats(statsRes.data);
      setActivity(activityRes.data?.activities || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Use mock data if API fails
      setStats({
        students: 0,
        drivers: 0,
        buses: 0,
        activeRoutes: 0,
        scansToday: 0,
        pickups: 0,
        dropoffs: 0,
      });
      setActivity([]);
    } finally {
      setLoading(false);
    }
  };

  useGSAP(() => {
    if (loading) return;

    // Stagger animation for stat cards (No ScrollTrigger since they are at the top)
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

    // Animate large sections (Also near top, standard timeline stagger is safer)
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

  const pendingScans = Math.abs((stats.pickups || 1850) - (stats.dropoffs || 1720));

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full" ref={containerRef}>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white tracking-tight">Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Stay updated with your latest transportation performance.</p>
        </div>
        <div className="flex bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-1 shadow-sm w-max">
          <button className="px-4 py-1.5 text-sm font-medium rounded-lg bg-black text-white dark:bg-white dark:text-black shadow">This Month</button>
          <button className="px-4 py-1.5 text-sm font-medium rounded-lg text-gray-500 hover:text-black dark:hover:text-white transition-colors">Last Month</button>
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
                <span>+3.2%</span>
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold text-black dark:text-white tracking-tight truncate">
                {stats[card.key]?.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 font-medium mt-1 truncate">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Overview (Abstract Metric Only) */}
      <div className="section-card bg-white dark:bg-[#111] rounded-3xl p-5 sm:p-8 border border-gray-100 dark:border-[#222] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] relative w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
          <div>
            <h3 className="text-xl font-bold text-black dark:text-white">Performance Tracking</h3>
            <p className="text-gray-500 text-sm mt-1">Daily scan activity vs target</p>
          </div>
          <select className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-black dark:text-white rounded-xl px-4 py-2 text-sm font-medium outline-none hover:bg-gray-50 dark:hover:bg-[#222] cursor-pointer shadow-sm w-full sm:w-auto">
            <option>Last 7 days</option>
            <option>This month</option>
          </select>
        </div>
        
        <div className="mt-4 mb-2 flex flex-col items-start gap-1">
            <span className="text-4xl sm:text-5xl font-extrabold text-black dark:text-white tracking-tighter">
              {stats.scansToday?.toLocaleString()}
            </span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1 bg-gray-50 dark:bg-[#1a1a1a] px-3 py-1 rounded-full mt-2 border border-gray-100 dark:border-[#333]">
              <TrendingUp className="w-4 h-4 text-black dark:text-white"/> +14.5% from yesterday
            </span>
        </div>
      </div>

      {/* Recent Activity and System Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
        {/* Recent Activity */}
        <div className="section-card bg-white dark:bg-[#111] rounded-3xl p-5 sm:p-8 border border-gray-100 dark:border-[#222] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] w-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-black dark:text-white">Recent Activity</h3>
            <button className="text-sm text-gray-500 hover:text-black dark:hover:text-white font-medium transition-all bg-gray-50 dark:bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-gray-100 dark:border-[#222]">
              View all
            </button>
          </div>
          <div className="space-y-3">
            {activity.length > 0 ? (
              activity.slice(0, 5).map((item, index) => (
                <div
                  key={item.id || index}
                  className="flex items-center gap-3 sm:gap-4 p-3 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] rounded-2xl transition-colors group cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-[#333]"
                >
                  <div className="p-2.5 sm:p-3 rounded-xl bg-gray-50 dark:bg-[#222] text-black dark:text-white border border-gray-100 dark:border-[#333] shadow-sm shrink-0">
                    {item.type === 'pickup' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Activity className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-black dark:text-white truncate">
                      {item.student}
                    </p>
                    <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                      {item.type === 'pickup' ? 'Safe Pick-up' : 'Safe Drop-off'} • {item.bus}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-black dark:text-white font-medium bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] px-2.5 py-1.5 rounded-lg shadow-sm shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{format(new Date(item.time), 'h:mm a')}</span>
                    <span className="sm:hidden">{format(new Date(item.time), 'h:mm')}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 p-6 bg-gray-50 dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-[#222]">
                <Activity className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
                <p className="text-sm font-medium">No recent activity recorded today.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / Alerts */}
        <div className="section-card bg-black dark:bg-[#fafafa] rounded-3xl p-5 sm:p-8 text-white dark:text-black relative overflow-hidden shadow-xl shadow-black/10 dark:shadow-none border border-black dark:border-gray-200">
          
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            System Alerts
            <span className="flex h-2.5 w-2.5 relative ml-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white dark:bg-black opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white dark:bg-black"></span>
            </span>
          </h3>
          
          <div className="space-y-4 mb-8">
            {pendingScans > 0 ? (
              <div className="bg-[#1a1a1a] dark:bg-white rounded-2xl p-4 flex gap-4 border border-[#333] dark:border-gray-200 shadow-sm transition-colors cursor-pointer group">
                 <div className="p-2 sm:p-2.5 bg-[#333] dark:bg-gray-100 text-white dark:text-black rounded-xl h-fit border border-[#444] dark:border-gray-200 shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <AlertTriangle className="w-5 h-5"/>
                 </div>
                 <div className="min-w-0">
                    <h4 className="font-bold text-sm truncate">Pending Scans Alert</h4>
                    <p className="text-xs text-gray-400 dark:text-gray-600 mt-1.5 leading-relaxed line-clamp-2">There are {pendingScans} pending scans recorded today. Please verify manual overrides if needed.</p>
                 </div>
              </div>
            ) : (
                <div className="bg-[#1a1a1a] dark:bg-white rounded-2xl p-4 flex gap-4 border border-[#333] dark:border-gray-200 shadow-sm transition-colors cursor-pointer group">
                  <div className="p-2 sm:p-2.5 bg-[#333] dark:bg-gray-100 text-white dark:text-black rounded-xl h-fit border border-[#444] dark:border-gray-200 shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <CheckCircle2 className="w-5 h-5"/>
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm truncate">All Clear</h4>
                    <p className="text-xs text-gray-400 dark:text-gray-600 mt-1.5 leading-relaxed line-clamp-2">No system alerts currently. The fleet is operating normally.</p>
                  </div>
                </div>
            )}
          </div>

          <div className="mt-auto">
             <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Quick Navigation</p>
             <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => window.location.href='/students'} className="flex-1 bg-white text-black dark:bg-black dark:text-white border border-transparent shadow shadow-white/10 dark:shadow-black/10 hover:opacity-90 py-3 rounded-xl text-sm font-bold transition-opacity">
                   Manage Students
                </button>
                <button onClick={() => window.location.href='/tracking'} className="flex-1 bg-[#1a1a1a] dark:bg-white text-white dark:text-black border border-[#333] dark:border-gray-200 shadow-sm hover:border-[#555] dark:hover:border-gray-400 py-3 rounded-xl text-sm font-bold transition-colors">
                   Live Map Check
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
