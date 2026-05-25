"use client";

import { useRef, useState } from "react";
import { LifeAgentCoverImage } from "@/components/LifeAgentCoverImage";
import { getDisplayAvatar } from "@/lib/avatar";

type ProfileAvatarEditorProps = {
  avatarUrl?: string | null;
  name?: string | null;
  email: string;
  onUpdated: (avatarUrl: string | null) => void;
  size?: "md" | "lg";
};

export function ProfileAvatarEditor({
  avatarUrl,
  name,
  email,
  onUpdated,
  size = "lg",
}: ProfileAvatarEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displaySrc = getDisplayAvatar({ avatarUrl, name, email });
  const boxClass = size === "lg" ? "h-16 w-16" : "h-12 w-12";
  const iconClass = size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5";

  const uploadAndSave = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch("/api/upload/life-agent-cover", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const uploadData = (await uploadRes.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!uploadRes.ok || typeof uploadData.url !== "string") {
        setError(
          uploadData.error === "FILE_TOO_LARGE"
            ? "图片不能超过 2MB"
            : uploadData.error === "UNSUPPORTED_TYPE"
              ? "仅支持 PNG、JPG、WebP"
              : "上传失败，请重试",
        );
        return;
      }

      const patchRes = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ avatarUrl: uploadData.url }),
      });
      const patchData = (await patchRes.json().catch(() => ({}))) as { avatarUrl?: string | null; error?: string };
      if (!patchRes.ok) {
        setError("保存头像失败，请重试");
        return;
      }
      onUpdated(patchData.avatarUrl ?? uploadData.url);
    } catch {
      setError("上传失败，请检查网络");
    } finally {
      setUploading(false);
    }
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("请选择图片文件");
      return;
    }
    await uploadAndSave(file);
  };

  const resetAvatar = async () => {
    setError(null);
    setUploading(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ avatarUrl: "" }),
      });
      if (!res.ok) {
        setError("恢复默认头像失败");
        return;
      }
      onUpdated(null);
    } catch {
      setError("操作失败，请重试");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className={`group relative ${boxClass} shrink-0 overflow-hidden rounded-full ring-1 ring-black/5 disabled:opacity-60`}
        aria-label="更换头像"
        title="更换头像（同步更新人生 Agent 封面）"
      >
        <LifeAgentCoverImage src={displaySrc} alt="" fill compact className="object-cover" sizes="64px" />
        <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/10 sm:hidden">
          <svg className="h-3 w-3 text-slate-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          </svg>
        </span>
        <span className="absolute inset-0 hidden items-center justify-center bg-black/0 transition group-hover:bg-black/25 sm:flex">
          <span className="rounded-full bg-white/90 p-1.5 opacity-0 shadow-sm transition group-hover:opacity-100 group-active:opacity-100">
            {uploading ? (
              <span className={`block ${iconClass} animate-spin rounded-full border-2 border-slate-300 border-t-slate-700`} />
            ) : (
              <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </span>
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={onPickFile}
      />
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
        <span>点头像更换</span>
        {avatarUrl ? (
          <button type="button" className="text-slate-400 underline hover:text-slate-700" onClick={resetAvatar} disabled={uploading}>
            恢复默认
          </button>
        ) : null}
      </div>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      <p className="max-w-[14rem] text-[10px] leading-4 text-slate-400">头像会同步为你名下人生 Agent 的封面</p>
    </div>
  );
}
