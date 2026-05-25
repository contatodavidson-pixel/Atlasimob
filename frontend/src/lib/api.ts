import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateMe: (data: object) => api.put('/auth/me', data),
};

// Properties
export const propertiesApi = {
  list: (params?: object) => api.get('/properties', { params }),
  get: (id: string) => api.get(`/properties/${id}`),
  analyze: (id: string) => api.post(`/properties/${id}/analyze`),
  scrape: (data: object) => api.post('/properties/scrape', data),
  saved: () => api.get('/properties/saved'),
  save: (id: string, notes?: string) => api.post(`/properties/${id}/save`, { notes }),
  unsave: (id: string) => api.delete(`/properties/${id}/save`),
  generateLOI: (id: string, data: object) => api.post(`/properties/${id}/loi`, data),
  loi: (id: string, data: object) => api.post(`/properties/${id}/loi`, data),
  priceHistory: (id: string) => api.get(`/properties/${id}/price-history`),
  stats: () => api.get('/properties/stats/summary'),
  dealOfDay: () => fetch(`${API_URL}/api/properties/deal-of-day`).then(r => { if (!r.ok) throw new Error('no deal'); return r.json().then(data => ({ data })); }),
};

// Chat
export const chatApi = {
  send: (message: string, sessionId?: string) =>
    api.post('/chat/message', { message, sessionId }),
  history: (sessionId: string) => api.get(`/chat/history/${sessionId}`),
  generateLoi: (data: object) => api.post('/chat/loi', data),
};

// Investors
export const investorsApi = {
  list: (params?: object) => api.get('/investors', { params }),
  get: (id: string) => api.get(`/investors/${id}`),
  create: (data: object) => api.post('/investors', data),
  update: (id: string, data: object) => api.put(`/investors/${id}`, data),
  autoReply: (id: string, data: object) => api.post(`/investors/${id}/auto-reply`, data),
  pipeline: () => api.get('/investors/pipeline/stats'),
};

// Analysis
export const analysisApi = {
  quick: (data: object) => api.post('/analysis/quick', data),
};

// Alerts
export const alertsApi = {
  list: () => api.get('/alerts'),
  create: (data: object) => api.post('/alerts', data),
  update: (id: string, data: object) => api.put(`/alerts/${id}`, data),
  delete: (id: string) => api.delete(`/alerts/${id}`),
};

// Reports
export const reportsApi = {
  list: () => api.get('/reports'),
  dashboard: () => api.get('/reports/dashboard'),
};

// Agencies
export const agenciesApi = {
  list: (params?: object) => api.get('/agencies', { params }),
  states: () => api.get('/agencies/states'),
  create: (data: object) => api.post('/agencies', data),
  update: (id: string, data: object) => api.put(`/agencies/${id}`, data),
  remove: (id: string) => api.delete(`/agencies/${id}`),
};

// Waitlist
export const waitlistApi = {
  join: (data: { email: string; name?: string; city?: string; source?: string }) =>
    fetch(`${API_URL}/api/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),
  count: () =>
    fetch(`${API_URL}/api/waitlist/count`).then(r => r.json()),
};

// SSE URL for real-time notifications
export const NOTIFICATIONS_SSE_URL = `${API_URL}/api/notifications/stream`;
