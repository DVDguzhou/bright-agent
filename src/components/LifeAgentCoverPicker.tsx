"use client";

import { useRef, useState } from "react";
import { DEFAULT_COVER_URL } from "@/lib/life-agent-covers";
import { patchUserAvatarFromCoverUrl } from "@/lib/sync-user-avatar";

type Props = {
  coverImageUrl: string;
  onChange: (coverImageUrl: string) => void;
  onAvatarSynced?: () => void;
  disabled?: boolean;
  accent?: "default" | "pastel";
};

export function LifeAgentCoverPicker({ coverImageUrl, onChange, onAvatarSynced, disabled, accent = "default" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");

  const showCustom = Boolean(coverImageUrl.trim());
  const previewSrc = showCustom ? coverImageUrl : DEFAULT_COVER_URL;

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
        const synced = await patchUserAvatarFromCoverUrl(data.url);
        if (synced) {
          onAvatarSynced?.();
        } else {
          setUploadErr("封面已上传，但头像同步失败，保存资料后会再试一次");
        }
      }
    } catch {
      setUploadErr("上传失败，请检查网络");
    } finally {
      setUploading(false);
    }
  };

  const pastel = accent === "pastel";

  return (
    <div className="space-y-3">
      <p className={`text-sm font-medium ${pastel ? "text-ink" : "text-ink-700"}`}>封面图</p>
      <p className="text-xs text-ink-400">默认使用统一封面，也可上传自己的图片。上传封面会同步更新你的头像。</p>

      <div
        className={`relative mx-auto aspect-[4/5] w-full max-w-[200px] overflow-hidden rounded-lg border bg-white ${
          pastel
            ? "border-ink/10 shadow-[0_12px_36px_rgba(17,21,19,0.08)]"
            : "border-ink/10"
        }`}
      >
        <img src={previewSrc} alt="封面预览" className="absolute inset-0 h-full w-full object-cover" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onPickFile} />
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className={
            pastel
              ? "btn-secondary disabled:opacity-50"
              : "btn-secondary disabled:opacity-50"
          }
        >
          {uploading ? "上传中…" : "上传自己的封面"}
        </button>
        {showCustom && (
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={async () => {
              onChange("");
              const synced = await patchUserAvatarFromCoverUrl("");
              if (synced) {
                onAvatarSynced?.();
              } else {
                setUploadErr("已恢复默认封面，但头像同步失败，保存资料后会再试一次");
              }
            }}
            className="text-sm text-ink-400 underline hover:text-ink-700"
          >
            恢复默认封面
          </button>
        )}
      </div>

      {uploadErr && <p className="text-sm text-oxblood-600">{uploadErr}</p>}
    </div>
  );
}
