"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

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
            className="fixed inset-0 z-[9999] flex items-end justify-center bg-ink/35 p-4 backdrop-blur-sm sm:items-center"
            role="presentation"
            onClick={() => setOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="app-panel w-full max-w-sm px-5 py-4 shadow-[0_24px_70px_rgba(17,21,19,0.18)]"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id={titleId} className="text-base font-semibold text-ink">
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
                className="btn-primary mt-4 w-full"
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
        className={`icon-button h-6 min-h-0 w-6 min-w-0 shrink-0 p-0 text-current ${className}`}
        aria-label="什么是心智"
        title="什么是心智"
      >
        <Info className="h-3 w-3" aria-hidden />
      </button>
      {dialog}
    </>
  );
}
