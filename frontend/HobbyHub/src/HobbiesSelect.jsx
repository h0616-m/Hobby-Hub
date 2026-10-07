import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { HOBBIES } from './hobbies';

export default function HobbiesSelect() {
  const { user, hobbies, updateHobbies, updateUsername } = useApp();
  const [selected, setSelected] = useState(Array.isArray(hobbies) ? hobbies : []);
  const navigate = useNavigate();

  const currentUsername = typeof user === 'object' ? user?.username : (user || '');
  const [usernameInput, setUsernameInput] = useState(currentUsername);
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentUsername && !usernameInput) {
      setUsernameInput(currentUsername);
    }
  }, [currentUsername]);

  useEffect(() => {
    const errorMsg = sessionStorage.getItem('google_username_taken_error');
    if (errorMsg) {
      setUsernameError(errorMsg);
      sessionStorage.removeItem('google_username_taken_error');
    }
  }, []);

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]));
  };

  const handleUpdateUsername = async () => {
    const clean = usernameInput.trim();
    if (!clean) {
      setUsernameError('Username cannot be empty.');
      return false;
    }
    if (clean.toLowerCase() === (currentUsername || '').toLowerCase()) {
      return true;
    }
    setUsernameError('');
    setUsernameSuccess('');
    const res = await updateUsername(clean);
    if (res.success) {
      setUsernameSuccess('Username updated successfully!');
      return true;
    } else {
      setUsernameError(res.message || 'Username is already taken.');
      return false;
    }
  };

  const handleContinue = async () => {
    setSubmitting(true);
    const clean = usernameInput.trim();
    if (clean && clean.toLowerCase() !== (currentUsername || '').toLowerCase()) {
      const ok = await handleUpdateUsername();
      if (!ok) {
        setSubmitting(false);
        return;
      }
    }

    sessionStorage.removeItem('just_google_signed_up');
    sessionStorage.removeItem('google_username_taken_error');
    await updateHobbies(selected);
    navigate('/feed', { replace: true });
  };

  return (
    <div className="hobbies-page">
      <h1>Pick your interests</h1>
      <p className="hobbies-subtitle">Choose your hobbies</p>

      {/* Username selection / customization card */}
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          margin: '0 auto 24px auto',
          backgroundColor: '#161b22',
          border: '1px solid #30363d',
          borderRadius: '8px',
          padding: '16px 20px',
          textAlign: 'left',
          boxSizing: 'border-box',
        }}
      >
        <label
          htmlFor="username-select-input"
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 600,
            color: '#8b949e',
            marginBottom: '8px',
          }}
        >
          Your Username:
        </label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            id="username-select-input"
            type="text"
            value={usernameInput}
            onChange={(e) => {
              setUsernameInput(e.target.value);
              setUsernameError('');
              setUsernameSuccess('');
            }}
            placeholder="Choose your username"
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '6px',
              backgroundColor: '#0d1117',
              border: usernameError ? '1px solid #f85149' : '1px solid #30363d',
              color: '#ffffff',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {usernameInput.trim() !== currentUsername && (
            <button
              type="button"
              onClick={handleUpdateUsername}
              style={{
                padding: '9px 14px',
                borderRadius: '6px',
                backgroundColor: '#ff4500',
                border: 'none',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Save
            </button>
          )}
        </div>
        {usernameError && (
          <p style={{ color: '#f85149', fontSize: '12px', margin: '8px 0 0 0', fontWeight: 500 }}>
            ⚠️ {usernameError}
          </p>
        )}
        {usernameSuccess && (
          <p style={{ color: '#3fb950', fontSize: '12px', margin: '8px 0 0 0', fontWeight: 500 }}>
            ✓ {usernameSuccess}
          </p>
        )}
      </div>

      <div className="hobbies-grid">
        {HOBBIES.map((h) => {
          const isSelected = selected.includes(h.id);
          return (
            <button
              type="button"
              key={h.id}
              className={isSelected ? 'hobby-card selected' : 'hobby-card'}
              onClick={() => toggle(h.id)}
              aria-pressed={isSelected}
            >
              <span className="hobby-icon">{h.icon}</span>
              <span className="hobby-label">{h.label}</span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="btn-primary continue-btn"
        disabled={selected.length === 0 || submitting}
        onClick={handleContinue}
      >
        {submitting
          ? 'Saving…'
          : selected.length > 0
          ? `Continue (${selected.length} selected)`
          : 'Continue'}
      </button>
    </div>
  );
}
