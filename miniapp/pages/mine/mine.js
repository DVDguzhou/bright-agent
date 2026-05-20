const { get, post, clearSession, absUrl } = require("../../utils/request");

Page({
  data: {
    user: null,
    purchased: [],
    loading: true,
  },
  onShow() {
    this.refresh();
  },
  refresh() {
    this.setData({ loading: true });
    get("/api/auth/me")
      .then((res) => {
        const user = res.data;
        getApp().globalData.user = user;
        this.setData({ user, loading: false });
        return this.loadPurchased();
      })
      .catch(() => {
        this.setData({ user: null, purchased: [], loading: false });
      });
  },
  loadPurchased() {
    return get("/api/life-agents/purchased")
      .then((res) => {
        const list = (res.data || []).map((item) => ({
          ...item,
          coverFull: absUrl(item.coverUrl || item.coverImageUrl || ""),
        }));
        this.setData({ purchased: list });
      })
      .catch(() => this.setData({ purchased: [] }));
  },
  goLogin() {
    wx.navigateTo({ url: "/pages/login/login" });
  },
  goChat(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/chat/chat?id=${id}` });
  },
  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/agent-detail/agent-detail?id=${id}` });
  },
  goSupport() {
    wx.navigateTo({ url: "/pages/support/support" });
  },
  goPrivacy() {
    wx.navigateTo({ url: "/pages/privacy/privacy" });
  },
  logout() {
    post("/api/auth/logout", {})
      .catch(() => {})
      .finally(() => {
        clearSession();
        this.setData({ user: null, purchased: [] });
        wx.showToast({ title: "已退出", icon: "none" });
      });
  },
});
