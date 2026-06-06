const {
  loadManageData,
  extractTopKeywords,
  formatDateTime,
  formatShortTime,
  goBackToManage,
} = require("../../utils/agent-manage");

Page({
  data: {
    id: "",
    loading: true,
    error: "",
    query: "",
    sessionCount: 0,
    totalMessages: 0,
    keywordsText: "",
    items: [],
    allSessions: [],
  },

  onLoad(options) {
    const id = options.id || "";
    this.setData({ id });
    if (!id) {
      this.setData({ loading: false, error: "缺少 Agent ID" });
      return;
    }
    this.loadData();
  },

  loadData() {
    const id = this.data.id;
    this.setData({ loading: true, error: "" });
    loadManageData(id).then(
      function (result) {
        if (!result.data) {
          this.setData({ loading: false, error: result.error || "加载失败" });
          return;
        }
        const sessions = Array.isArray(result.data.chatSessions) ? result.data.chatSessions : [];
        const totalMessages = sessions.reduce(function (sum, item) {
          return sum + (item.messageCount || 0);
        }, 0);
        const keywords = extractTopKeywords(
          sessions.map(function (item) {
            return item.title || "";
          }),
          6
        );
        this.setData({
          loading: false,
          allSessions: sessions,
          sessionCount: sessions.length,
          totalMessages: totalMessages,
          keywordsText: keywords.length > 0 ? keywords.join(" · ") : "",
        });
        this.applyFilter(this.data.query);
      }.bind(this)
    );
  },

  applyFilter(query) {
    const keyword = String(query || "")
      .trim()
      .toLowerCase();
    const list = this.data.allSessions;
    const filtered = !keyword
      ? list
      : list.filter(function (item) {
          const buyer = item.buyer || {};
          const hay = [item.title, buyer.name || "", buyer.email || ""].join(" ").toLowerCase();
          return hay.indexOf(keyword) >= 0;
        });
    this.setData({
      query: query,
      items: filtered.map(function (item) {
        const buyer = item.buyer || {};
        return {
          id: item.id,
          name: buyer.name || buyer.email || "用户",
          title: item.title || "隐私保护会话",
          detail: (item.messageCount || 0) + " 条消息 · 创建于 " + formatDateTime(item.createdAt),
          timeLabel: formatShortTime(item.updatedAt),
        };
      }),
    });
  },

  onSearchInput(e) {
    this.applyFilter(e.detail.value || "");
  },

  goBack() {
    goBackToManage(this.data.id);
  },

  retry() {
    this.loadData();
  },
});
