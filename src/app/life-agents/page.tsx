"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { RatingStars } from "@/components/RatingStars";
import { VerificationBadge } from "@/components/VerificationBadge";
import { useAuth } from "@/contexts/AuthContext";
import {
  COUNTRY_OPTIONS_FOR_FILTER as COUNTRY_OPTIONS,
  getCityOptionsForFilter as getCityOptions,
  getCountyOptionsForFilter as getCountyOptions,
  getProvinceOptionsForFilter as getProvinceOptions,
} from "@/lib/address-hierarchy";

type LifeAgentListItem = {
  id: string;
  displayName: string;
  headline: string;
  shortBio: string;
  audience: string;
  welcomeMessage: string;
  pricePerQuestion: number;
  expertiseTags: string[];
  sampleQuestions: string[];
  education?: string;
  income?: string;
  job?: string;
  school?: string;
  regions?: string[];
  country?: string;
  province?: string;
  city?: string;
  county?: string;
  verificationStatus?: string;
  knowledgeCount: number;
  soldQuestionPacks: number;
  sessionCount: number;
  ratings?: {
    averageScore: number;
    raters: number;
  };
  creator: {
    name: string | null;
  };
};

const UI = {
  all: "全部",
  allOrAny: "全部 / 不限",
  badge: "本地经验 · 可对话",
  heroTitle: "发现 Agent",
  heroSubtitle: "真实经历做成可对话咨询，按次付费",
  createAgent: "发布",
  profileHome: "我的",
  signup: "注册",
  sectionTitle: "推荐",
  sectionSubtitle: "",
  loading: "加载中...",
  countSuffix: "个",
  keywordSearch: "搜索感兴趣的方向",
  searchPlaceholder: "考研、求职、转行、雅思…",
  searchHint:
    "多关键词用空格或逗号分隔；会自动联想相关词。",
  region: "地区筛选",
  regionHint: "组合地区缩小范围",
  filtersToggle: "地区与筛选",
  emptyTitle: "还没有人生 Agent",
  emptySubtitle:
    "创建第一个，把你的经验变成可对话的咨询页",
  school: "学校",
  education: "学历",
  job: "工作",
  income: "收入",
  area: "地区",
  unrated: "暂无评分",
  ratersSuffix: "人评分",
  perQuestion: "每次提问",
  knowledgeCount: "知识条目",
  soldQuestionPacks: "已售提问包",
  sessionCount: "聊天场次",
  audience: "适合人群",
  anonymous: "佚",
} as const;

const RELATED_TERM_GROUPS: string[][] = [
  ["考研", "就业", "读研", "保研", "调剂"],
  ["求职", "秋招", "春招", "面试", "简历"],
  ["转行", "offer", "跳槽"],
  ["职业规划", "副业", "创业"],
  ["体制内", "考公", "考编"],
  ["留学", "托福", "雅思", "申请", "文书"],
  ["实习", "校招", "社招", "内推"],
  ["产品", "运营", "开发", "设计"],
  ["金融", "互联网", "咨询"],
  ["北京", "上海", "广州", "深圳"],
  ["杭州", "成都", "南京", "武汉"],
  ["远程", "居家", "线下", "兼职"],
  ["大厂", "初创", "外企"],
  ["离职", "offer", "裸辞"],
  ["涨薪", "晋升", "转岗"],
];

function hueFromId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h + id.charCodeAt(i) * (i + 1)) % 360;
  }
  return h;
}

function coverAspectClass(index: number) {
  const aspects = ["aspect-[4/5]", "aspect-[3/4]", "aspect-[5/6]"] as const;
  return aspects[index % aspects.length];
}

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase();
}

function splitKeywords(input: string) {
  return input
    .split(/[\s,\u3001\uFF0C;\/]+/)
    .map((item) => normalizeSearchText(item))
    .filter(Boolean);
}

function buildExpandedTerms(rawQuery: string) {
  const normalizedQuery = normalizeSearchText(rawQuery);
  const originalTerms = Array.from(new Set([normalizedQuery, ...splitKeywords(normalizedQuery)].filter(Boolean)));
  const originalSet = new Set(originalTerms);
  const relatedSet = new Set<string>();

  for (const group of RELATED_TERM_GROUPS) {
    const normalizedGroup = group.map((term) => normalizeSearchText(term));
    const isMatched = normalizedGroup.some(
      (term) =>
        normalizedQuery.includes(term) ||
        originalTerms.some((keyword) => keyword.includes(term) || term.includes(keyword))
    );
    if (!isMatched) continue;
    for (const term of normalizedGroup) {
      if (!originalSet.has(term)) {
        relatedSet.add(term);
      }
    }
  }

  return {
    originalTerms,
    relatedTerms: Array.from(relatedSet),
  };
}

function searchScore(profile: LifeAgentListItem, rawQuery: string) {
  const query = rawQuery.trim();
  if (!query) return 1;

  const fullText = normalizeSearchText(
    [
      profile.displayName,
      profile.headline,
      profile.shortBio,
      profile.audience,
      ...(profile.regions ?? []),
      profile.country,
      profile.province,
      profile.city,
      profile.county,
      ...(profile.expertiseTags ?? []),
      ...(profile.sampleQuestions ?? []),
    ]
      .filter(Boolean)
      .join("\n")
  );

  const { originalTerms, relatedTerms } = buildExpandedTerms(query);
  let score = 0;
  let directHits = 0;
  let relatedHits = 0;

  const normalizedQuery = normalizeSearchText(query);
  if (fullText.includes(normalizedQuery)) {
    score += 12;
  }

  for (const term of originalTerms) {
    if (term && fullText.includes(term)) {
      directHits += 1;
      score += 5;
    }
  }

  for (const term of relatedTerms) {
    if (term && fullText.includes(term)) {
      relatedHits += 1;
      score += 2;
    }
  }

  if (directHits > 1) {
    score += 4;
  }
  if (directHits === 0 && relatedHits >= 2) {
    score += 3;
  }
  if (directHits === originalTerms.length && originalTerms.length > 1) {
    score += 6;
  }

  return score;
}

export default function LifeAgentsPage() {
  const [profiles, setProfiles] = useState<LifeAgentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>(UI.all);
  const [selectedProvince, setSelectedProvince] = useState<string>(UI.all);
  const [selectedCity, setSelectedCity] = useState<string>(UI.all);
  const [selectedCounty, setSelectedCounty] = useState<string>(UI.all);

  const { user } = useAuth();
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setLoadError(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 秒超时

    fetch("/api/life-agents", { credentials: "include", signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        setProfiles(Array.isArray(data) ? data : []);
        setLoadError(null);
      })
      .catch((err) => {
        setProfiles([]);
        setLoadError(
          err.name === "AbortError"
            ? "请求超时，请检查后端是否启动或稍后重试"
            : "加载失败，请刷新页面重试"
        );
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setLoading(false);
      });
  }, []);

  const filteredProfiles = useMemo(() => {
    return [...profiles]
      .filter((profile) => (selectedCountry === UI.all ? true : profile.country?.includes(selectedCountry)))
      .filter((profile) => (selectedProvince === UI.all ? true : profile.province?.includes(selectedProvince)))
      .filter((profile) => (selectedCity === UI.all ? true : profile.city?.includes(selectedCity)))
      .filter((profile) => (selectedCounty === UI.all ? true : profile.county?.includes(selectedCounty)))
      .map((profile) => ({ profile, score: searchScore(profile, query) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (b.profile.soldQuestionPacks ?? 0) - (a.profile.soldQuestionPacks ?? 0);
      })
      .map(({ profile }) => profile);
  }, [profiles, query, selectedCountry, selectedProvince, selectedCity, selectedCounty]);

  return (
    <div className="-mx-1 space-y-4 pb-4 sm:mx-0 sm:space-y-5">
      <section className="rounded-2xl bg-white px-3 py-4 shadow-sm ring-1 ring-slate-200/80 sm:px-5 sm:py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-rose-500/90">{UI.badge}</p>
            <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{UI.heroTitle}</h1>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">{UI.heroSubtitle}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              href="/life-agents/create"
              className="rounded-full bg-gradient-to-r from-rose-500 to-orange-400 px-4 py-2 text-xs font-semibold text-white shadow-sm sm:px-5 sm:text-sm"
            >
              {UI.createAgent}
            </Link>
            <Link
              href={user ? "/dashboard" : "/signup"}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-700 sm:text-sm"
            >
              {user ? UI.profileHome : UI.signup}
            </Link>
          </div>
        </div>

        <div className="mt-4">
          <label className="sr-only">{UI.keywordSearch}</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              className="input-glow w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-300 focus:bg-white"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={UI.searchPlaceholder}
            />
          </div>
          <p className="mt-2 px-1 text-[11px] leading-relaxed text-slate-400 sm:text-xs">{UI.searchHint}</p>
        </div>

        <details className="group mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 open:border-slate-200 open:bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium text-slate-700 marker:hidden sm:px-4">
            <span>{UI.filtersToggle}</span>
            <span className="text-slate-400 transition group-open:rotate-180">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </summary>
          <div className="space-y-3 border-t border-slate-100 px-3 pb-4 pt-3 sm:px-4">
            <p className="text-xs font-medium text-slate-600">{UI.region}</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <select
                className="input-shell rounded-xl py-2.5 text-sm"
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  setSelectedProvince(UI.all);
                  setSelectedCity(UI.all);
                  setSelectedCounty(UI.all);
                }}
              >
                {COUNTRY_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item === UI.all ? UI.allOrAny : item}
                  </option>
                ))}
              </select>
              <select
                className="input-shell rounded-xl py-2.5 text-sm"
                value={selectedProvince}
                onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  setSelectedCity(UI.all);
                  setSelectedCounty(UI.all);
                }}
              >
                {getProvinceOptions(selectedCountry).map((item) => (
                  <option key={item} value={item}>
                    {item === UI.all ? UI.all : item}
                  </option>
                ))}
              </select>
              <select
                className="input-shell rounded-xl py-2.5 text-sm"
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setSelectedCounty(UI.all);
                }}
              >
                {getCityOptions(selectedCountry, selectedProvince).map((item) => (
                  <option key={item} value={item}>
                    {item === UI.all ? UI.all : item}
                  </option>
                ))}
              </select>
              <select
                className="input-shell rounded-xl py-2.5 text-sm"
                value={selectedCounty}
                onChange={(e) => setSelectedCounty(e.target.value)}
              >
                {getCountyOptions(selectedCountry, selectedProvince, selectedCity).map((item) => (
                  <option key={item} value={item}>
                    {item === UI.all ? UI.allOrAny : item}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-400">{UI.regionHint}</p>
          </div>
        </details>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
            {UI.sectionTitle}
            {UI.sectionSubtitle ? <span className="ml-2 font-normal text-slate-500">{UI.sectionSubtitle}</span> : null}
          </h2>
          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-600 sm:text-xs">
            {loading ? UI.loading : `${filteredProfiles.length}/${profiles.length}${UI.countSuffix}`}
          </span>
        </div>

        {loadError && (
          <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800">
            {loadError}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="ml-3 text-sm font-medium text-amber-700 underline hover:no-underline"
            >
              刷新页面
            </button>
          </div>
        )}
        {loading ? (
          <div
            className="columns-2 gap-x-2 sm:columns-3 sm:gap-x-3 lg:columns-4 xl:columns-5 [&>*]:mb-2 sm:[&>*]:mb-3"
            style={{ columnGap: "0.625rem" }}
          >
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className={`break-inside-avoid overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 ${
                  item % 3 === 0 ? "aspect-[5/7]" : item % 3 === 1 ? "aspect-[4/5]" : "aspect-[3/4]"
                } animate-pulse bg-gradient-to-br from-slate-100 to-slate-200/80`}
              />
            ))}
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
            <p className="text-base font-semibold text-slate-900">
              {loadError ? "加载失败" : UI.emptyTitle}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {loadError ? "请确认 Go 后端已启动（默认端口 8080），或刷新页面重试" : UI.emptySubtitle}
            </p>
          </div>
        ) : (
          <div
            className="columns-2 gap-x-2 sm:columns-3 sm:gap-x-3 lg:columns-4 xl:columns-5 [&>*]:mb-2 sm:[&>*]:mb-3"
            style={{ columnGap: "0.625rem" }}
          >
            {filteredProfiles.map((profile, index) => {
              const h = hueFromId(profile.id);
              const h2 = (h + 48) % 360;
              const areaLabel = [profile.city, profile.province].filter(Boolean).join(" · ");
              return (
                <motion.article
                  key={profile.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index < 8 ? index * 0.04 : 0 }}
                  className="break-inside-avoid"
                >
                  <Link href={"/life-agents/" + profile.id} className="group block">
                    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 transition duration-200 group-hover:shadow-md group-hover:ring-rose-200/60">
                      <div
                        className={`relative w-full overflow-hidden ${coverAspectClass(index)}`}
                        style={{
                          background: `linear-gradient(145deg, hsl(${h} 72% 88%), hsl(${h2} 65% 78%) 55%, hsl(${h} 55% 70%))`,
                        }}
                      >
                        <div
                          className="absolute inset-0 opacity-[0.15]"
                          style={{
                            backgroundImage: `radial-gradient(circle at 30% 20%, white, transparent 50%), radial-gradient(circle at 80% 60%, hsl(${h2} 40% 40%), transparent 45%)`,
                          }}
                        />
                        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/35 via-black/10 to-transparent p-2.5 pt-12">
                          <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-white drop-shadow-sm">
                            {profile.headline}
                          </span>
                        </div>
                        {(profile.verificationStatus === "verified" || profile.verificationStatus === "pending") && (
                          <div className="absolute right-2 top-2 rounded-full bg-white/90 px-1.5 py-0.5 shadow-sm backdrop-blur-sm">
                            <VerificationBadge status={profile.verificationStatus ?? "none"} size="sm" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5 p-2.5 sm:p-3">
                        <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-slate-900 sm:text-sm">
                          {profile.displayName}
                        </h3>
                        {areaLabel ? (
                          <p className="line-clamp-1 text-[11px] text-slate-400">{areaLabel}</p>
                        ) : null}
                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <div className="flex min-w-0 items-center gap-1 text-[11px] text-slate-500">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200/90 text-[10px] font-bold text-slate-600">
                              {(profile.displayName ?? UI.anonymous).slice(0, 1)}
                            </span>
                            <span className="truncate">{profile.creator.name ?? UI.anonymous}</span>
                          </div>
                          <span className="shrink-0 text-sm font-bold text-rose-500">
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
                        {(profile.expertiseTags ?? []).length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {(profile.expertiseTags ?? []).slice(0, 2).map((tag: string) => (
                              <span
                                key={tag}
                                className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-600/90"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                </motion.article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}