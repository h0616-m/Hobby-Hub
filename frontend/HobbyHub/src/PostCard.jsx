import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from './context/AppContext';

export default function PostCard({ post }) {
  const { vote, user, isAdmin, deletePost, banUser } = useApp();
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Bulletproof admin determination
  const userObj = typeof user === 'object' && user !== null ? user : { username: user };
  const effectiveIsAdmin = isAdmin === true;

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowAdminMenu(false);
      }
    }
    if (showAdminMenu) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showAdminMenu]);

  const handleDelete = async (e) => {
    e.stopPropagation();
    setShowAdminMenu(false);
    try {
      await deletePost(post.id);
    } catch (err) {
      alert(err.message || 'Failed to delete post');
    }
  };

  const handleBan = async (e) => {
    e.stopPropagation();
    setShowAdminMenu(false);
    if (!post.userId || post.author?.toLowerCase() === 'admin') return;
    try {
      await banUser(post.userId);
    } catch (err) {
      alert(err.message || 'Failed to ban user');
    }
  };

  const commentsCount = Array.isArray(post.comments) ? post.comments.length : (post.commentCount || 0);

  return (
    <div className="feed-post-row-wrapper">
      <div className="post-card" onClick={() => navigate(`/post/${post.id}`)}>
        {/* Left Vertical Voting Column */}
        <div className="post-vote-column" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={`vote-btn ${post.userVote === 'up' ? 'up active' : ''}`}
            onClick={() => vote(post.id, 'up')}
          >
            ▲
          </button>
          <span className="vote-count">{post.upvotes ?? 0}</span>
          <button
            type="button"
            className={`vote-btn ${post.userVote === 'down' ? 'down active' : ''}`}
            onClick={() => vote(post.id, 'down')}
          >
            ▼
          </button>
        </div>

        {/* Post Body */}
        <div className="post-body-column">
          <div className="post-header-top-row">
            <div className="post-header">
              <span className="post-community">{post.hobby}</span>
              <span className="post-author-text">Posted by {post.author || 'user'}</span>
            </div>

            {/* Admin 3 Dots Button */}
            {effectiveIsAdmin && (
              <button
                type="button"
                className="admin-dots-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAdminMenu((prev) => !prev);
                }}
                title=""
              >
                •••
              </button>
            )}
          </div>

          <h3 className="post-title">{post.title}</h3>

          {post.body && <p className="post-excerpt">{post.body}</p>}

          <div className="comments-btn">
            💬 {commentsCount} Comments
          </div>
        </div>
      </div>

      {/* Admin Action Box */}
      {effectiveIsAdmin && showAdminMenu && (
        <div
          ref={menuRef}
          className="admin-actions-card"
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" className="admin-action-btn" onClick={handleDelete}>
            Delete Post
          </button>
          <button type="button" className="admin-action-btn" onClick={handleBan}>
            Ban User
          </button>
        </div>
      )}
    </div>
  );
}