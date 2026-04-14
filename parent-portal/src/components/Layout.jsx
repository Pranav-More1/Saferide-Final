import { useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

import {
  LayoutDashboard,
  Users,
  MapPin,
  History,
  Bell,
  LogOut,
  Menu,
  X,
  Heart,
  Sun,
  Moon
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'My Children', href: '/children', icon: Users },
  { name: 'Track Bus', href: '/tracking', icon: MapPin },
  { name: 'Attendance', href: '/attendance', icon: History },
  { name: 'Notifications', href: '/notifications', icon: Bell },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  
  const sidebarRef = useRef(null);
  const headerRef = useRef(null);

  useGSAP(() => {
    if (window.innerWidth >= 1024) {
      gsap.from(sidebarRef.current, {
        x: -50,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out'
      });
      gsap.from(headerRef.current, {
        y: -30,
        opacity: 0,
        duration: 0.6,
        delay: 0.2,
        ease: 'power3.out'
      });
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-300 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/80 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={twMerge(
          "fixed top-0 left-0 z-50 h-full bg-white dark:bg-[#0a0a0a] border-r border-gray-200 dark:border-[#222] transition-all duration-300 ease-in-out lg:translate-x-0 overflow-x-hidden group",
          sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64 lg:w-[80px] hover:w-64" 
        )}
      >
        <div className="flex flex-col h-full w-64">
          {/* Logo */}
          <div className="flex items-center px-5 py-6 border-b border-gray-200 dark:border-[#222]">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-black dark:bg-white flex items-center justify-center">
              <Heart className="w-5 h-5 text-white dark:text-black" />
            </div>
            <div className="ml-3 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden">
              <h1 className="font-bold text-black dark:text-white text-lg tracking-tight whitespace-nowrap">SafeRide</h1>
              <p className="text-[11px] text-gray-500 font-medium tracking-wide uppercase whitespace-nowrap">Parent Portal</p>
            </div>
            <button
              className="ml-auto mr-4 lg:hidden text-black dark:text-white hover:opacity-70 transition-opacity"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <div className="py-6 flex-1 overflow-y-auto">
            <nav className="space-y-1 px-3">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={clsx(
                      "flex items-center gap-4 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 w-full hover:scale-[1.02]",
                      isActive
                        ? "bg-black text-white dark:bg-white dark:text-black shadow-md"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] hover:text-black dark:hover:text-white"
                    )}
                  >
                    <item.icon 
                      className={clsx(
                        "w-5 h-5 shrink-0 transition-transform duration-200", 
                        isActive ? "text-white dark:text-black" : "text-gray-500"
                      )} 
                    />
                    <span className="opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User section */}
          <div className="mt-auto border-t border-gray-200 dark:border-[#222] bg-white dark:bg-[#0a0a0a] shrink-0">
            <div className="flex items-center gap-3 px-5 py-4">
              <div className="w-10 h-10 shrink-0 rounded-full bg-gray-100 dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 flex items-center justify-center text-black dark:text-white font-bold text-sm shadow-sm">
                {user?.name?.charAt(0) || 'P'}
              </div>
              <div className="flex-1 min-w-0 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-sm font-semibold text-black dark:text-white truncate">
                  {user?.name || 'Parent'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 shrink-0 text-gray-500 hover:text-black dark:hover:text-white opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300 w-full lg:pl-[80px]">
        {/* Header */}
        <header 
          ref={headerRef}
          className="sticky top-0 z-30 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-200 dark:border-[#222]"
        >
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 -ml-2 text-black dark:text-white hover:opacity-70 transition-opacity"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
              
              <div className="hidden sm:block">
                <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                  <span className="text-black dark:text-white font-bold">Parent Portal</span>
                  <span>/</span>
                  <span className="capitalize">{location.pathname === '/' ? 'Dashboard' : location.pathname.substring(1)}</span>
                </nav>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 hover:text-black dark:hover:text-white bg-gray-50 dark:bg-[#1a1a1a] hover:bg-gray-200 dark:hover:bg-[#333] rounded-full transition-all duration-300 border border-gray-200 dark:border-[#333]"
                aria-label="Toggle Dark Mode"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              
              {/* Notifications */}
              <Link 
                to="/notifications"
                className="relative p-2 text-gray-500 hover:text-black dark:hover:text-white bg-gray-50 dark:bg-[#1a1a1a] hover:bg-gray-200 dark:hover:bg-[#333] rounded-full transition-all duration-300 border border-gray-200 dark:border-[#333]"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-black dark:bg-white border-2 border-white dark:border-[#1a1a1a] rounded-full" />
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 w-full max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
