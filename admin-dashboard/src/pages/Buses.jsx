import { useState, useEffect } from 'react';
import { busesAPI, driversAPI } from '../services/api';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Bus,
  Users,
  MapPin,
  Loader2,
  Circle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Buses() {
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [formData, setFormData] = useState({
    busNumber: '',
    licensePlate: '',
    capacity: '',
    driverId: '',
    route: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [busesRes, driversRes] = await Promise.all([
        busesAPI.getAll(),
        driversAPI.getAll(),
      ]);
      setBuses(busesRes.data?.buses || []);
      setDrivers(driversRes.data?.drivers || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Mock data
      setBuses([
        { _id: '1', busNumber: 'BUS-101', licensePlate: 'ABC-1234', capacity: 40, driver: { name: 'Robert Johnson' }, route: 'North Route', status: 'active' },
        { _id: '2', busNumber: 'BUS-102', licensePlate: 'DEF-5678', capacity: 35, driver: { name: 'Maria Garcia' }, route: 'South Route', status: 'active' },
        { _id: '3', busNumber: 'BUS-103', licensePlate: 'GHI-9012', capacity: 45, driver: null, route: 'East Route', status: 'inactive' },
      ]);
      setDrivers([
        { _id: '1', name: 'Robert Johnson' },
        { _id: '2', name: 'Maria Garcia' },
        { _id: '3', name: 'James Williams' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (bus = null) => {
    if (bus) {
      setEditingBus(bus);
      setFormData({
        busNumber: bus.busNumber || '',
        licensePlate: bus.licensePlate || '',
        capacity: bus.capacity?.toString() || '',
        driverId: bus.driver?._id || bus.driverId || '',
        route: bus.routeName || bus.route || '',
      });
    } else {
      setEditingBus(null);
      setFormData({
        busNumber: '',
        licensePlate: '',
        capacity: '',
        driverId: '',
        route: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBus(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = {
        busNumber: formData.busNumber,
        licensePlate: formData.licensePlate,
        capacity: parseInt(formData.capacity, 10),
        routeName: formData.route, // Backend expects 'routeName'
        driver: formData.driverId || null, // Backend expects 'driver', not 'driverId'
      };

      if (editingBus) {
        await busesAPI.update(editingBus._id, data);
        toast.success('Bus updated successfully');
      } else {
        await busesAPI.create(data);
        toast.success('Bus created successfully');
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Failed to save bus:', error);
      toast.error(error.response?.data?.error || 'Failed to save bus');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this bus?')) return;

    try {
      await busesAPI.delete(id);
      toast.success('Bus deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to delete bus:', error);
      toast.error('Failed to delete bus');
    }
  };

  const filteredBuses = buses.filter(
    (bus) =>
      bus.busNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bus.route?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Buses</h1>
          <p className="text-gray-500 mt-1">Manage bus fleet and route assignments</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Bus
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search buses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Buses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBuses.map((bus) => (
          <div
            key={bus._id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                    <Bus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{bus.busNumber}</h3>
                    <p className="text-sm text-gray-500">{bus.licensePlate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Circle
                    className={`w-3 h-3 ${
                      bus.status === 'active' ? 'text-green-500 fill-green-500' : 'text-gray-300 fill-gray-300'
                    }`}
                  />
                  <span className="text-xs text-gray-500 capitalize">{bus.status || 'Active'}</span>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4 text-gray-400" />
                    Capacity
                  </div>
                  <span className="font-semibold text-gray-900">{bus.capacity} seats</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    Route
                  </div>
                  <span className="font-medium text-gray-900">{bus.routeName || bus.route || 'Unassigned'}</span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Assigned Driver</p>
                  <p className="font-medium text-gray-900">
                    {bus.driver?.name || 'Not assigned'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleOpenModal(bus)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(bus._id)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredBuses.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <Bus className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No buses found</h3>
          <p className="text-gray-500 mt-1">
            {searchQuery ? 'Try a different search term' : 'Add your first bus to get started'}
          </p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingBus ? 'Edit Bus' : 'Add New Bus'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bus Number *
                  </label>
                  <input
                    type="text"
                    name="busNumber"
                    value={formData.busNumber}
                    onChange={handleChange}
                    placeholder="BUS-101"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Plate *
                  </label>
                  <input
                    type="text"
                    name="licensePlate"
                    value={formData.licensePlate}
                    onChange={handleChange}
                    placeholder="ABC-1234"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity *
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    placeholder="40"
                    min="1"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Route Name *
                  </label>
                  <input
                    type="text"
                    name="route"
                    value={formData.route}
                    onChange={handleChange}
                    placeholder="North Route"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Driver
                </label>
                <select
                  name="driverId"
                  value={formData.driverId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select driver</option>
                  {drivers.map((driver) => (
                    <option key={driver._id} value={driver._id}>
                      {driver.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>{editingBus ? 'Update' : 'Create'} Bus</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
