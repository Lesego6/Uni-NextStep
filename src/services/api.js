const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const AUTH_TOKEN_KEY = "authToken";

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (response.status === 401) {
    localStorage.removeItem("apsScore");
    clearAuthToken();
  }

  if (!response.ok) {
    throw new Error((typeof data === "object" && data ? data.message : data) || "Request failed");
  }

  return data;
}

export async function registerUser(userData) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

export async function loginUser(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getCurrentUser() {
  return request("/auth/me", { method: "GET" });
}

export async function logoutUser() {
  try {
    return await request("/auth/logout", { method: "POST" });
  } finally {
    clearAuthToken();
  }
}

export async function saveAPS(subjectsPayload) {
  return request("/student/aps", {
    method: "POST",
    body: JSON.stringify({ subjects: subjectsPayload })
  });
}

export async function getMyProfile() {
  return request("/student/profile", { method: "GET" });
}

export async function submitApplications(applications) {
  return request("/applications", {
    method: "POST",
    body: JSON.stringify({ applications })
  });
}

export async function getApplicationProfileData() {
  return request("/applications/profile-data", { method: "GET" });
}

export async function saveApplicationProfileData(payload) {
  return request("/applications/profile-data", {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function getMyApplications() {
  return request("/applications/my", { method: "GET" });
}

export async function getAllApplications(status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return request(`/applications${query}`, { method: "GET" });
}

export async function getApplicationDetails(applicationId) {
  return request(`/applications/${applicationId}/details`, { method: "GET" });
}

export async function updateApplicationStatus(applicationId, status, details = {}) {
  return request(`/applications/${applicationId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, ...details })
  });
}

export async function getCourses() {
  return request("/courses", { method: "GET" });
}

export async function getUniversities() {
  return request("/universities", { method: "GET" });
}

export async function getAdminUsers({ search = "", role = "" } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (role && role !== "All") params.set("role", role);

  const query = params.toString() ? `?${params.toString()}` : "";
  return request(`/admin/users${query}`, { method: "GET" });
}

export async function createAdminUser(userData) {
  return request("/admin/users", {
    method: "POST",
    body: JSON.stringify(userData)
  });
}

export async function updateAdminUserStatus(userId, status) {
  return request(`/admin/users/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}

export async function deleteAdminUser(userId) {
  return request(`/admin/users/${userId}`, { method: "DELETE" });
}

export async function getAdminReport({ type, startDate, endDate }) {
  const params = new URLSearchParams({ type, start_date: startDate, end_date: endDate });
  return request(`/admin/reports?${params.toString()}`, { method: "GET" });
}
