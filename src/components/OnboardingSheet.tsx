"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "la_onboarding_v1";

export function useOnboarding() {
  const [open, setOpen] = useState(false);
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setOpen(true);
      }
    } catch {
      // storage blocked
    }
  }, []);

  const dismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setPulsing(true);
    setTimeout(() => setPulsing(false), 5000);
  };

  return { open, pulsing, dismiss };
}

export function OnboardingSheet({ open, onDismiss }: { open: boolean; onDismiss: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] bg-ink/30 backdrop-blur-[2px]"
            onClick={onDismiss}
          />

          {/* sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed inset-x-0 bottom-0 z-[61] rounded-t-[28px] bg-paper px-6 pb-[calc(env(safe-area-inset-bottom)+28px)] pt-6 shadow-[0_-12px_48px_rgba(26,23,20,0.14)]"
          >
            {/* drag handle */}
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-hairline/60" />

            <h2 className="font-serif text-[22px] font-medium leading-snug text-ink">
              发现真实人生的智慧
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-400">
              这里的每一张卡片，都是一位愿意分享自己人生经验的真实创作者。
            </p>

            <ul className="mt-5 space-y-3.5">
              {[
                { step: "01", text: "点击任意卡片，查看 Ta 的人生经历与可聊话题" },
                { step: "02", text: "注册账号后，即可向 Ta 提问，获得一手的经验建议" },
              ].map(({ step, text }) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 font-serif text-xs text-ink-200">{step}</span>
                  <span className="text-sm text-ink-600">{text}</span>
                </li>
              ))}
            </ul>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
