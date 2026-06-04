"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { LifeAgentCoverImage } from "@/components/LifeAgentCoverImage";
import { UserAvatar } from "@/components/UserAvatar";
import { DEFAULT_COVER_URL, normalizeLifeAgentCoverImgSrc } from "@/lib/life-agent-covers";
import { resolveCdnUrl } from "@/lib/cdn";

interface CommentItem {
  id: string;
  content: string;
  authorName: string;
  authorId: string;
  authorAvatarUrl?: string;
  createdAt: string;
  isAgentReply: boolean;
  agentName?: string;
  agentId?: string;
  agentCoverUrl?: string;
}

interface PostDetail {
  id: string;
  content: string;
  images: string[];
  visibility?: "public" | "private";
  authorName: string;
  authorEmail: string;
  authorId: string;
  authorAvatarUrl?: string;
  authorAgentProfileId?: string;
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
          <div className="h-9 w-9 animate-pulse rounded-full bg-paper-200" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-paper-200" />
            <div className="h-3 w-16 animate-pulse rounded bg-paper-200" />
          </div>
        </div>
        <div className="h-32 animate-pulse rounded-xl bg-paper-50" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-2xl px-3 pb-24 pt-20 text-center sm:px-4">
        <p className="text-ink-400">{error || "帖子不存在"}</p>
        <Link href="/posts" className="mt-4 inline-block text-sm text-ink-600 underline">
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
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink-400 transition hover:bg-paper-200 active:scale-95"
          aria-label="返回"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-ink">帖子详情</h1>
        {isAuthor ? (
          <div className="flex items-center gap-3">
            <Link href={`/posts/${id}/edit`} className="text-sm text-ink-400 hover:text-ink-600">
              编辑
            </Link>
            <button type="button" onClick={handleDelete} className="text-sm text-ink-400 hover:text-oxblood-600">
              删除
            </button>
          </div>
        ) : (
          <div className="w-9" />
        )}
      </div>

      {/* Post card */}
      <div className="rounded-[20px] bg-paper p-4 shadow-sm ring-1 ring-hairline/40">
        {/* Author */}
        <div className="mb-3 flex items-center gap-2.5">
          {post.authorAgentProfileId ? (
            <Link href={`/life-agents/${post.authorAgentProfileId}`} className="shrink-0">
              <UserAvatar
                avatarUrl={post.authorAvatarUrl}
                name={post.authorName}
                email={post.authorEmail}
              />
            </Link>
          ) : (
            <UserAvatar
              avatarUrl={post.authorAvatarUrl}
              name={post.authorName}
              email={post.authorEmail}
            />
          )}
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink">
              {post.authorName}
              {post.visibility === "private" && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-paper-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-500">
                  <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 0h10.5a1.5 1.5 0 011.5 1.5v6.75a1.5 1.5 0 01-1.5 1.5H6.75a1.5 1.5 0 01-1.5-1.5V12a1.5 1.5 0 011.5-1.5z" />
                  </svg>
                  私密
                </span>
              )}
            </p>
            <p className="text-xs text-ink-300">{timeAgo(post.createdAt)}</p>
          </div>
        </div>

        {/* Content */}
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
          {post.content}
        </p>

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div className={`mt-3 grid gap-2 ${post.images.length === 1 ? "grid-cols-1" : post.images.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
            {post.images.map((src, idx) => (
              <div key={idx} className="relative aspect-square overflow-hidden rounded-lg bg-paper-50">
                <img src={resolveCdnUrl(src)} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center gap-5 border-t border-hairline/30 pt-3">
          <button
            type="button"
            onClick={handleLike}
            className={`flex items-center gap-1 text-sm transition ${
              post.likedByMe ? "text-oxblood-500" : "text-ink-300 hover:text-oxblood-400"
            }`}
          >
            <svg className="h-5 w-5" fill={post.likedByMe ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            {post.likes > 0 ? post.likes : "赞"}
          </button>
          <span className="flex items-center gap-1 text-sm text-ink-300">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
            </svg>
            {post.commentsCount > 0 ? `${post.commentsCount} 条评论` : "评论"}
          </span>
        </div>
      </div>

      {/* Comments Section */}
      <div className="mt-4">
        <h2 className="mb-3 text-base font-semibold text-ink">
          {allComments.length > 0 ? `评论 (${allComments.length})` : "评论"}
        </h2>

        {/* Comment input */}
        {user ? (
          <form onSubmit={handleSubmitComment} className="mb-4">
            <div className="rounded-[16px] bg-paper p-3 shadow-sm ring-1 ring-hairline/40">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="写下你的评论…"
                rows={3}
                className="w-full resize-none rounded-lg border-0 bg-paper-50 p-3 text-sm text-ink placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-hairline"
                maxLength={2000}
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-ink-300">{commentText.length}/2000</span>
                <button
                  type="submit"
                  disabled={!commentText.trim() || submittingComment}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition active:scale-95 ${
                    commentText.trim() && !submittingComment
                      ? "bg-gradient-to-r from-ink to-oxblood text-paper shadow-lg shadow-ink/15"
                      : "bg-paper-200 text-ink-300"
                  }`}
                >
                  {submittingComment ? "发送中…" : "发送"}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="mb-4 rounded-[16px] bg-paper p-4 text-center shadow-sm ring-1 ring-hairline/40">
            <p className="text-sm text-ink-400">登录后即可评论</p>
            <Link
              href="/login"
              className="mt-2 inline-block rounded-full bg-gradient-to-r from-ink to-oxblood px-5 py-1.5 text-sm font-semibold text-paper shadow-lg shadow-ink/15"
            >
              去登录
            </Link>
          </div>
        )}

        {/* Comments list */}
        <div className="space-y-3">
          {allComments.map((comment) => {
            const agentProfileId = comment.agentId || comment.authorId;
            const agentCoverSrc = comment.agentCoverUrl
              ? normalizeLifeAgentCoverImgSrc(comment.agentCoverUrl)
              : DEFAULT_COVER_URL;

            return (
            <div
              key={comment.id}
              className={`rounded-[16px] p-3 shadow-sm ring-1 ${
                comment.isAgentReply
                  ? "bg-gradient-to-r from-paper-50/80 to-paper/60 ring-hairline/50"
                  : "bg-paper ring-hairline/40"
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                {comment.isAgentReply && agentProfileId ? (
                  <Link
                    href={`/life-agents/${agentProfileId}`}
                    className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-paper-200/60 ring-1 ring-hairline/30 transition hover:ring-hairline/45"
                    aria-label={`查看 ${comment.agentName || "Agent"} 的资料`}
                  >
                    <LifeAgentCoverImage
                      src={agentCoverSrc}
                      alt=""
                      fill
                      compact
                      className="object-cover"
                      sizes="32px"
                    />
                  </Link>
                ) : (
                  <UserAvatar
                    avatarUrl={comment.authorAvatarUrl}
                    name={comment.authorName}
                    size="sm"
                    className="ring-0"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">
                    {comment.isAgentReply ? (
                      agentProfileId ? (
                        <Link
                          href={`/life-agents/${agentProfileId}`}
                          className="text-ink-700 transition hover:text-ink"
                        >
                          {comment.agentName || "Agent"}
                        </Link>
                      ) : (
                        <span className="text-ink-700">{comment.agentName || "Agent"}</span>
                      )
                    ) : (
                      comment.authorName
                    )}
                  </p>
                  <p className="text-xs text-ink-300">{timeAgo(comment.createdAt)}</p>
                </div>
                {comment.isAgentReply && (
                  <span className="ml-auto rounded-full bg-paper-100 px-2 py-0.5 text-[10px] font-medium text-ink-600">
                    Agent
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
                {comment.content}
              </p>
            </div>
            );
          })}

          {allComments.length === 0 && (
            <div className="py-8 text-center text-sm text-ink-300">
              还没有评论，快来抢沙发吧～
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
