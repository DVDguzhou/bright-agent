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
    email: string;
  };
};

const UI = {
  all: "全部",
  allOrAny: "全部 / 不限",
  badge: "专注本地经验的对话式 Agent",
  heroTitle: "浏览人生 Agent",
  heroSubtitle:
    "学长、大妈、酒吧达人、创业者，把真实经历做成可对话的 Agent，按次付费咨询。",
  createAgent: "创建 Agent",
  profileHome: "个人主页",
  signup: "注册",
  sectionTitle: "人生 Agent",
  sectionSubtitle: "按经验领域、地区筛选",
  loading: "加载中...",
  countSuffix: "个",
  keywordSearch: "关键词搜索",
  searchPlaceholder:
    "如：考研、求职、转行、职业规划...",
  searchHint:
    "支持多关键词，空格或逗号分隔；会自动扩展相关词，如搜“考研”会匹配“就业”“读研”等。",
  region: "所在地区",
  regionHint:
    "可多级筛选，组合关键词与地区缩小范围",
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
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
        <div className="max-w-3xl">
          <p className="mb-3 inline-flex rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
            {UI.badge}
          </p>
          <h1 className="section-title">{UI.heroTitle}</h1>
          <p className="section-subtitle mt-4">{UI.heroSubtitle}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/life-agents/create" className="btn-primary">
              {UI.createAgent}
            </Link>
            <Link href={user ? "/dashboard" : "/signup"} className="btn-secondary">
              {user ? UI.profileHome : UI.signup}
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">{UI.sectionTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">{UI.sectionSubtitle}</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
            {loading ? UI.loading : filteredProfiles.length + " / " + profiles.length + " " + UI.countSuffix}
          </span>
        </div>

        <div className="mb-6 space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">{UI.keywordSearch}</label>
            <input
              className="input-shell"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={UI.searchPlaceholder}
            />
            <p className="mt-2 text-xs text-slate-500">{UI.searchHint}</p>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">{UI.region}</p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <select
                className="input-shell"
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
                className="input-shell"
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
                className="input-shell"
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
                className="input-shell"
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
            <p className="mt-2 text-xs text-slate-500">{UI.regionHint}</p>
          </div>
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
          <div className="grid gap-5 lg:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-72 animate-pulse rounded-3xl bg-white shadow-sm" />
            ))}
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-lg font-medium text-slate-900">
              {loadError ? "加载失败" : UI.emptyTitle}
            </p>
            <p className="mt-2 text-slate-500">
              {loadError ? "请确认 Go 后端已启动（默认端口 8080），或刷新页面重试" : UI.emptySubtitle}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {filteredProfiles.map((profile, index) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index < 6 ? index * 0.05 : 0 }}
              >
                <Link href={"/life-agents/" + profile.id} className="block h-full">
                  <div className="glass-card h-full p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-lg font-semibold text-blue-700">
                            {(profile.displayName ?? UI.anonymous).slice(0, 1)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-xl font-semibold text-slate-900">{profile.displayName}</h3>
                              <VerificationBadge status={profile.verificationStatus ?? "none"} size="sm" />
                            </div>
                            <p className="text-sm text-slate-500">{profile.headline}</p>
                          </div>
                        </div>
                        {(profile.education || profile.school || profile.job || profile.income) && (
                          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500">
                            {profile.school && <span>{UI.school} {profile.school}</span>}
                            {profile.education && <span>{UI.education} {profile.education}</span>}
                            {profile.job && <span>{UI.job} {profile.job}</span>}
                            {profile.income && <span>{UI.income} {profile.income}</span>}
                          </div>
                        )}
                        {(profile.country || profile.province || profile.city || profile.county) && (
                          <p className="mt-3 text-sm text-slate-500">
                            {UI.area} {[profile.country, profile.province, profile.city, profile.county].filter(Boolean).join(" / ")}
                          </p>
                        )}
                        {Array.isArray(profile.regions) && profile.regions.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {profile.regions.map((region) => (
                              <span
                                key={profile.id + "-" + region}
                                className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                              >
                                {region}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="mt-4 text-sm leading-6 text-slate-600">{profile.shortBio}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                          <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                            <RatingStars score={profile.ratings?.averageScore ?? 0} size="sm" />
                            {profile.ratings && profile.ratings.raters > 0
                              ? profile.ratings.averageScore.toFixed(1) + " / 5"
                              : UI.unrated}
                          </span>
                          <span>
                            {profile.ratings && profile.ratings.raters > 0
                              ? profile.ratings.raters + " " + UI.ratersSuffix
                              : UI.unrated}
                          </span>
                        </div>
                      </div>
                      <div className="rounded-2xl bg-sky-50 px-4 py-3 text-right">
                        <p className="text-xs text-slate-500">{UI.perQuestion}</p>
                        <p className="text-lg font-semibold text-sky-700">
                          {"¥"}
                          {(profile.pricePerQuestion / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {(profile.expertiseTags ?? []).slice(0, 5).map((tag: string) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-slate-500">{UI.knowledgeCount}</p>
                        <p className="mt-1 font-semibold text-slate-900">{profile.knowledgeCount}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-slate-500">{UI.soldQuestionPacks}</p>
                        <p className="mt-1 font-semibold text-slate-900">{profile.soldQuestionPacks}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-slate-500">{UI.sessionCount}</p>
                        <p className="mt-1 font-semibold text-slate-900">{profile.sessionCount}</p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl bg-blue-50 p-4">
                      <p className="text-sm font-medium text-slate-900">{UI.audience}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{profile.audience}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}