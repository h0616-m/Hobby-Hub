/**
 * Admin Dashboard Data Service
 * Directly connected to the backend database endpoints (/api/admin/...).
 */

export async function fetchHobbyAnalytics() {
  const res = await fetch("/api/admin/analytics/hobbies", {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Failed to fetch analytics (HTTP ${res.status})`,
    );
  }

  return await res.json();
}

export async function fetchUsers(searchQuery = "") {
  const query = (searchQuery || "").trim();
  const endpoint = query
    ? `/api/admin/users?query=${encodeURIComponent(query)}`
    : "/api/admin/users";

  const res = await fetch(endpoint, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Failed to fetch users (HTTP ${res.status})`,
    );
  }

  return await res.json();
}

/**
 * Ban or unban a user
 * @param {number|string} userId
 * @param {boolean} isCurrentlyBanned
 */
export async function toggleUserBan(userId, isCurrentlyBanned) {
  const endpoint = isCurrentlyBanned
    ? `/api/admin/users/${userId}/unban`
    : `/api/admin/users/${userId}/ban`;

  const res = await fetch(endpoint, {
    method: "POST",
    credentials: "include",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Failed to update user ban status");
  }

  return {
    success: true,
    isBanned: !isCurrentlyBanned,
    message: data.message,
  };
}
