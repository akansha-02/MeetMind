import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
};

// Meetings API
export const meetingsAPI = {
  getAll: (params) => api.get("/meetings", { params }),
  getById: (id) => api.get(`/meetings/${id}`),
  create: (data) => api.post("/meetings", data),
  update: (id, data) => api.put(`/meetings/${id}`, data),
  delete: (id) => api.delete(`/meetings/${id}`),
  complete: (id) => api.post(`/meetings/${id}/complete`),
  process: (id) => api.post(`/meetings/${id}/process`),
  generateSummary: (id, data) => api.post(`/meetings/${id}/summary`, data),
};

// Transcripts API
export const transcriptsAPI = {
  upload: (formData) =>
    api.post("/transcripts/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getByMeeting: (meetingId) => api.get(`/transcripts/${meetingId}`),
};

// Action Items API
export const actionItemsAPI = {
  getAll: (params) => api.get("/action-items", { params }),
  getById: (id) => api.get(`/action-items/${id}`),
  create: (data) => api.post("/action-items", data),
  update: (id, data) => api.put(`/action-items/${id}`, data),
  delete: (id) => api.delete(`/action-items/${id}`),
};

// Knowledge Base API
export const knowledgeBaseAPI = {
  search: (query, limit = 10, filters = {}) =>
    api.post("/knowledge-base/search", { query, limit, filters }),
};

// Summarize API (standalone file summarization)
export const summarizeAPI = {
  upload: (formData) =>
    api.post("/summarize/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getAll: () => api.get("/summarize"),
  getById: (id) => api.get(`/summarize/${id}`),
  delete: (id) => api.delete(`/summarize/${id}`),
};

export default api;
