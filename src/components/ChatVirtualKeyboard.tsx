"use client";

import React, { useCallback, useState } from "react";

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
  placeholder = "输入内容…",
  inputLabel,
}: ChatVirtualKeyboardProps) {
  const [shift, setShift] = useState(false);
  const [mode, setMode] = useState<KeyMode>("alpha");

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
      className={`flex min-h-[42px] items-center justify-center rounded-xl border border-white/70 bg-white/75 px-2 text-base font-medium text-slate-700 shadow-[0_8px_20px_-16px_rgba(15,23,42,0.25)] backdrop-blur-md transition active:scale-95 disabled:opacity-50 sm:min-h-[44px] ${
        wide ? "flex-1 min-w-0" : "min-w-[28px] sm:min-w-[32px]"
      } ${className}`}
    >
      {children}
    </button>
  );


  return (
    <div className="flex flex-col gap-1.5 rounded-[24px] border border-white/60 bg-white/35 p-2 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.35)] backdrop-blur-2xl sm:gap-2 sm:rounded-[28px] sm:p-3">
      {/* 输入框 */}
      <div className="rounded-[20px] border border-white/55 bg-white/55 px-4 py-3 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:rounded-[22px]">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={false}
          inputMode="none"
          autoComplete="off"
          className="w-full border-0 bg-transparent text-[15px] leading-6 text-slate-800 outline-none placeholder:text-slate-400"
        />
        {inputLabel && (
          <p className="mt-1 text-[10px] text-slate-400 sm:text-[11px]">{inputLabel}</p>
        )}
      </div>

      {/* 候选栏 */}
      {suggestions.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {suggestions.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onSuggestionClick?.(item.value)}
              disabled={disabled}
              className="shrink-0 rounded-full border border-white/70 bg-white/65 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-md transition active:scale-95 hover:border-sky-200/80 hover:text-sky-700 disabled:opacity-50"
            >
              {item.label}
            </button>
          ))}
          <span className="ml-1 flex shrink-0 items-center text-slate-400">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
      )}

      {/* QWERTY / 数字键盘 */}
      <div className="flex flex-col gap-1 sm:gap-1.5">
        {mode === "alpha" ? (
          <>
            <div className="flex justify-center gap-0.5 sm:gap-1">
              {ROW1.map((c) => (
                <Key key={c} onClick={() => handleKey(c)}>
                  {shift ? c.toUpperCase() : c}
                </Key>
              ))}
            </div>
            <div className="flex justify-center gap-0.5 sm:gap-1">
              {ROW2.map((c) => (
                <Key key={c} onClick={() => handleKey(c)}>
                  {shift ? c.toUpperCase() : c}
                </Key>
              ))}
            </div>
            <div className="flex justify-center gap-0.5 sm:gap-1">
              <Key onClick={() => setShift((s) => !s)} className="bg-slate-100/80">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </Key>
              {ROW3.map((c) => (
                <Key key={c} onClick={() => handleKey(c)}>
                  {shift ? c.toUpperCase() : c}
                </Key>
              ))}
              <Key onClick={backspace} className="bg-slate-100/80">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l2-2m0 0L7 8m-4 4l2-2m0 0l2-2"
                  />
                </svg>
              </Key>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-center gap-0.5 sm:gap-1">
              {NUMBERS.map((c) => (
                <Key key={c} onClick={() => handleNumberKey(c)}>
                  {c}
                </Key>
              ))}
            </div>
            <div className="flex justify-center gap-0.5 sm:gap-1">
              {SYMBOLS_ROW1.map((c) => (
                <Key key={c} onClick={() => handleNumberKey(c)}>
                  {c}
                </Key>
              ))}
            </div>
            <div className="flex justify-center gap-0.5 sm:gap-1">
              {SYMBOLS_ROW2.map((c) => (
                <Key key={c} onClick={() => handleNumberKey(c)}>
                  {c}
                </Key>
              ))}
            </div>
          </>
        )}

        {/* 底部功能行 */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <Key onClick={() => setMode((m) => (m === "alpha" ? "number" : "alpha"))} wide className="text-xs">
            {mode === "alpha" ? "123" : "ABC"}
          </Key>
          <Key onClick={() => insert(" ")} wide className="text-xs text-slate-500">
            空格
          </Key>
          <Key
            onClick={onSubmit}
            wide
            className="border-sky-400/80 bg-gradient-to-br from-sky-500 to-cyan-400 text-white shadow-[0_12px_24px_-14px_rgba(14,165,233,0.9)]"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3.72 2.94a.75.75 0 0 1 .8-.12l11.5 5.5a.75.75 0 0 1 0 1.36l-11.5 5.5A.75.75 0 0 1 3.45 14.5l1.34-4.05H9.5a.75.75 0 0 0 0-1.5H4.8L3.45 4.9a.75.75 0 0 1 .27-.96Z" />
            </svg>
          </Key>
        </div>
      </div>
    </div>
  );
}
