/**
 * 参考抖音认证标签：黄V（个人认证）风格
 * - 已认证：金色 V 标，紧贴名称
 * - 认证申请中：灰色待审核标识
 */
export function VerificationBadge({ status, size = "md" }: { status: string; size?: "sm" | "md" }) {
  if (status === "verified") {
    const dim = size === "sm" ? "h-4 w-4 min-w-4 text-[9px]" : "h-5 w-5 min-w-5 text-xs";
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full bg-amber-400 font-bold leading-none text-white ${dim}`}
        title="已认证"
        aria-label="已认证"
      >
        V
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span
        className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs text-amber-700"
        title="认证申请中"
      >
        认证中
      </span>
    );
  }
  return null;
}
