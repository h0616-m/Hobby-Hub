import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from './context/AppContext';

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { posts, vote, addComment, user } = useApp();
  const [commentText, setCommentText] = useState('');

  const post = posts.find((p) => String(p.id) === String(id));

  if (!post) {
    return (
      <div className="post-detail-page">
        <button type="button" className="back-btn" onClick={() => navigate('/feed')}>
          ← Back to Feed
        </button>
        <p className="status-msg">Post not found.</p>
      </div>
    );
  }

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(post.id, commentText.trim(), user || 'you');
    setCommentText('');
  };

  return (
    <div className="post-detail-page">
      <button type="button" className="back-btn" onClick={() => navigate('/feed')}>
        ← Back to Feed
      </button>
      <div className="post-detail-card">
        <div className="post-vote-column">
          <button
            type="button"
            className={post.userVote === 'up' ? 'vote-btn up active' : 'vote-btn up'}
            onClick={() => vote(post.id, 'up')}
            aria-label="Upvote"
          >
            ▲
          </button>
          <span className="vote-count">{post.upvotes}</span>
          <button
            type="button"
            className={post.userVote === 'down' ? 'vote-btn down active' : 'vote-btn down'}
            onClick={() => vote(post.id, 'down')}
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
          <h1 className="post-title-detail">{post.title}</h1>
          <p className="post-body-detail">{post.body}</p>
        </div>
      </div>
      <div className="comments-section">
        <h2>Comments ({post.comments.length})</h2>
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
        <ul className="comment-list">
          {post.comments.map((c) => (
            <li key={c.id} className="comment-item">
              <span className="comment-author">{c.author}</span>
              <p className="comment-text">{c.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
