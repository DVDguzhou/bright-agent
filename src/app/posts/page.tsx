"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/UserAvatar";
import { PostCommentPreviewList, type PostCommentPreviewItem } from "@/components/PostCommentPreviewList";
import { resolveCdnUrl } from "@/lib/cdn";

interface ApiPost {
  id: string;
  content: string;
  images: string[];
  visibility?: "public" | "private";
  authorName: string;
  authorEmail: string;
  authorId: string;
  authorAvatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  likes: number;
  commentsCount: number;
  likedByMe: boolean;
  previewComments?: PostCommentPreviewItem[];
}

type FeedTab = "plaza" | "mine";

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

// 骨架屏占位
function PostSkeleton() {
  return (
    <div className="rounded-[20px] bg-paper p-4 shadow-sm ring-1 ring-hairline/40">
      <div className="mb-2 flex items-center gap-2.5">
        <div className="h-9 w-9 animate-pulse rounded-full bg-paper-200" />
        <div className="min-w-0 flex-1">
          <div className="h-4 w-24 animate-pulse rounded bg-paper-200" />
          <div className="mt-1 h-3 w-16 animate-pulse rounded bg-paper-200" />
        </div>
      </div>
      <div className="h-16 animate-pulse rounded bg-paper-200" />
    </div>
  );
}

export default function PostsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const pullStartYRef = useRef<number | null>(null);
  const [pullOffset, setPullOffset] = useState(0);
  const [tab, setTab] = useState<FeedTab>("plaza");

  // 发帖后刷新
  useEffect(() => {
    const onPostCreated = () => {
      resetAndLoad();
    };
    window.addEventListener("post-created", onPostCreated);
    return () => window.removeEventListener("post-created", onPostCreated);
  }, []);

  const fetchPosts = useCallback(async (cursor?: string, isPull?: boolean) => {
    try {
      const scopeParam = tab === "mine" ? "&scope=mine" : "";
      const url = cursor
        ? `/api/posts?cursor=${encodeURIComponent(cursor)}&limit=20${scopeParam}`
        : `/api/posts?limit=20${scopeParam}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("加载失败");
      const data = (await res.json()) as {
        items?: ApiPost[];
        nextCursor?: string;
        hasMore?: boolean;
      };

      if (cursor && !isPull) {
        setPosts((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          const newItems = (data.items || []).filter((p) => !seen.has(p.id));
          return [...prev, ...newItems];
        });
      } else {
        setPosts(data.items || []);
      }
      setNextCursor(data.nextCursor || null);
      setHasMore(!!data.hasMore);
      setError(null);
    } catch {
      if (!cursor) setError("加载动态失败");
    } finally {
      setLoaded(true);
      setLoadingMore(false);
      if (isPull) setPullRefreshing(false);
    }
  }, [tab]);

  const resetAndLoad = useCallback(() => {
    setLoaded(false);
    setNextCursor(null);
    setHasMore(false);
    void fetchPosts();
  }, [fetchPosts]);

  // 首次加载 + 切换 tab 时重置并重新拉取
  useEffect(() => {
    setLoaded(false);
    setPosts([]);
    setNextCursor(null);
    setHasMore(false);
    void fetchPosts();
  }, [fetchPosts]);

  // 滚动到底部加载更多
  useEffect(() => {
    function onScroll() {
      if (loadingMore || !hasMore || !nextCursor) return;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      if (scrollTop + clientHeight >= scrollHeight - 300) {
        setLoadingMore(true);
        void fetchPosts(nextCursor);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [loadingMore, hasMore, nextCursor, fetchPosts]);

  // 点赞乐观更新
  async function handleLike(postId: string) {
    if (!user) {
      router.push("/login");
      return;
    }
    const idx = posts.findIndex((p) => p.id === postId);
    if (idx === -1) return;

    const target = posts[idx];
    const wasLiked = target.likedByMe;
    const nextLikes = wasLiked ? Math.max(0, target.likes - 1) : target.likes + 1;

    // 乐观更新
    setPosts((prev) =>
      prev.map((p, i) =>
        i === idx ? { ...p, likedByMe: !wasLiked, likes: nextLikes } : p
      )
    );

    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { liked: boolean; likes: number };
      setPosts((prev) =>
        prev.map((p, i) =>
          i === idx ? { ...p, likedByMe: data.liked, likes: data.likes } : p
        )
      );
    } catch {
      // 回滚
      setPosts((prev) =>
        prev.map((p, i) =>
          i === idx ? { ...p, likedByMe: wasLiked, likes: target.likes } : p
        )
      );
    }
  }

  // 下拉刷新（触摸）
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const st = window.scrollY || document.documentElement.scrollTop;
    if (st <= 8) {
      pullStartYRef.current = e.touches[0].clientY;
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (pullStartYRef.current == null) return;
    const dy = e.touches[0].clientY - pullStartYRef.current;
    if (dy > 0 && (window.scrollY || document.documentElement.scrollTop) <= 8) {
      setPullOffset(Math.min(80, dy * 0.4));
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    if (pullOffset >= 50 && !pullRefreshing) {
      setPullRefreshing(true);
      setPullOffset(0);
      resetAndLoad();
    } else {
      setPullOffset(0);
    }
    pullStartYRef.current = null;
  }, [pullOffset, pullRefreshing, resetAndLoad]);

  // 删除帖子
  async function handleDelete(postId: string) {
    if (!confirm("确定删除这条动态吗？")) return;
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch {
      alert("删除失败");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-2xl px-3 pb-24 pt-3 sm:px-4"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull refresh indicator */}
      <div
        className="pointer-events-none flex justify-center overflow-hidden transition-[height] duration-200"
        style={{ height: pullOffset > 0 || pullRefreshing ? 48 : 0 }}
      >
        <div className="flex items-center gap-2 text-xs font-medium text-ink-400">
          {pullRefreshing ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-hairline border-t-ink" />
              刷新中…
            </>
          ) : (
            <>松手刷新</>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="mb-3 flex items-center justify-end">
        <Link
          href="/posts/create"
          className="btn-primary inline-flex items-center gap-1 px-4 py-2 text-sm font-semibold"
        >
          + 发帖
        </Link>
      </div>

      {/* 广场 / 我的 切换 */}
      <div className="mb-4 inline-flex rounded-full bg-paper-100/70 p-1 ring-1 ring-hairline/30">
        <button
          type="button"
          onClick={() => setTab("plaza")}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            tab === "plaza" ? "bg-paper text-ink shadow-sm" : "text-ink-400 hover:text-ink-600"
          }`}
        >
          广场
        </button>
        <button
          type="button"
          onClick={() => {
            if (!user) {
              router.push("/login");
              return;
            }
            setTab("mine");
          }}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            tab === "mine" ? "bg-paper text-ink shadow-sm" : "text-ink-400 hover:text-ink-600"
          }`}
        >
          我的
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-oxblood-50 px-4 py-3 text-sm text-oxblood-600">
          {error}
          <button
            type="button"
            onClick={resetAndLoad}
            className="ml-3 font-semibold underline"
          >
            重试
          </button>
        </div>
      )}

      {/* Skeleton while loading */}
      {!loaded && !error && (
        <div className="space-y-3">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      )}

      {loaded && posts.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-paper-50 text-3xl">
            📝
          </div>
          <p className="text-base font-semibold text-ink">
            {tab === "mine" ? "你还没有发布动态" : "还没有动态"}
          </p>
          <p className="mt-1 text-sm text-ink-300">
            {tab === "mine" ? "发布公开或私密动态，让 AI Agent 为你解答" : "发布第一个帖子，让 AI Agent 们为你解答"}
          </p>
          <Link
            href="/posts/create"
            className="btn-primary mt-4 inline-flex px-6 py-2.5 text-sm font-semibold"
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
            className="rounded-[20px] bg-paper p-4 shadow-sm ring-1 ring-hairline/40"
          >
            {/* Author + actions */}
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <UserAvatar
                  avatarUrl={post.authorAvatarUrl}
                  name={post.authorName}
                  email={post.authorEmail}
                  className="ring-0"
                />
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
              {user && user.id === post.authorId && (
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/posts/${post.id}/edit`}
                    className="text-xs text-ink-300 hover:text-ink-500"
                  >
                    编辑
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(post.id)}
                    className="text-xs text-ink-300 hover:text-oxblood-500"
                  >
                    删除
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            <Link href={`/posts/${post.id}`} className="block">
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
                {post.content}
              </p>

              {/* Images preview (max 3 in list) */}
              {post.images && post.images.length > 0 && (
                <div className={`mt-2 grid gap-2 ${post.images.length === 1 ? "grid-cols-1" : post.images.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                  {post.images.slice(0, 3).map((src, idx) => (
                    <div key={idx} className="relative aspect-square overflow-hidden rounded-lg bg-paper-50">
                      <img
                        src={resolveCdnUrl(src)}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              )}
            </Link>

            {/* Actions */}
            <div className="mt-3 flex items-center gap-5 border-t border-hairline/30 pt-2.5">
              <button
                type="button"
                onClick={() => handleLike(post.id)}
                className={`flex items-center gap-1 text-sm transition ${
                  post.likedByMe ? "text-oxblood-500" : "text-ink-300 hover:text-oxblood-400"
                }`}
              >
                <svg className="h-5 w-5" fill={post.likedByMe ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
                {post.likes > 0 ? post.likes : "赞"}
              </button>
              <Link
                href={`/posts/${post.id}`}
                className="flex items-center gap-1 text-sm text-ink-300 hover:text-oxblood transition"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.768 7.5 2.25 7.5 2.25s7.5-.482 7.5-2.25c0-1.768-7.5-2.25-7.5-2.25s-7.5.482-7.5 2.25zM2.25 12.76v3.93c0 1.768 7.5 2.25 7.5 2.25s7.5-.482 7.5-2.25v-3.93M12 15V3.75" />
                </svg>
                {post.commentsCount > 0 ? `${post.commentsCount} 条评论` : "评论"}
              </Link>
            </div>

            <PostCommentPreviewList
              comments={post.previewComments ?? []}
              postId={post.id}
              totalCount={post.commentsCount}
            />
          </motion.article>
        ))}
      </div>

      {loadingMore && (
        <div className="py-4 text-center text-sm text-ink-300">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-hairline border-t-ink" />
          <span className="ml-2">加载更多…</span>
        </div>
      )}
    </motion.div>
  );
}
