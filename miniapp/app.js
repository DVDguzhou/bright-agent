App({
  globalData: {
    user: null,
  },
  onLaunch() {
    const session = wx.getStorageSync("brightagent_session");
    if (session) {
      this.refreshUser().then((user) => {
        if (user) {
          const { hydrateServerFavorites } = require("./utils/favorites");
          hydrateServerFavorites();
        }
      });
    }
  },
  syncTabBar() {
    try {
      const pages = getCurrentPages();
      const page = pages[pages.length - 1];
      const { syncTabBarAuth } = require("./utils/tab-bar");
      syncTabBarAuth(page);
    } catch (e) {
      /* ignore */
    }
  },
  refreshUser() {
    const { get } = require("./utils/request");
    return get("/api/auth/me")
      .then((res) => {
        this.globalData.user = res.data;
        this.syncTabBar();
        return res.data;
      })
      .catch(() => {
        this.globalData.user = null;
        this.syncTabBar();
        return null;
      });
  },
  clearSession() {
    wx.removeStorageSync("brightagent_session");
    this.globalData.user = null;
    this.syncTabBar();
  },
});
