import axios from "axios";

const resolveBaseUrl = () => {
  const fromEnv =
    import.meta.env?.VITE_API_BASE_URL?.trim() ||
    import.meta.env?.APP_BASE_URL?.trim() ||
    "http://localhost:8080";
  return fromEnv.replace(/\/+$/, "");
};

const rbacApi = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 15000,
});

rbacApi.interceptors.request.use((config) => {
  const token =
    (localStorage.getItem("token") || "").trim() ||
    (sessionStorage.getItem("token") || "").trim();
  if (token) {
    config.headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }
  return config;
});

export default rbacApi;
