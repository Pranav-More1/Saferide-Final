import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.247.122.203:3000/api/v1'; // Your computer's IP for physical device

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('driver_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
};

// Route/Bus API
export const routeAPI = {
  getCurrentRoute: () => api.get('/driver/route'),
  getStudentsList: () => api.get('/driver/students'),
  startRoute: () => api.post('/driver/route/start'),
  endRoute: () => api.post('/driver/route/end'),
};

// Scan API - Four-Step Commute Logic
export const scanAPI = {
  /**
   * Scan a face and identify student with Four-Step validation.
   * @param {Object} data - { imageBase64, scanType, busId?, location? }
   * @param {string} data.scanType - One of: morning_pickup, morning_dropoff, evening_pickup, evening_dropoff
   */
  scanFace: (data) => api.post('/scan/face', data),
  
  /**
   * Manual attendance update (when face scan fails).
   * @param {Object} data - { studentId, scanType, reason?, skipValidation? }
   */
  manualAttendance: (data) => api.post('/scan/manual', data),
  
  /**
   * Get attendance status for a specific student.
   * @param {string} studentId
   * @param {string} date - Optional date in YYYY-MM-DD format
   */
  getStudentAttendance: (studentId, date) => 
    api.get(`/scan/attendance/${studentId}${date ? `?date=${date}` : ''}`),
  
  /**
   * Get attendance summary for all students on a bus.
   * @param {string} busId
   */
  getBusAttendance: (busId) => api.get(`/scan/bus/${busId}/attendance`),
  
  // Legacy methods (for backwards compatibility)
  uploadPhoto: async (photoUri) => {
    const formData = new FormData();
    formData.append('photo', {
      uri: photoUri,
      type: 'image/jpeg',
      name: 'scan.jpg',
    });
    return api.post('/scan/identify', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  recordPickup: (studentId) => api.post('/scan/manual', { 
    studentId, 
    scanType: 'morning_pickup' 
  }),
  recordDropoff: (studentId) => api.post('/scan/manual', { 
    studentId, 
    scanType: 'morning_dropoff' 
  }),
};

// Location API
export const locationAPI = {
  updateLocation: (location) => api.post('/driver/location', location),
};

export default api;
