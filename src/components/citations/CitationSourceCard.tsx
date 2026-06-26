"use client";

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
  const preview = shortCitationPreview(citation.displayExcerpt || citation.excerpt);
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
            ? `相关经历：${citation.parentTitle}`
            : "相关经历片段"}
          {chunkIndex ? ` · 片段 ${chunkIndex}` : ""}
        </p>
      )}
      {preview && (
        <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-ink-500">
          {preview}
        </p>
      )}
    </button>
  );
}
