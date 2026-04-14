import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { io } from 'socket.io-client';
import { parentAPI } from '../services/api';
import { Bus, MapPin, User, Clock, Navigation, Phone, CheckCircle } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom bus marker
const busIcon = new L.DivIcon({
  className: 'custom-bus-marker',
  html: `
    <div style="
      background: linear-gradient(135deg, #22c55e, #16a34a);
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 6v6"/>
        <path d="M15 6v6"/>
        <path d="M2 12h19.6"/>
        <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
        <circle cx="7" cy="18" r="2"/>
        <circle cx="17" cy="18" r="2"/>
      </svg>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

// School marker
const schoolIcon = new L.DivIcon({
  className: 'custom-school-marker',
  html: `
    <div style="
      background: linear-gradient(135deg, #f59e0b, #d97706);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m4 6 8-4 8 4"/>
        <path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/>
        <path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"/>
        <path d="M18 5v17"/>
        <path d="M6 5v17"/>
        <circle cx="12" cy="9" r="2"/>
      </svg>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function FlyToLocation({ position }) {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, { duration: 1 });
    }
  }, [position, map]);
  
  return null;
}

export default function LiveTracking() {
  const [searchParams] = useSearchParams();
  const selectedChildId = searchParams.get('child');
  
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [busLocation, setBusLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  // School location (could come from API)
  const schoolLocation = { lat: 28.6139, lng: 77.2090, name: 'Lincoln Elementary School' };

  // Use a ref to keep track of the selected child without causing socket reconnects
  const selectedChildRef = useRef(selectedChild);
  useEffect(() => {
    selectedChildRef.current = selectedChild;
  }, [selectedChild]);

  // Handle Socket Connection ONCE
  useEffect(() => {
    fetchChildren();
    
    // Connect to WebSocket
    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    const socketUrl = apiUrl.includes('/api/v1') ? apiUrl.replace('/api/v1', '') : apiUrl;
    
    const socket = io(socketUrl, {
      transports: ['websocket'],
      path: '/socket.io',
      auth: { token }
    });

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    // The backend route emits "bus:location_updated"
    socket.on('bus:location_updated', (data) => {
      const currentChild = selectedChildRef.current;
      if (currentChild && (data.busId === currentChild.assignedBus?._id || data.busId === currentChild.bus?.busId)) {
        setBusLocation(prev => ({
          ...prev,
          ...data,
          latitude: data.location?.latitude || data.latitude,
          longitude: data.location?.longitude || data.longitude,
        }));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Fetch initial location when child selected
  useEffect(() => {
    if (selectedChild && selectedChild._id) {
      fetchBusLocation(selectedChild._id);
    }
  }, [selectedChild]);

  const fetchBusLocation = async (childId) => {
    try {
      const response = await parentAPI.getChildBusLocation(childId);
      if (response.data?.data) {
        const locData = response.data.data;
        setBusLocation({
          busId: locData.busId?._id || locData.busId,
          busNumber: locData.busId?.busNumber,
          latitude: locData.location?.coordinates[1] || 0,
          longitude: locData.location?.coordinates[0] || 0,
          speed: locData.speed || 0,
          heading: locData.heading || 0,
          lastUpdate: locData.timestamp,
        });
      }
    } catch (error) {
      console.log('No current location available for child.');
    }
  };

  const fetchChildren = async () => {
    try {
      const response = await parentAPI.getChildren();
      const childrenData = response.data?.data || response.data?.children || [];
      setChildren(childrenData);
      
      if (selectedChildId) {
        const child = childrenData.find(c => c._id === selectedChildId);
        if (child) setSelectedChild(child);
      } else if (childrenData.length > 0) {
        setSelectedChild(childrenData[0]);
      }
    } catch (error) {
      console.error('Failed to fetch children:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChildSelect = (child) => {
    setSelectedChild(child);
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
                )}
              </div>
            </div>
          )}

          {/* Bus Info Card */}
          {(selectedChild?.assignedBus || selectedChild?.bus) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Bus Information</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                    <Bus className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bus Number</p>
                    <p className="font-semibold text-gray-900">{selectedChild.assignedBus?.busNumber || selectedChild.bus?.busNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Driver</p>
                    <p className="font-semibold text-gray-900">{selectedChild.assignedBus?.driverName || selectedChild.bus?.driver}</p>
                  </div>
                </div>
                {selectedChild.assignedBus?.driver?.phone && (
                  <a
                    href={`tel:${selectedChild.assignedBus.driver.phone}`}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <Phone className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-700">{selectedChild.assignedBus.driver.phone}</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Live Stats */}
          {busLocation && (
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
                    {connected ? 'Live' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-[500px] lg:h-[600px]">
            <MapContainer
              center={busLocation ? [busLocation.latitude, busLocation.longitude] : [schoolLocation.lat, schoolLocation.lng]}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {busLocation && (
                <>
                  <FlyToLocation position={[busLocation.latitude, busLocation.longitude]} />
                  <Marker position={[busLocation.latitude, busLocation.longitude]} icon={busIcon}>
                    <Popup>
                      <div className="p-2">
                        <h4 className="font-semibold">{busLocation.busNumber}</h4>
                        <p className="text-sm text-gray-600">Speed: {busLocation.speed || 0} km/h</p>
                        <p className="text-sm text-gray-600">
                          {selectedChild?.name} is on this bus
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                </>
              )}
              
              {/* School marker */}
              <Marker position={[schoolLocation.lat, schoolLocation.lng]} icon={schoolIcon}>
                <Popup>
                  <div className="p-2">
                    <h4 className="font-semibold">{schoolLocation.name}</h4>
                    <p className="text-sm text-gray-600">School Location</p>
                  </div>
                </Popup>
              </Marker>

              {/* Route line */}
              {busLocation && (
                <Polyline
                  positions={[
                    [busLocation.latitude, busLocation.longitude],
                    [schoolLocation.lat, schoolLocation.lng],
                  ]}
                  color="#22c55e"
                  weight={3}
                  dashArray="10, 10"
                />
              )}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
