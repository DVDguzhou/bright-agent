export default function Loading() {
  return (
    <div className="-mx-1 space-y-4 pb-4 sm:mx-0 sm:space-y-5" aria-live="polite">
      <div className="rounded-[24px] border border-purple-200/40 bg-white/95 px-4 py-3 shadow-[0_10px_36px_-18px_rgba(124,58,237,0.14)] backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-purple-950/90">页面初始化中...</p>
            <p className="mt-1 text-xs text-slate-500">首屏内容和封面资源准备好后再展示页面</p>
          </div>
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-purple-200 border-t-purple-700" aria-hidden />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="flex min-h-0 flex-col overflow-hidden rounded-[22px] border border-purple-200/[0.18] bg-white/[0.96] shadow-[0_4px_22px_rgba(124,58,237,0.06)]"
          >
            <div className="aspect-square w-full shrink-0 animate-pulse bg-gradient-to-br from-violet-100/80 to-fuchsia-100/50" />
            <div className="flex flex-1 flex-col gap-2 p-2.5">
              <div className="min-h-[2.75rem] animate-pulse rounded-md bg-slate-100" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
              <div className="h-4 animate-pulse rounded bg-slate-50" />
              <div className="h-6 animate-pulse rounded bg-slate-50" />
              <div className="min-h-[1.375rem] animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
