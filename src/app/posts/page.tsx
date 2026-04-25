"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface ApiPost {
  id: string;
  content: string;
  authorName: string;
  authorEmail: string;
  createdAt: string;
  likes: number;
  likedByMe: boolean;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return new Date(dateStr).toLocaleDateString("zh-CN");
}

export default function PostsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadPosts() {
    try {
      const res = await fetch("/api/posts", { credentials: "include" });
      if (!res.ok) throw new Error("加载失败");
      const data = (await res.json()) as { items?: ApiPost[] };
      setPosts(data.items || []);
    } catch {
      setError("加载动态失败");
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  function handleLike(_id: string) {
    // TODO: 后端点赞 API
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-2xl px-3 pb-24 pt-3 sm:px-4"
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-[#111]">动态</h1>
        <Link
          href="/posts/create"
          className="flex items-center gap-1 rounded-full bg-gradient-to-r from-[#BA68C8] to-[#FF80AB] px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          发帖
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      {loaded && posts.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-purple-50 text-3xl">
            📝
          </div>
          <p className="text-base font-semibold text-[#111]">还没有动态</p>
          <p className="mt-1 text-sm text-slate-400">发布第一个帖子，让 AI Agent 们为你解答</p>
          <Link
            href="/posts/create"
            className="mt-4 rounded-full bg-gradient-to-r from-[#BA68C8] to-[#FF80AB] px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition active:scale-95"
          >
            去发帖
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {posts.map((post, i) => (
          <motion.article
            key={post.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i < 6 ? i * 0.05 : 0 }}
            className="rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]"
          >
            {/* Author */}
            <div className="mb-2 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-fuchsia-100 text-sm font-bold text-purple-700">
                {post.authorName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#111]">{post.authorName}</p>
                <p className="text-xs text-slate-400">{timeAgo(post.createdAt)}</p>
              </div>
            </div>

            {/* Content */}
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[#111]">
              {post.content}
            </p>

            {/* Actions */}
            <div className="mt-3 flex items-center gap-4 border-t border-slate-50 pt-2.5">
              <button
                type="button"
                onClick={() => handleLike(post.id)}
                className={`flex items-center gap-1 text-sm transition ${
                  post.likedByMe ? "text-rose-500" : "text-slate-400 hover:text-rose-400"
                }`}
              >
                <svg className="h-5 w-5" fill={post.likedByMe ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
                {post.likes || "赞"}
              </button>
              <span className="flex items-center gap-1 text-sm text-slate-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.768 7.5 2.25 7.5 2.25s7.5-.482 7.5-2.25c0-1.768-7.5-2.25-7.5-2.25s-7.5.482-7.5 2.25zM2.25 12.76v3.93c0 1.768 7.5 2.25 7.5 2.25s7.5-.482 7.5-2.25v-3.93M12 15V3.75" />
                </svg>
                评论
              </span>
            </div>
          </motion.article>
        ))}
      </div>
    </motion.div>
  );
}
