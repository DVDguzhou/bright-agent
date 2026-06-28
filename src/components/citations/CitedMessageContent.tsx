"use client";

import { stripCitationMarkers } from "@/lib/citations";

export function CitedMessageContent({
  content,
  activeCiteIndex,
  onCiteClick,
}: {
  content: string;
  activeCiteIndex?: number | null;
  onCiteClick?: (citeIndex: number) => void;
}) {
  void activeCiteIndex;
  void onCiteClick;
  return <p className="whitespace-pre-wrap leading-relaxed">{stripCitationMarkers(content)}</p>;
}
