"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { CitationReference } from "@/lib/citations";
import { parseCiteIndex } from "@/lib/citations";
import { CitationSourceCard } from "@/components/citations/CitationSourceCard";

export function CitationPanel({
  references,
  activeCiteIndex,
  onSelectCiteIndex,
  open,
  onClose,
  variant = "sidebar",
}: {
  references: CitationReference[];
  activeCiteIndex?: number | null;
  onSelectCiteIndex: (index: number) => void;
  open: boolean;
  onClose: () => void;
  variant?: "sidebar" | "sheet";
}) {
  if (!open || references.length === 0) return null;

  const sorted = [...references].sort(
    (a, b) => (parseCiteIndex(a.citeIndex) ?? 999) - (parseCiteIndex(b.citeIndex) ?? 999)
  );
  const active =
    sorted.find((r) => parseCiteIndex(r.citeIndex) === activeCiteIndex) ?? sorted[0];
  const others = sorted.filter((r) => r.id !== active.id);

  const panelBody = (
    <>
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">引用来源</h2>
        {variant === "sheet" && (
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-ink-400 hover:bg-paper-100 hover:text-ink"
            aria-label="关闭引用面板"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">当前来源</p>
          <CitationSourceCard
            citation={active}
            active
            onClick={() => {
              const idx = parseCiteIndex(active.citeIndex);
              if (idx) onSelectCiteIndex(idx);
            }}
          />
        </section>
        {others.length > 0 && (
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">更多来源</p>
            <div className="space-y-2">
              {others.map((item) => (
                <CitationSourceCard
                  key={`${item.sourceType}-${item.id}`}
                  citation={item}
                  active={parseCiteIndex(item.citeIndex) === activeCiteIndex}
                  onClick={() => {
                    const idx = parseCiteIndex(item.citeIndex);
                    if (idx) onSelectCiteIndex(idx);
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );

  if (variant === "sidebar") {
    return (
      <aside className="hidden h-full w-80 shrink-0 flex-col border-l border-hairline bg-paper lg:flex">
        {panelBody}
      </aside>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="关闭引用面板"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-ink/35 lg:hidden"
            onClick={onClose}
          />
          <motion.aside
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-[111] flex max-h-[min(78dvh,520px)] flex-col rounded-t-lg border border-hairline bg-paper shadow-glow lg:hidden"
          >
            {panelBody}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export function CitationSourceChips({
  references,
  activeCiteIndex,
  onOpen,
}: {
  references: CitationReference[];
  activeCiteIndex?: number | null;
  onOpen: (citeIndex?: number) => void;
}) {
  if (references.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {references.map((ref) => {
        const idx = parseCiteIndex(ref.citeIndex);
        const active = idx != null && idx === activeCiteIndex;
        return (
          <button
            key={`${ref.sourceType}-${ref.id}`}
            type="button"
            onClick={() => onOpen(idx ?? undefined)}
            className={`max-w-full truncate rounded border px-2 py-0.5 text-[11px] transition ${
              active
                ? "border-signal-300 bg-signal-50 text-signal-800"
                : "border-hairline bg-paper-50 text-ink-500 hover:border-ink-300 hover:text-ink-700"
            }`}
          >
            {ref.title}
          </button>
        );
      })}
    </div>
  );
}
