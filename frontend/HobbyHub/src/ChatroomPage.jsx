import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useApp } from "./context/AppContext";

export default function ChatroomPage() {
  const { id } = useParams();
  const { chatrooms, sendChatMessage, user } = useApp();
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);

  const room = chatrooms.find((c) => c.id === id);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [room?.messages?.length]);

  if (!room) {
    return (
      <div className="chatroom-page">
        <p className="status-msg">Chatroom not found.</p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setText("");
    await sendChatMessage(room.id, text.trim(), user || "you");
  };

  return (
    <div className="chatroom-page">
      <div className="chatroom-header">
        <span className="chatroom-icon">{room.icon}</span>
        <h1>{room.title}</h1>
      </div>

      <div className="chat-messages">
        {room.messages.map((m) => (
          <div key={m.id} className="chat-message">
            <span className="comment-author">{m.author}</span>
            <p className="comment-text">{m.text}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Message..." aria-label="Chat message" />
        <button type="submit" className="btn-primary">Send</button>
      </form>
    </div>
  );
}