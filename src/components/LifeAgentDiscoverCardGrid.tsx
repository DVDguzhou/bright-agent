"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { RatingStars } from "@/components/RatingStars";
import { VerificationBadge } from "@/components/VerificationBadge";
import { lifeAgentCoverShouldBypassOptimizer, resolveLifeAgentCoverUrl } from "@/lib/life-agent-covers";
import type { LifeAgentListItem } from "@/lib/life-agent-feed-search";

const anonymous = "佚";

type Props = {
  profiles: LifeAgentListItem[];
  loading: boolean;
  emptyTitle: string;
  emptySubtitle: string;
  /** 默认公开详情页；管理列表可指向 `/dashboard/life-agents/:id` */
  profileHref?: (id: string) => string;
};

export function LifeAgentDiscoverCardGrid({
  profiles,
  loading,
  emptyTitle,
  emptySubtitle,
  profileHref = (id) => `/life-agents/${id}`,
}: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="flex min-h-0 flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60"
          >
            <div className="aspect-[4/5] w-full shrink-0 animate-pulse bg-gradient-to-br from-slate-100 to-slate-200/90" />
            <div className="flex flex-1 flex-col gap-2 p-2.5">
              <div className="min-h-[2.75rem] animate-pulse rounded-md bg-slate-100" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
              <div className="h-4 animate-pulse rounded bg-slate-50" />
              <div className="h-6 animate-pulse rounded bg-slate-50" />
              <div className="min-h-[1.375rem] animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
        <p className="text-base font-semibold text-slate-900">{emptyTitle}</p>
        <p className="mt-2 text-sm text-slate-500">{emptySubtitle}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
      {profiles.map((profile, index) => {
        const areaLabel = [profile.city, profile.province].filter(Boolean).join(" · ");
        const tags = (profile.expertiseTags ?? []).slice(0, 2);
        const coverUrl = profile.coverUrl || resolveLifeAgentCoverUrl(profile.coverImageUrl, profile.coverPresetKey);
        return (
          <motion.article
            key={profile.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index < 8 ? index * 0.04 : 0 }}
            className="min-h-0"
          >
            <Link href={profileHref(profile.id)} className="group flex h-full min-h-0">
              <div className="flex h-full min-h-[280px] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 transition duration-200 group-hover:shadow-md group-hover:ring-blue-200/60 sm:min-h-[300px]">
                <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden bg-slate-100">
                  {typeof profile.published === "boolean" && (
                    <div
                      className={`absolute left-2 top-2 z-[1] rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm ${
                        profile.published ? "bg-emerald-600 text-white" : "bg-white/95 text-slate-600 ring-1 ring-slate-200/80"
                      }`}
                    >
                      {profile.published ? "已发布" : "未发布"}
                    </div>
                  )}
                  <Image
                    src={coverUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
                    priority={index < 8}
                    unoptimized={lifeAgentCoverShouldBypassOptimizer(coverUrl)}
                  />
                  {(profile.verificationStatus === "verified" || profile.verificationStatus === "pending") && (
                    <div className="absolute right-2 top-2 rounded-full bg-white/90 px-1.5 py-0.5 shadow-sm backdrop-blur-sm">
                      <VerificationBadge status={profile.verificationStatus ?? "none"} size="sm" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 via-black/15 to-transparent p-2.5 pt-12">
                    <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-white drop-shadow-md">
                      {profile.headline}
                    </span>
                  </div>
                </div>
                <div className="flex min-h-0 flex-1 flex-col px-2.5 pb-2.5 pt-2 sm:p-3">
                  <h3 className="line-clamp-2 min-h-[2.75rem] text-[13px] font-semibold leading-snug text-slate-900 sm:text-sm">
                    {profile.displayName}
                  </h3>
                  <p className="line-clamp-1 min-h-[1.125rem] text-[11px] text-slate-400">{areaLabel || "\u00a0"}</p>
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <div className="flex min-w-0 items-center gap-1 text-[11px] text-slate-500">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200/90 text-[10px] font-bold text-slate-600">
                        {(profile.displayName ?? anonymous).slice(0, 1)}
                      </span>
                      <span className="truncate">{profile.creator.name ?? anonymous}</span>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-blue-600">
                      ¥{(profile.pricePerQuestion / 100).toFixed(0)}
                      <span className="text-[10px] font-medium text-slate-400">/问</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                    <RatingStars score={profile.ratings?.averageScore ?? 0} size="sm" />
                    <span>
                      {profile.ratings && profile.ratings.raters > 0
                        ? profile.ratings.averageScore.toFixed(1)
                        : "—"}
                    </span>
                    {profile.ratings && profile.ratings.raters > 0 ? (
                      <span className="text-slate-400">· {profile.ratings.raters} 人评</span>
                    ) : null}
                  </div>
                  <div className="flex-1" aria-hidden />
                  <div className="flex min-h-[1.375rem] flex-wrap content-end gap-1">
                    {tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600/90"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          </motion.article>
        );
      })}
    </div>
  );
}
