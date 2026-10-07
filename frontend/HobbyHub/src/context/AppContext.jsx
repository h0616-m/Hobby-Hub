import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { logoutRequest, getCurrentUser } from "../api/authApi";
import { fetchPosts, createPost, votePost, addPostComment, deletePostApi } from "../api/postsApi";
import { fetchChatrooms, sendChatroomMessage } from "../api/chatroomsApi";
import { banUserRequest } from "../api/adminApi";

const ALL_HOBBIES = ['Coding', 'Chess', 'Drawing', 'Gaming', 'Music', 'Fitness'];

const AppContext = createContext(null);

function readStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function getUserHobbiesKey(u) {
  const name = typeof u === "object" ? u?.username : u;
  return name ? `hobbyhub_hobbies_${name.toLowerCase()}` : "hobbyhub_hobbies";
}

export function AppProvider({ children }) {
  // The server session is the only source of truth for who the user is and whether
  // they are an admin or banned.
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [hobbies, setHobbies] = useState(() => {
    const initialUser = readStored("hobbyhub_user", null);
    const key = getUserHobbiesKey(initialUser);
    const userSaved = readStored(key, null);
    if (Array.isArray(userSaved) && userSaved.length > 0) return userSaved;
    return readStored("hobbyhub_hobbies", ['Coding']);
  });
  const [posts, setPosts] = useState([]);
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [chatrooms, setChatrooms] = useState([]);
  const [chatroomsLoaded, setChatroomsLoaded] = useState(false);

  const refreshUser = useCallback(async () => {
    const me = await getCurrentUser();
    if (me && me.username) {
      const isAdm = me.isAdmin === true;
      setUser({
        id: me.id,
        username: me.username,
        email: me.email || "",
        isAdmin: isAdm,
        isBanned: me.isBanned === true,
        role: isAdm ? "ADMIN" : "USER",
      });

      // Admin should always have all hobbies selected all the time
      if (isAdm) {
        setHobbies(ALL_HOBBIES);
        localStorage.setItem("hobbyhub_hobbies", JSON.stringify(ALL_HOBBIES));
        localStorage.setItem(getUserHobbiesKey(me), JSON.stringify(ALL_HOBBIES));
      } else {
        // Normal user: restore from backend selectedHobbies or localStorage
        let userHobbies = [];
        if (me.selectedHobbies && typeof me.selectedHobbies === 'string') {
          userHobbies = me.selectedHobbies.split(',').map((s) => s.trim()).filter(Boolean);
        }
        if (!userHobbies || userHobbies.length === 0) {
          const key = getUserHobbiesKey(me);
          userHobbies = readStored(key, null);
        }
        if (!userHobbies || userHobbies.length === 0) {
          userHobbies = readStored("hobbyhub_hobbies", ['Coding']);
        }
        if (!Array.isArray(userHobbies) || userHobbies.length === 0) {
          userHobbies = ['Coding'];
        }
        setHobbies(userHobbies);
        localStorage.setItem("hobbyhub_hobbies", JSON.stringify(userHobbies));
        localStorage.setItem(getUserHobbiesKey(me), JSON.stringify(userHobbies));
      }
    } else {
      setUser(null);
    }
    setAuthChecked(true);
    return me;
  }, []);

  // Handle initial auth & Google OAuth return
  useEffect(() => {
    const handleAuthInit = async () => {
      const params = new URLSearchParams(window.location.search);
      const googleUser = params.get("user");
      const googleUserId = params.get("userId");
      const googleEmail = params.get("email");
      const googleIsAdmin = params.get("isAdmin") === "true";
      const googleIsBanned = params.get("isBanned") === "true";
      const isNewUser = params.get("isNew") === "true";
      const accountExists = params.get("accountExists") === "true";

      const authMode = sessionStorage.getItem("google_auth_mode") || localStorage.getItem("google_auth_mode");
      const desiredUsername = sessionStorage.getItem("google_desired_username");

      if (googleUser) {
        // Clear transient auth markers immediately
        sessionStorage.removeItem("google_auth_mode");
        localStorage.removeItem("google_auth_mode");
        sessionStorage.removeItem("google_desired_username");

        // If user attempted to "Sign up with Google", but the account already exists:
        // Kick them back to login and display: "Account already exists, login instead"
        if (authMode === "signup" && (accountExists || !isNewUser)) {
          sessionStorage.removeItem("just_google_signed_up");
          localStorage.removeItem("hobbyhub_user");
          setUser(null);
          try {
            await logoutRequest();
          } catch (e) {
            console.warn("Logout failed", e);
          }
          window.location.replace(
            "/auth?mode=login&error=" + encodeURIComponent("Account already exists, login instead")
          );
          return;
        }

        let finalUsername = googleUser;
        const currentUserId = googleUserId ? Number(googleUserId) : null;

        // If user signed up with Google and entered a custom desired username
        if (authMode === "signup" && desiredUsername && desiredUsername.trim().toLowerCase() !== googleUser.toLowerCase()) {
          try {
            const res = await fetch("/api/user/username", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ userId: currentUserId, username: desiredUsername.trim() }),
            });
            const data = await res.json();
            if (data.status === "SUCCESS") {
              finalUsername = data.username;
            } else {
              sessionStorage.setItem("google_username_taken_error", data.message || "Username already taken");
            }
          } catch (e) {
            console.warn("Could not save desired username", e);
          }
        }

        const userObj = {
          id: currentUserId,
          username: finalUsername,
          email: googleEmail || "",
          isAdmin: googleIsAdmin,
          isBanned: googleIsBanned,
          role: googleIsAdmin ? "ADMIN" : "USER",
        };

        setUser(userObj);
        localStorage.setItem("hobbyhub_user", JSON.stringify(userObj));
        setAuthChecked(true);

        // Remove query parameters from URL address bar
        window.history.replaceState({}, document.title, window.location.pathname);

        // Routing rule:
        // "if login then google then directly to feed"
        // "if sign up then google (u can choose username (if already not taken)) also goes to select hobbies page"
        if (authMode === "signup" || (isNewUser && authMode !== "login")) {
          sessionStorage.setItem("just_google_signed_up", "true");
          window.location.replace("/hobbies");
          return;
        } else {
          sessionStorage.removeItem("just_google_signed_up");
          if (window.location.pathname !== "/feed") {
            window.location.replace("/feed");
          }
          return;
        }
      }

      await refreshUser();
    };

    handleAuthInit();
  }, [refreshUser]);

  useEffect(() => {
    if (Array.isArray(hobbies) && hobbies.length > 0) {
      localStorage.setItem("hobbyhub_hobbies", JSON.stringify(hobbies));
      if (user) {
        localStorage.setItem(getUserHobbiesKey(user), JSON.stringify(hobbies));
      }
    }
  }, [hobbies, user]);

  const updateUsername = useCallback(async (newUsername) => {
    if (!user || !newUsername || !newUsername.trim()) return { success: false, message: "Username cannot be empty" };
    const clean = newUsername.trim();
    try {
      const res = await fetch("/api/user/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: user.id, username: clean }),
      });
      const data = await res.json();
      if (data.status === "SUCCESS") {
        const updatedUser = { ...user, username: data.username };
        setUser(updatedUser);
        localStorage.setItem("hobbyhub_user", JSON.stringify(updatedUser));
        return { success: true, username: data.username };
      }
      return { success: false, message: data.message || "Failed to update username" };
    } catch (e) {
      return { success: false, message: "Server connection failed" };
    }
  }, [user]);

  // login/signup are called after the backend has created the session; just load that session's user.
  const login = useCallback(() => refreshUser(), [refreshUser]);
  const signup = useCallback(() => refreshUser(), [refreshUser]);

  const updateHobbies = useCallback(async (selected) => {
    let list = Array.isArray(selected) ? selected : [];
    if (user?.isAdmin === true) {
      list = ALL_HOBBIES;
    }
    setHobbies(list);
    localStorage.setItem("hobbyhub_hobbies", JSON.stringify(list));
    if (user) {
      localStorage.setItem(getUserHobbiesKey(user), JSON.stringify(list));
      try {
        await fetch("/api/hobbies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ hobbies: list }),
        });
      } catch (e) {
        // local / offline
      }
    }
  }, [user]);

  const logout = useCallback(async () => {
    localStorage.removeItem("hobbyhub_user");
    setUser(null);
    setHobbies([]);
    setPosts([]);
    setPostsLoaded(false);
    setChatrooms([]);
    setChatroomsLoaded(false);
    await logoutRequest();
  }, []);

  const loadPosts = useCallback(async () => {
    const data = await fetchPosts();
    setPosts(data);
    setPostsLoaded(true);
  }, []);

  const loadChatrooms = useCallback(async () => {
    const data = await fetchChatrooms();
    setChatrooms(data);
    setChatroomsLoaded(true);
  }, []);

  const vote = useCallback(async (postId, direction) => {
    const updated = await votePost(postId, direction);
    if (!updated) {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const currentVote = p.userVote;
          let delta = 0;
          let nextVote = direction;

          if (currentVote === direction) {
            delta = direction === "up" ? -1 : 1;
            nextVote = null;
          } else if (currentVote) {
            delta = direction === "up" ? 2 : -2;
          } else {
            delta = direction === "up" ? 1 : -1;
          }

          return {
            ...p,
            upvotes: Math.max(0, (p.upvotes || 0) + delta),
            userVote: nextVote,
          };
        })
      );
      return;
    }
    setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
  }, []);

  const addComment = useCallback(async (postId, text, author) => {
    const commentAuthor = author || (typeof user === "object" ? user?.username : user) || "you";
    const comment = await addPostComment(postId, text, commentAuthor);
    setPosts((prev) =>
      prev.map((p) => (p.id !== postId ? p : { ...p, comments: [...(p.comments || []), comment] }))
    );
  }, [user]);

  const addPost = useCallback(async (hobby, title, body, author) => {
    const postAuthor = author || (typeof user === "object" ? user?.username : user) || "you";
    const newPost = await createPost(hobby, title, body, postAuthor);
    setPosts((prev) => [newPost, ...prev]);
    return newPost;
  }, [user]);

  const deletePost = useCallback(async (postId) => {
    await deletePostApi(postId);
    setPosts((prev) => prev.filter((p) => String(p.id) !== String(postId)));
  }, []);

  const banUser = useCallback(async (userId) => {
    await banUserRequest(userId);
    setPosts((prev) => prev.filter((p) => p.userId !== userId));
  }, []);

  const sendChatMessage = useCallback(async (chatroomId, text, author) => {
    const messageAuthor = author || (typeof user === "object" ? user?.username : user) || "you";
    const message = await sendChatroomMessage(chatroomId, text, messageAuthor);
    setChatrooms((prev) =>
      prev.map((c) => (c.id !== chatroomId ? c : { ...c, messages: [...(c.messages || []), message] }))
    );
  }, [user]);

  const username = typeof user === "object" ? user?.username : user;

  const isAdmin = user?.isAdmin === true;
  const isBanned = user?.isBanned === true;

  const value = {
    user,
    username,
    isAdmin,
    isBanned,
    authChecked,
    hobbies,
    posts,
    postsLoaded,
    chatrooms,
    chatroomsLoaded,
    login,
    signup,
    refreshUser,
    logout,
    updateHobbies,
    updateUsername,
    vote,
    addComment,
    addPost,
    deletePost,
    banUser,
    sendChatMessage,
    loadPosts,
    loadChatrooms,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}