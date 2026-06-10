"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

const ROW1 = "qwertyuiop".split("");
const ROW2 = "asdfghjkl".split("");
const ROW3 = "zxcvbnm".split("");

const NUMBERS = "1234567890".split("");
const SYMBOLS_ROW1 = "!@#$%^&*()".split("");
const SYMBOLS_ROW2 = "-_=+[]{}|;':\"".split("");

type KeyMode = "alpha" | "number";

type ChatVirtualKeyboardProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  suggestions?: { label: string; value: string }[];
  onSuggestionClick?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  inputLabel?: string;
};

export function ChatVirtualKeyboard({
  value,
  onChange,
  onSubmit,
  suggestions = [],
  onSuggestionClick,
  disabled = false,
  placeholder = "输入或按住说话",
  inputLabel,
}: ChatVirtualKeyboardProps) {
  const [shift, setShift] = useState(false);
  const [mode, setMode] = useState<KeyMode>("alpha");
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const insert = useCallback(
    (char: string) => {
      if (disabled) return;
      onChange(value + char);
    },
    [value, onChange, disabled]
  );

  const backspace = useCallback(() => {
    if (disabled || value.length === 0) return;
    onChange(value.slice(0, -1));
  }, [value, onChange, disabled]);

  const handleKey = useCallback(
    (char: string) => {
      if (disabled) return;
      const c = shift ? char.toUpperCase() : char.toLowerCase();
      insert(c);
      if (shift) setShift(false);
    },
    [insert, shift, disabled]
  );

  const handleNumberKey = useCallback(
    (char: string) => {
      if (disabled) return;
      insert(char);
    },
    [insert, disabled]
  );

  // 点击键盘外部收起
  useEffect(() => {
    if (!expanded) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [expanded]);

  const Key = ({
    children,
    onClick,
    className = "",
    wide,
  }: {
    children: React.ReactNode;
    onClick: () => void;
    className?: string;
    wide?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-[44px] items-center justify-center rounded-md border border-ink/10 bg-white px-2 text-base font-semibold text-ink-600 shadow-[0_1px_2px_rgba(17,21,19,0.05)] transition active:scale-[0.97] disabled:opacity-50 sm:min-h-[48px] ${
        wide ? "flex-1 min-w-0" : "min-w-[28px] sm:min-w-[32px]"
      } ${className}`}
    >
      {children}
    </button>
  );

  // 收起状态：仅显示输入条
  if (!expanded) {
    return (
      <div ref={containerRef} className="flex flex-col">
        <div className="app-panel flex items-center gap-2 px-3 py-2.5 sm:px-4">
          <button
            type="button"
            disabled={disabled}
            className="icon-button h-9 w-9 shrink-0 text-ink-400 disabled:opacity-50"
            aria-label="添加"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => !disabled && setExpanded(true)}
            className="min-h-[36px] flex-1 rounded-md bg-paper-200/80 px-4 py-2 text-left text-[15px] text-ink-700 outline-none transition active:scale-[0.99] disabled:opacity-50"
          >
            {value ? (
              <span className="line-clamp-2 break-words">{value}</span>
            ) : (
              <span className="text-ink-300">{placeholder}</span>
            )}
          </button>
          <button
            type="button"
            disabled={disabled}
            className="icon-button h-9 w-9 shrink-0 text-ink-400 disabled:opacity-50"
            aria-label="表情"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // 展开状态：完整键盘
  return (
    <div
      ref={containerRef}
      className="flex flex-col rounded-t-lg border border-ink/10 border-b-0 bg-white/95 shadow-[0_-12px_36px_rgba(17,21,19,0.12)] backdrop-blur-xl"
      style={{ maxHeight: "min(420px, 45vh)" }}
    >
      {/* 输入条 */}
      <div className="flex items-center gap-2 border-b border-ink/10 bg-white/90 px-3 py-2.5 sm:px-4">
        <button
          type="button"
          disabled={disabled}
          className="icon-button h-9 w-9 shrink-0 text-ink-400 disabled:opacity-50"
          aria-label="添加"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <div className="min-h-[40px] flex-1 rounded-md bg-paper-200/90 px-4 py-2.5">
          <div className="min-h-[20px] whitespace-pre-wrap break-words text-[15px] leading-6 text-ink-700">
            {value || <span className="text-ink-300">{placeholder}</span>}
          </div>
          {inputLabel && <p className="mt-0.5 text-[10px] text-ink-300">{inputLabel}</p>}
        </div>
        <button
          type="button"
          disabled={disabled}
          className="icon-button h-9 w-9 shrink-0 text-ink-400 disabled:opacity-50"
          aria-label="表情"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* 候选栏 */}
      {suggestions.length > 0 && (
        <div className="flex gap-2 overflow-x-auto border-b border-hairline/50 px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {suggestions.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onSuggestionClick?.(item.value)}
              disabled={disabled}
              className="chip shrink-0 px-3.5 py-2 transition active:scale-95 disabled:opacity-50"
            >
              {item.label}
            </button>
          ))}
          <span className="ml-1 flex shrink-0 items-center text-ink-300">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
      )}

      {/* 键盘区域 */}
      <div className="flex flex-1 flex-col gap-1.5 overflow-auto p-2 sm:gap-2 sm:p-3">
        {mode === "alpha" ? (
          <>
            <div className="flex justify-center gap-1">
              {ROW1.map((c) => (
                <Key key={c} onClick={() => handleKey(c)}>
                  {shift ? c.toUpperCase() : c}
                </Key>
              ))}
            </div>
            <div className="flex justify-center gap-1">
              {ROW2.map((c) => (
                <Key key={c} onClick={() => handleKey(c)}>
                  {shift ? c.toUpperCase() : c}
                </Key>
              ))}
            </div>
            <div className="flex justify-center gap-1">
              <Key onClick={() => setShift((s) => !s)} className="bg-paper-200">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </Key>
              {ROW3.map((c) => (
                <Key key={c} onClick={() => handleKey(c)}>
                  {shift ? c.toUpperCase() : c}
                </Key>
              ))}
              <Key onClick={backspace} className="bg-paper-200">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l2-2m0 0L7 8m-4 4l2-2m0 0l2-2" />
                </svg>
              </Key>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-center gap-1">
              {NUMBERS.map((c) => (
                <Key key={c} onClick={() => handleNumberKey(c)}>
                  {c}
                </Key>
              ))}
            </div>
            <div className="flex justify-center gap-1">
              {SYMBOLS_ROW1.map((c) => (
                <Key key={c} onClick={() => handleNumberKey(c)}>
                  {c}
                </Key>
              ))}
            </div>
            <div className="flex justify-center gap-1">
              {SYMBOLS_ROW2.map((c) => (
                <Key key={c} onClick={() => handleNumberKey(c)}>
                  {c}
                </Key>
              ))}
            </div>
          </>
        )}

        {/* 底部功能行：123 | 表情 | 空格 | 发送 */}
        <div className="flex items-center gap-1.5">
          <Key onClick={() => setMode((m) => (m === "alpha" ? "number" : "alpha"))} wide className="text-sm">
            {mode === "alpha" ? "123" : "ABC"}
          </Key>
          <Key onClick={() => {}} wide className="bg-paper-200 text-ink-500">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </Key>
          <Key onClick={() => insert(" ")} wide className="text-sm text-ink-500">
            空格
          </Key>
          <Key
            onClick={onSubmit}
            wide
            className="border-ink bg-ink text-paper shadow-[0_10px_24px_rgba(17,21,19,0.16)] hover:bg-black"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3.72 2.94a.75.75 0 0 1 .8-.12l11.5 5.5a.75.75 0 0 1 0 1.36l-11.5 5.5A.75.75 0 0 1 3.45 14.5l1.34-4.05H9.5a.75.75 0 0 0 0-1.5H4.8L3.45 4.9a.75.75 0 0 1 .27-.96Z" />
            </svg>
          </Key>
        </div>
      </div>

      {/* 系统栏：语言 | 麦克风 */}
      <div className="flex items-center justify-between border-t border-ink/10 bg-white/80 px-4 py-2">
        <button
          type="button"
          disabled={disabled}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition hover:bg-paper-200 disabled:opacity-50"
          aria-label="切换语言"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0v.5a2.5 2.5 0 004.5 1.5V12m0-8.565A2.5 2.5 0 0012 3.5V5a2 2 0 012 2 2 2 0 104 0V3.5a2.5 2.5 0 00-4.5-1.5z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-xs text-ink-400 underline-offset-2 hover:underline"
        >
          收起键盘
        </button>
        <button
          type="button"
          disabled={disabled}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition hover:bg-paper-200 disabled:opacity-50"
          aria-label="语音输入"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 013-3V5a3 3 0 116 0v6a3 3 0 013 3z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
