const {
  loadManageData,
  extractTopKeywords,
  formatShortTime,
  feedbackTypeLabel,
  goBackToManage,
} = require("../../utils/agent-manage");

function truncateText(text, maxLen) {
  const s = String(text || "").trim();
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen) + "…";
}

function buildRows(feedback) {
  if (!feedback) return [];
  const out = [];
  const recent = Array.isArray(feedback.recent) ? feedback.recent : [];
  recent.forEach(function (item) {
    const sortMs = Date.parse(item.createdAt);
    const excerpt = item.assistantExcerpt ? String(item.assistantExcerpt).trim() : "";
    const comment = item.comment ? String(item.comment).trim() : "";
    const content = comment || truncateText(excerpt, 100) || "无摘要";
    out.push({
      key: "f-" + item.id,
      kind: "feedback",
      typeLabel: feedbackTypeLabel(item.feedbackType),
      content: content,
      keywordText: [excerpt, comment].filter(Boolean).join(" "),
      timeLabel: formatShortTime(item.createdAt),
      sortMs: isNaN(sortMs) ? 0 : sortMs,
      score: 0,
    });
  });
  const ratings = feedback.ratings && Array.isArray(feedback.ratings.recent) ? feedback.ratings.recent : [];
  ratings.forEach(function (item) {
    const sortMs = Date.parse(item.updatedAt);
    out.push({
      key: "r-" + item.id,
      kind: "rating",
      typeLabel: "星级评价",
      content: (item.comment && String(item.comment).trim()) || "无文字评语",
      keywordText: item.comment ? String(item.comment).trim() : "",
      timeLabel: formatShortTime(item.updatedAt),
      sortMs: isNaN(sortMs) ? 0 : sortMs,
      score: item.score || 0,
    });
  });
  out.sort(function (a, b) {
    return b.sortMs - a.sortMs;
  });
  return out;
}

function buildSuggestions(counts, ratings) {
  const list = [];
  if ((counts.notSpecific || 0) > (counts.helpful || 0)) {
    list.push("近期「不够具体」偏多，优先补真实案例、决策步骤和示范回答。");
  }
  if ((counts.notSuitable || 0) > 0) {
    list.push("出现「不适合我」反馈，建议完善「适合帮助的人群」和「不想回答的问题」。");
  }
  if ((counts.factualError || 0) > 0 || (counts.contradiction || 0) > 0) {
    list.push("已经出现事实错误或前后矛盾，建议优先检查结构化事实、知识条目和记忆摘要。");
  }
  if ((counts.tooConfident || 0) > 0) {
    list.push("有用户觉得回答「过度自信」，建议在不能回答的问题里写清楚边界，并补充更谨慎的示范回答。");
  }
  if (ratings.raters > 0 && ratings.averageScore < 4) {
    list.push("星级均分偏低，建议先用对话调教优化语气和回答结构。");
  }
  if (list.length === 0) {
    list.push("当前整体反馈稳定，可以继续扩充知识条目并保持更新频率。");
  }
  return list;
}

Page({
  data: {
    id: "",
    loading: true,
    error: "",
    displayName: "",
    query: "",
    avgScore: "—",
    helpful: 0,
    notSpecific: 0,
    notSuitable: 0,
    factualError: 0,
    contradiction: 0,
    tooConfident: 0,
    keywordsText: "",
    suggestions: [],
    trendRows: [],
    rows: [],
    filteredRows: [],
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
        const feedback = result.data.feedback || {};
        const counts = feedback.counts || {
          helpful: 0,
          notSpecific: 0,
          notSuitable: 0,
          factualError: 0,
          contradiction: 0,
        };
        const ratings = feedback.ratings || { averageScore: 0, raters: 0, recent: [] };
        const rows = buildRows(feedback);
        const keywords = extractTopKeywords(
          rows.map(function (row) {
            return row.keywordText || row.content || "";
          }),
          8
        );
        const trendRows = (ratings.recent || []).slice(0, 7).reverse().map(function (item) {
          return {
            timeLabel: formatShortTime(item.updatedAt),
            score: item.score || 0,
            widthPct: Math.round(((item.score || 0) / 5) * 100),
          };
        });
        this.setData({
          loading: false,
          displayName: result.data.profile.displayName || "",
          avgScore: ratings.raters > 0 ? ratings.averageScore.toFixed(1) : "—",
          helpful: counts.helpful || 0,
          notSpecific: counts.notSpecific || 0,
          notSuitable: counts.notSuitable || 0,
          factualError: counts.factualError || 0,
          contradiction: counts.contradiction || 0,
          tooConfident: counts.tooConfident || 0,
          keywordsText: keywords.length > 0 ? keywords.join(" · ") : "",
          suggestions: buildSuggestions(counts, ratings),
          trendRows: trendRows,
          rows: rows,
        });
        this.applyFilter(this.data.query);
      }.bind(this)
    );
  },

  applyFilter(query) {
    const keyword = String(query || "")
      .trim()
      .toLowerCase();
    const rows = this.data.rows;
    const filtered = !keyword
      ? rows
      : rows.filter(function (row) {
          const hay = [row.typeLabel, row.content, row.kind === "rating" ? String(row.score) : ""]
            .join(" ")
            .toLowerCase();
          return hay.indexOf(keyword) >= 0;
        });
    this.setData({ query: query, filteredRows: filtered });
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
