import { sourceTypeLabel } from "@/lib/citations";

export function SourceTypeBadge({
  sourceType,
  label,
}: {
  sourceType?: string;
  label?: string;
}) {
  const text = sourceTypeLabel(sourceType, label);
  return (
    <span className="inline-flex rounded border border-hairline bg-paper-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-500">
      {text}
    </span>
  );
}
