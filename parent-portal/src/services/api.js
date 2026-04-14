import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
};

// Parent API
export const parentAPI = {
  getChildren: () => api.get('/parent/children'),
  getChild: (id) => api.get(`/parent/children/${id}`),
  getChildHistory: (id, params) => api.get(`/parent/children/${id}/history`, { params }),
  getChildBusLocation: (id) => api.get(`/parent/children/${id}/bus-location`),
  getNotifications: () => api.get('/parent/notifications'),
  markNotificationRead: (id) => api.put(`/parent/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/parent/notifications/read-all'),
  getNotificationSettings: () => api.get('/parent/notification-settings'),
  updateNotificationSettings: (data) => api.put('/parent/notification-settings', data),
};

// Scan API
export const scanAPI = {
  getHistory: (params) => api.get('/scan/history', { params }),
  getStudentHistory: (studentId, params) => api.get(`/scan/history/${studentId}`, { params }),
};

export default api;
