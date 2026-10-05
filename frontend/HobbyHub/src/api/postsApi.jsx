import { MOCK_POSTS } from '../mockData';
import { HOBBIES } from '../hobbies';

async function parseJsonSafely(res) {
  const text = await res.text();
  if (!text || !text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function resolveHobby(p, fallback = 'Coding') {
  if (!p) return fallback;
  const raw = p.hobby || p.category || p.hobbyName || p.hobby_name || p.topic || p.subreddit;
  const val = typeof raw === 'string' ? raw.trim() : (raw && typeof raw === 'object' && raw.name ? String(raw.name).trim() : '');

  if (val && val.toLowerCase() !== 'general') {
    const match = HOBBIES.find((h) => h.id.toLowerCase() === val.toLowerCase());
    return match ? match.id : val;
  }
  return fallback;
}

export async function fetchPosts() {
  try {
    const res = await fetch('/api/posts', {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      return MOCK_POSTS;
    }

    const data = await parseJsonSafely(res);
    if (!Array.isArray(data)) {
      return MOCK_POSTS;
    }

    return data.map((p) => {
      const postHobby = resolveHobby(p, 'Coding');
      return {
        ...p,
        id: String(p.id ?? p.Post_id ?? Date.now()),
        title: p.title || p.Title || '',
        body: p.body || p.Context || '',
        hobby: postHobby,
        category: postHobby,
        subreddit: postHobby,
        author: p.author || p.Author || 'user',
        upvotes: typeof p.upvotes === 'number' ? p.upvotes : (typeof p.Likes === 'number' ? p.Likes : 1),
        userVote: p.userVote || null,
        comments: Array.isArray(p.comments) ? p.comments : [],
      };
    });
  } catch {
    return MOCK_POSTS;
  }
}

export async function createPost(hobby, title, body, author) {
  const cleanHobby = (hobby || '').trim() || 'Coding';
  const cleanTitle = (title || '').trim();
  const cleanBody = (body || '').trim();
  const authorName = (typeof author === 'object' ? author?.username : author) || 'you';

  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        hobby: cleanHobby,
        category: cleanHobby,
        title: cleanTitle,
        body: cleanBody,
        author: authorName,
      }),
    });

    const p = await parseJsonSafely(res);

    if (res.ok && p) {
      const assignedHobby = (p.hobby && p.hobby.toLowerCase() !== 'general')
        ? resolveHobby(p, cleanHobby)
        : cleanHobby;

      return {
        id: String(p.id ?? p.Post_id ?? Date.now()),
        hobby: assignedHobby,
        category: assignedHobby,
        subreddit: assignedHobby,
        title: p.title || cleanTitle,
        body: p.body || cleanBody,
        author: p.author || authorName,
        upvotes: typeof p.upvotes === 'number' ? p.upvotes : 1,
        userVote: p.userVote || 'up',
        comments: Array.isArray(p.comments) ? p.comments : [],
      };
    }
  } catch {
    // Network offline / backend unavailable
  }

  return {
    id: String(Date.now()),
    hobby: cleanHobby,
    category: cleanHobby,
    subreddit: cleanHobby,
    title: cleanTitle,
    body: cleanBody,
    author: authorName,
    upvotes: 1,
    userVote: 'up',
    comments: [],
  };
}

export async function votePost(postId, direction) {
  try {
    const res = await fetch(`/api/posts/${postId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ direction }),
    });

    if (!res.ok) return null;
    const p = await parseJsonSafely(res);
    if (!p) return null;

    const postHobby = resolveHobby(p, 'Coding');
    return {
      ...p,
      id: String(p.id ?? p.Post_id ?? postId),
      hobby: postHobby,
      category: postHobby,
      subreddit: postHobby,
      comments: Array.isArray(p.comments) ? p.comments : [],
    };
  } catch {
    return null;
  }
}

export async function addPostComment(postId, text, author) {
  const authorName = (typeof author === 'object' ? author?.username : author) || 'you';
  const cleanText = (text || '').trim();

  try {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        text: cleanText,
        author: authorName,
      }),
    });

    const comment = await parseJsonSafely(res);
    if (res.ok && comment) return comment;
  } catch {
    // Network offline / backend unavailable
  }

  return {
    id: `c_${Date.now()}`,
    author: authorName,
    text: cleanText,
  };
}

export async function deletePostApi(postId) {
  let res = await fetch(`/api/posts/${postId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!res.ok && res.status !== 403) {
    res = await fetch(`/api/admin/posts/${postId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
  }

  if (!res.ok) {
    const errorData = await parseJsonSafely(res);
    throw new Error(errorData?.message || 'Failed to delete post');
  }

  return true;
}