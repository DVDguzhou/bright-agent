const { get } = require("../utils/request");

Component({
  data: {
    selected: 0,
    color: "#8d8478",
    selectedColor: "#1a1714",
    isLoggedIn: false,
    primaryAgent: null,
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
        this.setData({ primaryAgent: null });
        return;
      }
      this.loadOwnedAgents();
    },

    loadOwnedAgents() {
      if (this._loadingAgents) return;
      this._loadingAgents = true;
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
          this.setData({ primaryAgent });
        })
        .catch(() => {
          this.setData({ primaryAgent: null });
        })
        .finally(() => {
          this._loadingAgents = false;
        });
    },

    switchTab(e) {
      const { path, index } = e.currentTarget.dataset;
      if (index === 3 && !this.data.isLoggedIn) {
        wx.redirectTo({ url: "/pages/login/login" });
        return;
      }
      if (path) {
        wx.switchTab({ url: path });
        this.setData({ selected: index });
      }
    },
  },
});
