import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { parentAPI } from '../services/api';
import {
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Bus,
  User,
  ChevronRight,
  Bell,
  Shield,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export default function Home() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const [childRes, notifRes] = await Promise.all([
        parentAPI.getChildren(),
        parentAPI.getNotifications()
      ]);
      setChildren(childRes.data?.children || []);
      const notifs = notifRes.data?.data || [];
      setUnreadAlerts(notifs.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    // Four-Step Commute Logic status mapping
    switch (status) {
      case 'not_boarded':
        return { label: 'Waiting', color: 'bg-gray-100 text-gray-700', icon: Clock };
      case 'morning_picked_up':
        return { label: 'On Bus to School', color: 'bg-yellow-100 text-yellow-700', icon: Bus };
      case 'at_school':
        return { label: 'At School', color: 'bg-green-100 text-green-700', icon: CheckCircle2 };
      case 'evening_picked_up':
        return { label: 'On Bus Home', color: 'bg-purple-100 text-purple-700', icon: Bus };
      case 'dropped_home':
        return { label: 'Home Safe', color: 'bg-blue-100 text-blue-700', icon: Shield };
      case 'absent':
        return { label: 'Absent', color: 'bg-red-100 text-red-700', icon: AlertTriangle };
      // Legacy status mappings for backwards compatibility
      case 'on_bus':
        return { label: 'On Bus', color: 'bg-blue-100 text-blue-700', icon: Bus };
      case 'at_home':
        return { label: 'At Home', color: 'bg-purple-100 text-purple-700', icon: Shield };
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-700', icon: AlertTriangle };
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
      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">Good {getGreeting()}, {user?.name?.split(' ')[0] || 'Parent'}!</h1>
        <p className="text-primary-100 mt-1">Here's an overview of your children's status today</p>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-3xl font-bold">{children.length}</p>
            <p className="text-sm text-primary-100">Children</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-3xl font-bold">{children.filter(c => c.status === 'at_school').length}</p>
            <p className="text-sm text-primary-100">At School</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-3xl font-bold">{children.filter(c => c.status === 'on_bus').length}</p>
            <p className="text-sm text-primary-100">On Bus</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-3xl font-bold">{unreadAlerts}</p>
            <p className="text-sm text-primary-100">Alerts</p>
          </div>
        </div>
      </div>

      {/* Children Status Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">My Children</h2>
          <Link to="/children" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View all
          </Link>
        </div>

        <div className="space-y-4">
          {children.map((child) => {
            const statusInfo = getStatusInfo(child.status);
            const StatusIcon = statusInfo.icon;

            return (
              <Link
                key={child._id}
                to={`/tracking?child=${child._id}`}
                className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-semibold flex-shrink-0">
                    {child.name?.charAt(0) || 'C'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">{child.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{child.grade} Grade</p>

                    {child.lastScan && (
                      <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {getScanTypeLabel(child.lastScan.type)}{' '}
                          {formatDistanceToNow(new Date(child.lastScan.time), { addSuffix: true })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Bus className="w-4 h-4 text-gray-400" />
                          {child.lastScan.bus}
                        </div>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          <Link
            to="/tracking"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Live Tracking</p>
              <p className="text-xs text-gray-500">Track buses in real-time</p>
            </div>
          </Link>
          <Link
            to="/history"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">History</p>
              <p className="text-xs text-gray-500">View past activity</p>
            </div>
          </Link>
          <Link
            to="/notifications"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Notifications</p>
              <p className="text-xs text-gray-500">View alerts & updates</p>
            </div>
          </Link>
          <Link
            to="/children"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <User className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Children</p>
              <p className="text-xs text-gray-500">Manage profiles</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

// Four-Step scan type display labels
function getScanTypeLabel(scanType) {
  const labels = {
    morning_pickup: 'Picked up from home',
    morning_dropoff: 'Dropped at school',
    evening_pickup: 'Picked up from school',
    evening_dropoff: 'Dropped at home',
    // Legacy types
    pickup: 'Picked up',
    dropoff: 'Dropped off',
  };
  return labels[scanType] || scanType;
}
