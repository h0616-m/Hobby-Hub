import { MOCK_POSTS } from '../mockData';

async function parseJsonSafely(res) {
  const text = await res.text();
  if (!text || !text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
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
      const postHobby = p.hobby || p.category || 'General';
      return {
        ...p,
        hobby: postHobby,
        subreddit: postHobby,
        upvotes: typeof p.upvotes === 'number' ? p.upvotes : 1,
        userVote: p.userVote || null,
        comments: Array.isArray(p.comments) ? p.comments : [],
      };
    });
  } catch {
    return MOCK_POSTS;
  }
}

export async function createPost(hobby, title, body, author) {
  const cleanHobby = (hobby || '').trim() || 'General';
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
      const assignedHobby = p.hobby || p.category || cleanHobby;
      return {
        id: String(p.id || Date.now()),
        hobby: assignedHobby,
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

    const postHobby = p.hobby || p.category || 'General';
    return {
      ...p,
      hobby: postHobby,
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