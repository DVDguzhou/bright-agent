const {
  loadManageData,
  formatDateTime,
  formatShortTime,
  goBackToManage,
} = require("../../utils/agent-manage");

const RANGE_OPTIONS = [
  { key: "7d", label: "近 7 天" },
  { key: "30d", label: "近 30 天" },
  { key: "all", label: "全部" },
];

function filterPacks(packs, range) {
  if (range === "all") return packs;
  const days = range === "7d" ? 7 : 30;
  const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
  return packs.filter(function (item) {
    const ms = Date.parse(item.createdAt);
    return !isNaN(ms) && ms >= threshold;
  });
}

function buildSummary(filtered) {
  const buyers = {};
  let asked = 0;
  filtered.forEach(function (item) {
    const key = (item.buyer && (item.buyer.email || item.buyer.name)) || item.id;
    buyers[key] = true;
    asked += item.questionCount || 0;
  });
  const buyerCount = Object.keys(buyers).length;
  return { buyers: buyerCount, asked: asked, heat: buyerCount + asked };
}

Page({
  data: {
    id: "",
    loading: true,
    error: "",
    displayName: "",
    range: "30d",
    rangeOptions: RANGE_OPTIONS,
    summary: { buyers: 0, asked: 0, heat: 0 },
    rangeLabel: "近 30 天",
    items: [],
    allPacks: [],
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
        const packs = Array.isArray(result.data.questionPacks) ? result.data.questionPacks : [];
        this.setData({
          loading: false,
          displayName: result.data.profile.displayName || "",
          allPacks: packs,
        });
        this.applyFilter(this.data.range);
      }.bind(this)
    );
  },

  applyFilter(range) {
    const filtered = filterPacks(this.data.allPacks, range);
    const summary = buildSummary(filtered);
    const rangeLabel = range === "7d" ? "近 7 天" : range === "30d" ? "近 30 天" : "全部";
    this.setData({
      range: range,
      rangeLabel: rangeLabel,
      summary: summary,
      items: filtered.map(function (item) {
        const buyer = item.buyer || {};
        return {
          id: item.id,
          name: buyer.name || buyer.email || "用户",
          detail: "提问 " + (item.questionCount || 0) + " 次，已对话 " + (item.questionsUsed || 0) + " 次",
          timeLabel: formatShortTime(item.createdAt),
          dateLabel: formatDateTime(item.createdAt),
        };
      }),
    });
  },

  onRangeTap(e) {
    const range = e.currentTarget.dataset.range;
    if (!range || range === this.data.range) return;
    this.applyFilter(range);
  },

  goBack() {
    goBackToManage(this.data.id);
  },

  retry() {
    this.loadData();
  },
});
