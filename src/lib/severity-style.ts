export type SeverityTier = "urgent" | "high" | "medium" | "low";

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

export const SEVERITY_DOT: Record<SeverityTier, string> = {
  urgent: "bg-oxblood-600",
  high: "bg-oxblood-400",
  medium: "bg-oxblood-200",
  low: "bg-ink-300",
};

export const SEVERITY_TEXT: Record<SeverityTier, string> = {
  urgent: "text-oxblood-700",
  high: "text-oxblood-600",
  medium: "text-ink-700",
  low: "text-ink-500",
};

export const SEVERITY_BADGE: Record<SeverityTier, string> = {
  urgent: "bg-oxblood-600 text-paper-50",
  high: "bg-oxblood-100 text-oxblood-700",
  medium: "bg-paper-300 text-ink-600",
  low: "bg-paper-200 text-ink-400",
};

export const SEVERITY_LINK: Record<SeverityTier, string> = {
  urgent: "text-oxblood-600",
  high: "text-oxblood-600",
  medium: "text-ink-600",
  low: "text-ink-500",
};

export const SEVERITY_LABEL: Record<SeverityTier, string> = {
  urgent: "紧急",
  high: "重要",
  medium: "建议",
  low: "参考",
};

export const FEEDBACK_POSITIVE_BADGE = "bg-olive-400/20 text-olive-600";

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

export function feedbackTypeValueClass(type: string): string {
  if (type === "helpful") return "text-olive-600";
  const tier = severityFromFeedbackType(type);
  return tier ? SEVERITY_TEXT[tier] : "text-ink";
}
