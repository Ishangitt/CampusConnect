import axios from "axios";

let rawBaseUrl = (import.meta.env.VITE_API_URL || "/api").trim().replace(/\/+$/, "");
if (rawBaseUrl.startsWith("http") && !rawBaseUrl.endsWith("/api")) {
  rawBaseUrl += "/api";
}

const api = axios.create({
  baseURL: rawBaseUrl,
});

let tokenGetter = async () => null;

export function setupApi(getToken) {
  tokenGetter = getToken;
}

api.interceptors.request.use(async (config) => {
  const token = await tokenGetter();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
