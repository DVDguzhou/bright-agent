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
  liveUpdateCategoryLabel,
  formatFreshDays,
  formatReviewDate,
} = require("../../utils/format");
const { selectTopLifeAgentDisplayTags } = require("../../utils/life-agent-display-tags");
const { lifeAgentShowsPurchaseUi } = require("../../utils/commerce");

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

function normalizeClaim(agent) {
  const claim = (agent && agent.claim) || {};
  const status = claim.status === "claimed" ? "claimed" : "unclaimed";
  return {
    claimStatus: status,
    claimLabel: claim.label || (status === "claimed" ? "已认领" : "未认领"),
    isClaimed: status === "claimed",
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
    claimStatus: "unclaimed",
    claimLabel: "未认领",
    isClaimed: false,
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
        const allTags = selectTopLifeAgentDisplayTags({
          mbti: agent.mbti,
          expertiseTags: agent.expertiseTags,
          headline: intro.headline,
          audience: intro.audience,
          shortBio: intro.shortBio,
          sampleQuestions: intro.sampleQuestions,
          limit: 5,
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
        const claim = normalizeClaim(agent);

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
          claimStatus: claim.claimStatus,
          claimLabel: claim.claimLabel,
          isClaimed: claim.isClaimed,
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
