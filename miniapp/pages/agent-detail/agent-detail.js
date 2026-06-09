const { get } = require("../../utils/request");
const { isFavoriteAgentId, toggleFavoriteAgentId } = require("../../utils/favorites");
const {
  resolveLifeAgentCoverDisplayUrl,
  nextCoverFallback,
} = require("../../utils/covers");
const {
  cleanLifeAgentIntroText,
  cleanLifeAgentIntroMultiline,
} = require("../../utils/intro-clean");
const {
  buildFullArea,
  formatRating,
  formatYuan,
  topicGroupLabel,
  liveUpdateCategoryLabel,
  formatFreshDays,
  formatReviewDate,
} = require("../../utils/format");
const { lifeAgentShowsPurchaseUi } = require("../../utils/commerce");

function isShortTag(s) {
  const v = (s || "").trim();
  if (!v || v.length > 12) return false;
  if (/[，。；：、！？,;:!?·…—\-—·"'""''()（）\s→↔]/.test(v)) return false;
  return true;
}

function buildIntro(agent) {
  const dn = agent.displayName || "";
  return {
    headline: cleanLifeAgentIntroText(agent.headline, dn),
    shortBio: cleanLifeAgentIntroText(agent.shortBio, dn),
    school: cleanLifeAgentIntroText(agent.school, dn),
    education: cleanLifeAgentIntroText(agent.education, dn),
    job: cleanLifeAgentIntroText(agent.job, dn),
    income: cleanLifeAgentIntroText(agent.income, dn),
    audience: cleanLifeAgentIntroMultiline(agent.audience, dn),
    welcomeMessage: cleanLifeAgentIntroMultiline(agent.welcomeMessage, dn),
    sampleQuestions: (agent.sampleQuestions || []).map((q) =>
      cleanLifeAgentIntroText(q, dn)
    ),
  };
}

Page({
  data: {
    id: "",
    intro: {},
    coverFull: "",
    loading: true,
    error: "",
    isLoggedIn: false,
    remainingQ: 0,
    starred: false,
    tags: [],
    topics: [],
    liveUpdates: [],
    facts: [],
    mindScore: null,
    averageScore: 0,
    ratingDisplay: "—",
    ratingSubtext: "暂无评价",
    recentReviews: [],
    priceHint: "",
    creatorInitial: "?",
    displayName: "",
    creatorName: "",
    sessionCount: 0,
    verificationStatus: "none",
    showHeroVerify: false,
    sampleQuestions: [],
    hasMindScore: false,
    showContent: false,
  },
  onLoad(options) {
    const id = options.id || "";
    this.setData({ id });
    if (!id) {
      this.setData({ loading: false, error: "缺少 Agent ID" });
      return;
    }
    this.loadDetail();
  },
  loadDetail() {
    this.setData({ loading: true, error: "" });
    const id = this.data.id;

    Promise.all([
      get(`/api/life-agents/${id}`),
      get(`/api/life-agents/${id}/live-updates`).catch(() => ({ data: {} })),
    ])
      .then(([detailRes, updatesRes]) => {
        const agent = detailRes.data || {};
        if (!agent.displayName) {
          this.setData({ loading: false, error: "未找到该 Agent" });
          return;
        }

        const intro = buildIntro(agent);
        const viewer = agent.viewerState || {};
        // 标签只展示 MBTI + 专长话题；人设/语气/回应风格是内部行为字段，不当话题标签露出
        // （它们常是自动生成的近义描述，如「犀利直给」「直接犀利」，并排显示重复又跑题）。
        const allTags = [agent.mbti, ...(agent.expertiseTags || [])]
          .filter(isShortTag)
          .filter((tag, i, arr) => arr.indexOf(tag) === i);

        const activeTopics = (agent.topicSummaries || [])
          .filter(function (t) {
            return t.status === "active";
          })
          .map(function (t) {
            return Object.assign({}, t, {
              groupLabel: topicGroupLabel(t.topicGroup),
            });
          });

        const facts = [];
        if (intro.school) facts.push({ label: "学校", value: intro.school });
        if (intro.education) facts.push({ label: "学历", value: intro.education });
        if (intro.job) facts.push({ label: "职业", value: intro.job });
        if (intro.income) facts.push({ label: "收入", value: intro.income });
        const areaText = buildFullArea(
          agent.country,
          agent.province,
          agent.city,
          agent.county
        );
        if (areaText) facts.push({ label: "地区", value: areaText });

        const ratings = agent.ratings || {};
        const averageScore = ratings.averageScore || 0;
        const showPrice = lifeAgentShowsPurchaseUi();
        const remainingQ = viewer.remainingQuestions || 0;
        let priceHint = "";
        if (showPrice && agent.pricePerQuestion > 0) {
          priceHint =
            remainingQ > 0
              ? `剩余 ${remainingQ} 次提问额度`
              : `¥${formatYuan(agent.pricePerQuestion)} / 次提问`;
        }

        const updates = (updatesRes.data && updatesRes.data.updates) || [];
        const liveUpdates = updates.slice(0, 5).map(function (u) {
          return Object.assign({}, u, {
            categoryLabel: liveUpdateCategoryLabel(u.category),
            freshLabel: formatFreshDays(u.freshDays),
          });
        });

        const mindScore =
          agent.mindScore && typeof agent.mindScore.total === "number"
            ? agent.mindScore.total
            : agent.stats && typeof agent.stats.mindScore === "number"
              ? agent.stats.mindScore
              : null;

        const verificationStatus = agent.verificationStatus || "none";
        const creator = agent.creator || {};

        this.setData({
          intro: Object.assign({}, intro, {
            audience: intro.audience || "—",
          }),
          coverFull: resolveLifeAgentCoverDisplayUrl(
            agent.coverUrl,
            agent.coverImageUrl,
            agent.coverPresetKey
          ),
          isLoggedIn: !!viewer.isLoggedIn,
          remainingQ,
          starred: isFavoriteAgentId(id),
          tags: allTags,
          topics: activeTopics,
          liveUpdates,
          facts,
          mindScore,
          hasMindScore: mindScore != null,
          averageScore,
          ratingDisplay: formatRating(ratings.raters > 0 ? averageScore : 0),
          ratingSubtext: ratings.raters > 0 ? `${ratings.raters} 人评价` : "暂无评价",
          recentReviews: (ratings.recent || []).slice(0, 5).map(function (r) {
            return Object.assign({}, r, {
              dateLabel: formatReviewDate(r.updatedAt),
            });
          }),
          priceHint,
          displayName: agent.displayName || "",
          creatorName: creator.name || agent.displayName || "",
          creatorInitial: (agent.displayName || "?").slice(0, 1),
          sessionCount: (agent.stats && agent.stats.sessionCount) || 0,
          verificationStatus,
          showHeroVerify:
            verificationStatus === "verified" || verificationStatus === "pending",
          sampleQuestions: intro.sampleQuestions || [],
          loading: false,
          showContent: true,
        });
      })
      .catch(function () {
        this.setData({ loading: false, error: "加载失败", showContent: false });
      }.bind(this));
  },
  onCoverError() {
    const next = nextCoverFallback(this.data.coverFull);
    if (next !== this.data.coverFull) {
      this.setData({ coverFull: next });
    }
  },
  toggleStar() {
    toggleFavoriteAgentId(this.data.id).then((starred) => {
      this.setData({ starred });
      wx.showToast({ title: starred ? "已收藏" : "已取消", icon: "none" });
    });
  },
  goChat() {
    if (!this.data.isLoggedIn) {
      this.goLogin();
      return;
    }
    wx.navigateTo({ url: `/pages/chat/chat?id=${this.data.id}` });
  },
  goLogin() {
    wx.navigateTo({
      url: `/pages/login/login?redirect=${encodeURIComponent(`/pages/chat/chat?id=${this.data.id}`)}`,
    });
  },
  goBack() {
    wx.navigateBack({
      fail: function () {
        wx.switchTab({ url: "/pages/index/index" });
      },
    });
  },
  goPosts() {
    wx.navigateTo({ url: "/pages/posts/posts" });
  },
  goDiscover() {
    wx.switchTab({ url: "/pages/index/index" });
  },
  goSearch() {
    wx.navigateTo({ url: "/pages/search/search" });
  },
});
