"use client";

import { useState } from "react";
import type { CitationReference } from "@/lib/citations";
import { SourceTypeBadge } from "@/components/citations/SourceTypeBadge";

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
  const body = citation.fullContent || citation.excerpt;
  const preview = citation.excerpt || body.slice(0, 160);
  const chunkIndex =
    citation.chunkIndex == null || citation.chunkIndex === ""
      ? null
      : Number.parseInt(String(citation.chunkIndex), 10);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded border px-3 py-2.5 text-left transition ${
        active
          ? "border-signal-300 bg-signal-50/60"
          : "border-hairline bg-paper-50 hover:border-ink-300 hover:bg-paper-100"
      }`}
    >
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
            ? `来自：${citation.parentTitle}`
            : "来自知识库条目"}
          {chunkIndex ? ` · 片段 ${chunkIndex}` : ""}
        </p>
      )}
      <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-ink-500">
        {expanded ? body : preview}
      </p>
      {body.length > preview.length && (
        <span
          role="presentation"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
          className="mt-1 inline-block text-xs text-signal-700 hover:underline"
        >
          {expanded ? "收起" : "展开全文"}
        </span>
      )}
    </button>
  );
}
