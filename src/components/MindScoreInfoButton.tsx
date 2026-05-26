"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

const EXPLANATION = {
  title: "什么是心智？",
  body: [
    "心智是这个人生 Agent 的成长值，不是百分制，也没有上限。",
    "它反映 Agent 积累了多少真实经历、观点判断、人物关系和说话习惯，以及在对话里被验证、被修正的程度。",
    "数字越高，通常表示这个 Agent 越了解本人、回答越像本人。继续调教，心智会慢慢上涨。",
  ],
} as const;

export function MindScoreInfoButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const titleId = useId();

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const dialog =
    open && portalReady
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/35 p-4 sm:items-center"
            role="presentation"
            onClick={() => setOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="w-full max-w-sm rounded-2xl bg-paper px-5 py-4 shadow-xl ring-1 ring-hairline/40"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id={titleId} className="font-serif text-base font-medium text-ink">
                {EXPLANATION.title}
              </h3>
              <div className="mt-3 space-y-2 text-sm leading-relaxed text-ink-500">
                {EXPLANATION.body.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-4 w-full rounded-full bg-ink py-2.5 text-sm font-medium text-paper active:opacity-90"
              >
                知道了
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={`inline-flex shrink-0 items-center justify-center rounded-full text-current transition hover:bg-paper-200/50 ${className}`}
        aria-label="什么是心智"
        title="什么是心智"
      >
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
      {dialog}
    </>
  );
}
