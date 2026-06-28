"use client";

import { useState } from "react";
import type { CitationReference } from "@/lib/citations";
import { SourceTypeBadge } from "@/components/citations/SourceTypeBadge";

function shortCitationPreview(value?: string) {
  const text = (value || "").trim();
  if (text.length <= 44) return text;
  return `${text.slice(0, 44)}...`;
}

export function CitationSourceCard({
  citation,
  active,
  onClick,
}: {
  citation: CitationReference;
  active?: boolean;
  onClick?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const preview = shortCitationPreview(citation.displayExcerpt || citation.excerpt);
  // 原文：命中片段的原始文本（chunk 级），用于让买方核对，而非再加工摘要。
  const original = (citation.fullContent || "").trim();
  // 仅当原文比预览更长（有可核对的额外内容）时才提供展开。
  const hasOriginal =
    original.length > 0 &&
    original.replace(/\s+/g, "") !== (preview || "").replace(/[.\s]+/g, "").replace(/\.\.\.$/, "");
  const chunkIndex =
    citation.chunkIndex == null || citation.chunkIndex === ""
      ? null
      : Number.parseInt(String(citation.chunkIndex), 10);

  return (
    <div
      className={`w-full rounded border px-3 py-2.5 text-left transition ${
        active
          ? "border-signal-300 bg-signal-50/60"
          : "border-hairline bg-paper-50 hover:border-ink-300 hover:bg-paper-100"
      }`}
    >
      <button type="button" onClick={onClick} className="block w-full text-left">
        <div className="flex flex-wrap items-center gap-2">
          {citation.citeIndex != null && (
            <span className="text-[11px] font-semibold text-ink-400">[{citation.citeIndex}]</span>
          )}
          <SourceTypeBadge sourceType={citation.sourceType} label={citation.sourceTypeLabel} />
        </div>
        <p className="mt-1.5 text-sm font-medium text-ink">{citation.title}</p>
        {(citation.parentTitle || chunkIndex) && (
          <p className="mt-0.5 text-[11px] leading-4 text-ink-400">
            {citation.parentTitle && citation.parentTitle !== citation.title
              ? `相关经历：${citation.parentTitle}`
              : "相关经历片段"}
            {chunkIndex ? ` · 片段 ${chunkIndex}` : ""}
          </p>
        )}
        {preview && !expanded && (
          <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-ink-500">
            {preview}
          </p>
        )}
      </button>

      {expanded && original && (
        <div className="mt-1.5 rounded bg-paper/60 px-2.5 py-2 ring-1 ring-hairline/40">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-ink-400">原文片段</p>
          <p className="max-h-60 overflow-y-auto whitespace-pre-wrap text-xs leading-5 text-ink-600">
            {original}
          </p>
        </div>
      )}

      {hasOriginal && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 text-[11px] font-medium text-signal-600 transition hover:text-signal-700"
        >
          {expanded ? "收起原文" : "展开看原文"}
        </button>
      )}
    </div>
  );
}
