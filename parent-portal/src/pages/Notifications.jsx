<<<<<<< HEAD
import { useState, useEffect, useRef } from 'react';
import { notificationsAPI } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  Bell,
  Check,
  CheckCheck,
  Bus,
  MapPin,
  AlertTriangle,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const containerRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationsAPI.getAll();
      setNotifications(response.data?.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Mock data
      setNotifications([
        {
          _id: '1',
          type: 'pickup',
          title: 'Child Picked Up',
          message: 'John Smith Jr. was picked up from Home Stop by BUS-101',
          time: new Date(Date.now() - 3600000).toISOString(),
          read: false,
        },
        {
          _id: '2',
          type: 'dropoff',
          title: 'Child Dropped Off',
          message: 'John Smith Jr. was safely dropped off at School',
          time: new Date(Date.now() - 7200000).toISOString(),
          read: false,
        },
        {
          _id: '3',
          type: 'delay',
          title: 'Bus Delay Alert',
          message: 'BUS-101 is running 10 minutes behind schedule due to traffic',
          time: new Date(Date.now() - 86400000).toISOString(),
          read: true,
        },
        {
          _id: '4',
          type: 'info',
          title: 'Schedule Update',
          message: 'Tomorrow\'s pickup time has been changed to 7:45 AM',
          time: new Date(Date.now() - 172800000).toISOString(),
          read: true,
        },
=======
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
      // Use mock data
      setNotifications([
        { _id: '1', type: 'boarding', title: 'Aanya boarded BUS-101', message: 'Your child Aanya was safely scanned boarding BUS-101 at 7:30 AM.', time: new Date(Date.now() - 3600000), read: false },
        { _id: '2', type: 'arrival', title: 'Bus arriving at your stop', message: 'BUS-101 is 5 minutes away from Sector 15 Gate.', time: new Date(Date.now() - 7200000), read: false },
        { _id: '3', type: 'alighting', title: 'Arjun dropped off at school', message: 'Your child Arjun was safely scanned alighting at Green Valley School at 8:15 AM.', time: new Date(Date.now() - 10800000), read: true },
        { _id: '4', type: 'delay', title: 'Bus delay alert', message: 'BUS-101 is running 10 minutes late on Route 4A due to traffic.', time: new Date(Date.now() - 86400000), read: true },
        { _id: '5', type: 'info', title: 'Schedule update', message: 'Bus timings have been updated for the upcoming holiday season. Please check the new schedule.', time: new Date(Date.now() - 172800000), read: true },
>>>>>>> friend/main
      ]);
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('All notifications marked as read', {
        className: 'dark:bg-[#1a1a1a] dark:text-white dark:border dark:border-[#333]',
      });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('All notifications marked as read', {
        className: 'dark:bg-[#1a1a1a] dark:text-white dark:border dark:border-[#333]',
      });
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'pickup':
        return { icon: Bus, color: 'bg-black text-white dark:bg-white dark:text-black border-transparent' };
      case 'dropoff':
        return { icon: MapPin, color: 'bg-black text-white dark:bg-white dark:text-black border-transparent' };
      case 'delay':
        return { icon: AlertTriangle, color: 'bg-white dark:bg-[#111] text-black dark:text-white border-gray-200 dark:border-[#444]' };
      default:
        return { icon: Info, color: 'bg-gray-50 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-[#333]' };
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'alerts') return n.type === 'delay' || n.type === 'alert';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  useGSAP(() => {
    if (loading) return;
    gsap.fromTo('.stagger-card',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
    );
  }, { scope: containerRef, dependencies: [loading, filter, notifications.length] });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
=======
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
>>>>>>> friend/main
        <div className="animate-spin w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full" />
      </div>
    );
  }

<<<<<<< HEAD
  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto" ref={containerRef}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white tracking-tight">Notifications</h1>
          <p className="text-sm font-medium text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notifications require attention` : 'All caught up! No unread notifications.'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-black bg-white dark:text-white dark:bg-[#111] border border-gray-200 dark:border-[#333] hover:border-black/20 dark:hover:border-white/20 hover:shadow-md transition-all rounded-xl"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 sm:gap-3 p-1.5 bg-gray-100 dark:bg-[#1a1a1a] rounded-2xl w-max border border-gray-200 dark:border-[#222]">
        {[
          { value: 'all', label: 'All' },
          { value: 'unread', label: `Unread (${unreadCount})` },
          { value: 'alerts', label: 'Alerts' },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
              filter === option.value
                ? 'bg-white dark:bg-[#333] text-black dark:text-white shadow-sm border border-gray-200 dark:border-[#444]'
                : 'text-gray-500 hover:text-black dark:hover:text-white transparent border border-transparent'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="stagger-card text-center py-16 bg-white dark:bg-[#111] rounded-3xl border border-gray-100 dark:border-[#222]">
          <Bell className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-xl font-bold text-black dark:text-white">No notifications</h3>
          <p className="text-gray-500 font-medium mt-2">
            {filter === 'unread' ? 'All notifications have been read.' : 'You have no notifications in this category.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification, index) => {
            const { icon: Icon, color } = getIcon(notification.type);

            return (
              <div
                key={notification._id}
                className={`stagger-card rounded-3xl border shadow-sm p-5 sm:p-6 transition-all duration-300 ${
                  notification.read 
                    ? 'bg-white dark:bg-[#111] border-gray-100 dark:border-[#222] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)]' 
                    : 'bg-gray-50 dark:bg-[#1a1a1a] border-black/10 dark:border-white/20 shadow-md ring-1 ring-black/5 dark:ring-white/10'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-4 sm:gap-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border ${color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-1.5">
                      <div className="flex items-center gap-3">
                        {!notification.read && (
                           <span className="w-2.5 h-2.5 rounded-full bg-black dark:bg-white shrink-0 block" />
                        )}
                        <h3 className="text-lg font-bold text-black dark:text-white tracking-tight">{notification.title}</h3>
                      </div>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        {formatDistanceToNow(new Date(notification.time), { addSuffix: true })}
                      </p>
                    </div>
                    
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1 pl-0 sm:pl-0 pr-8">{notification.message}</p>
                    
                    {!notification.read && (
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => handleMarkRead(notification._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] hover:border-black/20 dark:hover:border-white/20 text-xs font-bold uppercase tracking-widest text-black dark:text-white rounded-lg transition-all"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Mark Read
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
=======
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
>>>>>>> friend/main
        </div>
      )}
    </div>
  );
}
