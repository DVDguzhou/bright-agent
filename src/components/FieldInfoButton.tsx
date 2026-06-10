"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

type FieldInfoButtonProps = {
  title: string;
  body: readonly string[];
  ariaLabel: string;
  className?: string;
};

export function FieldInfoButton({ title, body, ariaLabel, className = "" }: FieldInfoButtonProps) {
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
                {title}
              </h3>
              <div className="mt-3 space-y-2 text-sm leading-relaxed text-ink-500">
                {body.map((line) => (
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
        className={`icon-button h-6 min-h-0 w-6 min-w-0 shrink-0 p-0 text-ink-300 hover:text-ink-500 ${className}`}
        aria-label={ariaLabel}
        title={ariaLabel}
      >
        <Info className="h-3.5 w-3.5" aria-hidden />
      </button>
      {dialog}
    </>
  );
}
