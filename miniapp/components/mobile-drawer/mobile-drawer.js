const { getNavMetrics } = require("../../utils/nav-metrics");
const { post, clearSession } = require("../../utils/request");

Component({
  properties: {
    open: {
      type: Boolean,
      value: false,
      observer: "onOpenChange",
    },
  },

  data: {
    statusBarHeight: 44,
    isLoggedIn: false,
  },

  lifetimes: {
    attached() {
      const nav = getNavMetrics();
      this.setData({
        statusBarHeight: nav.statusBarHeight,
      });
    },
  },

  methods: {
    onOpenChange(open) {
      if (open) this.syncLoginState();
    },

    syncLoginState() {
      const app = getApp();
      if (app && typeof app.refreshUser === "function") {
        app.refreshUser().then((user) => {
          this.setData({ isLoggedIn: !!user });
        });
        return;
      }
      const user = app && app.globalData && app.globalData.user;
      this.setData({ isLoggedIn: !!user });
    },

    onClose() {
      this.triggerEvent("close");
    },

    noop() {},

    goCreate() {
      this.onClose();
      wx.navigateTo({ url: "/pages/agent-create/agent-create" });
    },

    goCreated() {
      this.onClose();
      wx.navigateTo({ url: "/pages/my-agents/my-agents" });
    },

    goMessages() {
      this.onClose();
      wx.switchTab({ url: "/pages/messages/messages" });
    },

    goMap() {
      this.onClose();
      wx.switchTab({ url: "/pages/map/map" });
    },

    goSupport() {
      this.onClose();
      wx.navigateTo({ url: "/pages/support/support" });
    },

    goMine() {
      this.onClose();
      wx.switchTab({ url: "/pages/mine/mine" });
    },

    goAccount() {
      this.onClose();
      wx.navigateTo({ url: "/pages/account/account" });
    },

    goLogin() {
      this.onClose();
      wx.navigateTo({ url: "/pages/login/login" });
    },

    logout() {
      this.onClose();
      post("/api/auth/logout", {})
        .catch(function () {})
        .then(function () {
          clearSession();
          wx.showToast({ title: "已退出", icon: "none" });
        });
    },
  },
});
