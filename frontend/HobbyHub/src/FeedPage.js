import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from './context/AppContext';
import PostCard from './PostCard';
import HobbiesModal from './HobbiesModal';
import CreatePostModal from './CreatePostModal';

export default function FeedPage() {
  const {
    posts, postsLoaded, loadPosts,
    chatrooms, chatroomsLoaded, loadChatrooms,
    hobbies, updateHobbies, addPost, user,
  } = useApp();
  const [status, setStatus] = useState(postsLoaded ? 'ready' : 'loading');
  const [search, setSearch] = useState('');
  const [showHobbiesModal, setShowHobbiesModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (postsLoaded) { setStatus('ready'); return undefined; }
    let cancelled = false;
    setStatus('loading');
    loadPosts()
      .then(() => { if (!cancelled) setStatus('ready'); })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, [postsLoaded, loadPosts]);

  useEffect(() => {
    if (chatroomsLoaded) return;
    loadChatrooms().catch(() => {});
  }, [chatroomsLoaded, loadChatrooms]);

  const visiblePosts = useMemo(() => {
    let list = hobbies.length === 0 ? posts : posts.filter((p) => hobbies.includes(p.hobby));
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) =>
        p.hobby.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.body.toLowerCase().includes(q)
      );
    }
    return list;
  }, [posts, hobbies, search]);

  const joinedChatrooms = chatrooms.filter((c) => hobbies.includes(c.id));

  const handleCreatePost = async (hobby, title, body) => {
    await addPost(hobby, title, body, user || 'you');
    if (!hobbies.includes(hobby)) {
      updateHobbies([...hobbies, hobby]);
    }
    setShowCreateModal(false);
  };

  const handleSaveHobbies = (selected) => {
    updateHobbies(selected);
    setShowHobbiesModal(false);
  };

  return (
    <div className="feed-layout">
      <main className="feed-main">
        <div className="feed-toolbar">
          <input
            type="text"
            className="search-input"
            placeholder="Search hobbies, titles, or content"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="button" className="btn-secondary" onClick={() => setShowHobbiesModal(true)}>More Hobbies</button>
          <button type="button" className="btn-primary" onClick={() => setShowCreateModal(true)}>Create Post</button>
        </div>

        {status === 'loading' && <p className="status-msg">Loading posts…</p>}
        {status === 'error' && <p className="status-msg error">Something went wrong loading posts.</p>}
        {status === 'ready' && visiblePosts.length === 0 && (
          <p className="status-msg">No posts found for your selected hobbies.</p>
        )}
        {status === 'ready' && visiblePosts.map((post) => <PostCard key={post.id} post={post} />)}
      </main>

      <aside className="feed-sidebar">
        <div className="chatroom-card">
          <h2>Chatrooms</h2>
          {joinedChatrooms.length === 0 && (
            <p className="status-msg small">Join a hobby to see its chatroom.</p>
          )}
          <ul className="chatroom-list">
            {joinedChatrooms.map((room) => (
              <li key={room.id}>
                <Link to={`/chatroom/${room.id}`} className="chatroom-item">
                  <span className="chatroom-icon">{room.icon}</span>
                  <div className="chatroom-text">
                    <span className="chatroom-title">{room.title}</span>
                    <span className="chatroom-subtitle">{room.subtitle}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {showHobbiesModal && (
        <HobbiesModal current={hobbies} onClose={() => setShowHobbiesModal(false)} onSave={handleSaveHobbies} />
      )}
      {showCreateModal && (
        <CreatePostModal onClose={() => setShowCreateModal(false)} onCreate={handleCreatePost} />
      )}
    </div>
  );
}
