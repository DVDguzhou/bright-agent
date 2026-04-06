"use client";

import { useRef, useState } from "react";
import { DEFAULT_COVER_PNG_URL } from "@/lib/life-agent-covers";

type Props = {
  coverImageUrl: string;
  onChange: (coverImageUrl: string) => void;
  disabled?: boolean;
};

export function LifeAgentCoverPicker({ coverImageUrl, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");

  const showCustom = Boolean(coverImageUrl.trim());
  const previewSrc = showCustom ? coverImageUrl : DEFAULT_COVER_PNG_URL;

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || disabled) return;
    setUploadErr("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/life-agent-cover", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadErr(
          data.error === "FILE_TOO_LARGE"
            ? "图片不能超过 2MB"
            : data.error === "UNSUPPORTED_TYPE"
              ? "仅支持 PNG、JPG、WebP"
              : "上传失败，请重试"
        );
        return;
      }
      if (typeof data.url === "string") {
        onChange(data.url);
      }
    } catch {
      setUploadErr("上传失败，请检查网络");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-800">封面图</p>
      <p className="text-xs text-slate-500">默认使用统一封面，也可上传自己的图片。</p>

      <div className="relative mx-auto aspect-[4/5] w-full max-w-[200px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        <img src={previewSrc} alt="封面预览" className="absolute inset-0 h-full w-full object-cover" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onPickFile} />
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-rose-300 hover:text-rose-700 disabled:opacity-50"
        >
          {uploading ? "上传中…" : "上传自己的封面"}
        </button>
        {showCustom && (
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => onChange("")}
            className="text-sm text-slate-500 underline hover:text-slate-800"
          >
            恢复默认封面
          </button>
        )}
      </div>

      {uploadErr && <p className="text-sm text-rose-600">{uploadErr}</p>}
    </div>
  );
}
