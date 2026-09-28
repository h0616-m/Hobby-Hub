import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "./context/AppContext";

export default function Navbar() {
  const { user, logout } = useApp();
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setShowMenu(false);
    logout();
    navigate("/auth", { replace: true });
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        {user && (
          <Link to="/feed" className="nav-icon-btn" aria-label="Home">
            🏠
          </Link>
        )}
        <span className="brand">App</span>
      </div>

      {user && (
        <div className="navbar-right">
          <button
            type="button"
            className="nav-icon-btn profile-btn"
            onClick={() => setShowMenu((s) => !s)}
            aria-label="Profile menu"
          >
            👤
          </button>
          {showMenu && (
            <div className="profile-dropdown">
              <p className="profile-username">{user}</p>
              <button type="button" className="btn-secondary logout-btn" onClick={handleLogout}>
                Log Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}