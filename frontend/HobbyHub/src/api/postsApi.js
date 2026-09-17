import { MOCK_POSTS } from '../mockData';

let posts = MOCK_POSTS.map((p) => ({ ...p, comments: [...p.comments] }));
const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchPosts() {
  await delay();
  return posts;
}

export async function createPost(hobby, title, body, author) {
  await delay();
  const newPost = { id: `p${Date.now()}`, hobby, subreddit: hobby, author, title, body, upvotes: 1, userVote: 'up', comments: [] };
  posts = [newPost, ...posts];
  return newPost;
}

export async function votePost(postId, direction) {
  await delay(150);
  posts = posts.map((p) => {
    if (p.id !== postId) return p;
    let upvotes = p.upvotes;
    let userVote = p.userVote;
    if (direction === 'up') {
      if (userVote === 'up') { upvotes -= 1; userVote = null; }
      else if (userVote === 'down') { upvotes += 2; userVote = 'up'; }
      else { upvotes += 1; userVote = 'up'; }
    } else {
      if (userVote === 'down') { upvotes += 1; userVote = null; }
      else if (userVote === 'up') { upvotes -= 2; userVote = 'down'; }
      else { upvotes -= 1; userVote = 'down'; }
    }
    return { ...p, upvotes, userVote };
  });
  return posts.find((p) => p.id === postId);
}

export async function addPostComment(postId, text, author) {
  await delay(150);
  const comment = { id: `c${Date.now()}`, author, text };
  posts = posts.map((p) => (p.id !== postId ? p : { ...p, comments: [...p.comments, comment] }));
  return comment;
}
