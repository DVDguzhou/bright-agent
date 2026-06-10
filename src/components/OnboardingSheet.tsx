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
            className="fixed inset-0 z-[60] bg-ink/30 backdrop-blur-sm"
            onClick={onDismiss}
          />

          {/* sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed inset-x-3 bottom-3 z-[61] rounded-lg border border-ink/10 bg-white/95 px-5 pb-[calc(env(safe-area-inset-bottom)+22px)] pt-5 shadow-[0_24px_70px_rgba(17,21,19,0.18)] supports-[backdrop-filter]:backdrop-blur-xl sm:left-1/2 sm:max-w-md sm:-translate-x-1/2"
          >
            {/* drag handle */}
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-ink/12" />

            <h2 className="text-[22px] font-semibold leading-snug text-ink">
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
                  <span className="mt-0.5 shrink-0 rounded-md bg-ink px-2 py-1 text-xs font-semibold text-paper">{step}</span>
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
