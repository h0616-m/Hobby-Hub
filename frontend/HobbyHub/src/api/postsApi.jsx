export async function fetchPosts() {
  const res = await fetch('/api/posts', {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('Failed to fetch posts');
  }
  const data = await res.json();
  return data.map((p) => ({
    ...p,
    hobby: p.hobby || 'Coding',
    subreddit: p.hobby || 'Coding',
    upvotes: p.upvotes ?? 1,
    userVote: p.userVote || null,
    comments: p.comments || [],
  }));
}

export async function createPost(hobby, title, body, author) {
  const res = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ title, body }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create post');
  }
  const p = await res.json();
  return {
    ...p,
    hobby: hobby || 'Coding',
    subreddit: hobby || 'Coding',
    upvotes: 1,
    userVote: 'up',
    comments: [],
  };
}

export async function votePost(postId, direction) {
  const res = await fetch(`/api/posts/${postId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ direction }),
  });
  if (!res.ok) return null;
  const p = await res.json();
  return {
    ...p,
    hobby: p.hobby || 'Coding',
    subreddit: p.hobby || 'Coding',
    comments: p.comments || [],
  };
}

export async function addPostComment(postId, text, author) {
  const res = await fetch(`/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to add comment');
  }
  return await res.json();
}
