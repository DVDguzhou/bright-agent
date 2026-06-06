const { get, post, del } = require("../../utils/request");
const { resolveLifeAgentCoverDisplayUrl, nextCoverFallback } = require("../../utils/covers");
const { cleanLifeAgentIntroText } = require("../../utils/intro-clean");
const { formatFreshDays } = require("../../utils/format");
const {
  computeCompletion,
  formatDateTime,
  formatShortTime,
  feedbackTypeLabel,
  alertPriorityLabel,
  buildOptimizationSuggestions,
  liveCategoryLabel,
  LIVE_CATEGORIES,
  QUICK_ACTIONS,
  navigateToManageSub,
} = require("../../utils/agent-manage");

function mapQuickActions(blindSpotCount) {
  return QUICK_ACTIONS.map(function (item) {
    const next = Object.assign({}, item);
    if (item.titleSuffixFrom === "blindSpotCount" && blindSpotCount > 0) {
      next.title = item.title + " (" + blindSpotCount + ")";
    }
    return next;
  });
}

function mapProfileStatus(profile, data) {
  const persona = [profile.personaArchetype, profile.toneStyle, profile.responseStyle]
    .filter(Boolean)
    .join(" · ");
  const lastUpdated =
    data.chatSessions && data.chatSessions[0]
      ? formatDateTime(data.chatSessions[0].updatedAt)
      : "暂无记录";
  return [
    { label: "欢迎语", value: profile.welcomeMessage || "未设置" },
    {
      label: "擅长标签",
      value: (profile.expertiseTags || []).join("、") || "未设置",
    },
    { label: "人设与语气", value: persona || "未设置" },
    {
      label: "知识条目",
      value: String((profile.knowledgeEntries || []).length) + " 条",
    },
    {
      label: "结构化事实",
      value: String((profile.structuredFacts || []).length) + " 条",
    },
    {
      label: "Topic 摘要",
      value:
        String(
          (profile.topicSummaries || []).length ||
            (data.stats && data.stats.topicCount) ||
            0
        ) + " 条",
    },
    {
      label: "开放 API",
      value: profile.apiInvokeEnabled
        ? "已开启 · " + (profile.apiTotalCalls || 0) + " 次调用"
        : "未开启",
    },
    { label: "最后更新", value: lastUpdated },
  ];
}

function alertToneClass(color) {
  if (color === "red") return "tone-red";
  if (color === "orange") return "tone-orange";
  if (color === "yellow") return "tone-yellow";
  if (color === "blue") return "tone-blue";
  return "tone-default";
}

Page({
  data: {
    id: "",
    loading: true,
    error: "",
    displayName: "",
    displayInitial: "?",
    headline: "",
    coverFull: "",
    published: false,
    completion: 0,
    soldPacks: 0,
    packCount: 0,
    sessionCount: 0,
    mindScore: 0,
    blindSpotCount: 0,
    quickActions: QUICK_ACTIONS,
    liveCategories: LIVE_CATEGORIES,
    liveCategoryIndex: 0,
    liveContent: "",
    liveLocation: "",
    liveCanPost: false,
    livePosting: false,
    liveUpdates: [],
    liveUpdateCount: 0,
    recentPacks: [],
    recentSessions: [],
    recentFeedback: [],
    alerts: [],
    suggestions: [],
    statusItems: [],
    dangerOpen: false,
    deleting: false,
  },

  onLoad(options) {
    const id = options.id || "";
    this.setData({ id });
    if (!id) {
      this.setData({ loading: false, error: "缺少 Agent ID" });
      return;
    }
    this.loadAll();
  },

  onShow() {
    if (this.data.id && this._loadedOnce) {
      this.loadAll();
    }
  },

  loadAll() {
    const id = this.data.id;
    this.setData({ loading: true, error: "" });
    Promise.all([
      get("/api/life-agents/" + id + "/manage"),
      get("/api/life-agents/" + id + "/live-updates").catch(function () {
        return { data: { updates: [] } };
      }),
    ])
      .then(
        function (results) {
          const manageRes = results[0];
          const liveRes = results[1];
          const data = manageRes.data || {};
          const profile = data.profile;
          if (!profile || !profile.displayName) {
            this.setData({ loading: false, error: "加载失败或无权访问" });
            return;
          }
          const displayName = profile.displayName || "";
          const mindScoreValue =
            data.mindScore && typeof data.mindScore.total === "number"
              ? data.mindScore.total
              : data.stats && typeof data.stats.mindScore === "number"
                ? data.stats.mindScore
                : 0;
          const blindSpotCount = (data.stats && data.stats.blindSpotCount) || 0;
          const questionPacks = Array.isArray(data.questionPacks) ? data.questionPacks : [];
          const chatSessions = Array.isArray(data.chatSessions) ? data.chatSessions : [];
          const feedbackRecent =
            data.feedback && Array.isArray(data.feedback.recent) ? data.feedback.recent : [];
          const alerts =
            data.feedback && Array.isArray(data.feedback.alerts) ? data.feedback.alerts : [];
          const liveUpdatesRaw =
            liveRes.data && Array.isArray(liveRes.data.updates) ? liveRes.data.updates : [];
          const liveUpdates = liveUpdatesRaw.map(function (u) {
            return Object.assign({}, u, {
              categoryLabel: liveCategoryLabel(u.category),
              freshLabel: formatFreshDays(u.freshDays),
            });
          });
          const suggestions = buildOptimizationSuggestions(data);
          if (suggestions.length === 0) {
            suggestions.push("状态很好，继续保持更新和稳定回复即可。");
          }

          wx.setNavigationBarTitle({ title: displayName });
          this.setData({
            loading: false,
            error: "",
            displayName,
            displayInitial: displayName ? displayName.slice(0, 1) : "?",
            headline: cleanLifeAgentIntroText(profile.headline, displayName),
            coverFull: resolveLifeAgentCoverDisplayUrl(
              profile.coverUrl,
              profile.coverImageUrl,
              profile.coverPresetKey
            ),
            published: !!profile.published,
            completion: computeCompletion(profile),
            soldPacks: (data.stats && data.stats.soldPacks) || 0,
            packCount: questionPacks.length,
            sessionCount: (data.stats && data.stats.sessionCount) || 0,
            mindScore: mindScoreValue,
            blindSpotCount,
            quickActions: mapQuickActions(blindSpotCount),
            liveUpdates,
            liveUpdateCount: liveUpdates.length,
            recentPacks: questionPacks.slice(0, 3).map(function (item) {
              const buyer = item.buyer || {};
              return {
                id: item.id,
                name: buyer.name || buyer.email || "用户",
                detail:
                  "提问 " +
                  (item.questionCount || 0) +
                  " 次，已对话 " +
                  (item.questionsUsed || 0) +
                  " 次",
                timeLabel: formatShortTime(item.createdAt),
              };
            }),
            recentSessions: chatSessions.slice(0, 3).map(function (item) {
              const buyer = item.buyer || {};
              return {
                id: item.id,
                name: buyer.name || buyer.email || "用户",
                title: item.title || "隐私保护会话",
                detail:
                  (item.messageCount || 0) +
                  " 条消息 · 最近更新 " +
                  formatShortTime(item.updatedAt),
              };
            }),
            recentFeedback: feedbackRecent.slice(0, 3).map(function (item) {
              return {
                id: item.id,
                typeLabel: feedbackTypeLabel(item.feedbackType),
                content:
                  (item.comment && String(item.comment).trim()) ||
                  item.assistantExcerpt ||
                  "无补充说明",
                timeLabel: formatShortTime(item.createdAt),
              };
            }),
            alerts: alerts.map(function (alert) {
              return Object.assign({}, alert, {
                priorityLabel: alertPriorityLabel(alert.priority),
                toneClass: alertToneClass(alert.color),
                linkAction: alert.topicId ? "topics" : alert.source === "blind_spot" ? "blindspots" : "",
              });
            }),
            suggestions,
            statusItems: mapProfileStatus(profile, data),
          });
          this._loadedOnce = true;
          this._manageProfile = profile;
        }.bind(this)
      )
      .catch(
        function () {
          this.setData({ loading: false, error: "加载失败，请稍后重试" });
        }.bind(this)
      );
  },

  loadManage() {
    this.loadAll();
  },

  onCoverError() {
    const next = nextCoverFallback(this.data.coverFull);
    if (next !== this.data.coverFull) {
      this.setData({ coverFull: next });
    }
  },

  goBack() {
    wx.navigateBack({
      fail: function () {
        wx.navigateTo({ url: "/pages/my-agents/my-agents" });
      },
    });
  },

  goPublicDetail() {
    wx.navigateTo({ url: "/pages/agent-detail/agent-detail?id=" + this.data.id });
  },

  goApiKeys() {
    wx.navigateTo({ url: "/pages/api-keys/api-keys?profileId=" + encodeURIComponent(this.data.id) });
  },

  goSubPage(action) {
    navigateToManageSub(this.data.id, action);
  },

  onEditProfile() {
    this.goSubPage("edit");
  },

  onQuickAction(e) {
    const action = e.currentTarget.dataset.action;
    if (action === "api") {
      this.goApiKeys();
      return;
    }
    this.goSubPage(action);
  },

  onStatTap(e) {
    const action = e.currentTarget.dataset.action;
    if (action) this.goSubPage(action);
  },

  onAlertLink(e) {
    const action = e.currentTarget.dataset.action;
    if (action) this.goSubPage(action);
  },

  onLiveInput(e) {
    const liveContent = e.detail.value || "";
    this.setData({
      liveContent: liveContent,
      liveCanPost: !!String(liveContent).trim(),
    });
  },

  onLiveLocationInput(e) {
    this.setData({ liveLocation: e.detail.value || "" });
  },

  onLiveCategoryChange(e) {
    const idx = Number(e.detail.value) || 0;
    this.setData({ liveCategoryIndex: idx });
  },

  postLiveUpdate() {
    const content = (this.data.liveContent || "").trim();
    if (!content || this.data.livePosting) return;
    const category =
      LIVE_CATEGORIES[this.data.liveCategoryIndex] &&
      LIVE_CATEGORIES[this.data.liveCategoryIndex].value
        ? LIVE_CATEGORIES[this.data.liveCategoryIndex].value
        : "general";
    const location = (this.data.liveLocation || "").trim();
    this.setData({ livePosting: true });
    post("/api/life-agents/" + this.data.id + "/live-updates", {
      content,
      category,
      location: location || undefined,
    })
      .then(
        function () {
          this.setData({ liveContent: "", liveLocation: "", livePosting: false, liveCanPost: false });
          this.loadAll();
        }.bind(this)
      )
      .catch(
        function () {
          this.setData({ livePosting: false });
          wx.showToast({ title: "发布失败", icon: "none" });
        }.bind(this)
      );
  },

  deleteLiveUpdate(e) {
    const updateId = e.currentTarget.dataset.id;
    if (!updateId) return;
    const that = this;
    wx.showModal({
      title: "删除更新",
      content: "确定删除这条实时更新吗？",
      success: function (res) {
        if (!res.confirm) return;
        del("/api/life-agents/" + that.data.id + "/live-updates/" + updateId)
          .then(function () {
            that.loadAll();
          })
          .catch(function () {
            wx.showToast({ title: "删除失败", icon: "none" });
          });
      },
    });
  },

  toggleDanger() {
    this.setData({ dangerOpen: !this.data.dangerOpen });
  },

  deleteAgent() {
    if (this.data.deleting) return;
    const that = this;
    wx.showModal({
      title: "删除人生 Agent",
      content: "删除后无法恢复，包括知识、聊天记录等。确定继续吗？",
      confirmText: "删除",
      confirmColor: "#7a1f1f",
      success: function (res) {
        if (!res.confirm) return;
        that.setData({ deleting: true });
        del("/api/life-agents/" + that.data.id)
          .then(function () {
            wx.showToast({ title: "已删除", icon: "success" });
            setTimeout(function () {
              wx.redirectTo({ url: "/pages/my-agents/my-agents" });
            }, 400);
          })
          .catch(function () {
            that.setData({ deleting: false });
            wx.showToast({ title: "删除失败", icon: "none" });
          });
      },
    });
  },
});
