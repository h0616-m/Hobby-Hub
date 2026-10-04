import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { logoutRequest } from "../api/authApi";
import { fetchPosts, createPost, votePost, addPostComment } from "../api/postsApi";
import { fetchChatrooms, sendChatroomMessage } from "../api/chatroomsApi";
import { deletePostRequest, banUserRequest } from "../api/adminApi";

const AppContext = createContext(null);

function readStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = readStored("hobbyhub_user", null);
    if (!stored) return null;
    const name = typeof stored === "object" ? stored.username : stored;
    const mail = typeof stored === "object" ? stored.email : "";
    if (name?.toLowerCase() === "admin" || mail?.toLowerCase() === "admin@gmail.com") {
      return {
        username: "admin",
        email: "admin@gmail.com",
        role: "ADMIN",
        isAdmin: true,
        isBanned: false,
      };
    }
    return stored;
  });

  const [hobbies, setHobbies] = useState(() => readStored("hobbyhub_hobbies", []));
  const [posts, setPosts] = useState([]);
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [chatrooms, setChatrooms] = useState([]);
  const [chatroomsLoaded, setChatroomsLoaded] = useState(false);
  const authChecked = true;

  useEffect(() => {
    if (user === null) {
      localStorage.removeItem("hobbyhub_user");
    } else {
      localStorage.setItem("hobbyhub_user", JSON.stringify(user));
    }
  }, [user]);

  useEffect(() => {
    if (hobbies.length === 0) {
      localStorage.removeItem("hobbyhub_hobbies");
    } else {
      localStorage.setItem("hobbyhub_hobbies", JSON.stringify(hobbies));
    }
  }, [hobbies]);

  const login = useCallback((userData) => {
    const name = typeof userData === "object" ? userData.username : userData;
    const mail = typeof userData === "object" ? userData.email : "";

    if (name?.toLowerCase() === "admin" || mail?.toLowerCase() === "admin@gmail.com") {
      setUser({
        username: "admin",
        email: "admin@gmail.com",
        role: "ADMIN",
        isAdmin: true,
        isBanned: false,
      });
    } else if (typeof userData === "string") {
      setUser({
        username: userData,
        email: `${userData}@gmail.com`,
        role: "USER",
        isAdmin: false,
        isBanned: false,
      });
    } else {
      setUser(userData);
    }
  }, []);

  const signup = useCallback((userData) => {
    if (typeof userData === "string") {
      setUser({
        username: userData,
        email: `${userData}@gmail.com`,
        role: "USER",
        isAdmin: false,
        isBanned: false,
      });
    } else {
      setUser(userData);
    }
  }, []);

  const updateHobbies = useCallback((selected) => setHobbies(selected), []);

  const logout = useCallback(() => {
    localStorage.removeItem("hobbyhub_user");
    localStorage.removeItem("hobbyhub_hobbies");
    setUser(null);
    setHobbies([]);
    setPosts([]);
    setPostsLoaded(false);
    setChatrooms([]);
    setChatroomsLoaded(false);
    logoutRequest().catch(() => {});
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
    await deletePostRequest(postId);
    setPosts((prev) => prev.filter((p) => String(p.id) !== String(postId)));
  }, []);

  const banUser = useCallback(async (targetUsername) => {
    await banUserRequest(targetUsername);
    try {
      const banned = JSON.parse(localStorage.getItem("hobbyhub_banned_users") || "[]");
      if (!banned.includes(targetUsername.toLowerCase())) {
        banned.push(targetUsername.toLowerCase());
        localStorage.setItem("hobbyhub_banned_users", JSON.stringify(banned));
      }
    } catch {
      // storage exception safety
    }
    setPosts((prev) => prev.filter((p) => p.author?.toLowerCase() !== targetUsername.toLowerCase()));
  }, []);

  const sendChatMessage = useCallback(async (chatroomId, text, author) => {
    const messageAuthor = author || (typeof user === "object" ? user?.username : user) || "you";
    const message = await sendChatroomMessage(chatroomId, text, messageAuthor);
    setChatrooms((prev) =>
      prev.map((c) => (c.id !== chatroomId ? c : { ...c, messages: [...(c.messages || []), message] }))
    );
  }, [user]);

  const username = typeof user === "object" ? user?.username : user;

  // HARDCODED ADMIN CHECK
  const isAdmin = Boolean(
    user === "admin" ||
    (typeof user === "object" && (
      user?.username?.toLowerCase() === "admin" ||
      user?.email?.toLowerCase() === "admin@gmail.com" ||
      user?.role === "ADMIN" ||
      user?.isAdmin === true
    ))
  );

  const isBanned = typeof user === "object" ? Boolean(user?.isBanned) : false;

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
    logout,
    updateHobbies,
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