import type { ReactNode } from "react";

/**
 * 抵消根 layout 里 main 的 px-4，让创建页背景渐变铺满视口宽度；
 * 与 page 上的 life-agent-create-skin 一起作用。
 */
export default function LifeAgentCreateLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative -mx-4 min-h-0 w-[calc(100%+2rem)] max-w-none">
      {children}
    </div>
  );
}
