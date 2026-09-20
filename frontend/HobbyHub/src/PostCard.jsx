import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from './context/AppContext';

export default function PostCard({ post }) {
  const { vote, addComment, user } = useApp();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const navigate = useNavigate();

  const handleUpvote = (e) => {
    e.stopPropagation();
    vote(post.id, 'up');
  };

  const handleDownvote = (e) => {
    e.stopPropagation();
    vote(post.id, 'down');
  };

  const handleToggleComments = (e) => {
    e.stopPropagation();
    setShowComments((s) => !s);
  };

  const handleCommentSubmit = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(post.id, commentText.trim(), user || 'you');
    setCommentText('');
  };

  const handleCardClick = () => {
    navigate(`/post/${post.id}`);
  };

  return (
    <div className="post-card" onClick={handleCardClick}>
      <div className="post-vote-column" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={post.userVote === 'up' ? 'vote-btn up active' : 'vote-btn up'}
          onClick={handleUpvote}
          aria-label="Upvote"
        >
          ▲
        </button>
        <span className="vote-count">{post.upvotes}</span>
        <button
          type="button"
          className={post.userVote === 'down' ? 'vote-btn down active' : 'vote-btn down'}
          onClick={handleDownvote}
          aria-label="Downvote"
        >
          ▼
        </button>
      </div>
      <div className="post-body-column">
        <div className="post-header">
          <span className="post-community">{post.subreddit}</span>
          <span className="post-meta">Posted by {post.author}</span>
        </div>
        <h3 className="post-title">{post.title}</h3>
        <p className="post-excerpt">{post.body}</p>
        <div className="post-actions">
          <button type="button" className="comments-btn" onClick={handleToggleComments}>
            💬 {post.comments.length} Comments
          </button>
        </div>
        {showComments && (
          <div className="comments-drawer" onClick={(e) => e.stopPropagation()}>
            <ul className="comment-list">
              {post.comments.map((c) => (
                <li key={c.id} className="comment-item">
                  <span className="comment-author">{c.author}</span>
                  <p className="comment-text">{c.text}</p>
                </li>
              ))}
            </ul>
            <form className="comment-form" onSubmit={handleCommentSubmit}>
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment…"
                aria-label="Add a comment"
              />
              <button type="submit" className="btn-primary">
                Post
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
