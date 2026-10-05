import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "./context/AppContext";
import userIcon from "./assets/images.png";

export default function Navbar() {
  const { user, logout, isAdmin } = useApp();
  const [showMenu, setShowMenu] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const username = typeof user === "object" ? user?.username : user;
  const email = typeof user === "object" ? user?.email || "" : "";

  const handleLogout = async () => {
    setShowMenu(false);
    await logout();
    navigate("/auth", { replace: true });
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  return (
    <header
      style={{
        height: "60px",
        backgroundColor: "#0e1117",
        borderBottom: "1px solid #1f2328",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        boxSizing: "border-box",
      }}
    >
      {/* Left: Brand */}
      <div>
        <Link
          to={user ? "/feed" : "/auth"}
          style={{ textDecoration: "none" }}
        >
          <span
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "#ff4500",
              letterSpacing: "-0.5px",
            }}
          >
            HobbyHub
          </span>
        </Link>
      </div>

      {/* Right: Home & Profile */}
      {user && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            position: "relative",
          }}
        >
          {/* Admin Panel Button */}
          {isAdmin && (
            <Link
              to="/admin"
              aria-label="Admin Dashboard"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                textDecoration: "none",
                backgroundColor: "rgba(255, 69, 0, 0.15)",
                color: "#ff4500",
                border: "1px solid rgba(255, 69, 0, 0.4)",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 700,
                transition: "all 0.2s ease",
              }}
            >
              <span>🛡️</span>
              <span>Admin Panel</span>
            </Link>
          )}

          {/* Home Icon */}
          <Link
            to="/feed"
            aria-label="Home"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
              padding: "4px",
              borderRadius: "6px",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 10.5 12 3l9 7.5" />
              <path d="M5 9.5V21h5v-6h4v6h5V9.5" />
            </svg>
          </Link>

          {/* Profile Menu Wrapper */}
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setShowMenu((prev) => !prev)}
              aria-label="Profile menu"
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                borderRadius: "50%",
              }}
            >
              <img
                src={userIcon}
                alt="Profile"
                style={{
                  width: "36px",
                  height: "36px",
                  maxWidth: "36px",
                  maxHeight: "36px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  display: "block",
                  backgroundColor: "#ffffff",
                }}
              />
            </button>

            {/* Dropdown */}
            {showMenu && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 10px)",
                  right: 0,
                  width: "200px",
                  backgroundColor: "#161b22",
                  border: "1px solid #30363d",
                  borderRadius: "8px",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                  boxSizing: "border-box",
                }}
              >
                {/* White Info Box */}
                <div
                  style={{
                    backgroundColor: "#22232c",
                    borderRadius: "6px",
                    padding: "10px 8px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#d5dbe3",
                      wordBreak: "break-all",
                    }}
                  >
                    {username}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#c8e2ff",
                      marginTop: "3px",
                      wordBreak: "break-all",
                    }}
                  >
                    {email}
                  </div>
                </div>

                {/* Admin Dashboard in Menu */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setShowMenu(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      textDecoration: "none",
                      width: "100%",
                      padding: "8px 0",
                      backgroundColor: "rgba(255, 69, 0, 0.15)",
                      color: "#ff4500",
                      border: "1px solid rgba(255, 69, 0, 0.4)",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: 700,
                      boxSizing: "border-box",
                    }}
                  >
                    🛡️ Admin Panel
                  </Link>
                )}

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    width: "100%",
                    padding: "8px 0",
                    backgroundColor: "#e02828",
                    color: "#fff3f3",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}