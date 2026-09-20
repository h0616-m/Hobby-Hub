export async function loginRequest(emailOrUsername, password) {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username: emailOrUsername, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Login failed.');
  }
  return { username: data.username || emailOrUsername };
}

export async function signupRequest(email, username, password) {
  const res = await fetch('/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, username, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Signup failed.');
  }
  return { username: data.username || username };
}

export async function getCurrentUser() {
  try {
    const res = await fetch('/api/me', {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}
