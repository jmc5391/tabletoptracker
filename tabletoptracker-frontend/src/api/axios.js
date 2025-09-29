import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true,
});

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

API.interceptors.request.use((config) => {
  // send CSRF token for protected requests
  if (["post", "put", "delete", "patch"].includes(config.method)) {
    const csrf = getCookie("csrf_access_token");
    if (csrf) config.headers["X-CSRF-TOKEN"] = csrf;
  }
  return config;
});

export default API;
