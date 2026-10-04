const ADMIN_USERNAME = "admin";
const ADMIN_EMAIL = "admin@gmail.com";

async function parseJsonSafely(res) {
  const text = await res.text();
  if (!text || !text.trim()) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function loginRequest(emailOrUsername, password) {
  const pass = (password || "").trim();

  // 3. Backend & Database Authentication
  let res;
  try {
    res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username: emailOrUsername.trim(), password: pass }),
    });
  } catch (networkErr) {
    throw new Error("Server is unreachable. Please try again.");
  }

  const data = await parseJsonSafely(res);

  if (!res.ok) {
    throw new Error(data?.message || "Invalid username or password.");
  }

  return {
    username: data?.username || emailOrUsername.trim(),
    role: data?.role || "USER",
    isAdmin: false,
  };
}

export async function signupRequest(email, username, password) {
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanUsername = (username || "").trim().toLowerCase();
  const pass = (password || "").trim();

  // 1. Reserve Admin Credentials
  if (cleanUsername === ADMIN_USERNAME || cleanEmail === ADMIN_EMAIL) {
    throw new Error("This username or email is reserved by system administration.");
  }

  // 3. Backend Registration
  let res;
  try {
    res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: cleanEmail,
        username: username.trim(),
        password: pass,
      }),
    });
  } catch (networkErr) {
    throw new Error("Server is unreachable. Please try again.");
  }

  const data = await parseJsonSafely(res);

  if (!res.ok) {
    throw new Error(
      data?.message || "Signup failed. Username or email may already be in use."
    );
  }

  return {
    username: data?.username || username.trim(),
    role: "USER",
    isAdmin: false,
  };
}

export async function logoutRequest() {
  try {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch (err) {
    console.warn("Backend logout endpoint unreachable, completing client logout.");
  }
}

export async function getCurrentUser() {
  try {
    const res = await fetch("/api/me", {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) return null;
    return await parseJsonSafely(res);
  } catch {
    return null;
  }
}