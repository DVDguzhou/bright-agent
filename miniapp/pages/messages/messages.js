const { get } = require("../../utils/request");
const { formatSessionTime } = require("../../utils/format");
const { setTabBarSelected } = require("../../utils/tab-bar");
const {
  resolveLifeAgentCoverDisplayUrl,
  nextCoverFallback,
} = require("../../utils/covers");
const { cleanLifeAgentIntroText } = require("../../utils/intro-clean");
const { getNavMetrics } = require("../../utils/nav-metrics");

function previewText(item) {
  if (item.messageCount === 0) return "暂无消息";
  const t = (item.title || "").trim();
  if (t) return t.length > 80 ? `${t.slice(0, 80)}…` : t;
  const profile = item.profile || {};
  const h = cleanLifeAgentIntroText(
    profile.headline || "",
    profile.displayName || ""
  );
  return h || "暂无消息";
}

function normalizeItem(item) {
  const profile = item.profile || {};
  const coverFull = resolveLifeAgentCoverDisplayUrl(
    profile.coverUrl,
    profile.coverImageUrl,
    profile.coverPresetKey
  );
  return {
    id: item.id,
    title: item.title,
    messageCount: item.messageCount,
    updatedAt: item.updatedAt,
    createdAt: item.createdAt,
    profile: profile,
    coverFull: coverFull,
    initial: (profile.displayName || "?").slice(0, 1),
    timeLabel: formatSessionTime(item.updatedAt || item.createdAt),
    preview: previewText(item),
  };
}

Page({
  data: {
    statusBarHeight: 20,
    user: null,
    authLoading: true,
    dataLoading: true,
    items: [],
    filtered: [],
    query: "",
    skeletonRows: [1, 2, 3, 4, 5, 6],
  },

  onLoad() {
    const nav = getNavMetrics();
    this.setData({ statusBarHeight: nav.statusBarHeight });
  },

  onShow() {
    setTabBarSelected(this, 1);
    this.refresh();
  },

  onPullDownRefresh() {
    this.refresh(true);
  },

  refresh(fromPull) {
    const app = getApp();
    const authPromise =
      app && typeof app.refreshUser === "function"
        ? app.refreshUser()
        : get("/api/auth/me").then(function (res) {
            if (app) app.globalData.user = res.data;
            return res.data;
          });

    if (!fromPull) {
      this.setData({ authLoading: true, dataLoading: true });
    }

    authPromise
      .then(
        function (user) {
          this.setData({ user: user, authLoading: false });
          if (!user) {
            this.setData({
              dataLoading: false,
              items: [],
              filtered: [],
            });
            if (fromPull) wx.stopPullDownRefresh();
            return null;
          }
          return get("/api/life-agents/chat-sessions");
        }.bind(this)
      )
      .then(
        function (res) {
          if (res === null) return;
          if (!res) {
            if (fromPull) wx.stopPullDownRefresh();
            return;
          }
          const raw = Array.isArray(res.data) ? res.data : [];
          const items = raw.map(normalizeItem);
          this.setData({ items: items, dataLoading: false });
          this.applyFilter(this.data.query, items);
          if (fromPull) wx.stopPullDownRefresh();
        }.bind(this)
      )
      .catch(
        function () {
          this.setData({
            user: null,
            authLoading: false,
            dataLoading: false,
            items: [],
            filtered: [],
          });
          if (fromPull) wx.stopPullDownRefresh();
        }.bind(this)
      );
  },

  onQueryInput(e) {
    const query = e.detail.value || "";
    this.setData({ query: query });
    this.applyFilter(query, this.data.items);
  },

  applyFilter(query, items) {
    const keyword = (query || "").trim().toLowerCase();
    if (!keyword) {
      this.setData({ filtered: items });
      return;
    }
    const filtered = items.filter(function (item) {
      const profile = item.profile || {};
      return [item.title, profile.displayName, profile.headline].some(function (
        v
      ) {
        return v && String(v).toLowerCase().indexOf(keyword) >= 0;
      });
    });
    this.setData({ filtered: filtered });
  },

  clearQuery() {
    this.setData({ query: "" });
    this.applyFilter("", this.data.items);
  },

  openChat(e) {
    const profileId = e.currentTarget.dataset.profileId;
    const sessionId = e.currentTarget.dataset.sessionId;
    if (!profileId) return;
    let url = "/pages/chat/chat?id=" + profileId;
    if (sessionId) url += "&sessionId=" + sessionId;
    wx.navigateTo({ url: url });
  },

  openProfile(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: "/pages/agent-detail/agent-detail?id=" + id });
  },

  onCoverError(e) {
    const index = e.currentTarget.dataset.index;
    const key = "filtered[" + index + "].coverFull";
    const item = this.data.filtered[index];
    if (!item) return;
    this.setData({
      [key]: nextCoverFallback(item.coverFull),
    });
  },

  goDiscover() {
    wx.switchTab({ url: "/pages/index/index" });
  },
});
