<<<<<<< HEAD
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { io } from 'socket.io-client';
import { childrenAPI } from '../services/api';
import { Bus, User, Phone, CheckCircle } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
=======
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { io } from 'socket.io-client';
import { childrenAPI, trackingAPI } from '../services/api';
import { Bus, MapPin, User, Clock, Navigation, Phone, CheckCircle } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
>>>>>>> friend/main

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

<<<<<<< HEAD
// Monochrome custom bus marker
=======
// Custom bus marker
>>>>>>> friend/main
const busIcon = new L.DivIcon({
  className: 'custom-bus-marker',
  html: `
    <div style="
<<<<<<< HEAD
      background: #111;
=======
      background: linear-gradient(135deg, #22c55e, #16a34a);
>>>>>>> friend/main
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid white;
<<<<<<< HEAD
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
=======
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
>>>>>>> friend/main
        <path d="M8 6v6"/>
        <path d="M15 6v6"/>
        <path d="M2 12h19.6"/>
        <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
<<<<<<< HEAD
        <circle cx="7" cy="18" r="2.5"/>
        <circle cx="17" cy="18" r="2.5"/>
=======
        <circle cx="7" cy="18" r="2"/>
        <circle cx="17" cy="18" r="2"/>
>>>>>>> friend/main
      </svg>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

<<<<<<< HEAD
// Monochrome school marker
=======
// School marker
>>>>>>> friend/main
const schoolIcon = new L.DivIcon({
  className: 'custom-school-marker',
  html: `
    <div style="
<<<<<<< HEAD
      background: white;
=======
      background: linear-gradient(135deg, #f59e0b, #d97706);
>>>>>>> friend/main
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
<<<<<<< HEAD
      border: 3px solid #111;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
=======
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
>>>>>>> friend/main
        <path d="m4 6 8-4 8 4"/>
        <path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/>
        <path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"/>
        <path d="M18 5v17"/>
        <path d="M6 5v17"/>
<<<<<<< HEAD
        <circle cx="12" cy="9" r="2.5"/>
=======
        <circle cx="12" cy="9" r="2"/>
>>>>>>> friend/main
      </svg>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function FlyToLocation({ position }) {
  const map = useMap();
<<<<<<< HEAD
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, { duration: 1.5, easeLinearity: 0.25 });
    }
  }, [position, map]);
=======
  
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, { duration: 1 });
    }
  }, [position, map]);
  
>>>>>>> friend/main
  return null;
}

export default function LiveTracking() {
  const [searchParams] = useSearchParams();
  const selectedChildId = searchParams.get('child');
<<<<<<< HEAD
  const containerRef = useRef(null);
=======
>>>>>>> friend/main
  
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [busLocation, setBusLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

<<<<<<< HEAD
=======
  // School location (could come from API)
>>>>>>> friend/main
  const schoolLocation = { lat: 28.6139, lng: 77.2090, name: 'Lincoln Elementary School' };

  useEffect(() => {
    fetchChildren();
<<<<<<< HEAD
  }, []);

  useEffect(() => {
    if (!selectedChild) return;

    // Connect to WebSocket for the specific child's bus
=======
    
    // Connect to WebSocket
>>>>>>> friend/main
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      transports: ['websocket'],
      path: '/socket.io',
    });

<<<<<<< HEAD
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('bus-location-update', (data) => {
      if (data.busId === selectedChild.bus?.busId) {
=======
    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('bus-location-update', (data) => {
      if (selectedChild && data.busId === selectedChild.bus?.busId) {
>>>>>>> friend/main
        setBusLocation({
          ...data,
          latitude: data.latitude,
          longitude: data.longitude,
        });
      }
    });

<<<<<<< HEAD
    return () => socket.disconnect();
=======
    return () => {
      socket.disconnect();
    };
>>>>>>> friend/main
  }, [selectedChild]);

  const fetchChildren = async () => {
    try {
      const response = await childrenAPI.getAll();
      const childrenData = response.data?.children || [];
      setChildren(childrenData);
      
      if (selectedChildId) {
        const child = childrenData.find(c => c._id === selectedChildId);
        if (child) setSelectedChild(child);
      } else if (childrenData.length > 0) {
        setSelectedChild(childrenData[0]);
      }
    } catch (error) {
      console.error('Failed to fetch children:', error);
<<<<<<< HEAD
      const mockChildren = [
        {
          _id: '1',
          name: 'John Smith Jr.',
          grade: '5th',
          status: 'on_bus',
          bus: { busId: '1', busNumber: 'BUS-101', driver: 'Robert Johnson', phone: '555-0201' },
        },
        {
          _id: '2',
          name: 'Emily Smith',
          grade: '3rd',
          status: 'at_school',
          bus: { busId: '1', busNumber: 'BUS-101', driver: 'Robert Johnson', phone: '555-0201' },
        },
      ];
      setChildren(mockChildren);
      setSelectedChild(selectedChildId ? mockChildren.find(c => c._id === selectedChildId) : mockChildren[0]);
      
      setBusLocation({
        busId: '1',
        busNumber: 'BUS-101',
        latitude: 28.6100,
        longitude: 77.2050,
        speed: 25,
        lastUpdate: new Date(),
      });
=======
>>>>>>> friend/main
    } finally {
      setLoading(false);
    }
  };

  const handleChildSelect = (child) => {
    setSelectedChild(child);
<<<<<<< HEAD
  };

  useGSAP(() => {
    if (loading) return;
    gsap.fromTo('.stagger-card',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
    );
  }, { scope: containerRef, dependencies: [loading, selectedChild] });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full" />
=======
    // In real app, fetch bus location for this child
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
>>>>>>> friend/main
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto" ref={containerRef}>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white tracking-tight">Live Tracking</h1>
          <p className="text-sm text-gray-500 mt-1">Track your child's bus in real-time</p>
        </div>
      </div>

      {/* Child Selector */}
      <div className="stagger-card flex gap-3 overflow-x-auto pb-4 snap-x hide-scrollbar">
        {children.map((child) => {
          const isSelected = selectedChild?._id === child._id;
          return (
            <button
              key={child._id}
              onClick={() => handleChildSelect(child)}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border whitespace-nowrap transition-all shadow-sm snap-center ${
                isSelected
                  ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-lg scale-[1.02]'
                  : 'bg-white dark:bg-[#111] border-gray-200 dark:border-[#333] text-black dark:text-white hover:border-black/20 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border ${
                isSelected
                  ? 'bg-white text-black dark:bg-black dark:text-white border-transparent'
                  : 'bg-gray-100 dark:bg-[#222] text-gray-900 dark:text-white border-gray-200 dark:border-[#444]'
              }`}>
                {child.name?.charAt(0)}
              </div>
              <div className="text-left">
                <p className="font-bold text-sm tracking-tight">{child.name}</p>
                <p className={`text-xs font-medium mt-0.5 ${isSelected ? 'opacity-80' : 'text-gray-500'}`}>
                  {child.status === 'on_bus' ? 'On Bus' : 'At School'}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Info Panel */}
        <div className="space-y-6">
          {selectedChild && (
            <div className="stagger-card bg-white dark:bg-[#111] rounded-3xl border border-gray-100 dark:border-[#222] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] p-6 sm:p-8">
              <div className="flex items-center gap-5 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-2xl font-bold shadow-md">
                  {selectedChild.name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-black dark:text-white">{selectedChild.name}</h3>
                  <p className="text-sm font-medium text-gray-500 mt-1">{selectedChild.grade} Grade</p>
                </div>
              </div>
              
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wide border ${
                selectedChild.status === 'on_bus'
                  ? 'bg-gray-100 dark:bg-[#222] text-black dark:text-white border-transparent'
                  : 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
              }`}>
                {selectedChild.status === 'on_bus' ? (
                  <><Bus className="w-4 h-4" /> Currently on bus</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> At school</>
=======
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Live Tracking</h1>
        <p className="text-gray-500 mt-1">Track your child's bus in real-time</p>
      </div>

      {/* Child Selector */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {children.map((child) => (
          <button
            key={child._id}
            onClick={() => handleChildSelect(child)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border whitespace-nowrap transition-all ${
              selectedChild?._id === child._id
                ? 'bg-primary-50 border-primary-200 text-primary-700'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
              selectedChild?._id === child._id
                ? 'bg-gradient-to-br from-primary-400 to-primary-600'
                : 'bg-gray-400'
            }`}>
              {child.name?.charAt(0)}
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">{child.name}</p>
              <p className="text-xs text-gray-500">{child.status === 'on_bus' ? 'On Bus' : 'At School'}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Panel */}
        <div className="space-y-4">
          {/* Child Info Card */}
          {selectedChild && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-semibold">
                  {selectedChild.name?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedChild.name}</h3>
                  <p className="text-sm text-gray-500">{selectedChild.grade} Grade</p>
                </div>
              </div>
              
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                selectedChild.status === 'on_bus'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {selectedChild.status === 'on_bus' ? (
                  <>
                    <Bus className="w-4 h-4" />
                    Currently on bus
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    At school
                  </>
>>>>>>> friend/main
                )}
              </div>
            </div>
          )}

<<<<<<< HEAD
          {selectedChild?.bus && (
            <div className="stagger-card bg-white dark:bg-[#111] rounded-3xl border border-gray-100 dark:border-[#222] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] p-6 sm:p-8">
              <h4 className="text-lg font-bold text-black dark:text-white mb-6">Bus Information</h4>
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] flex items-center justify-center">
                    <Bus className="w-5 h-5 text-black dark:text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Bus Number</p>
                    <p className="font-bold text-black dark:text-white mt-1">{selectedChild.bus.busNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] flex items-center justify-center">
                    <User className="w-5 h-5 text-black dark:text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Driver</p>
                    <p className="font-bold text-black dark:text-white mt-1">{selectedChild.bus.driver}</p>
=======
          {/* Bus Info Card */}
          {selectedChild?.bus && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Bus Information</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                    <Bus className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bus Number</p>
                    <p className="font-semibold text-gray-900">{selectedChild.bus.busNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Driver</p>
                    <p className="font-semibold text-gray-900">{selectedChild.bus.driver}</p>
>>>>>>> friend/main
                  </div>
                </div>
                {selectedChild.bus.phone && (
                  <a
                    href={`tel:${selectedChild.bus.phone}`}
<<<<<<< HEAD
                    className="flex items-center gap-4 p-4 mt-2 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-2xl hover:border-black/20 dark:hover:border-white/20 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
                       <Phone className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-black dark:text-white group-hover:underline">{selectedChild.bus.phone}</span>
=======
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <Phone className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-700">{selectedChild.bus.phone}</span>
>>>>>>> friend/main
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Live Stats */}
          {busLocation && (
<<<<<<< HEAD
            <div className="stagger-card bg-white dark:bg-[#111] rounded-3xl border border-gray-100 dark:border-[#222] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] p-6 sm:p-8">
              <h4 className="text-lg font-bold text-black dark:text-white mb-6">Live Status</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-[#222]">
                  <span className="text-sm font-semibold text-gray-500">Speed</span>
                  <span className="font-bold text-black dark:text-white">{busLocation.speed || 0} km/h</span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-[#222]">
                  <span className="text-sm font-semibold text-gray-500">Last Update</span>
                  <span className="font-bold text-black dark:text-white">
                    {new Date(busLocation.lastUpdate).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-semibold text-gray-500">Connection</span>
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                    connected ? 'bg-gray-100 dark:bg-[#222] text-black dark:text-white' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${connected ? 'bg-black dark:bg-white' : 'bg-red-500'}`} />
=======
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Live Status</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Speed</span>
                  <span className="font-semibold text-gray-900">{busLocation.speed || 0} km/h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Last Update</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(busLocation.lastUpdate).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Connection</span>
                  <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                    connected ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
>>>>>>> friend/main
                    {connected ? 'Live' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Map */}
<<<<<<< HEAD
        <div className="stagger-card lg:col-span-2 bg-white dark:bg-[#111] rounded-3xl border border-gray-100 dark:border-[#222] shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="h-[500px] lg:h-[700px] w-full isolate">
            <MapContainer
              center={busLocation ? [busLocation.latitude, busLocation.longitude] : [schoolLocation.lat, schoolLocation.lng]}
              zoom={14}
              style={{ height: '100%', width: '100%', filter: 'contrast(1.05) saturate(0.8)' }}
              zoomControl={false}
=======
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-[500px] lg:h-[600px]">
            <MapContainer
              center={busLocation ? [busLocation.latitude, busLocation.longitude] : [schoolLocation.lat, schoolLocation.lng]}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
>>>>>>> friend/main
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {busLocation && (
                <>
                  <FlyToLocation position={[busLocation.latitude, busLocation.longitude]} />
                  <Marker position={[busLocation.latitude, busLocation.longitude]} icon={busIcon}>
<<<<<<< HEAD
                    <Popup className="custom-popup">
                      <div className="text-center font-sans tracking-tight">
                        <h4 className="font-bold text-gray-900 text-lg">{busLocation.busNumber}</h4>
                        <p className="text-xs font-medium text-gray-500 mt-1 uppercase tracking-wide">Speed: {busLocation.speed || 0} km/h</p>
                        <hr className="my-2 border-gray-200" />
                        <p className="text-sm font-medium text-gray-800">
                          {selectedChild?.name} is on board
=======
                    <Popup>
                      <div className="p-2">
                        <h4 className="font-semibold">{busLocation.busNumber}</h4>
                        <p className="text-sm text-gray-600">Speed: {busLocation.speed || 0} km/h</p>
                        <p className="text-sm text-gray-600">
                          {selectedChild?.name} is on this bus
>>>>>>> friend/main
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                </>
              )}
              
<<<<<<< HEAD
              <Marker position={[schoolLocation.lat, schoolLocation.lng]} icon={schoolIcon}>
                <Popup className="custom-popup">
                  <div className="text-center font-sans tracking-tight">
                    <h4 className="font-bold text-gray-900">{schoolLocation.name}</h4>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mt-1">Destination</p>
=======
              {/* School marker */}
              <Marker position={[schoolLocation.lat, schoolLocation.lng]} icon={schoolIcon}>
                <Popup>
                  <div className="p-2">
                    <h4 className="font-semibold">{schoolLocation.name}</h4>
                    <p className="text-sm text-gray-600">School Location</p>
>>>>>>> friend/main
                  </div>
                </Popup>
              </Marker>

<<<<<<< HEAD
=======
              {/* Route line */}
>>>>>>> friend/main
              {busLocation && (
                <Polyline
                  positions={[
                    [busLocation.latitude, busLocation.longitude],
                    [schoolLocation.lat, schoolLocation.lng],
                  ]}
<<<<<<< HEAD
                  color="#111"
                  weight={4}
                  dashArray="12, 12"
                  opacity={0.8}
=======
                  color="#22c55e"
                  weight={3}
                  dashArray="10, 10"
>>>>>>> friend/main
                />
              )}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
