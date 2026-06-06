const { get, absUrl } = require("../../utils/request");
const { hydrateServerFavorites } = require("../../utils/favorites");
const { lifeAgentShowsPurchaseUi } = require("../../utils/commerce");
const { setTabBarSelected } = require("../../utils/tab-bar");

Page({
  data: {
    user: null,
    userAvatar: "",
    purchased: [],
    created: [],
    loading: true,
    initial: "?",
    topStats: [],
    quickActions: [],
    totalMindScore: 0,
    createdCount: 0,
    createdSessions: 0,
    soldPacks: 0,
    purchasedCount: 0,
    primaryAgentId: "",
    drawerOpen: false,
  },

  onShow() {
    setTabBarSelected(this, 3);
    this.refresh();
  },

  resetLoggedOutState() {
    this.setData({
      user: null,
      userAvatar: "",
      loading: false,
      purchased: [],
      created: [],
      topStats: [],
      quickActions: [],
      totalMindScore: 0,
      createdCount: 0,
      createdSessions: 0,
      soldPacks: 0,
      purchasedCount: 0,
      primaryAgentId: "",
      initial: "?",
    });
  },

  goLogin() {
    wx.redirectTo({ url: "/pages/login/login" });
  },

  refresh() {
    this.setData({ loading: true });
    get("/api/auth/me")
      .then((res) => {
        const user = res.data;
        getApp().globalData.user = user;
        if (!user) {
          this.resetLoggedOutState();
          this.goLogin();
          return null;
        }
        const rawAvatar = user.avatarUrl;
        this.setData({
          user,
          userAvatar: rawAvatar ? absUrl(rawAvatar) : "",
          initial: (user.name || user.email || "?").slice(0, 1).toUpperCase(),
        });
        hydrateServerFavorites();
        return Promise.all([
          get("/api/life-agents/mine"),
          get("/api/life-agents/purchased"),
        ]);
      })
      .then((results) => {
        if (!results) return;
        const [createdRes, purchasedRes] = results;
        const created = Array.isArray(createdRes.data) ? createdRes.data : [];
        const purchased = Array.isArray(purchasedRes.data) ? purchasedRes.data : [];

        const createdCount = created.length;
        const createdSessions = created.reduce(function (s, i) {
          return s + (i.sessionCount || 0);
        }, 0);
        const soldPacks = created.reduce(function (s, i) {
          return s + (i.soldPacks || 0);
        }, 0);
        const purchasedQuestions = purchased.reduce(function (s, i) {
          return s + (i.remainingQuestions || 0);
        }, 0);
        const totalMindScore = created.reduce(function (s, i) {
          return s + (i.mindScore || 0);
        }, 0);

        const topStats = [
          { label: "我的创建", value: createdCount, sub: "人生 Agent" },
          { label: "累计对话", value: createdSessions, sub: "聊天场次" },
        ];
        if (lifeAgentShowsPurchaseUi()) {
          topStats.push(
            { label: "已购次数", value: purchasedQuestions, sub: "剩余提问" },
            { label: "累计售出", value: soldPacks, sub: "提问包" }
          );
        }

        const quickActions = [
          {
            id: "created",
            label: "我创建的",
            desc: createdCount + " 个",
            icon: "created",
            iconClass: "icon-paper",
          },
          {
            id: "favorites",
            label: "我的收藏",
            desc: "喜欢的 Agent",
            icon: "favorites",
            iconClass: "icon-oxblood",
          },
          {
            id: "dev",
            label: "开发能力",
            desc: "API Key",
            icon: "dev",
            iconClass: "icon-oxblood",
          },
        ];

        this.setData({
          created,
          purchased,
          topStats,
          quickActions,
          totalMindScore,
          createdCount,
          createdSessions,
          soldPacks,
          purchasedCount: purchased.length,
          primaryAgentId: created[0] ? created[0].id : "",
          loading: false,
        });
      })
      .catch(function (err) {
        const app = getApp();
        const noUser = !app || !app.globalData || !app.globalData.user;
        const unauth = noUser || (err && err.statusCode === 401);
        this.resetLoggedOutState();
        if (unauth) {
          this.goLogin();
        }
      }.bind(this));
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

  goDiscover() {
    wx.switchTab({ url: "/pages/index/index" });
  },

  goSearch() {
    wx.navigateTo({ url: "/pages/search/search" });
  },

  onAvatarError() {
    this.setData({ userAvatar: "" });
  },

  onQuickAction(e) {
    const id = e.currentTarget.dataset.id;
    if (id === "created") {
      wx.navigateTo({ url: "/pages/my-agents/my-agents" });
      return;
    }
    if (id === "favorites") {
      const app = getApp();
      if (app && app.globalData) {
        app.globalData.pendingFeedView = "favorites";
      }
      wx.switchTab({ url: "/pages/index/index" });
      return;
    }
    if (id === "dev") {
      wx.navigateTo({ url: "/pages/api-keys/api-keys" });
    }
  },

  goPrimaryAgent() {
    if (this.data.primaryAgentId) {
      wx.navigateTo({
        url: "/pages/agent-manage/agent-manage?id=" + this.data.primaryAgentId,
      });
      return;
    }
    wx.navigateTo({ url: "/pages/agent-create/agent-create" });
  },
});
