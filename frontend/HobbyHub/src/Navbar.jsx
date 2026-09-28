import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "./context/AppContext";
import userIcon from "./assets/user.png";

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
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 10.5 12 3l9 7.5" />
              <path d="M5 9.5V21h5v-6h4v6h5V9.5" />
            </svg>
          </Link>
        )}
        <span className="brand">App</span>
      </div>

      {user && (
        <div className="navbar-right">
          <button
            type="button"
            className="profile-btn"
            onClick={() => setShowMenu((s) => !s)}
            aria-label="Profile menu"
          >
            <img src={userIcon} alt="Profile" className="profile-img" />
          </button>
          {showMenu && (
            <div className="profile-dropdown">
              <div className="profile-info">
                <img src={userIcon} alt="" className="profile-img small" />
                <span className="profile-username">{user}</span>
              </div>
              <button type="button" className="btn-secondary logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}