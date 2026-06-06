const { get, patch, post } = require("../../utils/request");
const { goBackToManage } = require("../../utils/agent-manage");

const FILTER_OPTIONS = [
  { key: "all", label: "全部" },
  { key: "active", label: "active" },
  { key: "candidate", label: "candidate" },
  { key: "archived", label: "archived" },
];

const STATUS_OPTIONS = ["candidate", "active", "archived"];
const CONFIDENCE_OPTIONS = ["low", "medium", "high"];

function topicMatchesQuery(topic, edit, keyword) {
  if (!keyword) return true;
  const haystack = [
    topic.topicLabel,
    topic.topicKey,
    topic.summary,
    topic.topicGroup,
    topic.source,
    topic.status,
    topic.confidence,
    topic.mergedIntoTopicLabel,
  ]
    .concat(topic.aliases || [])
    .concat(topic.questionPatterns || [])
    .concat([
      edit && edit.topicLabel,
      edit && edit.summary,
      edit && edit.aliases,
      edit && edit.questionPatterns,
    ])
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.indexOf(keyword) >= 0;
}

function computeTopicStats(topics) {
  return {
    total: topics.length,
    candidate: topics.filter(function (t) {
      return t.status === "candidate";
    }).length,
    active: topics.filter(function (t) {
      return t.status === "active";
    }).length,
    feedback: topics.reduce(function (sum, t) {
      return sum + ((t.feedback && t.feedback.total) || 0);
    }, 0),
  };
}

function buildEdits(topics) {
  const edits = {};
  topics.forEach(function (topic) {
    edits[topic.id] = {
      topicLabel: topic.topicLabel || "",
      summary: topic.summary || "",
      aliases: Array.isArray(topic.aliases) ? topic.aliases.join("\n") : "",
      questionPatterns: Array.isArray(topic.questionPatterns) ? topic.questionPatterns.join("\n") : "",
      confidence: topic.confidence || "medium",
      status: topic.status || "candidate",
      mergeTargetId: "",
      mergeTargetIndex: 0,
      mergeTargetLabel: "",
    };
  });
  return edits;
}

function mapTopics(topics, edits, mergeTargets) {
  return topics.map(function (topic) {
    const edit = edits[topic.id] || {};
    const mergeOptions = mergeTargets
      .filter(function (item) {
        return item.id !== topic.id;
      })
      .map(function (item) {
        return {
          id: item.id,
          label: (item.topicLabel || item.topicKey) + " (" + (item.status || "") + ")",
        };
      });
    return {
      id: topic.id,
      topicKey: topic.topicKey || "",
      topicGroup: topic.topicGroup || "",
      source: topic.source || "unknown",
      status: topic.status || "candidate",
      manualEdited: !!topic.manualEdited,
      mergedIntoTopicLabel: topic.mergedIntoTopicLabel || "",
      feedbackTotal: (topic.feedback && topic.feedback.total) || 0,
      feedbackHelpful: (topic.feedback && topic.feedback.helpful) || 0,
      feedbackFacts: ((topic.feedback && topic.feedback.factualError) || 0) + ((topic.feedback && topic.feedback.contradiction) || 0),
      sourceCount: (topic.sourceEntryIds && topic.sourceEntryIds.length) || 0,
      edit: edit,
      mergeOptions: mergeOptions,
      statusIndex: Math.max(0, STATUS_OPTIONS.indexOf(edit.status || "candidate")),
      confidenceIndex: Math.max(0, CONFIDENCE_OPTIONS.indexOf(edit.confidence || "medium")),
    };
  });
}

Page({
  data: {
    id: "",
    loading: true,
    error: "",
    filter: "all",
    query: "",
    filteredCount: 0,
    filterOptions: FILTER_OPTIONS,
    topics: [],
    allTopics: [],
    edits: {},
    mergeTargets: [],
    statusOptions: STATUS_OPTIONS,
    confidenceOptions: CONFIDENCE_OPTIONS,
    stats: { total: 0, candidate: 0, active: 0, feedback: 0 },
    savingId: "",
    mergingId: "",
  },

  onLoad(options) {
    const id = options.id || "";
    this.setData({ id });
    if (!id) {
      this.setData({ loading: false, error: "缺少 Agent ID" });
      return;
    }
    this.loadTopics();
  },

  loadTopics() {
    const id = this.data.id;
    this.setData({ loading: true, error: "" });
    get("/api/life-agents/" + id + "/topics")
      .then(
        function (res) {
          const topics = res.data && Array.isArray(res.data.topics) ? res.data.topics : [];
          const edits = buildEdits(topics);
          const mergeTargets = topics.filter(function (t) {
            return t.status !== "archived";
          });
          const stats = computeTopicStats(topics);
          this.setData({
            loading: false,
            allTopics: topics,
            edits: edits,
            mergeTargets: mergeTargets,
            stats: stats,
          });
          this.applyFilter(this.data.filter);
        }.bind(this)
      )
      .catch(
        function (err) {
          const detail = (err.data && err.data.detail) || "加载 Topic 失败";
          this.setData({ loading: false, error: detail });
        }.bind(this)
      );
  },

  applyFilter(filter) {
    const keyword = String(this.data.query || "")
      .trim()
      .toLowerCase();
    const list =
      filter === "all"
        ? this.data.allTopics
        : this.data.allTopics.filter(function (topic) {
            return topic.status === filter;
          });
    const filtered = keyword
      ? list.filter(
          function (topic) {
            return topicMatchesQuery(topic, this.data.edits[topic.id], keyword);
          }.bind(this)
        )
      : list;
    this.setData({
      filter: filter,
      filteredCount: filtered.length,
      topics: mapTopics(filtered, this.data.edits, this.data.mergeTargets),
    });
  },

  clearSearch() {
    this.setData({ query: "" });
    this.applyFilter(this.data.filter);
  },

  refreshTopicsState(topics) {
    const edits = buildEdits(topics);
    const mergeTargets = topics.filter(function (t) {
      return t.status !== "archived";
    });
    this.setData({
      allTopics: topics,
      edits: edits,
      mergeTargets: mergeTargets,
      stats: computeTopicStats(topics),
    });
    this.applyFilter(this.data.filter);
  },

  onSearchInput(e) {
    this.setData({ query: e.detail.value || "" });
    this.applyFilter(this.data.filter);
  },

  onFilterTap(e) {
    const filter = e.currentTarget.dataset.filter;
    if (!filter) return;
    this.applyFilter(filter);
  },

  onFieldInput(e) {
    const topicId = e.currentTarget.dataset.id;
    const field = e.currentTarget.dataset.field;
    if (!topicId || !field) return;
    const edits = Object.assign({}, this.data.edits);
    const prev = edits[topicId] || {};
    edits[topicId] = Object.assign({}, prev, { [field]: e.detail.value });
    this.setData({ edits: edits });
    this.applyFilter(this.data.filter);
  },

  onStatusChange(e) {
    const topicId = e.currentTarget.dataset.id;
    const idx = Number(e.detail.value) || 0;
    const edits = Object.assign({}, this.data.edits);
    const prev = edits[topicId] || {};
    edits[topicId] = Object.assign({}, prev, { status: STATUS_OPTIONS[idx] || "candidate" });
    this.setData({ edits: edits });
    this.applyFilter(this.data.filter);
  },

  onConfidenceChange(e) {
    const topicId = e.currentTarget.dataset.id;
    const idx = Number(e.detail.value) || 0;
    const edits = Object.assign({}, this.data.edits);
    const prev = edits[topicId] || {};
    edits[topicId] = Object.assign({}, prev, { confidence: CONFIDENCE_OPTIONS[idx] || "medium" });
    this.setData({ edits: edits });
    this.applyFilter(this.data.filter);
  },

  onMergeChange(e) {
    const topicId = e.currentTarget.dataset.id;
    const idx = Number(e.detail.value) || 0;
    const topic = this.data.topics.find(function (t) {
      return t.id === topicId;
    });
    const targetId = topic && topic.mergeOptions[idx] ? topic.mergeOptions[idx].id : "";
    const targetLabel = topic && topic.mergeOptions[idx] ? topic.mergeOptions[idx].label : "";
    const edits = Object.assign({}, this.data.edits);
    const prev = edits[topicId] || {};
    edits[topicId] = Object.assign({}, prev, {
      mergeTargetId: targetId,
      mergeTargetIndex: idx,
      mergeTargetLabel: targetLabel,
    });
    this.setData({ edits: edits });
    this.applyFilter(this.data.filter);
  },

  saveTopic(e) {
    const topicId = e.currentTarget.dataset.id;
    const edit = this.data.edits[topicId];
    if (!edit || this.data.savingId) return;
    this.setData({ savingId: topicId });
    const that = this;
    patch("/api/life-agents/" + this.data.id + "/topics/" + topicId, {
      topicLabel: String(edit.topicLabel || "").trim(),
      summary: String(edit.summary || "").trim(),
      aliases: String(edit.aliases || "")
        .split("\n")
        .map(function (s) {
          return s.trim();
        })
        .filter(Boolean),
      questionPatterns: String(edit.questionPatterns || "")
        .split("\n")
        .map(function (s) {
          return s.trim();
        })
        .filter(Boolean),
      confidence: edit.confidence,
      status: edit.status,
    })
      .then(function (res) {
        const topics = res.data && Array.isArray(res.data.topics) ? res.data.topics : [];
        that.setData({ savingId: "" });
        that.refreshTopicsState(topics);
        wx.showToast({ title: "已保存", icon: "success" });
      })
      .catch(function (err) {
        that.setData({ savingId: "" });
        wx.showToast({ title: (err.data && err.data.detail) || "保存失败", icon: "none" });
      });
  },

  mergeTopic(e) {
    const topicId = e.currentTarget.dataset.id;
    const edit = this.data.edits[topicId];
    if (!edit || !edit.mergeTargetId || this.data.mergingId) {
      if (!edit || !edit.mergeTargetId) {
        wx.showToast({ title: "请先选择合并目标", icon: "none" });
      }
      return;
    }
    this.setData({ mergingId: topicId });
    const that = this;
    post("/api/life-agents/" + this.data.id + "/topics/merge", {
      sourceTopicId: topicId,
      targetTopicId: edit.mergeTargetId,
    })
      .then(function (res) {
        const topics = res.data && Array.isArray(res.data.topics) ? res.data.topics : [];
        that.setData({ mergingId: "" });
        that.refreshTopicsState(topics);
        wx.showToast({ title: "已归并", icon: "success" });
      })
      .catch(function (err) {
        that.setData({ mergingId: "" });
        wx.showToast({ title: (err.data && err.data.detail) || "合并失败", icon: "none" });
      });
  },

  goBack() {
    goBackToManage(this.data.id);
  },

  retry() {
    this.loadTopics();
  },
});
