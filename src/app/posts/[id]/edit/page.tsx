"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface PostDetail {
  id: string;
  content: string;
  images: string[];
  authorId: string;
  createdAt: string;
}

const MAX_CONTENT_LENGTH = 2000;

export default function PostEditPage() {
  const { id } = useParams() as { id: string };
  const { user, loading } = useAuth();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadImage(file: File) {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/life-agent-cover", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error("上传失败");
      const data = (await res.json().catch(() => ({}))) as { url?: string };
      if (data.url) {
        setImages((prev) => [...prev, data.url!]);
      } else {
        throw new Error("上传失败");
      }
    } catch {
      alert("图片上传失败");
    } finally {
      setUploadingImage(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("请选择图片文件");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("图片大小不能超过 5MB");
      return;
    }
    void uploadImage(file);
    e.target.value = "";
  }

  const fetchPost = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("加载失败");
      const data = (await res.json()) as PostDetail;
      if (!user || data.authorId !== user.id) {
        setError("你没有权限编辑这条帖子");
        setFetchLoading(false);
        return;
      }
      setContent(data.content);
      setImages(data.images || []);
    } catch {
      setError("加载帖子失败");
    } finally {
      setFetchLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    if (!loading && user) {
      fetchPost();
    } else if (!loading && !user) {
      setError("请先登录");
      setFetchLoading(false);
    }
  }, [loading, user, fetchPost]);

  async function handleSubmit() {
    const trimmed = content.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed, images }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message || "保存失败");
      }
      router.push(`/posts/${id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "保存失败");
      setSubmitting(false);
    }
  }

  if (fetchLoading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-purple-200 border-t-purple-700" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-3 pt-20 text-center sm:px-4">
        <p className="text-slate-500">{error}</p>
        <Link href="/posts" className="mt-4 inline-block text-sm text-purple-700 underline">
          返回动态
        </Link>
      </div>
    );
  }

  const trimmed = content.trim();
  const canSubmit = trimmed.length > 0 && !submitting;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-2xl px-3 pb-24 pt-4 sm:px-4"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 active:scale-95"
          aria-label="返回"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-[#111]">编辑帖子</h1>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`rounded-full px-5 py-1.5 text-sm font-semibold transition active:scale-95 ${
            canSubmit
              ? "bg-gradient-to-r from-[#BA68C8] to-[#FF80AB] text-white shadow-lg shadow-fuchsia-500/20"
              : "bg-slate-100 text-slate-400"
          }`}
        >
          {submitting ? "保存中…" : "保存"}
        </button>
      </div>

      <div className="rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04]">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-fuchsia-100 text-sm font-bold text-purple-700">
            {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#111]">{user?.name || "用户"}</p>
            <p className="text-xs text-slate-400">公开发布</p>
          </div>
        </div>

        <textarea
          value={content}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CONTENT_LENGTH) {
              setContent(e.target.value);
            }
          }}
          placeholder="分享你的问题、经验或想法…"
          rows={8}
          className="min-h-[180px] w-full resize-none rounded-xl border-0 bg-transparent px-0 text-[15px] leading-relaxed text-[#111] placeholder:text-slate-400 focus:outline-none focus:ring-0"
          autoFocus
        />

        {/* Existing images preview */}
        {images.length > 0 && (
          <div className={`mt-2 grid gap-2 ${images.length === 1 ? "grid-cols-1" : images.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
            {images.map((src, idx) => (
              <div key={idx} className="relative aspect-square overflow-hidden rounded-lg bg-slate-50">
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white text-xs hover:bg-black/70"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage || images.length >= 9}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-slate-600 ${uploadingImage ? "opacity-50" : ""}`}
              title={images.length >= 9 ? "最多 9 张图片" : "添加图片"}
            >
              {uploadingImage ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-purple-200 border-t-purple-700" />
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
              )}
            </button>
          </div>
          <span className={`text-xs ${trimmed.length > MAX_CONTENT_LENGTH * 0.9 ? "text-amber-500" : "text-slate-400"}`}>
            {trimmed.length}/{MAX_CONTENT_LENGTH}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
