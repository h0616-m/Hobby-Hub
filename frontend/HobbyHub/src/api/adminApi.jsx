async function readError(res, fallback) {
  const text = await res.text();
  if (!text || !text.trim()) return fallback;
  try {
    return JSON.parse(text).message || fallback;
  } catch {
    return text;
  }
}

export async function deletePostRequest(postId) {
  const res = await fetch(`/api/admin/posts/${postId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) throw new Error(await readError(res, "Failed to delete post"));
  return true;
}

export async function banUserRequest(userId) {
  const res = await fetch(`/api/admin/users/${userId}/ban`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) throw new Error(await readError(res, "Failed to ban user"));
  return true;
}