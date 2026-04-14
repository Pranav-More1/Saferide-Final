import { useState, useEffect } from 'react';
import { parentAPI } from '../services/api';
import {
  Bell,
  BellOff,
  Settings,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Bus,
  MapPin,
  Info,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Inbox,
} from 'lucide-react';

export default function Notifications() {
  const [activeTab, setActiveTab] = useState('notifications');
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    boardingAlerts: true,
    arrivalAlerts: true,
    delayAlerts: true,
    absenteeAlerts: true,
  });
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [notifRes, settingsRes] = await Promise.all([
        parentAPI.getNotifications(),
        parentAPI.getNotificationSettings(),
      ]);
      setNotifications(notifRes.data?.data || []);
      setSettings(settingsRes.data?.data || settings);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    setSavingSettings(true);
    try {
      await parentAPI.updateNotificationSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSavingSettings(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'boarding': return <CheckCircle2 className="w-5 h-5" />;
      case 'alighting': return <MapPin className="w-5 h-5" />;
      case 'arrival': return <Bus className="w-5 h-5" />;
      case 'delay': return <AlertTriangle className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'boarding': return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30';
      case 'alighting': return 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30';
      case 'arrival': return 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/30';
      case 'delay': return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30';
      default: return 'bg-gray-50 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-[#333]';
    }
  };

  const formatTime = (time) => {
    const diff = Date.now() - new Date(time).getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  const settingItems = [
    { key: 'pushEnabled', label: 'Push Notifications', desc: 'Receive push notifications on your device' },
    { key: 'emailEnabled', label: 'Email Notifications', desc: 'Receive notifications via email' },
    { key: 'smsEnabled', label: 'SMS Notifications', desc: 'Receive notifications via SMS' },
    { key: 'boardingAlerts', label: 'Boarding Alerts', desc: 'When your child boards the bus' },
    { key: 'arrivalAlerts', label: 'Arrival Alerts', desc: 'When the bus is arriving at your stop' },
    { key: 'delayAlerts', label: 'Delay Alerts', desc: 'When the bus is delayed' },
    { key: 'absenteeAlerts', label: 'Absence Alerts', desc: 'When your child is marked absent' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white tracking-tight">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-1 shadow-sm w-max">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'notifications'
              ? 'bg-black text-white dark:bg-white dark:text-black shadow'
              : 'text-gray-500 hover:text-black dark:hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Alerts
          </span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'settings'
              ? 'bg-black text-white dark:bg-white dark:text-black shadow'
              : 'text-gray-500 hover:text-black dark:hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </span>
        </button>
      </div>

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white dark:bg-[#111] rounded-3xl border border-gray-100 dark:border-[#222] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] overflow-hidden">
          {notifications.length > 0 ? (
            <div className="divide-y divide-gray-50 dark:divide-[#1a1a1a]">
              {notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`flex items-start gap-3 sm:gap-4 p-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors cursor-pointer ${
                    !notif.read ? 'bg-gray-50/50 dark:bg-[#0f0f0f]' : ''
                  }`}
                >
                  <div className={`p-2.5 rounded-xl shrink-0 border ${getNotificationColor(notif.type)}`}>
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-bold truncate ${
                        !notif.read ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-black dark:bg-white shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 font-medium shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(notif.time)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Inbox className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
              <h3 className="text-lg font-bold text-black dark:text-white mb-2">No Notifications</h3>
              <p className="text-gray-500 text-sm">You're all caught up! No new notifications.</p>
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-[#111] rounded-3xl border border-gray-100 dark:border-[#222] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-[#222]">
            <h3 className="text-lg font-bold text-black dark:text-white">Notification Preferences</h3>
            <p className="text-sm text-gray-500 mt-1">Choose how and when you'd like to be notified</p>
          </div>

          <div className="divide-y divide-gray-50 dark:divide-[#1a1a1a]">
            {settingItems.map((item, index) => (
              <div key={item.key}>
                {index === 3 && (
                  <div className="px-5 sm:px-6 pt-5 pb-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Alert Types</p>
                  </div>
                )}
                <div className="flex items-center justify-between p-4 sm:px-6 hover:bg-gray-50/50 dark:hover:bg-[#0f0f0f] transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-black dark:text-white">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(item.key)}
                    className="shrink-0 ml-4"
                  >
                    {settings[item.key] ? (
                      <ToggleRight className="w-10 h-10 text-black dark:text-white" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
