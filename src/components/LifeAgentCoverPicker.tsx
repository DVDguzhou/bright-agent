"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import {
  DEFAULT_COVER_PRESET_KEY,
  LIFE_AGENT_COVER_PRESETS,
  type LifeAgentCoverPresetKey,
} from "@/lib/life-agent-covers";

type Props = {
  coverPresetKey: string;
  coverImageUrl: string;
  /** coverPresetKey 为预设 id；上传自定义图时传 coverImageUrl 并可将 preset 置空由父组件再默认 */
  onChange: (next: { coverPresetKey: string; coverImageUrl: string }) => void;
  disabled?: boolean;
};

export function LifeAgentCoverPicker({ coverPresetKey, coverImageUrl, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");

  const effectivePreset = (coverPresetKey || DEFAULT_COVER_PRESET_KEY) as LifeAgentCoverPresetKey;
  const showCustom = Boolean(coverImageUrl.trim());

  const pickPreset = (key: LifeAgentCoverPresetKey) => {
    onChange({ coverPresetKey: key, coverImageUrl: "" });
    setUploadErr("");
  };

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
        onChange({ coverPresetKey: "", coverImageUrl: data.url });
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
      <p className="text-xs text-slate-500">可选预设插画，或上传自己的图片（将覆盖预设）。</p>

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-4 md:grid-cols-8">
        {LIFE_AGENT_COVER_PRESETS.map((p) => {
          const active = !showCustom && effectivePreset === p.key;
          return (
            <button
              key={p.key}
              type="button"
              disabled={disabled || uploading}
              title={p.label}
              onClick={() => pickPreset(p.key)}
              className={`relative aspect-square overflow-hidden rounded-xl ring-2 transition ${
                active ? "ring-rose-500 ring-offset-2" : "ring-transparent hover:ring-slate-200"
              } disabled:opacity-50`}
            >
              <Image src={p.file} alt={p.label} fill className="object-cover" sizes="80px" />
            </button>
          );
        })}
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
        {showCustom ? (
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => pickPreset(effectivePreset)}
            className="text-sm text-slate-500 underline hover:text-slate-800"
          >
            改回使用预设
          </button>
        ) : null}
      </div>

      {showCustom ? (
        <div className="relative mx-auto aspect-[4/5] w-full max-w-[200px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          <Image src={coverImageUrl} alt="自定义封面" fill className="object-cover" sizes="200px" unoptimized />
        </div>
      ) : null}

      {uploadErr ? <p className="text-sm text-rose-600">{uploadErr}</p> : null}
    </div>
  );
}
