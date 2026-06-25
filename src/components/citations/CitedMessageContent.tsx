"use client";

import { splitCitationContent } from "@/lib/citations";

export function CitedMessageContent({
  content,
  activeCiteIndex,
  onCiteClick,
}: {
  content: string;
  activeCiteIndex?: number | null;
  onCiteClick?: (citeIndex: number) => void;
}) {
  const parts = splitCitationContent(content);
  const hasCites = parts.some((p) => p.type === "cite");

  if (!hasCites) {
    return <p className="whitespace-pre-wrap">{content}</p>;
  }

  return (
    <p className="whitespace-pre-wrap leading-relaxed">
      {parts.map((part, idx) => {
        if (part.type === "text") {
          return <span key={`t-${idx}`}>{part.value}</span>;
        }
        const isActive = activeCiteIndex === part.citeIndex;
        return (
          <sup key={`c-${idx}`} className="mx-0.5 align-super">
            <button
              type="button"
              onClick={() => onCiteClick?.(part.citeIndex)}
              className={`inline text-[0.65em] font-semibold leading-none underline-offset-2 transition ${
                isActive
                  ? "text-signal-700 underline"
                  : "text-signal-600/90 hover:text-signal-800 hover:underline"
              }`}
              aria-label={`查看引用 ${part.citeIndex}`}
            >
              {part.citeIndex}
            </button>
          </sup>
        );
      })}
    </p>
  );
}
