import { useState } from 'react';
import { HOBBIES } from './hobbies';

export default function CreatePostModal({ onClose, onCreate }) {
  const [hobby, setHobby] = useState(HOBBIES[0].id);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    onCreate(hobby, title.trim(), body.trim());
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>Create Post</h2>
        <form className="create-post-form" onSubmit={handleSubmit}>
          <label htmlFor="hobby-select">Community</label>
          <select id="hobby-select" value={hobby} onChange={(e) => setHobby(e.target.value)}>
            {HOBBIES.map((h) => (
              <option key={h.id} value={h.id}>{h.label}</option>
            ))}
          </select>
          <label htmlFor="post-title">Title</label>
          <input id="post-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <label htmlFor="post-body">Content</label>
          <textarea id="post-body" value={body} onChange={(e) => setBody(e.target.value)} rows={5} required />
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Post</button>
          </div>
        </form>
      </div>
    </div>
  );
}
