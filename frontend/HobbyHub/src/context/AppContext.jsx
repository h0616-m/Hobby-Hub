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

  // On load (including right after the Google redirect) ask the server who we are.
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (Array.isArray(hobbies) && hobbies.length > 0) {
      localStorage.setItem("hobbyhub_hobbies", JSON.stringify(hobbies));
      if (user) {
        localStorage.setItem(getUserHobbiesKey(user), JSON.stringify(hobbies));
      }
    }
  }, [hobbies, user]);

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