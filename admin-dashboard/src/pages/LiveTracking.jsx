import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { io } from 'socket.io-client';
import { busesAPI } from '../services/api';
import { Bus, MapPin, RefreshCw, Circle, Clock, Navigation } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom bus marker icon
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

// Component to recenter map
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

export default function LiveTracking() {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState(null);
  const [connected, setConnected] = useState(false);

  // Default center (can be school location)
  const defaultCenter = [28.6139, 77.2090]; // Delhi coordinates

  useEffect(() => {
    fetchBusLocations();
    
    // Connect to WebSocket for real-time updates
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      transports: ['websocket'],
      path: '/socket.io',
    });

    socket.on('connect', () => {
      console.log('Connected to tracking server');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from tracking server');
      setConnected(false);
    });

    socket.on('bus-location-update', (data) => {
      setBuses((prev) => {
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

  const fetchBusLocations = async () => {
    try {
      const response = await busesAPI.getLocations();
      setBuses(response.data?.locations || []);
    } catch (error) {
      console.error('Failed to fetch bus locations:', error);
      // Mock data for demo
      setBuses([
        { busId: '1', busNumber: 'BUS-101', latitude: 28.6139, longitude: 77.2090, speed: 35, lastUpdate: new Date(), driver: 'Robert Johnson' },
        { busId: '2', busNumber: 'BUS-102', latitude: 28.6229, longitude: 77.2180, speed: 28, lastUpdate: new Date(), driver: 'Maria Garcia' },
        { busId: '3', busNumber: 'BUS-103', latitude: 28.6049, longitude: 77.1990, speed: 0, lastUpdate: new Date(Date.now() - 600000), driver: 'James Williams' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const isOnline = (lastUpdate) => {
    const diff = Date.now() - new Date(lastUpdate).getTime();
    return diff < 5 * 60 * 1000; // 5 minutes
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Tracking</h1>
          <p className="text-gray-500 mt-1">Real-time bus location monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Circle
              className={`w-3 h-3 ${connected ? 'text-green-500 fill-green-500' : 'text-red-500 fill-red-500'}`}
            />
            <span className="text-sm text-gray-600">
              {connected ? 'Live' : 'Offline'}
            </span>
          </div>
          <button
            onClick={fetchBusLocations}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Map and Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Bus List Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Active Buses</h3>
              <p className="text-sm text-gray-500">{buses.length} buses tracked</p>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {buses.map((bus) => {
                const online = isOnline(bus.lastUpdate);
                return (
                  <button
                    key={bus.busId}
                    onClick={() => setSelectedBus(bus)}
                    className={`w-full p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors text-left ${
                      selectedBus?.busId === bus.busId ? 'bg-primary-50' : ''
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
                          <span className="font-semibold text-gray-900">
                            {bus.busNumber}
                          </span>
                          <Circle
                            className={`w-2 h-2 ${
                              online ? 'text-green-500 fill-green-500' : 'text-gray-300 fill-gray-300'
                            }`}
                          />
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {bus.driver || 'No driver'}
                        </p>
                      </div>
                      {online && bus.speed > 0 && (
                        <span className="text-sm font-medium text-gray-600">
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
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Bus Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Bus className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Bus:</span>
                  <span className="font-medium text-gray-900">{selectedBus.busNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium text-gray-900">
                    {selectedBus.latitude?.toFixed(4)}, {selectedBus.longitude?.toFixed(4)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Navigation className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Speed:</span>
                  <span className="font-medium text-gray-900">{selectedBus.speed || 0} km/h</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Last Update:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(selectedBus.lastUpdate).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
              <RecenterButton buses={buses} />
              
              {buses.map((bus) => (
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
                      <p className="text-sm text-gray-600">{bus.driver || 'No driver'}</p>
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
