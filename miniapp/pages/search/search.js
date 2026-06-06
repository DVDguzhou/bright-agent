const { get } = require("../../utils/request");
const { resolveLifeAgentCoverDisplayUrl } = require("../../utils/covers");
const { getNavMetrics } = require("../../utils/nav-metrics");
const {
  getSearchHistory,
  addSearchHistory,
  clearSearchHistory,
} = require("../../utils/search-history");

const SEARCH_PAGE_SIZE = 24;

const GUESS_LEFT = [
  "考研经验咨询",
  "秋招改简历",
  "转行互联网",
  "雅思怎么准备",
  "体制内跳槽",
];

const GUESS_RIGHT = [
  { text: "产品经理入门路径", hot: true },
  { text: "远程岗位怎么找", hot: false },
  { text: "副业从哪开始", hot: false },
  { text: "大厂面试准备", hot: false },
  { text: "留学申请时间线", hot: false },
];

function normalizeAgent(item) {
  return Object.assign({}, item, {
    coverFull: resolveLifeAgentCoverDisplayUrl(
      item.coverUrl,
      item.coverImageUrl,
      item.coverPresetKey
    ),
  });
}

function parseSearchPayload(raw) {
  if (Array.isArray(raw)) {
    return { items: raw, nextCursor: "", total: raw.length, fallback: false };
  }
  if (raw && typeof raw === "object") {
    return {
      items: Array.isArray(raw.items) ? raw.items : [],
      nextCursor:
        typeof raw.nextCursor === "string" ? raw.nextCursor : "",
      total: typeof raw.total === "number" ? raw.total : 0,
      fallback: raw.fallback === true,
    };
  }
  return { items: [], nextCursor: "", total: 0, fallback: false };
}

function buildEditorPicks() {
  const items = GUESS_LEFT.map(function (text) {
    return { text: text, hot: false };
  }).concat(GUESS_RIGHT);
  return items.map(function (item, index) {
    const n = index + 1;
    const num = n < 10 ? "0" + n : String(n);
    return Object.assign({}, item, { num: num });
  });
}

function buildStatusLine(loading, loadError, fallback, total) {
  if (loading) return "加载中…";
  if (loadError) return "";
  if (fallback) return "没有完全匹配的 Agent，为你推荐以下内容";
  return "共 " + total + " 个相关 Agent";
}

Page({
  data: {
    statusBarHeight: 20,
    mode: "entry",
    draft: "",
    query: "",
    history: [],
    historyExpanded: false,
    visibleHistory: [],
    editorPicks: buildEditorPicks(),
    agents: [],
    nextCursor: "",
    total: 0,
    fallback: false,
    loading: false,
    loadingMore: false,
    loadError: "",
    statusLine: "",
    kickerLabel: "Results",
    kickerFallback: false,
    focusInput: true,
    skeletonRows: [1, 2, 3, 4, 5, 6],
  },

  onLoad(options) {
    const nav = getNavMetrics();
    this.setData({ statusBarHeight: nav.statusBarHeight });
    this._openedWithQuery = false;

    const q = (options.q || "").trim();
    if (q) {
      this._openedWithQuery = true;
      this.setData({
        mode: "results",
        draft: q,
        query: q,
        focusInput: false,
      });
      this.loadSearch(true);
      return;
    }
    this.refreshHistory();
  },

  onShow() {
    if (this.data.mode === "entry") {
      this.refreshHistory();
    }
  },

  onReachBottom() {
    if (this.data.mode !== "results") return;
    this.loadMore();
  },

  refreshHistory() {
    const history = getSearchHistory();
    this.applyHistoryView(history, this.data.historyExpanded);
  },

  applyHistoryView(history, expanded) {
    const visibleHistory = expanded ? history : history.slice(0, 6);
    this.setData({
      history: history,
      visibleHistory: visibleHistory,
      historyExpanded: expanded,
    });
  },

  onDraftInput(e) {
    this.setData({ draft: e.detail.value || "" });
  },

  runSearch(arg) {
    let term = this.data.draft;
    if (typeof arg === "string") {
      term = arg;
    } else if (arg && arg.detail && arg.detail.value != null) {
      term = arg.detail.value;
    }
    const t = (term || "").trim();
    if (!t) return;
    addSearchHistory(t);
    this.setData({
      mode: "results",
      draft: t,
      query: t,
      focusInput: false,
    });
    this.loadSearch(true);
  },

  loadSearch(reset) {
    const q = this.data.query;
    if (!q) return Promise.resolve();

    if (reset) {
      this.setData({
        loading: true,
        loadingMore: false,
        loadError: "",
        agents: [],
        nextCursor: "",
        total: 0,
        fallback: false,
        statusLine: "加载中…",
        kickerLabel: "Results",
        kickerFallback: false,
      });
    }

    const cursor = reset ? "" : this.data.nextCursor;
    let url =
      "/api/life-agents/search?q=" +
      encodeURIComponent(q) +
      "&limit=" +
      SEARCH_PAGE_SIZE;
    if (cursor) {
      url += "&offset=" + encodeURIComponent(cursor);
    }

    return get(url)
      .then(
        function (res) {
          const parsed = parseSearchPayload(res.data);
          const items = parsed.items.map(normalizeAgent);
          let agents = items;
          if (!reset) {
            const seen = {};
            this.data.agents.forEach(function (a) {
              seen[a.id] = true;
            });
            agents = this.data.agents.slice();
            items.forEach(function (item) {
              if (!seen[item.id]) {
                seen[item.id] = true;
                agents.push(item);
              }
            });
          }
          const total = parsed.total || agents.length;
          const fallback = parsed.fallback;
          this.setData({
            agents: agents,
            nextCursor: parsed.nextCursor,
            total: total,
            fallback: fallback,
            loading: false,
            loadingMore: false,
            loadError: "",
            statusLine: buildStatusLine(false, "", fallback, total),
            kickerLabel: fallback ? "Suggested" : "Results",
            kickerFallback: fallback,
          });
        }.bind(this)
      )
      .catch(
        function () {
          this.setData({
            loading: false,
            loadingMore: false,
            loadError: "加载失败，请刷新页面重试",
            agents: [],
            statusLine: "",
          });
        }.bind(this)
      );
  },

  loadMore() {
    if (
      this.data.loading ||
      this.data.loadingMore ||
      !this.data.nextCursor
    ) {
      return;
    }
    this.setData({ loadingMore: true });
    this.loadSearch(false);
  },

  clearHistory() {
    clearSearchHistory();
    this.applyHistoryView([], false);
  },

  toggleHistoryExpanded() {
    const expanded = !this.data.historyExpanded;
    this.applyHistoryView(this.data.history, expanded);
  },

  tapHistory(e) {
    const term = e.currentTarget.dataset.term;
    if (!term) return;
    this.setData({ draft: term });
    this.runSearch(term);
  },

  tapPick(e) {
    const text = e.currentTarget.dataset.text;
    if (!text) return;
    this.setData({ draft: text });
    this.runSearch(text);
  },

  clearLoadError() {
    this.loadSearch(true);
  },

  goBack() {
    if (this.data.mode === "results" && !this._openedWithQuery) {
      this.setData({
        mode: "entry",
        draft: "",
        query: "",
        agents: [],
        loadError: "",
        loading: false,
        focusInput: true,
      });
      this.refreshHistory();
      return;
    }
    wx.navigateBack({
      fail: function () {
        wx.switchTab({ url: "/pages/index/index" });
      },
    });
  },

  goDetail(e) {
    const id = e.detail && e.detail.id;
    if (!id) return;
    wx.navigateTo({ url: "/pages/agent-detail/agent-detail?id=" + id });
  },
});
