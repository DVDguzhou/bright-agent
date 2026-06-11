const { get, formatRequestError } = require("../../utils/request");
const { resolveLifeAgentCoverDisplayUrl } = require("../../utils/covers");
const { getNavMetrics } = require("../../utils/nav-metrics");
const { setTabBarSelected } = require("../../utils/tab-bar");

const ONBOARDING_KEY = "la_onboarding_v1";
const PAGE_SIZE = 48;

function normalizeAgent(item) {
  return {
    ...item,
    coverFull: resolveLifeAgentCoverDisplayUrl(
      item.coverUrl,
      item.coverImageUrl,
      item.coverPresetKey
    ),
  };
}

function parseListPayload(raw) {
  if (Array.isArray(raw)) return { items: raw, nextCursor: "" };
  if (raw && typeof raw === "object") {
    return {
      items: Array.isArray(raw.items) ? raw.items : [],
      nextCursor: typeof raw.nextCursor === "string" ? raw.nextCursor : "",
    };
  }
  return { items: [], nextCursor: "" };
}

Page({
  data: {
    statusBarHeight: 44,
    navBarHeight: 44,
    menuRight: 16,
    topTab: "discover",
    feedView: "discover",
    discoverAgents: [],
    favoriteAgents: [],
    currentList: [],
    loading: true,
    loadingMore: false,
    error: "",
    nextCursor: "",
    hasMore: true,
    onboardingOpen: false,
    firstCardPulsing: false,
    drawerOpen: false,
    emptyTitle: "还没有人生 Agent",
    emptySubtitle: "创建第一个，把你的经验变成可对话的咨询页",
    favoritesLoaded: false,
    favoritesNeedLogin: false,
  },
  onLoad() {
    const nav = getNavMetrics();
    this.setData({
      statusBarHeight: nav.statusBarHeight,
      navBarHeight: nav.navBarHeight,
      menuRight: nav.menuRight,
    });
    try {
      if (!wx.getStorageSync(ONBOARDING_KEY)) {
        this.setData({ onboardingOpen: true });
      }
    } catch (e) {
      /* ignore */
    }
    this.discoverSeed = (Math.random() * 2147483647) | 0;
    this.loadDiscover(true);
  },
  onShow() {
    setTabBarSelected(this, 0);
    const app = getApp();
    if (app && typeof app.refreshUser === "function") {
      app.refreshUser();
    }
    if (app && app.globalData && app.globalData.pendingFeedView === "favorites") {
      app.globalData.pendingFeedView = "";
      this.setData({ feedView: "favorites", topTab: "discover" });
      this.loadFavorites(true);
      return;
    }
    if (this.data.feedView === "favorites") {
      this.loadFavorites();
    }
  },
  onPullDownRefresh() {
    const task =
      this.data.feedView === "discover"
        ? this.loadDiscover(true)
        : this.loadFavorites(true);
    task.finally(() => wx.stopPullDownRefresh());
  },
  onReachBottom() {
    if (this.data.feedView !== "discover") return;
    this.loadMore();
  },
  openDrawer() {
    this.setData({ drawerOpen: true });
  },
  closeDrawer() {
    this.setData({ drawerOpen: false });
  },
  goPosts() {
    wx.navigateTo({ url: "/pages/posts/posts" });
  },
  goDiscoverTab() {
    this.setData({ topTab: "discover", feedView: "discover" });
    this.syncCurrentList();
    if (this.data.discoverAgents.length === 0) {
      this.loadDiscover(true);
    }
  },
  syncCurrentList() {
    const { feedView, discoverAgents, favoriteAgents } = this.data;
    const currentList = feedView === "favorites" ? favoriteAgents : discoverAgents;
    const emptyTitle =
      feedView === "favorites" ? "还没有收藏" : "还没有人生 Agent";
    const emptySubtitle =
      feedView === "favorites"
        ? "在 Agent 详情页点星形即可收藏到这里"
        : "创建第一个，把你的经验变成可对话的咨询页";
    this.setData({ currentList, emptyTitle, emptySubtitle });
  },
  dismissOnboarding() {
    try {
      wx.setStorageSync(ONBOARDING_KEY, "1");
    } catch (e) {
      /* ignore */
    }
    this.setData({ onboardingOpen: false, firstCardPulsing: true });
    setTimeout(() => this.setData({ firstCardPulsing: false }), 5000);
  },
  reload() {
    if (this.data.feedView === "discover") {
      this.loadDiscover(true);
    } else {
      this.loadFavorites(true);
    }
  },
  loadDiscover(reset) {
    if (reset) {
      this.discoverSeed = (Math.random() * 2147483647) | 0;
      this.setData({ loading: true, error: "", nextCursor: "", hasMore: true });
    } else {
      this.setData({ loadingMore: true });
    }

    const cursor = reset ? "" : this.data.nextCursor;
    let url = `/api/life-agents?limit=${PAGE_SIZE}&seed=${this.discoverSeed}`;
    if (cursor) {
      url += `&cursor=${encodeURIComponent(cursor)}&offset=${encodeURIComponent(cursor)}`;
    }

    return get(url)
      .then((res) => {
        const { items, nextCursor } = parseListPayload(res.data);
        const list = items.map(normalizeAgent);
        const seen = reset ? new Set() : new Set(this.data.discoverAgents.map((a) => a.id));
        const merged = reset ? [] : this.data.discoverAgents.slice();
        for (const item of list) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            merged.push(item);
          }
        }
        this.setData({
          discoverAgents: merged,
          nextCursor,
          hasMore: !!nextCursor,
          loading: false,
          loadingMore: false,
        });
        if (this.data.feedView === "discover") {
          this.syncCurrentList();
        }
      })
      .catch((err) => {
        console.error("[index] loadDiscover failed", err);
        this.setData({
          loading: false,
          loadingMore: false,
          error: "加载失败：" + formatRequestError(err),
        });
        if (this.data.feedView === "discover") {
          this.syncCurrentList();
        }
      });
  },
  loadMore() {
    if (!this.data.hasMore || this.data.loadingMore || this.data.loading) return;
    this.loadDiscover(false);
  },
  loadFavorites(force) {
    if (this.data.favoritesLoaded && !force) {
      this.syncCurrentList();
      return Promise.resolve();
    }
    this.setData({ loading: true, error: "" });
    return get("/api/life-agents/favorites?include=items")
      .then((res) => {
        const items = Array.isArray(res.data) ? res.data : parseListPayload(res.data).items;
        this.setData({
          favoriteAgents: items.map(normalizeAgent),
          favoritesLoaded: true,
          favoritesNeedLogin: false,
          loading: false,
        });
        if (this.data.feedView === "favorites") {
          this.syncCurrentList();
        }
      })
      .catch((err) => {
        if (err.statusCode === 401) {
          this.setData({
            favoriteAgents: [],
            favoritesLoaded: true,
            favoritesNeedLogin: true,
            loading: false,
          });
          if (this.data.feedView === "favorites") {
            this.setData({
              emptyTitle: "请先登录",
              emptySubtitle: "登录后查看已同步的收藏列表",
              currentList: [],
            });
          }
          return;
        }
        this.setData({ loading: false, error: "收藏加载失败" });
      });
  },
  goDetail(e) {
    wx.navigateTo({ url: `/pages/agent-detail/agent-detail?id=${e.detail.id}` });
  },
  goSearch() {
    wx.navigateTo({ url: "/pages/search/search" });
  },
  goLogin() {
    wx.navigateTo({ url: "/pages/login/login" });
  },
});
