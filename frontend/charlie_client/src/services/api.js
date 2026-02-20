import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  timeout: 30000
});

/* ---------- REQUEST INTERCEPTOR ---------- */
api.interceptors.request.use(config => {

  // If body is FormData → remove JSON header
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});

/* ---------- RESPONSE INTERCEPTOR ---------- */
api.interceptors.response.use(
  response => response,
  error => {
    console.error(
      "API Error:",
      error.response?.data || error.message
    );
    return Promise.reject(error);
  }
);

export default api;
