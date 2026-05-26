export type FeedbackSummaryResponse = {
  unreadCount?: number;
  recent?: unknown[];
  ratings?: { recent?: unknown[] };
};

export function readUnreadCount(data: FeedbackSummaryResponse | null | undefined): number {
  const n = data?.unreadCount;
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export async function markAgentNotificationsRead(): Promise<number> {
  const res = await fetch("/api/life-agents/feedback/mark-read", {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) return NaN;
  const data = (await res.json().catch(() => ({}))) as { unreadCount?: number };
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("notifications-seen"));
  }
  return typeof data.unreadCount === "number" ? data.unreadCount : 0;
}

export async function fetchAgentNotificationUnreadCount(): Promise<number> {
  const res = await fetch("/api/life-agents/feedback/all", { credentials: "include" });
  if (!res.ok) return 0;
  const data = (await res.json().catch(() => null)) as FeedbackSummaryResponse | null;
  return readUnreadCount(data);
}
