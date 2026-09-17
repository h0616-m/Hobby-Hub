import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { HOBBIES } from './hobbies';

export default function HobbiesSelect() {
  const [selected, setSelected] = useState([]);
  const { updateHobbies } = useApp();
  const navigate = useNavigate();

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]));
  };

  const handleContinue = () => {
    updateHobbies(selected);
    navigate('/feed', { replace: true });
  };

  return (
    <div className="hobbies-page">
      <h1>Pick your interests</h1>
      <p className="hobbies-subtitle">Choose topics to personalize your feed</p>
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
      <button type="button" className="btn-primary continue-btn" disabled={selected.length === 0} onClick={handleContinue}>
        {selected.length > 0 ? `Continue (${selected.length} selected)` : 'Continue'}
      </button>
    </div>
  );
}
