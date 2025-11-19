// frontend/src/services/api.ts
import axios from "axios";
import { getTokenFromStorage } from "./token";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const api = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 20000
});

// Attach any existing token synchronously at module import time
const stored = getTokenFromStorage();
if (stored) {
  api.defaults.headers.common["Authorization"] = `Bearer ${stored}`;
}

// Response interceptor: log 401s but don't auto-clear token here (AuthContext controls logout)
api.interceptors.response.use(
  r => r,
  err => {
    const status = err?.response?.status;
    if (status === 401) {
      // DO NOT remove token here — we will let AuthContext handle logout to avoid races.
      console.warn("API returned 401 Unauthorized", err?.response?.config?.url);
    }
    return Promise.reject(err);
  }
);

export default api;
