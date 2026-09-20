import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "./context/AppContext";
import { loginRequest, signupRequest } from "./api/authApi";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user, login, signup } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/feed", { replace: true });
    }
  }, [user, navigate]);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const identifier = email.trim();
    const userPass = password.trim();

    if (!identifier || !userPass || (mode === "signup" && !username.trim())) {
      setError("Please fill in all fields.");
      return;
    }

    if (mode === "signup" && !EMAIL_REGEX.test(identifier)) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        const data = await loginRequest(identifier, userPass);
        login(data.username);
        navigate("/feed", { replace: true });
      } else {
        const data = await signupRequest(
          identifier,
          username.trim(),
          userPass
        );
        signup(data.username);
        navigate("/hobbies", { replace: true });
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "login" ? "auth-tab active" : "auth-tab"}
            onClick={() => switchMode("login")}
          >
            Log In
          </button>
          <button
            type="button"
            className={mode === "signup" ? "auth-tab active" : "auth-tab"}
            onClick={() => switchMode("signup")}
          >
            Sign Up
          </button>
        </div>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="email">
            {mode === "login" ? "Email or Username" : "Email"}
          </label>
          <input
            id="email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            placeholder={mode === "login" ? "admin or admin@gmail.com" : "user@example.com"}
            required
          />

          {mode === "signup" && (
            <>
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="Choose a username"
                required
              />
            </>
          )}

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            required
          />

          {error && <p className="auth-error" style={{ color: "#d93025", margin: "8px 0" }}>{error}</p>}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting
              ? "Please wait…"
              : mode === "login"
                ? "Log In"
                : "Sign Up"}
          </button>
        </form>

        <div style={{ textAlign: "center", margin: "16px 0 8px 0", color: "#888", fontSize: "14px" }}>
          or
        </div>

        <a
          href="http://localhost:8080/oauth2/authorization/google"
          className="btn-secondary"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            textDecoration: "none",
            width: "100%",
            boxSizing: "border-box",
            padding: "10px",
            borderRadius: "6px",
            fontWeight: "500",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Sign in with Google
        </a>
      </div>
    </div>
  );
}
