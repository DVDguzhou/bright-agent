/* ── Local-only post store (localStorage) ──
 * Temporary client-side storage until a backend /api/posts is built. */

export type Post = {
  id: string;
  content: string;
  authorName: string;
  authorEmail: string;
  createdAt: string;
  likes: number;
  likedByMe: boolean;
  comments: Comment[];
  agentReplies?: AgentReply[];
};

export type Comment = {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  createdAt: string;
};

export type AgentReply = {
  id: string;
  agentId: string;
  agentName: string;
  agentAvatar?: string;
  content: string;
  createdAt: string;
};

const STORAGE_KEY = "ba_posts_v1";

function read(): Post[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Post[]) : [];
  } catch {
    return [];
  }
}

function write(posts: Post[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

export function getPosts(): Post[] {
  return read().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addPost(content: string, authorName: string, authorEmail: string): Post {
  const posts = read();
  const post: Post = {
    id: `post_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    content,
    authorName: authorName || "用户",
    authorEmail,
    createdAt: new Date().toISOString(),
    likes: 0,
    likedByMe: false,
    comments: [],
    agentReplies: generateMockReplies(content),
  };
  posts.unshift(post);
  write(posts);
  return post;
}

export function toggleLikePost(id: string): Post | null {
  const posts = read();
  const idx = posts.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  posts[idx].likedByMe = !posts[idx].likedByMe;
  posts[idx].likes += posts[idx].likedByMe ? 1 : -1;
  write(posts);
  return posts[idx];
}

export function addComment(postId: string, author: string, content: string): Comment | null {
  const posts = read();
  const post = posts.find((p) => p.id === postId);
  if (!post) return null;
  const comment: Comment = {
    id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    author,
    content,
    createdAt: new Date().toISOString(),
  };
  post.comments.push(comment);
  write(posts);
  return comment;
}

function generateMockReplies(_content: string): AgentReply[] {
  const mockAgents = [
    { id: "agent_1", name: "杨大鹅", avatar: "🦢" },
    { id: "agent_2", name: "Justin", avatar: "🧑‍💻" },
    { id: "agent_3", name: "枸杞期待偷鸡", avatar: "🐔" },
    { id: "agent_4", name: "Rowling", avatar: "🧙‍♀️" },
    { id: "agent_5", name: "ArnoZhao赵晓阳", avatar: "🕵️" },
  ];
  const count = 2 + Math.floor(Math.random() * 3);
  return mockAgents.slice(0, count).map((agent) => ({
    id: `r_${Date.now()}_${agent.id}`,
    agentId: agent.id,
    agentName: agent.name,
    agentAvatar: agent.avatar,
    content: `这是一个模拟的 AI Agent 回复，来自 ${agent.name}。`,
    createdAt: new Date(Date.now() + Math.random() * 60000).toISOString(),
  }));
}
