export function StatCell({
  value,
  label,
  sub,
  valueClass,
}: {
  value: string | number;
  label: string;
  sub: string;
  valueClass?: string;
}) {
  return (
    <div className="px-3 py-3 text-center">
      <p className={`text-2xl font-semibold tabular-nums leading-none ${valueClass ?? "text-ink"}`}>{value}</p>
      <p className="mt-2 text-[11px] font-medium text-ink-600">{label}</p>
      <p className="mt-0.5 text-[11px] text-ink-400">{sub}</p>
    </div>
  );
}
