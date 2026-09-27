import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getCurrentUser } from '../api/authApi';
import { fetchPosts, createPost, votePost, addPostComment } from '../api/postsApi';
import { fetchChatrooms, sendChatroomMessage } from '../api/chatroomsApi';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [hobbies, setHobbies] = useState([]);
  const [posts, setPosts] = useState([]);
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [chatrooms, setChatrooms] = useState([]);
  const [chatroomsLoaded, setChatroomsLoaded] = useState(false);

  useEffect(() => {
    // Check if redirected from Google OAuth with ?user=...
    const searchParams = new URLSearchParams(window.location.search);
    const oauthUsername = searchParams.get('user');

    if (oauthUsername) {
      setUser(oauthUsername);
      setAuthChecked(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      getCurrentUser()
        .then((data) => {
          if (data && data.username) {
            setUser(data.username);
          }
        })
        .finally(() => {
          setAuthChecked(true);
        });
    }
  }, []);

  const login = useCallback((username) => setUser(username), []);
  const signup = useCallback((username) => setUser(username), []);
  const updateHobbies = useCallback((selected) => setHobbies(selected), []);

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
    if (updated) {
      setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
    }
  }, []);

  const addComment = useCallback(async (postId, text, author) => {
    const comment = await addPostComment(postId, text, author);
    setPosts((prev) => prev.map((p) => (p.id !== postId ? p : { ...p, comments: [...(p.comments || []), comment] })));
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
    user, authChecked, hobbies, posts, postsLoaded, chatrooms, chatroomsLoaded,
    login, signup, updateHobbies, vote, addComment, addPost, sendChatMessage,
    loadPosts, loadChatrooms,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
