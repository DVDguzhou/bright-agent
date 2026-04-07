import type { ReactNode } from "react";

/**
 * 抵消根 layout 里 main 的 px-4，让创建页背景铺满视口宽度（全站已为薰衣草渐变底）。
 */
export default function LifeAgentCreateLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative -mx-4 min-h-0 w-[calc(100%+2rem)] max-w-none">
      {children}
    </div>
  );
}
