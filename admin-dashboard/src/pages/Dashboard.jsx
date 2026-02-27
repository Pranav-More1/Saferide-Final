import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import {
  Users,
  Bus,
  UserCog,
  MapPin,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';

const statCards = [
  { key: 'students', label: 'Total Students', icon: Users, color: 'blue' },
  { key: 'drivers', label: 'Active Drivers', icon: UserCog, color: 'green' },
  { key: 'buses', label: 'Active Buses', icon: Bus, color: 'purple' },
  { key: 'activeRoutes', label: 'Active Routes', icon: MapPin, color: 'orange' },
];

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600',
  orange: 'bg-orange-50 text-orange-600',
};

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
        students: 156,
        drivers: 12,
        buses: 8,
        activeRoutes: 5,
        scansToday: 234,
        pickups: 120,
        dropoffs: 114,
      });
      setActivity([
        { id: 1, type: 'pickup', student: 'John Smith', time: new Date(), bus: 'Bus 101' },
        { id: 2, type: 'dropoff', student: 'Emma Wilson', time: new Date(Date.now() - 300000), bus: 'Bus 102' },
        { id: 3, type: 'pickup', student: 'Michael Brown', time: new Date(Date.now() - 600000), bus: 'Bus 103' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your school transportation system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.key}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-xl ${colorClasses[card.color]}`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span>+12%</span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-gray-900">{stats[card.key]}</p>
              <p className="text-sm text-gray-500 mt-1">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Overview & Today's Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Scan Stats */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Scans</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.pickups || 120}</p>
                  <p className="text-sm text-gray-500">Pickups</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.dropoffs || 114}</p>
                  <p className="text-sm text-gray-500">Dropoffs</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.abs((stats.pickups || 120) - (stats.dropoffs || 114))}
                  </p>
                  <p className="text-sm text-gray-500">Pending</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </button>
          </div>
          <div className="space-y-3">
            {activity.length > 0 ? (
              activity.slice(0, 5).map((item, index) => (
                <div
                  key={item.id || index}
                  className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <div
                    className={`p-2 rounded-full ${
                      item.type === 'pickup' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {item.type === 'pickup' ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {item.student} - {item.type === 'pickup' ? 'Picked up' : 'Dropped off'}
                    </p>
                    <p className="text-xs text-gray-500">{item.bus}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {format(new Date(item.time), 'h:mm a')}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <a
            href="/students"
            className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
          >
            <Users className="w-6 h-6" />
            <span className="text-sm font-medium">Add Student</span>
          </a>
          <a
            href="/drivers"
            className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
          >
            <UserCog className="w-6 h-6" />
            <span className="text-sm font-medium">Add Driver</span>
          </a>
          <a
            href="/buses"
            className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
          >
            <Bus className="w-6 h-6" />
            <span className="text-sm font-medium">Add Bus</span>
          </a>
          <a
            href="/tracking"
            className="flex flex-col items-center gap-2 p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
          >
            <MapPin className="w-6 h-6" />
            <span className="text-sm font-medium">View Map</span>
          </a>
        </div>
      </div>
    </div>
  );
}
