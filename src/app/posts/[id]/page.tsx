"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface CommentItem {
  id: string;
  content: string;
  authorName: string;
  authorId: string;
  createdAt: string;
  isAgentReply: boolean;
  agentName?: string;
}

interface PostDetail {
  id: string;
  content: string;
  images: string[];
  authorName: string;
  authorEmail: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  likes: number;
  commentsCount: number;
  likedByMe: boolean;
  comments: CommentItem[];
  agentReplies: CommentItem[];
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

export default function PostDetailPage() {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchPost = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("加载失败");
      const data = (await res.json()) as PostDetail;
      setPost(data);
    } catch {
      setError("加载帖子失败");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  async function handleLike() {
    if (!post) return;
    if (!user) {
      router.push("/login");
      return;
    }
    const wasLiked = post.likedByMe;
    const nextLikes = wasLiked ? Math.max(0, post.likes - 1) : post.likes + 1;

    // 乐观更新
    setPost((prev) => (prev ? { ...prev, likedByMe: !wasLiked, likes: nextLikes } : prev));

    try {
      const res = await fetch(`/api/posts/${id}/like`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { liked: boolean; likes: number };
      setPost((prev) => (prev ? { ...prev, likedByMe: data.liked, likes: data.likes } : prev));
    } catch {
      setPost((prev) => (prev ? { ...prev, likedByMe: wasLiked, likes: post.likes } : prev));
    }
  }

  async function handleDelete() {
    if (!confirm("确定删除这条动态吗？")) return;
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      router.push("/posts");
    } catch {
      alert("删除失败");
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    const text = commentText.trim();
    if (!text || !user) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/posts/${id}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) throw new Error();
      setCommentText("");
      // 重新加载
      await fetchPost();
    } catch {
      alert("评论失败");
    } finally {
      setSubmittingComment(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-3 pb-24 pt-4 sm:px-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-9 w-9 animate-pulse rounded-full bg-slate-100" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
        <div className="h-32 animate-pulse rounded-xl bg-slate-50" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-2xl px-3 pb-24 pt-20 text-center sm:px-4">
        <p className="text-slate-500">{error || "帖子不存在"}</p>
        <Link href="/posts" className="mt-4 inline-block text-sm text-purple-700 underline">
          返回动态
        </Link>
      </div>
    );
  }

  const isAuthor = user && user.id === post.authorId;
  const allComments = [
    ...post.comments.map((c) => ({ ...c, sortAt: c.createdAt })),
    ...post.agentReplies.map((a) => ({ ...a, sortAt: a.createdAt })),
  ].sort((a, b) => new Date(a.sortAt).getTime() - new Date(b.sortAt).getTime());

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl px-3 pb-24 pt-4 sm:px-4"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) router.back();
            else router.push("/posts");
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 active:scale-95"
          aria-label="返回"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-[#111]">帖子详情</h1>
        {isAuthor ? (
          <div className="flex items-center gap-3">
            <Link href={`/posts/${id}/edit`} className="text-sm text-slate-500 hover:text-purple-700">
              编辑
            </Link>
            <button type="button" onClick={handleDelete} className="text-sm text-slate-500 hover:text-rose-600">
              删除
            </button>
          </div>
        ) : (
          <div className="w-9" />
        )}
      </div>

      {/* Post card */}
      <div className="rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
        {/* Author */}
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-fuchsia-100 text-sm font-bold text-purple-700">
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

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div className={`mt-3 grid gap-2 ${post.images.length === 1 ? "grid-cols-1" : post.images.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
            {post.images.map((src, idx) => (
              <div key={idx} className="relative aspect-square overflow-hidden rounded-lg bg-slate-50">
                <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center gap-5 border-t border-slate-50 pt-3">
          <button
            type="button"
            onClick={handleLike}
            className={`flex items-center gap-1 text-sm transition ${
              post.likedByMe ? "text-rose-500" : "text-slate-400 hover:text-rose-400"
            }`}
          >
            <svg className="h-5 w-5" fill={post.likedByMe ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            {post.likes > 0 ? post.likes : "赞"}
          </button>
          <span className="flex items-center gap-1 text-sm text-slate-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.768 7.5 2.25 7.5 2.25s7.5-.482 7.5-2.25c0-1.768-7.5-2.25-7.5-2.25s-7.5.482-7.5 2.25zM2.25 12.76v3.93c0 1.768 7.5 2.25 7.5 2.25s7.5-.482 7.5-2.25v-3.93M12 15V3.75" />
            </svg>
            {post.commentsCount > 0 ? `${post.commentsCount} 条评论` : "评论"}
          </span>
        </div>
      </div>

      {/* Comments Section */}
      <div className="mt-4">
        <h2 className="mb-3 text-base font-semibold text-[#111]">
          {allComments.length > 0 ? `评论 (${allComments.length})` : "评论"}
        </h2>

        {/* Comment input */}
        {user ? (
          <form onSubmit={handleSubmitComment} className="mb-4">
            <div className="rounded-[16px] bg-white p-3 shadow-sm ring-1 ring-black/[0.04]">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="写下你的评论…"
                rows={3}
                className="w-full resize-none rounded-lg border-0 bg-slate-50 p-3 text-sm text-[#111] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                maxLength={2000}
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400">{commentText.length}/2000</span>
                <button
                  type="submit"
                  disabled={!commentText.trim() || submittingComment}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition active:scale-95 ${
                    commentText.trim() && !submittingComment
                      ? "bg-gradient-to-r from-[#BA68C8] to-[#FF80AB] text-white shadow-lg shadow-fuchsia-500/20"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {submittingComment ? "发送中…" : "发送"}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="mb-4 rounded-[16px] bg-white p-4 text-center shadow-sm ring-1 ring-black/[0.04]">
            <p className="text-sm text-slate-500">登录后即可评论</p>
            <Link
              href="/login"
              className="mt-2 inline-block rounded-full bg-gradient-to-r from-[#BA68C8] to-[#FF80AB] px-5 py-1.5 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/20"
            >
              去登录
            </Link>
          </div>
        )}

        {/* Comments list */}
        <div className="space-y-3">
          {allComments.map((comment) => (
            <div
              key={comment.id}
              className={`rounded-[16px] p-3 shadow-sm ring-1 ${
                comment.isAgentReply
                  ? "bg-gradient-to-r from-purple-50/80 to-fuchsia-50/60 ring-purple-100"
                  : "bg-white ring-black/[0.04]"
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    comment.isAgentReply
                      ? "bg-gradient-to-br from-purple-200 to-fuchsia-200 text-purple-800"
                      : "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700"
                  }`}
                >
                  {comment.isAgentReply ? "AI" : comment.authorName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#111]">
                    {comment.isAgentReply ? (
                      <span className="text-purple-800">{comment.agentName || "Agent"}</span>
                    ) : (
                      comment.authorName
                    )}
                  </p>
                  <p className="text-xs text-slate-400">{timeAgo(comment.createdAt)}</p>
                </div>
                {comment.isAgentReply && (
                  <span className="ml-auto rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                    Agent
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#111]">
                {comment.content}
              </p>
            </div>
          ))}

          {allComments.length === 0 && (
            <div className="py-8 text-center text-sm text-slate-400">
              还没有评论，快来抢沙发吧～
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
