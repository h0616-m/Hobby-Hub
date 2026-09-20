export const MOCK_POSTS = [
  { id: '1', hobby: 'Coding', subreddit: 'Coding', author: 'coder_pro', title: "What's your favorite VS Code extension?", body: 'I just discovered a productivity extension that changed how I write code. Curious what everyone else is using.', upvotes: 128, userVote: null, comments: [
    { id: 'c1', author: 'devgirl', text: 'Prettier + ESLint combo is a must.' },
    { id: 'c2', author: 'js_ninja', text: 'GitLens has saved me so much time.' },
  ] },
  { id: '2', hobby: 'Gaming', subreddit: 'Gaming', author: 'pixel_hunter', title: 'Just beat the final boss after 30 attempts', body: 'Finally cleared the hardest fight in the game. Felt so good to finally get that S rank.', upvotes: 342, userVote: null, comments: [
    { id: 'c3', author: 'gamer_dad', text: 'Congrats! That fight is brutal.' },
  ] },
  { id: '3', hobby: 'Chess', subreddit: 'Chess', author: 'queens_gambit', title: 'Found a neat tactic in my last blitz game', body: 'Spotted a fork that won me the exchange. Sharing the position here for anyone who wants to solve it.', upvotes: 76, userVote: null, comments: [
    { id: 'c4', author: 'rook_lift', text: 'Nice find, knight forks are underrated.' },
  ] },
  { id: '4', hobby: 'Drawing', subreddit: 'Drawing', author: 'inkwell_art', title: 'Finished a 6 hour digital painting', body: 'Practiced lighting and shading today, still learning color theory but happy with the result.', upvotes: 214, userVote: null, comments: [
    { id: 'c5', author: 'sketchy_sam', text: 'The lighting is gorgeous, what brush did you use?' },
    { id: 'c6', author: 'colorblind_carl', text: 'Love the palette choice here.' },
  ] },
  { id: '5', hobby: 'Music', subreddit: 'Music', author: 'vinyl_lover', title: 'Recorded my first original song', body: 'Been playing guitar for years but this is the first time I wrote and recorded something fully original.', upvotes: 95, userVote: null, comments: [
    { id: 'c7', author: 'bassline_bob', text: 'The chord progression is really nice.' },
  ] },
  { id: '6', hobby: 'Fitness', subreddit: 'Fitness', author: 'iron_will', title: 'Hit a new deadlift PR today', body: 'Been training for this for months, finally pulled 405 for the first time. Small victories.', upvotes: 189, userVote: null, comments: [
    { id: 'c8', author: 'gym_rat', text: "Huge congrats, that's an awesome milestone!" },
  ] },
  { id: '7', hobby: 'Coding', subreddit: 'Coding', author: 'backend_bea', title: 'React vs Vue in 2026, thoughts?', body: 'Starting a new project soon and trying to decide on a frontend framework. Would love to hear real experiences.', upvotes: 58, userVote: null, comments: [] },
  { id: '8', hobby: 'Gaming', subreddit: 'Gaming', author: 'retro_zane', title: 'Replaying old classics this weekend', body: 'Nothing beats revisiting the games that got you into gaming in the first place.', upvotes: 47, userVote: null, comments: [] },
];

export const MOCK_CHATROOMS = [
  { id: 'Coding', icon: '💻', title: 'Coding', subtitle: 'Talk code with devs', messages: [
    { id: 'm1', author: 'coder_pro', text: 'Anyone using Rust for backend now?' },
    { id: 'm2', author: 'js_ninja', text: 'Still on Node here, works fine.' },
  ] },
  { id: 'Chess', icon: '♟️', title: 'Chess', subtitle: 'Discuss openings and games', messages: [
    { id: 'm1', author: 'queens_gambit', text: 'Sicilian or Caro-Kann against e4?' },
  ] },
  { id: 'Drawing', icon: '🎨', title: 'Drawing', subtitle: 'Share your art', messages: [
    { id: 'm1', author: 'inkwell_art', text: 'Working on a new piece tonight.' },
  ] },
  { id: 'Gaming', icon: '🎮', title: 'Gaming', subtitle: 'Squad up and play', messages: [
    { id: 'm1', author: 'pixel_hunter', text: 'Anyone up for ranked later?' },
  ] },
  { id: 'Music', icon: '🎵', title: 'Music', subtitle: 'Talk tracks and gear', messages: [
    { id: 'm1', author: 'vinyl_lover', text: 'New audio interface came in today.' },
  ] },
  { id: 'Fitness', icon: '🏋️', title: 'Fitness', subtitle: 'Share your progress', messages: [
    { id: 'm1', author: 'iron_will', text: "Leg day tomorrow, who's in?" },
  ] },
];
