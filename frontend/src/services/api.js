import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000'
});

// Injeta token JWT em todas as requisições
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Webhooks
export const webhooksApi = {
  list: () => api.get('/api/webhooks'),
  get: (id) => api.get(`/api/webhooks/${id}`),
  create: (data) => api.post('/api/webhooks', data),
  update: (id, data) => api.put(`/api/webhooks/${id}`, data),
  delete: (id) => api.delete(`/api/webhooks/${id}`),
  logs: (id, params) => api.get(`/api/webhooks/${id}/logs`, { params })
};

// Billing
export const billingApi = {
  plans: () => api.get('/api/billing/plans'),
  subscription: () => api.get('/api/billing/subscription'),
  checkout: (plan) => api.post('/api/billing/checkout', { plan }),
  portal: () => api.post('/api/billing/portal')
};

// Profile
export const profileApi = {
  get: () => api.get('/api/profile'),
  update: (data) => api.put('/api/profile', data),
  delete: () => api.delete('/api/profile')
};

export default api;
