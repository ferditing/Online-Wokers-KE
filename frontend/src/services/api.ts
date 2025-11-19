// frontend/src/services/api.ts
import axios from "axios";
import { getTokenFromStorage } from "./token";

// Ensure VITE_API_URL exists
const BASE_URL = import.meta.env.VITE_API_URL;
if (!BASE_URL) {
  throw new Error("VITE_API_URL environment variable is not defined");
}

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL.endsWith("/") ? `${BASE_URL}api` : `${BASE_URL}/api`, // add /api if your backend uses it
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

// Attach token if it exists
const stored = getTokenFromStorage();
if (stored) {
  api.defaults.headers.common["Authorization"] = `Bearer ${stored}`;
}

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      console.warn("API returned 401 Unauthorized", error?.response?.config?.url);
      // Optionally, handle global logout in AuthContext
    }
    return Promise.reject(error);
  }
);

export default api;
