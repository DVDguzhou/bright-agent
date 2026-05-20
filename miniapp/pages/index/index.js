const { get, absUrl } = require("../../utils/request");

Page({
  data: {
    agents: [],
    loading: true,
    error: "",
  },
  onShow() {
    this.loadAgents();
  },
  loadAgents() {
    this.setData({ loading: true, error: "" });
    get("/api/life-agents")
      .then((res) => {
        const list = (res.data || []).map((item) => ({
          ...item,
          coverFull: absUrl(item.coverUrl || item.coverImageUrl || ""),
        }));
        this.setData({ agents: list, loading: false });
      })
      .catch(() => {
        this.setData({
          loading: false,
          error: "加载失败，请检查网络或服务器域名配置",
        });
      });
  },
  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/agent-detail/agent-detail?id=${id}` });
  },
  goMine() {
    wx.navigateTo({ url: "/pages/mine/mine" });
  },
  goSupport() {
    wx.navigateTo({ url: "/pages/support/support" });
  },
});
