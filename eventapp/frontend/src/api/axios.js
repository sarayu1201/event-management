import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
});

// Attach token to every request if present
api.interceptors.request.use((config) => {
  // Normalize double /api/ prefixing if the route starts with "/api/"
  if (config.url && config.url.startsWith("/api/")) {
    config.url = config.url.substring(4); // Remove "/api" prefix (e.g. "/api/business" becomes "/business")
  }

  const token = localStorage.getItem("eventhub_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 handling — bounce to home if token expired/invalid
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem("eventhub_token");
      localStorage.removeItem("eventhub_user");
    }
    return Promise.reject(err);
  }
);

export default api;
