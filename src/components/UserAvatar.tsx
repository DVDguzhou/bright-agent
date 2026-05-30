"use client";

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
      className={`relative ${box} shrink-0 overflow-hidden rounded-full bg-paper-100 ring-2 ring-paper ${className}`.trim()}
    >
      <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" decoding="async" />
    </div>
  );
}
