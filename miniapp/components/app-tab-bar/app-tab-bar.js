const { get } = require("../../utils/request");

Component({
  properties: {
    selected: { type: Number, value: 0 },
    loginActive: { type: Boolean, value: false },
  },

  data: {
    isLoggedIn: false,
    primaryAgent: null,
    fabLoading: false,
  },

  lifetimes: {
    attached() {
      this.syncUser();
    },
  },

  pageLifetimes: {
    show() {
      this.syncUser();
    },
  },

  methods: {
    syncUser() {
      const app = getApp();
      const user = app && app.globalData && app.globalData.user;
      const isLoggedIn = !!user;
      this.setData({ isLoggedIn });
      if (!isLoggedIn) {
        this.setData({ primaryAgent: null, fabLoading: false });
        return;
      }
      this.loadOwnedAgents();
    },

    loadOwnedAgents() {
      if (this._loadingAgents) return;
      this._loadingAgents = true;
      this.setData({ fabLoading: true });
      get("/api/life-agents/mine")
        .then((res) => {
          const raw = Array.isArray(res.data) ? res.data : [];
          const first = raw[0];
          const primaryAgent =
            first && first.id
              ? {
                  id: String(first.id),
                  displayName: String(first.displayName || "Agent"),
                }
              : null;
          this.setData({ primaryAgent, fabLoading: false });
          this._loadingAgents = false;
        })
        .catch(function () {
          this.setData({ primaryAgent: null, fabLoading: false });
          this._loadingAgents = false;
        }.bind(this));
    },

    switchTab(e) {
      const index = Number(e.currentTarget.dataset.index);
      const path = e.currentTarget.dataset.path;
      if (index === 3 && !this.data.isLoggedIn) {
        if (this.properties.loginActive) return;
        wx.navigateTo({ url: "/pages/login/login" });
        return;
      }
      if (path) {
        wx.switchTab({ url: path });
      }
    },

    onFabTap() {
      const app = getApp();
      const user = app && app.globalData && app.globalData.user;
      if (!user) {
        wx.navigateTo({ url: "/pages/login/login" });
        return;
      }
      wx.navigateTo({ url: "/pages/agent-create/agent-create" });
    },
  },
});
