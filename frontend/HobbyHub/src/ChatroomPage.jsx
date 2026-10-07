import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { fetchChatroomMessages, sendChatroomMessage, subscribeChatroomMessages } from './api/chatroomsApi';

const DEFAULT_METAS = {
  Coding: { icon: '💻', title: 'Coding', subtitle: 'Talk code with devs' },
  Chess: { icon: '♟️', title: 'Chess', subtitle: 'Discuss openings and games' },
  Drawing: { icon: '🎨', title: 'Drawing', subtitle: 'Share your art' },
  Gaming: { icon: '🎮', title: 'Gaming', subtitle: 'Squad up and play' },
  Music: { icon: '🎵', title: 'Music', subtitle: 'Talk tracks and gear' },
  Fitness: { icon: '🏋️', title: 'Fitness', subtitle: 'Share your progress' },
};

export default function ChatroomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { chatrooms, user, isBanned, loadChatrooms, chatroomsLoaded, hobbies } = useApp();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const messagesEndRef = useRef(null);

  const contextRoom = chatrooms.find((c) => c.id?.toLowerCase() === (id || '').toLowerCase());
  const meta = DEFAULT_METAS[id] || (contextRoom ? { icon: contextRoom.icon, title: contextRoom.title, subtitle: contextRoom.subtitle } : { icon: '💬', title: id, subtitle: '' });

  useEffect(() => {
    if (!chatroomsLoaded) {
      loadChatrooms().catch(() => {});
    }
  }, [chatroomsLoaded, loadChatrooms]);

  useEffect(() => {
    let cancelled = false;
    if (contextRoom?.messages?.length) {
      setMessages(contextRoom.messages);
    }
    fetchChatroomMessages(id).then((data) => {
      if (!cancelled && Array.isArray(data) && data.length > 0) {
        setMessages(data);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [id, contextRoom]);

  // Connect to Live Server (SSE stream) for instant updates without refreshing
  useEffect(() => {
    if (!id) return;
    const unsubscribe = subscribeChatroomMessages(
      id,
      (newMsg) => {
        setMessages((prev) => {
          if (prev.some((m) => String(m.id) === String(newMsg.id))) {
            return prev;
          }
          return [...prev, newMsg];
        });
      },
      (liveStatus) => {
        setIsLive(liveStatus);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;

    if (isBanned) {
      setErrorMsg('Your account is banned and cannot send messages.');
      return;
    }

    const outgoingText = text.trim();
    setText('');
    setErrorMsg('');
    setSending(true);

    const authorName = (typeof user === 'object' ? user?.username : user) || 'Anonymous';

    try {
      const saved = await sendChatroomMessage(id, outgoingText, authorName);
      if (saved) {
        setMessages((prev) => {
          if (prev.some((m) => String(m.id) === String(saved.id))) return prev;
          return [...prev, saved];
        });
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chatroom-page">
      <div className="chatroom-header">
        <button type="button" className="back-btn" onClick={() => navigate('/feed')}>← Back to Feed</button>
        <span className="chatroom-icon">{meta.icon}</span>
        <h1>{meta.title}</h1>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '12px',
            padding: '4px 10px',
            borderRadius: '12px',
            backgroundColor: isLive ? 'rgba(70, 209, 96, 0.15)' : 'rgba(255, 180, 0, 0.15)',
            color: isLive ? '#46d160' : '#ffb400',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '500',
          }}
          title={isLive ? 'Real-time live server connected' : 'Connecting to live server...'}
        >
          <span style={{ fontSize: '9px' }}>{isLive ? '🟢' : '🟡'}</span>
          {isLive ? 'Live' : 'Connecting...'}
        </span>
      </div>

      {hobbies && hobbies.length > 1 && (
        <div className="mobile-chatroom-tabs">
          {hobbies.map((h) => {
            const isCurrent = h.toLowerCase() === (id || '').toLowerCase();
            return (
              <button
                key={h}
                type="button"
                onClick={() => navigate(`/chatroom/${h}`)}
                className={`mobile-chat-tab ${isCurrent ? 'active' : ''}`}
              >
                <span>{DEFAULT_METAS[h]?.icon || '💬'}</span>
                <span>{h}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="chat-messages">
        {messages.length === 0 ? (
          <p style={{ color: '#818384', textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
            No messages yet in this room. Be the first to start the conversation!
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id || `m-${Math.random()}`} className="chat-message">
              <span className="comment-author">{m.author}</span>
              <p className="comment-text">{m.text}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {errorMsg && (
        <p style={{ color: '#ff4444', fontSize: '13px', margin: '4px 0 8px 0' }}>
          {errorMsg}
        </p>
      )}

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isBanned ? 'You are banned from sending messages' : 'Message...'}
          aria-label="Chat message"
          disabled={isBanned || sending}
        />
        <button type="submit" className="btn-primary" disabled={isBanned || sending || !text.trim()}>
          {sending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </div>
  );
}
