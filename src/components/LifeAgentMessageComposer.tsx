"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { VoiceInputButton } from "@/components/voice";

const QUICK_EMOJIS = ["😀", "👍", "❤️", "🙏", "😂", "🎉", "🫡", "✨"];

function autoResizeTextarea(textarea: HTMLTextAreaElement | null) {
  if (!textarea) return;
  textarea.style.height = "0px";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
}

export type LifeAgentMessageComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
  placeholder?: string;
  onVoiceFinal?: (text: string) => void;
  onTextareaFocus?: () => void;
  textareaRef?: React.Ref<HTMLTextAreaElement>;
  formRef?: React.Ref<HTMLFormElement>;
  required?: boolean;
  /** 「+」：聊天页打开侧栏；创建页可配合 moreOpen / morePanel 切换 */
  onMoreClick?: () => void;
  moreOpen?: boolean;
  morePanel?: React.ReactNode;
  /** 打开表情或聚焦输入时收起 more 面板（由父组件把 moreOpen 设为 false） */
  onCloseMorePanel?: () => void;
  formClassName?: string;
};

export function LifeAgentMessageComposer({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = "发消息...",
  onVoiceFinal,
  onTextareaFocus,
  textareaRef,
  formRef,
  required,
  onMoreClick,
  moreOpen = false,
  morePanel,
  onCloseMorePanel,
  formClassName = "",
}: LifeAgentMessageComposerProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const showMoreButton = Boolean(onMoreClick || morePanel !== undefined);

  useEffect(() => {
    if (!emojiOpen && !moreOpen) return;
    const onPointer = (e: PointerEvent) => {
      const el = wrapRef.current;
      if (el && !el.contains(e.target as Node)) {
        setEmojiOpen(false);
        onCloseMorePanel?.();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [emojiOpen, moreOpen, onCloseMorePanel]);

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className={`bg-transparent px-0 pb-0 pt-1 sm:px-0 ${formClassName}`.trim()}
    >
      <div ref={wrapRef} className="relative mx-auto w-full max-w-3xl">
        {emojiOpen ? (
          <div className="absolute bottom-full left-0 right-0 z-20 mb-2 flex flex-wrap gap-1.5 rounded-2xl border border-purple-200/[0.22] bg-white/[0.98] p-3 shadow-[0_8px_32px_-8px_rgba(124,58,237,0.12)] backdrop-blur-md">
            {QUICK_EMOJIS.map((em) => (
              <button
                key={em}
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-lg transition hover:bg-purple-50/90"
                onClick={() => {
                  onChange(value + em);
                  setEmojiOpen(false);
                }}
              >
                {em}
              </button>
            ))}
          </div>
        ) : null}
        {moreOpen && morePanel ? (
          <div className="absolute bottom-full left-0 right-0 z-20 mb-2">{morePanel}</div>
        ) : null}
        <div className="flex items-end gap-1.5 rounded-full border border-purple-200/[0.25] bg-white/[0.96] py-1.5 pl-2 pr-1 shadow-[0_3px_18px_rgba(124,58,237,0.06)] backdrop-blur-md sm:gap-2 sm:py-2 sm:pl-3">
          <VoiceInputButton
            onTranscript={(text, isFinal) => {
              if (isFinal && text.trim()) onVoiceFinal?.(text);
            }}
            disabled={disabled}
            size="sm"
            className="!h-9 !w-9 shrink-0 border-purple-200/40 sm:!h-10 sm:!w-10"
          />
          <textarea
            ref={textareaRef}
            onFocus={() => {
              setEmojiOpen(false);
              onCloseMorePanel?.();
              onTextareaFocus?.();
            }}
            className="max-h-32 min-h-[36px] w-full min-w-0 flex-1 resize-none border-0 bg-transparent py-2 text-[15px] leading-5 text-[#111] outline-none placeholder:text-slate-400"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              autoResizeTextarea(e.target);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            rows={1}
            enterKeyHint="send"
          />
          <button
            type="button"
            onClick={() => {
              setEmojiOpen((o) => {
                if (!o) onCloseMorePanel?.();
                return !o;
              });
            }}
            disabled={disabled}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-purple-800/50 transition hover:bg-purple-50/90 disabled:opacity-40"
            aria-label="表情"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" d="M8.5 14.5s1.2 2 3.5 2 3.5-2 3.5-2M9 9h.01M15 9h.01" />
            </svg>
          </button>
          {showMoreButton ? (
            <button
              type="button"
              onClick={() => {
                setEmojiOpen(false);
                onMoreClick?.();
              }}
              disabled={disabled}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-purple-800/50 transition hover:bg-purple-50/90 disabled:opacity-40"
              aria-label="更多功能"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
    </form>
  );
}
