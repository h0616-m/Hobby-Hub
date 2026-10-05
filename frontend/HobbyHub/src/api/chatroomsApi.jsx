import { MOCK_CHATROOMS } from '../mockData';

let fallbackChatrooms = MOCK_CHATROOMS.map((c) => ({ ...c, messages: [...c.messages] }));

export async function fetchChatrooms() {
  try {
    const res = await fetch('/api/chatrooms', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    // fallback to mock data if backend not reachable
  }
  return fallbackChatrooms;
}

export async function fetchChatroomMessages(chatroomId) {
  try {
    const res = await fetch(`/api/chatrooms/${encodeURIComponent(chatroomId)}/messages`, { credentials: 'include' });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // fallback
  }
  const room = fallbackChatrooms.find((c) => c.id.toLowerCase() === chatroomId.toLowerCase());
  return room ? room.messages : [];
}

export async function sendChatroomMessage(chatroomId, text, author) {
  try {
    const res = await fetch(`/api/chatrooms/${encodeURIComponent(chatroomId)}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ text, author }),
    });
    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json().catch(() => ({}));
    if (errData?.message) {
      throw new Error(errData.message);
    }
  } catch (err) {
    if (err.message && err.message.toLowerCase().includes('banned')) {
      throw err;
    }
    // Network error fallback
  }

  const message = { id: `m${Date.now()}`, author, text, createdAt: new Date().toISOString() };
  fallbackChatrooms = fallbackChatrooms.map((c) =>
    c.id.toLowerCase() !== chatroomId.toLowerCase()
      ? c
      : { ...c, messages: [...c.messages, message] }
  );
  return message;
}

/**
 * Connect to live real-time Server-Sent Events (SSE) stream for a chatroom.
 * Zero external quotas or limits - powered directly by the backend server.
 */
export function subscribeChatroomMessages(chatroomId, onMessage, onStatusChange) {
  let eventSource = null;
  let active = true;

  try {
    const url = `/api/chatrooms/${encodeURIComponent(chatroomId)}/stream`;
    eventSource = new EventSource(url, { credentials: 'include' });

    eventSource.onopen = () => {
      if (active && onStatusChange) onStatusChange(true);
    };

    eventSource.addEventListener('message', (e) => {
      if (!active) return;
      try {
        const msg = JSON.parse(e.data);
        onMessage(msg);
      } catch (err) {
        console.warn('Failed to parse SSE message:', err);
      }
    });

    eventSource.onerror = () => {
      if (active && onStatusChange) onStatusChange(false);
      // Native EventSource automatically attempts reconnection
    };
  } catch (err) {
    console.warn('SSE initialization failed:', err);
    if (onStatusChange) onStatusChange(false);
  }

  return () => {
    active = false;
    if (eventSource) {
      eventSource.close();
    }
  };
}
