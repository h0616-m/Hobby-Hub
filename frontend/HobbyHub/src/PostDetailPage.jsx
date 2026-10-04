import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from './context/AppContext';

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    posts,
    postsLoaded,
    loadPosts,
    vote,
    addComment,
    user,
    isAdmin,
    deletePost,
    banUser,
  } = useApp();

  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(!postsLoaded);

  useEffect(() => {
    let isMounted = true;
    if (!postsLoaded) {
      setLoading(true);
      loadPosts()
        .catch(() => {})
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      setLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [postsLoaded, loadPosts]);

  const post = posts.find((p) => String(p.id) === String(id));

  const userObj = typeof user === 'object' && user !== null ? user : { username: user };
  const effectiveIsAdmin = Boolean(
    isAdmin ||
    user === 'admin' ||
    userObj?.isAdmin === true ||
    userObj?.role === 'ADMIN' ||
    userObj?.username?.toLowerCase() === 'admin' ||
    userObj?.email?.toLowerCase() === 'admin@gmail.com'
  );

  const handleVote = (direction) => {
    if (post) {
      vote(post.id, direction);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !post) return;
    const author = userObj?.username || 'you';
    await addComment(post.id, commentText.trim(), author);
    setCommentText('');
  };

  const handleDelete = async () => {
    if (!post) return;
    await deletePost(post.id);
    navigate('/feed');
  };

  const handleBan = async () => {
    if (!post || !post.userId || post.author?.toLowerCase() === 'admin') return;
    await banUser(post.userId);
    navigate('/feed');
  };

  if (loading) {
    return (
      <div className="post-detail-page">
        <p className="status-msg">Loading post...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post-detail-page">
        <p className="status-msg">Post not found.</p>
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/feed')}
          >
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  const commentsList = Array.isArray(post.comments) ? post.comments : [];

  return (
    <div className="post-detail-page">
      <div className="post-detail-card">
        <div className="post-vote-column">
          <button
            type="button"
            className={`vote-btn ${post.userVote === 'up' ? 'up active' : ''}`}
            onClick={() => handleVote('up')}
          >
            ▲
          </button>
          <span className="vote-count">{post.upvotes ?? 0}</span>
          <button
            type="button"
            className={`vote-btn ${post.userVote === 'down' ? 'down active' : ''}`}
            onClick={() => handleVote('down')}
          >
            ▼
          </button>
        </div>

        <div className="post-body-column">
          <div className="post-header-top-row">
            <div className="post-header">
              <span className="post-community">{post.hobby}</span>
              <span className="post-author-text">Posted by {post.author || 'user'}</span>
            </div>

            {effectiveIsAdmin && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="admin-action-btn"
                  style={{ padding: '6px 12px', fontSize: '12px', width: 'auto' }}
                  onClick={handleDelete}
                >
                  Delete Post
                </button>
                <button
                  type="button"
                  className="admin-action-btn"
                  style={{ padding: '6px 12px', fontSize: '12px', width: 'auto' }}
                  onClick={handleBan}
                >
                  Ban User
                </button>
              </div>
            )}
          </div>

          <h2 className="post-title-detail">{post.title}</h2>
          {post.body && <p className="post-body-detail">{post.body}</p>}
        </div>
      </div>

      <section className="comments-section">
        <h2>Comments ({commentsList.length})</h2>

        <form className="comment-form" onSubmit={handleCommentSubmit}>
          <input
            type="text"
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <button type="submit" className="btn-primary">
            Comment
          </button>
        </form>

        <ul className="comment-list" style={{ marginTop: '16px' }}>
          {commentsList.length === 0 ? (
            <li className="status-msg small">No comments yet. Be the first to comment!</li>
          ) : (
            commentsList.map((c, idx) => (
              <li key={c.id || idx} className="comment-item">
                <span className="comment-author">{typeof c === 'string' ? 'User' : c.author}:</span>
                <span className="comment-text">{typeof c === 'string' ? c : c.text || c.content}</span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}