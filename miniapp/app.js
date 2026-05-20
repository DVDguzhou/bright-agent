App({
  globalData: {
    user: null,
  },
  onLaunch() {
    const session = wx.getStorageSync("brightagent_session");
    if (session) {
      this.refreshUser();
    }
  },
  refreshUser() {
    const { get } = require("./utils/request");
    return get("/api/auth/me")
      .then((res) => {
        this.globalData.user = res.data;
        return res.data;
      })
      .catch(() => {
        this.globalData.user = null;
        return null;
      });
  },
  clearSession() {
    wx.removeStorageSync("brightagent_session");
    this.globalData.user = null;
  },
});
