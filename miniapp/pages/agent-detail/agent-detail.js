const { get, absUrl } = require("../../utils/request");

Page({
  data: {
    id: "",
    agent: null,
    loading: true,
    error: "",
    remaining: 0,
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
          remaining: viewer.remainingQuestions || 0,
          isLoggedIn: !!viewer.isLoggedIn,
          loading: false,
        });
      })
      .catch(() => {
        this.setData({ loading: false, error: "加载失败" });
      });
  },
  goChat() {
    const { id, isLoggedIn, remaining } = this.data;
    if (!isLoggedIn) {
      wx.navigateTo({
        url: `/pages/login/login?redirect=${encodeURIComponent(`/pages/chat/chat?id=${id}`)}`,
      });
      return;
    }
    if (remaining <= 0) {
      wx.showModal({
        title: "暂无提问次数",
        content: "请先在网站或 App 购买提问包后再对话。小程序 Phase 1 暂不支持支付。",
        showCancel: false,
      });
      return;
    }
    wx.navigateTo({ url: `/pages/chat/chat?id=${id}` });
  },
});
