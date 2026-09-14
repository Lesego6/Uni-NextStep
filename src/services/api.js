const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

function apiFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {})
    }
  });
}

export async function registerUser(userData) {
  const response = await apiFetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Registration failed");
  return data;
}

export async function loginUser(email, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include"
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Login failed");
  return data;
}

export async function logoutUser() {
  const response = await apiFetch(`${API_URL}/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Logout failed");
  return data;
}

export async function saveAPS(subjectsPayload) {
  const response = await apiFetch(`${API_URL}/student/aps`, {
    method: "POST",
    body: JSON.stringify({ subjects: subjectsPayload })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to save APS score");
  return data;
}

export async function getMyProfile() {
  const response = await apiFetch(`${API_URL}/student/profile`, {
    method: "GET"
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to load profile");
  return data;
}

export async function submitApplications(applications) {
  const response = await apiFetch(`${API_URL}/applications`, {
    method: "POST",
    body: JSON.stringify({ applications })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to submit applications");
  return data;
}

export async function getMyApplications() {
  const response = await apiFetch(`${API_URL}/applications/my`, {
    method: "GET"
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to load applications");
  return data;
}

export async function getAllApplications(status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const response = await apiFetch(`${API_URL}/applications${query}`, {
    method: "GET"
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to load applications");
  return data;
}

export async function updateApplicationStatus(applicationId, status) {
  const response = await apiFetch(`${API_URL}/applications/${applicationId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to update application status");
  return data;
}

export async function getCourses() {
  const response = await apiFetch(`${API_URL}/courses`, { method: "GET" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to load courses");
  return data;
}

export async function getUniversities() {
  const response = await apiFetch(`${API_URL}/universities`, { method: "GET" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to load universities");
  return data;
}

export async function getAdminUsers({ search = "", role = "" } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (role && role !== "All") params.set("role", role);

  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await apiFetch(`${API_URL}/admin/users${query}`, {
    method: "GET"
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to load users");
  return data;
}

export async function createAdminUser(userData) {
  const response = await apiFetch(`${API_URL}/admin/users`, {
    method: "POST",
    body: JSON.stringify(userData)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to create user");
  return data;
}

export async function updateAdminUserStatus(userId, status) {
  const response = await apiFetch(`${API_URL}/admin/users/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to update user status");
  return data;
}

export async function deleteAdminUser(userId) {
  const response = await apiFetch(`${API_URL}/admin/users/${userId}`, {
    method: "DELETE"
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to delete user");
  return data;
}

export async function getAdminReport({ type, startDate, endDate }) {
  const params = new URLSearchParams({ type, start_date: startDate, end_date: endDate });
  const response = await apiFetch(`${API_URL}/admin/reports?${params.toString()}`, {
    method: "GET"
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to generate report");
  return data;
}