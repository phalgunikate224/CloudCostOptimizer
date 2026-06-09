import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const costsApi = {
  getSummary: () => apiClient.get('/api/costs/summary'),
  getBreakdown: (days = 30, cloud = null) =>
    apiClient.get('/api/costs/breakdown', { params: { days, cloud } }),
  getMulticloud: (months = 6) =>
    apiClient.get('/api/costs/multicloud', { params: { months } }),
  getDailyTrend: (days = 30) =>
    apiClient.get('/api/costs/daily-trend', { params: { days } }),
  getServiceBreakdown: (days = 30) =>
    apiClient.get('/api/costs/service-breakdown', { params: { days } }),
};

export const predictionsApi = {
  getForecast: (cloud = null) =>
    apiClient.get('/api/predictions/forecast', { params: { cloud } }),
};

export const anomaliesApi = {
  detect: (cloud = null) =>
    apiClient.get('/api/anomalies/detect', { params: { cloud } }),
};

export const recommendationsApi = {
  list: () => apiClient.get('/api/recommendations/list'),
  apply: (recommendationId) =>
    apiClient.post('/api/recommendations/apply', { recommendation_id: recommendationId }),
};

export const policiesApi = {
  list: () => apiClient.get('/api/policies/list'),
  create: (policy) => apiClient.post('/api/policies/create', policy),
  toggle: (policyId, isActive) =>
    apiClient.patch(`/api/policies/${policyId}/toggle`, { is_active: isActive }),
  delete: (policyId) => apiClient.delete(`/api/policies/${policyId}`),
};

export const simulationApi = {
  run: (data) => apiClient.post('/api/simulation/run', data),
  getResourceTypes: () => apiClient.get('/api/simulation/resource-types'),
};

export default apiClient;
