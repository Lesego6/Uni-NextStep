const API_URL = "http://localhost:5000/api";

function getAuthHeaders() {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function registerUser(userData) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Registration failed");
  }

  return data;
}

export async function loginUser(email, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
}
export async function saveAPS(apsScore) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/student/aps`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      aps_score: apsScore,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to save APS score");
  }

  return data;
}
export async function getMyProfile() {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/student/profile`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load profile");
  }

  return data;
}

export async function submitApplications(applications) {
  const response = await fetch(`${API_URL}/applications`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ applications }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to submit applications");
  }

  return data;
}

export async function getMyApplications() {
  const response = await fetch(`${API_URL}/applications/my`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load applications");
  }

  return data;
}

export async function getAllApplications(status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";

  const response = await fetch(`${API_URL}/applications${query}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load applications");
  }

  return data;
}

export async function updateApplicationStatus(applicationId, status) {
  const response = await fetch(`${API_URL}/applications/${applicationId}/status`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update application status");
  }

  return data;
}

export async function getAdminUsers({ search = "", role = "" } = {}) {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (role && role !== "All") {
    params.set("role", role);
  }

  const query = params.toString() ? `?${params.toString()}` : "";

  const response = await fetch(`${API_URL}/admin/users${query}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load users");
  }

  return data;
}

export async function createAdminUser(userData) {
  const response = await fetch(`${API_URL}/admin/users`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create user");
  }

  return data;
}

export async function updateAdminUserStatus(userId, status) {
  const response = await fetch(`${API_URL}/admin/users/${userId}/status`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update user status");
  }

  return data;
}

export async function deleteAdminUser(userId) {
  const response = await fetch(`${API_URL}/admin/users/${userId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete user");
  }

  return data;
}

export async function getAdminReport({ type, startDate, endDate }) {
  const params = new URLSearchParams({
    type,
    start_date: startDate,
    end_date: endDate,
  });

  const response = await fetch(`${API_URL}/admin/reports?${params.toString()}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to generate report");
  }

  return data;
}
