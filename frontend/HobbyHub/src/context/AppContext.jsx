import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { fetchPosts, createPost, votePost, addPostComment } from "../api/postsApi";
import { fetchChatrooms, sendChatroomMessage } from "../api/chatroomsApi";

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
  const [user, setUser] = useState(() => readStored("hobbyhub_user", null));
  const [hobbies, setHobbies] = useState(() => readStored("hobbyhub_hobbies", []));
  const [posts, setPosts] = useState([]);
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [chatrooms, setChatrooms] = useState([]);
  const [chatroomsLoaded, setChatroomsLoaded] = useState(false);

  useEffect(() => {
    localStorage.setItem("hobbyhub_user", JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem("hobbyhub_hobbies", JSON.stringify(hobbies));
  }, [hobbies]);

  const login = useCallback((username) => setUser(username), []);
  const signup = useCallback((username) => setUser(username), []);
  const updateHobbies = useCallback((selected) => setHobbies(selected), []);

  const logout = useCallback(() => {
    setUser(null);
    setHobbies([]);
    setPosts([]);
    setPostsLoaded(false);
    setChatrooms([]);
    setChatroomsLoaded(false);
    localStorage.removeItem("hobbyhub_user");
    localStorage.removeItem("hobbyhub_hobbies");
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
    setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
  }, []);

  const addComment = useCallback(async (postId, text, author) => {
    const comment = await addPostComment(postId, text, author);
    setPosts((prev) => prev.map((p) => (p.id !== postId ? p : { ...p, comments: [...p.comments, comment] })));
  }, []);

  const addPost = useCallback(async (hobby, title, body, author) => {
    const newPost = await createPost(hobby, title, body, author);
    setPosts((prev) => [newPost, ...prev]);
  }, []);

  const sendChatMessage = useCallback(async (chatroomId, text, author) => {
    const message = await sendChatroomMessage(chatroomId, text, author);
    setChatrooms((prev) => prev.map((c) => (c.id !== chatroomId ? c : { ...c, messages: [...c.messages, message] })));
  }, []);

  const value = {
    user, hobbies, posts, postsLoaded, chatrooms, chatroomsLoaded,
    login, signup, logout, updateHobbies, vote, addComment, addPost, sendChatMessage,
    loadPosts, loadChatrooms,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}