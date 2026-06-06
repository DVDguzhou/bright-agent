const { get, post } = require("../../utils/request");
const {
  loadManageData,
  goBackToManage,
  navigateToManageSub,
} = require("../../utils/agent-manage");

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("zh-CN");
}

function confidenceLabel(value) {
  const v = String(value || "").toLowerCase();
  if (v === "high") return "置信度高";
  if (v === "medium") return "置信度中";
  return "置信度低";
}

function routeLabel(value) {
  const v = String(value || "").trim();
  if (!v) return "";
  if (v === "memory") return "记忆缺口";
  if (v === "knowledge") return "知识缺口";
  if (v === "experience") return "经验缺口";
  return v;
}

Page({
  data: {
    id: "",
    loading: true,
    error: "",
    spots: [],
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
    Promise.all([
      loadManageData(id),
      get("/api/life-agents/" + id + "/blind-spots").catch(function () {
        return { data: { blindSpots: [] } };
      }),
    ]).then(
      function (results) {
        const manage = results[0];
        const blindRes = results[1];
        if (!manage.data) {
          this.setData({ loading: false, error: manage.error || "加载失败" });
          return;
        }
        const spots = blindRes.data && Array.isArray(blindRes.data.blindSpots) ? blindRes.data.blindSpots : [];
        this.setData({
          loading: false,
          spots: spots.map(function (spot) {
            return {
              id: spot.id,
              userQuestion: spot.userQuestion || "",
              dateLabel: formatDate(spot.createdAt),
              confidenceLabel: confidenceLabel(spot.confidence),
              routeLabel: routeLabel(spot.route),
            };
          }),
        });
      }.bind(this)
    );
  },

  goCoedit() {
    navigateToManageSub(this.data.id, "coedit");
  },

  resolveSpot(e) {
    const spotId = e.currentTarget.dataset.id;
    if (!spotId) return;
    const that = this;
    post("/api/life-agents/" + this.data.id + "/blind-spots/" + spotId + "/resolve")
      .then(function () {
        that.setData({
          spots: that.data.spots.filter(function (s) {
            return s.id !== spotId;
          }),
        });
      })
      .catch(function () {
        wx.showToast({ title: "操作失败", icon: "none" });
      });
  },

  goBack() {
    goBackToManage(this.data.id);
  },

  retry() {
    this.loadData();
  },
});
