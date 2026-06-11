import {
  FEEDBACK_POSITIVE_BADGE,
  SEVERITY_BADGE,
  severityFromFeedbackType,
} from "@/lib/severity-style";

export function feedbackTypeLabel(type: string): string {
  if (type === "helpful") return "有帮助";
  if (type === "not_specific") return "不够具体";
  if (type === "not_suitable") return "不适合我";
  if (type === "factual_error") return "事实错误";
  if (type === "contradiction") return "前后矛盾";
  if (type === "too_confident") return "过度自信";
  return type;
}

export function feedbackTypeBadgeClass(type: string): string {
  if (type === "helpful") {
    return `rounded px-2 py-0.5 text-[11px] font-medium ${FEEDBACK_POSITIVE_BADGE}`;
  }
  const tier = severityFromFeedbackType(type);
  const base = "rounded px-2 py-0.5 text-[11px] font-medium";
  return tier ? `${base} ${SEVERITY_BADGE[tier]}` : `${base} bg-paper-200 text-ink-600`;
}
