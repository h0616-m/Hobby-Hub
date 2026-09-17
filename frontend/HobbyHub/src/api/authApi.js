const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

const mockUsers = [
  { email: "admin@gmail.com", username: "admin", password: "admin123" },
];

export async function loginRequest(email, password) {
  await delay();
  const found = mockUsers.find(
    (u) => u.email === email && u.password === password,
  );
  if (!found) {
    throw new Error("Invalid email or password.");
  }
  return { username: found.username, email: found.email };
}

export async function signupRequest(email, username, password) {
  await delay();
  const exists = mockUsers.some((u) => u.email === email);
  if (exists) {
    throw new Error("An account with this email already exists.");
  }
  mockUsers.push({ email, username, password });
  return { username, email };
}
