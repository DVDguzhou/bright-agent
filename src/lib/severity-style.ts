/**
 * 克制分级状态色（restrained severity scale）
 *
 * 设计约束：品牌只有 oxblood（强调）+ olive（认证/活跃）+ ink/paper。
 * 多级语义状态（严重度、告警等级）不引入第二个色相，而是用 oxblood 的
 * 明度阶做"热度梯度"，最低档用中性 ink 收尾——越红越深＝越紧急，
 * 渐隐成灰＝仅供参考。全站告警/严重度统一走这里，避免各页把
 * red/orange/yellow 各自压平成同一个 oxblood（留下假装分级的死代码）。
 */
export type SeverityTier = "urgent" | "high" | "medium" | "low";

/** 把后端的 priority 字段（urgent/high/medium/low/…）规整成四档 */
export function severityFromPriority(priority?: string | null): SeverityTier {
  switch (priority) {
    case "urgent":
      return "urgent";
    case "high":
      return "high";
    case "medium":
      return "medium";
    default:
      return "low";
  }
}

/** 圆点：oxblood 明度梯度，最低档转中性 */
export const SEVERITY_DOT: Record<SeverityTier, string> = {
  urgent: "bg-oxblood-600",
  high: "bg-oxblood-400",
  medium: "bg-oxblood-200",
  low: "bg-ink-300",
};

/** 标题文字：随严重度加深，最低档用中性 ink */
export const SEVERITY_TEXT: Record<SeverityTier, string> = {
  urgent: "text-oxblood-700",
  high: "text-oxblood-600",
  medium: "text-ink-700",
  low: "text-ink-500",
};

/** 徽章：响度梯度，实心 oxblood → 浅 oxblood → 纸面阶 */
export const SEVERITY_BADGE: Record<SeverityTier, string> = {
  urgent: "bg-oxblood-600 text-paper-50",
  high: "bg-oxblood-100 text-oxblood-700",
  medium: "bg-paper-300 text-ink-600",
  low: "bg-paper-200 text-ink-400",
};

/** 链接/动作文字：与标题同档但保持可点的强调 */
export const SEVERITY_LINK: Record<SeverityTier, string> = {
  urgent: "text-oxblood-600",
  high: "text-oxblood-600",
  medium: "text-ink-600",
  low: "text-ink-500",
};

/** 中文档位标签 */
export const SEVERITY_LABEL: Record<SeverityTier, string> = {
  urgent: "紧急",
  high: "重要",
  medium: "建议",
  low: "参考",
};

/** 正向反馈（有帮助）— olive 表活跃/正向，非 severity 档位 */
export const FEEDBACK_POSITIVE_BADGE = "bg-olive-400/20 text-olive-600";

/** 把轻反馈类型映射到克制分级四档（helpful 不走 severity） */
export function severityFromFeedbackType(type: string): SeverityTier | null {
  switch (type) {
    case "factual_error":
      return "urgent";
    case "contradiction":
      return "high";
    case "not_specific":
    case "too_confident":
      return "medium";
    case "not_suitable":
      return "low";
    default:
      return null;
  }
}

/** 统计数值文字色：helpful 用 ink，其余走 severity */
export function feedbackTypeValueClass(type: string): string {
  if (type === "helpful") return "text-olive-600";
  const tier = severityFromFeedbackType(type);
  return tier ? SEVERITY_TEXT[tier] : "text-ink";
}
