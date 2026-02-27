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
  refreshToken: () => api.post('/auth/refresh'),
};

// Students API
export const studentsAPI = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.patch(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  uploadPhoto: (id, photo) => {
    const formData = new FormData();
    formData.append('photo', photo);
    return api.post(`/students/${id}/face`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

// Drivers API  
export const driversAPI = {
  getAll: (params) => api.get('/users', { params: { ...params, role: 'driver' } }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/auth/register', { 
    ...data, 
    role: 'driver',
    confirmPassword: data.password // Backend requires confirmPassword
  }),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Buses API
export const busesAPI = {
  getAll: (params) => api.get('/buses', { params }),
  getById: (id) => api.get(`/buses/${id}`),
  create: (data) => api.post('/buses', data),
  update: (id, data) => api.put(`/buses/${id}`, data),
  delete: (id) => api.delete(`/buses/${id}`),
  getLocation: (id) => api.get(`/buses/${id}/location`),
  getAllLocations: () => api.get('/buses/locations'),
};

// Scan/Activity API
export const scanAPI = {
  getHistory: (params) => api.get('/scan/history', { params }),
  getStudentHistory: (studentId, params) => api.get(`/scan/history/${studentId}`, { params }),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentActivity: () => api.get('/dashboard/activity'),
};

export default api;
