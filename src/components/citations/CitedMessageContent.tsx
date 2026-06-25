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
  if (parts.length === 0) {
    return <p className="whitespace-pre-wrap">{content}</p>;
  }

  return (
    <p className="whitespace-pre-wrap">
      {parts.map((part, idx) => {
        if (part.type === "text") {
          return <span key={`t-${idx}`}>{part.value}</span>;
        }
        const isActive = activeCiteIndex === part.citeIndex;
        return (
          <sup key={`c-${idx}`}>
            <button
              type="button"
              onClick={() => onCiteClick?.(part.citeIndex)}
              className={`mx-0.5 inline-flex min-h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded text-[10px] font-semibold leading-none transition ${
                isActive
                  ? "bg-signal-600 text-paper-50"
                  : "bg-paper-200 text-ink-500 hover:bg-signal-100 hover:text-signal-800"
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
