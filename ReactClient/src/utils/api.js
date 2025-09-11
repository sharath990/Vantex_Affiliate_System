import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  verifyToken: () => api.get('/auth/verify'),
};

export const affiliateAPI = {
  register: (data) => api.post('/affiliates/register', data),
  addDownline: (data) => api.post('/affiliates/downlines', data),
  getDownlines: (affiliateCode) => api.get(`/affiliates/${affiliateCode}/downlines`),
};

export const adminAPI = {
  getPendingAffiliates: () => api.get('/admin/affiliates/pending'),
  getAllAffiliates: (params) => api.get('/admin/affiliates', { params }),
  approveAffiliate: (id) => api.put(`/admin/affiliates/${id}/approve`),
  rejectAffiliate: (id) => api.put(`/admin/affiliates/${id}/reject`),
  updateAffiliateStatus: (id, status) => api.put(`/admin/affiliates/${id}/status`, { status }),
  getAllDownlines: (params) => api.get('/admin/downlines', { params }),
  addDownlineManually: (data) => api.post('/admin/downlines', data),
};

export default api;