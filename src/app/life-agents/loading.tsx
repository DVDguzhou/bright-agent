/** 路由级骨架：与发现页 LifeAgentDiscoverCard 的真实形态一致（4:5 平面封面 + 发丝线 + 文字行） */
export default function Loading() {
  return (
    <div className="-mx-1 space-y-4 pb-4 sm:mx-0 sm:space-y-5" aria-live="polite">
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-1 pb-3">
        <p className="text-sm text-ink-400">加载中…</p>
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-hairline border-t-ink" aria-hidden />
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-9 lg:grid-cols-4 xl:grid-cols-5">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="min-h-0">
            <div className="w-full animate-pulse bg-paper-200" style={{ aspectRatio: "4 / 5" }} />
            <div className="mt-2.5 space-y-1.5 border-t border-hairline pt-2.5">
              <div className="h-3.5 w-3/5 animate-pulse bg-paper-200" />
              <div className="h-3 w-full animate-pulse bg-paper-200" />
              <div className="h-3 w-2/3 animate-pulse bg-paper-200" />
              <div className="h-2.5 w-4/5 animate-pulse bg-paper-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
