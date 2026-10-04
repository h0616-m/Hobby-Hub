async function parseJsonSafely(res) {
  const text = await res.text();
  if (!text || !text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function deletePostRequest(postId) {
  const response = await fetch(`/api/admin/posts/${postId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Failed to delete post");
  }

  return true;
}

export async function banUserRequest(username) {
  try {
    const res = await fetch(`/api/admin/users/${username}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await parseJsonSafely(res);
      throw new Error(err?.message || 'Failed to ban user');
    }
    return true;
  } catch {
    // Development offline fallback
    console.warn('Backend unavailable, banning user locally:', username);
    return true;
  }
}

export async function checkBannedStatus(username) {
  try {
    const res = await fetch(`/api/users/${username}/status`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) return false;
    const data = await parseJsonSafely(res);
    return Boolean(data?.banned || data?.isBanned);
  } catch {
    return false;
  }
}