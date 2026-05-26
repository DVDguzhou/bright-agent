"use client";

import { LifeAgentCoverImage } from "@/components/LifeAgentCoverImage";
import { getDisplayAvatar } from "@/lib/avatar";

type UserAvatarProps = {
  avatarUrl?: string | null;
  name?: string | null;
  email?: string | null;
  size?: "sm" | "md";
  className?: string;
};

export function UserAvatar({
  avatarUrl,
  name,
  email,
  size = "md",
  className = "",
}: UserAvatarProps) {
  const src = getDisplayAvatar({ avatarUrl, name, email });
  const box = size === "sm" ? "h-8 w-8" : "h-9 w-9";

  return (
    <div
      className={`relative ${box} shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#FFF176] to-[#FF80AB] ring-2 ring-paper ${className}`.trim()}
    >
      <LifeAgentCoverImage
        src={src}
        alt=""
        fill
        compact
        className="object-cover"
        sizes={size === "sm" ? "32px" : "36px"}
      />
    </div>
  );
}
