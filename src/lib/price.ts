export function centsToYuanInput(cents: number | null | undefined): string {
  if (!Number.isFinite(cents)) return "";
  const yuan = (Number(cents) / 100).toFixed(2);
  return yuan.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

export function yuanInputToCents(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;

  const yuan = Number(normalized);
  if (!Number.isFinite(yuan) || yuan <= 0) return null;

  return Math.round(yuan * 100);
}
