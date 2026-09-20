import { MOCK_CHATROOMS } from '../mockData';

let chatrooms = MOCK_CHATROOMS.map((c) => ({ ...c, messages: [...c.messages] }));
const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchChatrooms() {
  await delay();
  return chatrooms;
}

export async function sendChatroomMessage(chatroomId, text, author) {
  await delay(150);
  const message = { id: `m${Date.now()}`, author, text };
  chatrooms = chatrooms.map((c) => (c.id !== chatroomId ? c : { ...c, messages: [...c.messages, message] }));
  return message;
}
