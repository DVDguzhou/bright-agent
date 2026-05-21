const { get, absUrl } = require("../../utils/request");

Page({
  data: {
    id: "",
    agent: null,
    loading: true,
    error: "",
    isLoggedIn: false,
  },
  onLoad(options) {
    const id = options.id || "";
    this.setData({ id });
    if (!id) {
      this.setData({ loading: false, error: "缺少 Agent ID" });
      return;
    }
    this.loadDetail();
  },
  loadDetail() {
    this.setData({ loading: true, error: "" });
    get(`/api/life-agents/${this.data.id}`)
      .then((res) => {
        const agent = res.data || {};
        const viewer = agent.viewerState || {};
        this.setData({
          agent: {
            ...agent,
            coverFull: absUrl(agent.coverUrl || agent.coverImageUrl || ""),
          },
          isLoggedIn: !!viewer.isLoggedIn,
          loading: false,
        });
      })
      .catch(() => {
        this.setData({ loading: false, error: "加载失败" });
      });
  },
  goChat() {
    const { id, isLoggedIn } = this.data;
    if (!isLoggedIn) {
      wx.navigateTo({
        url: `/pages/login/login?redirect=${encodeURIComponent(`/pages/chat/chat?id=${id}`)}`,
      });
      return;
    }
    wx.navigateTo({ url: `/pages/chat/chat?id=${id}` });
  },
});
