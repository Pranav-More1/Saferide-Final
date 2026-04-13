import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { io } from 'socket.io-client';
import { parentAPI } from '../services/api';
import { Bus, MapPin, RefreshCw, Circle, Clock, Navigation, Users } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const busIcon = new L.DivIcon({
  className: 'custom-bus-marker',
  html: `
    <div style="
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 6v6"/>
        <path d="M15 6v6"/>
        <path d="M2 12h19.6"/>
        <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
        <circle cx="7" cy="18" r="2"/>
        <circle cx="17" cy="18" r="2"/>
      </svg>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

function RecenterButton({ buses }) {
  const map = useMap();

  const handleRecenter = () => {
    if (buses.length > 0) {
      const bounds = L.latLngBounds(buses.map(b => [b.latitude, b.longitude]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  return (
    <button
      onClick={handleRecenter}
      className="absolute top-4 right-4 z-[1000] p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
      title="Center map on buses"
    >
      <Navigation className="w-5 h-5 text-gray-600" />
    </button>
  );
}

export default function TrackBus() {
  const [children, setChildren] = useState([]);
  const [busLocations, setBusLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState(null);
  const [connected, setConnected] = useState(false);

  const defaultCenter = [19.0760, 72.8777];

  useEffect(() => {
    fetchChildrenAndBuses();

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const socketUrl = apiUrl.includes('/api/v1') ? apiUrl.replace('/api/v1', '') : apiUrl;
    
    const socket = io(socketUrl, {
      transports: ['websocket'],
      path: '/socket.io',
    });

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('bus-location-update', (data) => {
      setBusLocations((prev) => {
        const existing = prev.findIndex((b) => b.busId === data.busId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = { ...updated[existing], ...data };
          return updated;
        }
        return [...prev, data];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchChildrenAndBuses = async () => {
    try {
      const res = await parentAPI.getChildren();
      const childrenData = res.data?.children || [];
      setChildren(childrenData);

      // Fetch bus locations for each child
      const locations = [];
      for (const child of childrenData) {
        if (child.assignedBus) {
          try {
            const locRes = await parentAPI.getChildBusLocation(child._id);
            if (locRes.data?.data) {
              locations.push({
                ...locRes.data.data,
                childName: child.name,
                busNumber: child.assignedBus.busNumber || locRes.data.data.busId?.busNumber,
              });
            }
          } catch (e) {
            // Location not available
          }
        }
      }
      
      if (locations.length > 0) {
        setBusLocations(locations);
      } else {
        setBusLocations([]);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setChildren([]);
      setBusLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const isOnline = (lastUpdate) => {
    const diff = Date.now() - new Date(lastUpdate).getTime();
    return diff < 5 * 60 * 1000;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white tracking-tight">Track Bus</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time bus location for your children</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Circle
              className={`w-3 h-3 ${connected ? 'text-green-500 fill-green-500' : 'text-red-500 fill-red-500'}`}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {connected ? 'Live' : 'Offline'}
            </span>
          </div>
          <button
            onClick={fetchChildrenAndBuses}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] text-black dark:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Map and Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Bus List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-[#222] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-[#222]">
              <h3 className="font-semibold text-black dark:text-white">Children's Buses</h3>
              <p className="text-sm text-gray-500">{busLocations.length} buses tracked</p>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {busLocations.map((bus) => {
                const online = isOnline(bus.lastUpdate);
                return (
                  <button
                    key={bus.busId}
                    onClick={() => setSelectedBus(bus)}
                    className={`w-full p-4 border-b border-gray-50 dark:border-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors text-left ${
                      selectedBus?.busId === bus.busId ? 'bg-gray-50 dark:bg-[#1a1a1a]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          online
                            ? 'bg-gradient-to-br from-green-400 to-green-600'
                            : 'bg-gradient-to-br from-gray-300 to-gray-400'
                        }`}
                      >
                        <Bus className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-black dark:text-white">
                            {bus.busNumber}
                          </span>
                          <Circle
                            className={`w-2 h-2 ${
                              online ? 'text-green-500 fill-green-500' : 'text-gray-300 fill-gray-300'
                            }`}
                          />
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {bus.childName || bus.driver || 'No driver'}
                        </p>
                      </div>
                      {online && bus.speed > 0 && (
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {bus.speed} km/h
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Bus Details */}
          {selectedBus && (
            <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-[#222] shadow-sm p-4">
              <h3 className="font-semibold text-black dark:text-white mb-3">Bus Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Bus className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500 dark:text-gray-400">Bus:</span>
                  <span className="font-medium text-black dark:text-white">{selectedBus.busNumber}</span>
                </div>
                {selectedBus.childName && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500 dark:text-gray-400">Child:</span>
                    <span className="font-medium text-black dark:text-white">{selectedBus.childName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500 dark:text-gray-400">Location:</span>
                  <span className="font-medium text-black dark:text-white">
                    {selectedBus.latitude?.toFixed(4)}, {selectedBus.longitude?.toFixed(4)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Navigation className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500 dark:text-gray-400">Speed:</span>
                  <span className="font-medium text-black dark:text-white">{selectedBus.speed || 0} km/h</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500 dark:text-gray-400">Last Update:</span>
                  <span className="font-medium text-black dark:text-white">
                    {new Date(selectedBus.lastUpdate).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="lg:col-span-3 bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-[#222] shadow-sm overflow-hidden">
          <div className="h-[600px] relative">
            <MapContainer
              center={selectedBus ? [selectedBus.latitude, selectedBus.longitude] : defaultCenter}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <RecenterButton buses={busLocations} />
              
              {busLocations.map((bus) => (
                <Marker
                  key={bus.busId}
                  position={[bus.latitude, bus.longitude]}
                  icon={busIcon}
                  eventHandlers={{
                    click: () => setSelectedBus(bus),
                  }}
                >
                  <Popup>
                    <div className="p-2">
                      <h4 className="font-semibold text-gray-900">{bus.busNumber}</h4>
                      <p className="text-sm text-gray-600">{bus.childName}</p>
                      <p className="text-sm text-gray-600">Speed: {bus.speed || 0} km/h</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
