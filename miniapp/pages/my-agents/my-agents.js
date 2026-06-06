const { get } = require("../../utils/request");
const { resolveLifeAgentCoverDisplayUrl } = require("../../utils/covers");

function normalizeAgent(item) {
  return Object.assign({}, item, {
    coverFull: resolveLifeAgentCoverDisplayUrl(
      item.coverUrl,
      item.coverImageUrl,
      item.coverPresetKey
    ),
  });
}

function filterAgents(agents, query) {
  const keyword = (query || "").trim().toLowerCase();
  if (!keyword) return agents;
  return agents.filter(function (item) {
    return [item.displayName, item.headline, item.shortBio]
      .filter(Boolean)
      .some(function (text) {
        return String(text).toLowerCase().indexOf(keyword) >= 0;
      });
  });
}

Page({
  data: {
    query: "",
    agents: [],
    filteredList: [],
    loading: true,
  },

  onLoad() {
    this.loadAgents();
  },

  loadAgents() {
    this.setData({ loading: true });
    get("/api/life-agents/mine")
      .then(function (res) {
        const raw = Array.isArray(res.data) ? res.data : [];
        const agents = raw.map(normalizeAgent);
        this.setData({
          agents,
          filteredList: filterAgents(agents, this.data.query),
          loading: false,
        });
      }.bind(this))
      .catch(function () {
        this.setData({ agents: [], filteredList: [], loading: false });
        wx.showToast({ title: "加载失败", icon: "none" });
      }.bind(this));
  },

  onSearchInput(e) {
    const query = e.detail.value || "";
    this.setData({
      query,
      filteredList: filterAgents(this.data.agents, query),
    });
  },

  goDetail(e) {
    const id = (e.detail && e.detail.id) || "";
    if (!id) return;
    wx.navigateTo({
      url: "/pages/agent-manage/agent-manage?id=" + id,
    });
  },

  goCreate() {
    wx.navigateTo({ url: "/pages/agent-create/agent-create" });
  },

  goDiscover() {
    wx.switchTab({ url: "/pages/index/index" });
  },
});
