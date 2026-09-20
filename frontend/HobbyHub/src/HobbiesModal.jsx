import { useState } from 'react';
import { HOBBIES } from './hobbies';

export default function HobbiesModal({ current, onClose, onSave }) {
  const [selected, setSelected] = useState(current);

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>Your Hobbies</h2>
        <div className="hobbies-grid">
          {HOBBIES.map((h) => {
            const isSelected = selected.includes(h.id);
            return (
              <button type="button" key={h.id} className={isSelected ? 'hobby-card selected' : 'hobby-card'} onClick={() => toggle(h.id)} aria-pressed={isSelected}>
                <span className="hobby-icon">{h.icon}</span>
                <span className="hobby-label">{h.label}</span>
              </button>
            );
          })}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" onClick={() => onSave(selected)}>Save</button>
        </div>
      </div>
    </div>
  );
}
