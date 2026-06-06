const { get, post, put, patch, absUrl } = require("../../utils/request");
const { getNavMetrics } = require("../../utils/nav-metrics");
const { parseChatFile, importChatFile } = require("../../utils/upload-chat");
const { AGENT_CATEGORIES } = require("../../utils/life-agent-create-data");
const { resolveLifeAgentCoverDisplayUrl, nextCoverFallback } = require("../../utils/covers");
const voice = require("../../utils/voice");
const voiceDraft = require("../../utils/voice-draft");
const {
  loadManageData,
  summarizeProfileChanges,
  buildPatchPayloadFromProfile,
  goBackToManage,
  navigateToManageSub,
  coEditStorageKey,
  PERSONA_OPTIONS,
  TONE_OPTIONS,
  RESPONSE_STYLE_OPTIONS,
} = require("../../utils/agent-manage");

const WELCOME_MSG =
  "你可以直接说想改什么，比如「把欢迎语改得更像朋友聊天」「补两条关于留学租房的示范回答」。";
const RETRACTED_USER_MESSAGE = "你撤回了一条消息";

function pickCoEditChatHistory(serverH, localH) {
  if (!serverH.length) return localH;
  if (!localH.length) return serverH;
  if (localH.length > serverH.length) return localH;
  if (serverH.length > localH.length) return serverH;
  return serverH;
}

function isRetracted(content) {
  return String(content || "").indexOf(RETRACTED_USER_MESSAGE) >= 0;
}

function mergeManageProfile(prev, patch) {
  return Object.assign({}, prev, patch, {
    knowledgeEntries: patch.knowledgeEntries || prev.knowledgeEntries || [],
    expertiseTags: patch.expertiseTags || prev.expertiseTags || [],
    sampleQuestions: patch.sampleQuestions || prev.sampleQuestions || [],
    exampleReplies: patch.exampleReplies || prev.exampleReplies || [],
    forbiddenPhrases: patch.forbiddenPhrases || prev.forbiddenPhrases || [],
    regions: patch.regions || prev.regions || [],
  });
}

function initCategoryChips(tags) {
  const set = {};
  (tags || []).forEach(function (t) {
    set[t] = true;
  });
  return AGENT_CATEGORIES.map(function (cat) {
    return {
      label: cat.label,
      color: cat.color,
      selected: !!set[cat.label],
    };
  });
}

function userInitial(user) {
  const name = (user && (user.displayName || user.nickname || user.name)) || "";
  return name ? name.slice(0, 1) : "我";
}

function profilePanelFromProfile(profile) {
  const tags = profile.expertiseTags || [];
  const personaIndex = Math.max(0, PERSONA_OPTIONS.indexOf(profile.personaArchetype || ""));
  const toneIndex = Math.max(0, TONE_OPTIONS.indexOf(profile.toneStyle || ""));
  const responseIndex = Math.max(0, RESPONSE_STYLE_OPTIONS.indexOf(profile.responseStyle || ""));
  return {
    profileHeadline: profile.headline || "",
    profileWelcome: profile.welcomeMessage || "",
    profileExamples: (profile.exampleReplies || []).join("\n"),
    profileNotSuitable: profile.notSuitableFor || "",
    personaIndex: personaIndex,
    toneIndex: toneIndex,
    responseIndex: responseIndex,
    personaLabel: profile.personaArchetype || "角色类型",
    toneLabel: profile.toneStyle || "语气",
    responseLabel: profile.responseStyle || "回答习惯",
    categoryChips: initCategoryChips(tags),
    tagCount: tags.length,
    knowledgeCount: (profile.knowledgeEntries || []).length,
  };
}

function suggestionKey(sug) {
  if (!sug) return "";
  return String(sug.ruleId || "") + "|" + String(sug.title || "").trim();
}

function suggestionAlreadyInChat(sug, rows) {
  if (!sug) return false;
  const parts = [String(sug.prompt || "").trim(), String(sug.title || "").trim()].filter(Boolean);
  for (let i = 0; i < (rows || []).length; i++) {
    const row = rows[i];
    if (row.role !== "assistant") continue;
    const content = String(row.content || "").trim();
    if (!content || isRetracted(content)) continue;
    for (let j = 0; j < parts.length; j++) {
      const part = parts[j];
      if (!part) continue;
      if (content === part || content.indexOf(part) >= 0 || part.indexOf(content) >= 0) return true;
    }
  }
  return false;
}

function shouldShowNextSuggestion(sug, rows, dismissed) {
  if (!sug) return false;
  if (dismissed && dismissed[suggestionKey(sug)]) return false;
  if (suggestionAlreadyInChat(sug, rows)) return false;
  return true;
}

function dismissedStorageKey(id) {
  return "life-agent-co-edit-dismissed:" + id;
}

function mapMessages(rows, opts) {
  const importLoading = opts && opts.importLoading;
  return (rows || []).map(function (row, index) {
    const isUser = row.role === "user";
    const retracted = isRetracted(row.content);
    let canRecall = false;
    if (isUser && !retracted && !importLoading) {
      const next = rows[index + 1];
      if (!(next && next.role === "assistant" && next.status === "pending")) {
        canRecall = true;
      }
    }
    return {
      role: row.role,
      isUser: isUser,
      content: row.content || "",
      eventId: row.eventId || "",
      status: row.status || "",
      pending: row.role === "assistant" && row.status === "pending",
      failed: row.status === "failed",
      retracted: retracted,
      canRecall: canRecall,
      key: row.role + "-" + index,
    };
  });
}

Page({
  data: {
    id: "",
    loading: true,
    error: "",
    displayName: "",
    agentCover: "",
    mindScore: 0,
    scoreFlash: 0,
    turnCount: 0,
    messages: [],
    showWelcome: true,
    input: "",
    sending: false,
    profileSaving: false,
    banner: "",
    scrollTo: "",
    statusBarHeight: 44,
    navBarHeight: 44,
    nextSuggestion: null,
    welcomeMsg: WELCOME_MSG,
    stateOpen: false,
    profileHeadline: "",
    profileWelcome: "",
    profileExamples: "",
    profileNotSuitable: "",
    personaOptions: PERSONA_OPTIONS,
    personaIndex: 0,
    personaLabel: "角色类型",
    toneOptions: TONE_OPTIONS,
    toneIndex: 0,
    toneLabel: "语气",
    responseOptions: RESPONSE_STYLE_OPTIONS,
    responseIndex: 0,
    responseLabel: "回答习惯",
    categoryChips: [],
    tagCount: 0,
    knowledgeCount: 0,
    hasLastChange: false,
    impactedFields: [],
    lastChangeMessage: "",
    showRetractMenu: false,
    retractIndex: -1,
    moreOpen: false,
    importOpen: false,
    importLoading: false,
    importParsing: false,
    importProgress: "",
    importFileName: "",
    importFilePath: "",
    importSenders: [],
    importTargetIndex: 0,
    importTargetName: "",
    importTotalMessages: 0,
    importParseError: "",
    userAvatar: "",
    userInitial: "我",
    voiceRecording: false,
    voiceTranscribing: false,
  },

  onLoad(options) {
    const nav = getNavMetrics();
    this.setData({
      statusBarHeight: nav.statusBarHeight,
      navBarHeight: nav.navBarHeight,
    });
    const id = options.id || "";
    this.setData({ id });
    if (!id) {
      this.setData({ loading: false, error: "缺少 Agent ID" });
      return;
    }
    this._chatHistory = [];
    this._lastChange = null;
    this._coEditReady = false;
    this._profile = null;
    this._dismissedSuggestionKeys = {};
    try {
      const raw = wx.getStorageSync(dismissedStorageKey(id));
      if (raw) this._dismissedSuggestionKeys = JSON.parse(raw) || {};
    } catch (e) {
      this._dismissedSuggestionKeys = {};
    }
    this._pendingVoicePrompt = voiceDraft.loadVoiceDraft(id);
    if (this._pendingVoicePrompt) {
      voiceDraft.saveVoiceDraft(id, "");
    }
    voice.bindRecorderEvents({
      onStart: function () {
        this.setData({ voiceRecording: true });
      }.bind(this),
      onStop: function (res) {
        this.setData({ voiceRecording: false });
        this.onVoiceRecorded(res);
      }.bind(this),
      onError: function () {
        this._voicePressed = false;
        this.setData({ voiceRecording: false, voiceTranscribing: false });
      }.bind(this),
    });
    this.loadAll();
  },

  onShow() {
    voice.refreshRecordPermission();
    this.syncUser();
  },

  onUnload() {
    this.stopPoll();
    this.flushCoEditState();
    voice.stopRecording();
  },

  onHide() {
    this.flushCoEditState();
  },

  syncUser() {
    const app = getApp();
    const user = (app && app.globalData && app.globalData.user) || null;
    const rawAvatar = user && user.avatarUrl;
    const isDefaultCover = /default-cover\.(png|svg)/i.test(String(rawAvatar || ""));
    this.setData({
      userInitial: userInitial(user),
      userAvatar: rawAvatar && !isDefaultCover ? absUrl(rawAvatar) : "",
    });
  },

  syncProfilePanel() {
    if (!this._profile) return;
    const panel = profilePanelFromProfile(this._profile);
    const cover = resolveLifeAgentCoverDisplayUrl(
      "",
      this._profile.coverImageUrl,
      this._profile.coverPresetKey
    );
    this.setData(
      Object.assign(
        {
          displayName: this._profile.displayName || "",
          agentCover: cover,
        },
        panel
      )
    );
  },

  syncLastChangePanel() {
    const lc = this._lastChange;
    this.setData({
      hasLastChange: !!lc,
      impactedFields: lc && Array.isArray(lc.summary) ? lc.summary : [],
      lastChangeMessage: lc && lc.message ? lc.message : "",
    });
  },

  consumePendingVoicePrompt() {
    if (!this._coEditReady || this.data.sending || this.data.importLoading) return;
    const pending = (this._pendingVoicePrompt || "").trim();
    if (!pending) return;
    this._pendingVoicePrompt = null;
    this.setData({ banner: "已收到语音指令，正在调教：" + pending });
    this.sendWithText(pending);
  },

  persistDismissedSuggestions() {
    if (!this.data.id) return;
    try {
      wx.setStorageSync(
        dismissedStorageKey(this.data.id),
        JSON.stringify(this._dismissedSuggestionKeys || {})
      );
    } catch (e) {
      /* ignore */
    }
  },

  dismissNextSuggestion(sug) {
    const target = sug || this.data.nextSuggestion;
    if (!target) return;
    if (!this._dismissedSuggestionKeys) this._dismissedSuggestionKeys = {};
    this._dismissedSuggestionKeys[suggestionKey(target)] = true;
    this.persistDismissedSuggestions();
    this.applyNextSuggestion(null);
  },

  applyNextSuggestion(sug) {
    const visible = shouldShowNextSuggestion(sug, this._chatHistory, this._dismissedSuggestionKeys);
    this.setData({ nextSuggestion: visible ? sug : null });
  },

  loadAll() {
    const id = this.data.id;
    this.setData({ loading: true, error: "" });
    loadManageData(id).then(
      function (result) {
        if (!result.data) {
          this.setData({ loading: false, error: result.error || "加载失败" });
          return;
        }
        const profile = result.data.profile;
        const mindScore =
          result.data.mindScore && typeof result.data.mindScore.total === "number"
            ? result.data.mindScore.total
            : (result.data.stats && result.data.stats.mindScore) || 0;
        this._profile = profile;
        this._serverNextSuggestion = result.data.nextSuggestion || null;
        this.setData({
          loading: false,
          mindScore: mindScore,
        });
        this.syncProfilePanel();
        this.hydrateCoEditState();
      }.bind(this)
    );
  },

  hydrateCoEditState() {
    const id = this.data.id;
    const that = this;
    get("/api/life-agents/" + id + "/co-edit-state")
      .then(function (res) {
        const payload = res.data || {};
        let localParsed = null;
        try {
          const raw = wx.getStorageSync(coEditStorageKey(id));
          if (raw) localParsed = JSON.parse(raw);
        } catch (e) {
          /* ignore */
        }
        const serverH = Array.isArray(payload.chatHistory) ? payload.chatHistory : [];
        const localH = localParsed && Array.isArray(localParsed.chatHistory) ? localParsed.chatHistory : [];
        const merged = pickCoEditChatHistory(serverH, localH);
        that._chatHistory = merged;
        that._lastChange =
          localH.length > serverH.length
            ? localParsed && localParsed.lastChange !== undefined
              ? localParsed.lastChange
              : null
            : payload.lastChange !== undefined
              ? payload.lastChange
              : localParsed
                ? localParsed.lastChange
                : null;
        that._coEditReady = true;
        that.syncLastChangePanel();
        that.syncMessages();
        that.applyNextSuggestion(that._serverNextSuggestion || null);
        that.consumePendingVoicePrompt();
      })
      .catch(function () {
        try {
          const raw = wx.getStorageSync(coEditStorageKey(that.data.id));
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed.chatHistory)) that._chatHistory = parsed.chatHistory;
            if (parsed.lastChange !== undefined) that._lastChange = parsed.lastChange;
          }
        } catch (e) {
          /* ignore */
        }
        that._coEditReady = true;
        that.syncLastChangePanel();
        that.syncMessages();
        that.applyNextSuggestion(that._serverNextSuggestion || null);
        that.consumePendingVoicePrompt();
      });
  },

  syncMessages() {
    const rows = this._chatHistory || [];
    const turnCount = rows.filter(function (r) {
      return r.role === "user" && !isRetracted(r.content);
    }).length;
    this.setData({
      messages: mapMessages(rows, { importLoading: this.data.importLoading }),
      showWelcome: rows.length === 0,
      turnCount: turnCount,
      scrollTo: rows.length > 0 ? "msg-" + (rows.length - 1) : "",
    });
    this.saveLocalCoEdit();
    this.schedulePutCoEdit();
    this.updatePoll();
  },

  saveLocalCoEdit() {
    if (!this._coEditReady || !this.data.id) return;
    try {
      wx.setStorageSync(
        coEditStorageKey(this.data.id),
        JSON.stringify({ chatHistory: this._chatHistory, lastChange: this._lastChange })
      );
    } catch (e) {
      /* ignore */
    }
  },

  schedulePutCoEdit() {
    const that = this;
    if (this._putTimer) clearTimeout(this._putTimer);
    this._putTimer = setTimeout(function () {
      that.flushCoEditState();
    }, 650);
  },

  flushCoEditState() {
    if (!this._coEditReady || !this.data.id) return;
    put("/api/life-agents/" + this.data.id + "/co-edit-state", {
      chatHistory: this._chatHistory,
      lastChange: this._lastChange,
    }).catch(function () {
      /* offline */
    });
  },

  toggleStateOpen() {
    this.setData({ stateOpen: !this.data.stateOpen });
  },

  onProfileInput(e) {
    const field = e.currentTarget.dataset.field;
    if (!field || !this._profile) return;
    const value = e.detail.value || "";
    const patch = {};
    patch[field] = value;
    if (field === "profileExamples") {
      patch.exampleReplies = value
        .split("\n")
        .map(function (line) {
          return line.trim();
        })
        .filter(Boolean);
      this._profile = mergeManageProfile(this._profile, {
        exampleReplies: patch.exampleReplies,
      });
      this.setData({ profileExamples: value });
      return;
    }
    if (field === "profileHeadline") {
      this._profile = mergeManageProfile(this._profile, { headline: value });
      this.setData({ profileHeadline: value });
      return;
    }
    if (field === "profileWelcome") {
      this._profile = mergeManageProfile(this._profile, { welcomeMessage: value });
      this.setData({ profileWelcome: value });
      return;
    }
    if (field === "profileNotSuitable") {
      this._profile = mergeManageProfile(this._profile, { notSuitableFor: value });
      this.setData({ profileNotSuitable: value });
    }
  },

  toggleCategory(e) {
    const label = e.currentTarget.dataset.label;
    if (!label || !this._profile) return;
    const tags = (this._profile.expertiseTags || []).slice();
    const idx = tags.indexOf(label);
    if (idx >= 0) tags.splice(idx, 1);
    else tags.push(label);
    this._profile = mergeManageProfile(this._profile, { expertiseTags: tags });
    this.setData({
      categoryChips: initCategoryChips(tags),
      tagCount: tags.length,
    });
  },

  onPersonaChange(e) {
    const idx = Number(e.detail.value) || 0;
    const val = PERSONA_OPTIONS[idx] || "";
    if (!this._profile) return;
    this._profile = mergeManageProfile(this._profile, { personaArchetype: val });
    this.setData({ personaIndex: idx, personaLabel: val || "角色类型" });
  },

  onToneChange(e) {
    const idx = Number(e.detail.value) || 0;
    const val = TONE_OPTIONS[idx] || "";
    if (!this._profile) return;
    this._profile = mergeManageProfile(this._profile, { toneStyle: val });
    this.setData({ toneIndex: idx, toneLabel: val || "语气" });
  },

  onResponseChange(e) {
    const idx = Number(e.detail.value) || 0;
    const val = RESPONSE_STYLE_OPTIONS[idx] || "";
    if (!this._profile) return;
    this._profile = mergeManageProfile(this._profile, { responseStyle: val });
    this.setData({ responseIndex: idx, responseLabel: val || "回答习惯" });
  },

  saveProfileFields() {
    if (!this._profile || this.data.profileSaving || this.data.sending) return;
    const that = this;
    this.setData({ profileSaving: true, banner: "" });
    patch("/api/life-agents/" + this.data.id, buildPatchPayloadFromProfile(this._profile))
      .then(function (res) {
        const next = res.data || {};
        that._profile = mergeManageProfile(that._profile, next);
        that.syncProfilePanel();
        if (typeof next.mindScore === "number") {
          that.setData({ mindScore: next.mindScore });
        } else if (next.mindScore && typeof next.mindScore.total === "number") {
          const patchData = { mindScore: next.mindScore.total };
          if (typeof next.mindScore.delta === "number" && next.mindScore.delta > 0) {
            patchData.scoreFlash = next.mindScore.delta;
            setTimeout(function () {
              that.setData({ scoreFlash: 0 });
            }, 3200);
          }
          that.setData(patchData);
        }
        if (next.nextSuggestion !== undefined) {
          that._serverNextSuggestion = next.nextSuggestion;
          that.applyNextSuggestion(next.nextSuggestion);
        }
        that.setData({ banner: "资料已保存" });
      })
      .catch(function () {
        that.setData({ banner: "资料保存失败，请稍后再试" });
      })
      .finally(function () {
        that.setData({ profileSaving: false });
      });
  },

  keepLastChange() {
    this._lastChange = null;
    this.syncLastChangePanel();
    this.saveLocalCoEdit();
    this.schedulePutCoEdit();
    this.setData({ banner: "这次修改已保留" });
  },

  undoLastChange() {
    const lc = this._lastChange;
    if (!lc || !lc.before || this.data.sending) return;
    const that = this;
    this.setData({ sending: true, banner: "" });
    patch("/api/life-agents/" + this.data.id, buildPatchPayloadFromProfile(lc.before))
      .then(function () {
        that._profile = lc.before;
        that._lastChange = null;
        that.syncProfilePanel();
        that.syncLastChangePanel();
        that._chatHistory = that._chatHistory.concat([
          { role: "assistant", content: "已撤回上次修改，资料恢复到修改前状态。" },
        ]);
        that.setData({ banner: "已撤回上次修改" });
        that.syncMessages();
      })
      .catch(function () {
        that.setData({ banner: "撤回失败，请稍后再试" });
      })
      .finally(function () {
        that.setData({ sending: false });
      });
  },

  onInput(e) {
    this.setData({ input: e.detail.value || "" });
  },

  sendMessage() {
    this.sendWithText((this.data.input || "").trim());
  },

  sendWithText(msg) {
    if (!msg || this.data.sending || this.data.importLoading) return;
    if (this.data.nextSuggestion) this.dismissNextSuggestion(this.data.nextSuggestion);
    this.setData({ input: "", sending: true, banner: "", moreOpen: false });
    const userHistory = this._chatHistory.concat([{ role: "user", content: msg }]);
    this._chatHistory = userHistory.concat([
      { role: "assistant", content: "已记录，正在理解中…", status: "pending" },
    ]);
    this.syncMessages();
    const that = this;
    post("/api/life-agents/" + this.data.id + "/modify-via-chat", {
      message: msg,
      chatHistory: userHistory.map(function (item) {
        return { role: item.role, content: item.content };
      }),
    })
      .then(function (res) {
        const eventId = res.data && res.data.eventId;
        if (!eventId) throw { data: { detail: "服务器未返回事件 ID" } };
        const rows = that._chatHistory.slice();
        const last = rows[rows.length - 1];
        if (last && last.role === "assistant") {
          rows[rows.length - 1] = Object.assign({}, last, { eventId: eventId, status: "pending" });
        }
        that._chatHistory = rows;
        that.syncMessages();
      })
      .catch(function (err) {
        const detail = (err.data && (err.data.detail || err.data.error)) || "保存失败";
        const rows = that._chatHistory.slice();
        const last = rows[rows.length - 1];
        if (last && last.role === "assistant") {
          rows[rows.length - 1] = Object.assign({}, last, {
            content: "保存失败：" + detail,
            status: "failed",
          });
        }
        that._chatHistory = rows;
        that.setData({ banner: "保存失败：" + detail });
        that.syncMessages();
      })
      .finally(function () {
        that.setData({ sending: false });
      });
  },

  hasPendingEvent() {
    return (this._chatHistory || []).some(function (row) {
      return row.role === "assistant" && row.status === "pending" && row.eventId;
    });
  },

  updatePoll() {
    if (this.hasPendingEvent()) {
      this.startPoll();
    } else {
      this.stopPoll();
    }
  },

  startPoll() {
    if (this._pollTimer) return;
    const that = this;
    this._pollAttempts = 0;
    const tick = function () {
      if (!that.hasPendingEvent()) {
        that.stopPoll();
        return;
      }
      that._pollAttempts = (that._pollAttempts || 0) + 1;
      get("/api/life-agents/" + that.data.id + "/co-edit-events?limit=50")
        .then(function (res) {
          const events = res.data && Array.isArray(res.data.events) ? res.data.events : [];
          const eventMap = {};
          events.forEach(function (ev) {
            if (ev && ev.id) eventMap[ev.id] = ev;
          });
          let anyProcessed = false;
          let mutated = false;
          let lastProcessedMessage = "";
          const previousProfile = that._profile;
          const nextRows = that._chatHistory.map(function (row) {
            if (row.role !== "assistant" || row.status !== "pending" || !row.eventId) return row;
            const ev = eventMap[row.eventId];
            if (!ev) return row;
            if (ev.status === "processed") {
              anyProcessed = true;
              mutated = true;
              if (ev.rawMessage) lastProcessedMessage = ev.rawMessage;
              const base = (ev.assistantMessage && String(ev.assistantMessage).trim()) || "好的，我已经理解了。";
              const summary = ev.changesSummary && String(ev.changesSummary).trim();
              const content = summary ? base + "\n\n（已自动应用：" + summary + "）" : base;
              return Object.assign({}, row, { content: content, status: "processed", changesSummary: summary });
            }
            if (ev.status === "failed") {
              mutated = true;
              const detail = (ev.errorDetail && String(ev.errorDetail).trim()) || "AI 暂时未响应";
              return Object.assign({}, row, {
                content: "（理解未完成：" + detail + "）\n原话已保存为记忆，稍后可在 Topic 管理里查看。",
                status: "failed",
              });
            }
            return row;
          });
          if (mutated) {
            that._chatHistory = nextRows;
            that.syncMessages();
          }
          if (anyProcessed && previousProfile) {
            loadManageData(that.data.id).then(function (refresh) {
              if (!refresh.data) return;
              const after = refresh.data.profile;
              const diffSummary = summarizeProfileChanges(previousProfile, after);
              if (diffSummary.length > 0) {
                that._lastChange = {
                  before: previousProfile,
                  after: after,
                  summary: diffSummary,
                  message: lastProcessedMessage || "",
                  appliedAt: new Date().toISOString(),
                };
                that.syncLastChangePanel();
                that.saveLocalCoEdit();
              }
              that._profile = after;
              that.syncProfilePanel();
              const mindScore =
                refresh.data.mindScore && typeof refresh.data.mindScore.total === "number"
                  ? refresh.data.mindScore.total
                  : that.data.mindScore;
              const delta =
                refresh.data.mindScore && typeof refresh.data.mindScore.delta === "number"
                  ? refresh.data.mindScore.delta
                  : 0;
              const patchData = {
                mindScore: mindScore,
              };
              if (delta > 0) {
                patchData.scoreFlash = delta;
                setTimeout(function () {
                  that.setData({ scoreFlash: 0 });
                }, 3200);
              }
              that.setData(patchData);
              that._serverNextSuggestion = refresh.data.nextSuggestion || null;
              that.applyNextSuggestion(that._serverNextSuggestion);
            });
          }
        })
        .catch(function () {
          /* retry */
        })
        .finally(function () {
          if (!that.hasPendingEvent()) {
            that.stopPoll();
            return;
          }
          const delay = that._pollAttempts > 20 ? 6000 : that._pollAttempts > 10 ? 4000 : 2000;
          that._pollTimer = setTimeout(tick, delay);
        });
    };
    this._pollTimer = setTimeout(tick, 1200);
  },

  stopPoll() {
    if (this._pollTimer) {
      clearTimeout(this._pollTimer);
      this._pollTimer = null;
    }
  },

  useNextSuggestion() {
    const sug = this.data.nextSuggestion;
    if (!sug || this.data.sending || this.data.importLoading) return;
    const question = (sug.prompt && String(sug.prompt).trim()) || (sug.title && String(sug.title).trim());
    if (!question) return;
    this.dismissNextSuggestion(sug);
    this._chatHistory = this._chatHistory.concat([{ role: "assistant", content: question }]);
    this.setData({ banner: "" });
    this.syncMessages();
  },

  openRetractMenu(e) {
    const index = Number(e.currentTarget.dataset.index);
    if (index < 0) return;
    this.setData({ showRetractMenu: true, retractIndex: index });
  },

  closeRetractMenu() {
    this.setData({ showRetractMenu: false, retractIndex: -1 });
  },

  confirmRetract() {
    const index = this.data.retractIndex;
    const rows = this._chatHistory || [];
    const row = rows[index];
    if (!row || row.role !== "user" || isRetracted(row.content)) {
      this.closeRetractMenu();
      return;
    }
    const originalContent = row.content;
    const next = rows.slice();
    next[index] = Object.assign({}, next[index], { content: RETRACTED_USER_MESSAGE });
    if (next[index + 1] && next[index + 1].role === "assistant") {
      next.splice(index + 1, 1);
    }
    this._chatHistory = next;
    if (this._lastChange && this._lastChange.message === originalContent) {
      this._lastChange = null;
      this.syncLastChangePanel();
    }
    this.closeRetractMenu();
    this.setData({ banner: "" });
    this.syncMessages();
  },

  toggleMore() {
    this.setData({ moreOpen: !this.data.moreOpen });
  },

  closeMore() {
    this.setData({ moreOpen: false });
  },

  goManageHome() {
    this.closeMore();
    goBackToManage(this.data.id);
  },

  goEditProfile() {
    this.closeMore();
    navigateToManageSub(this.data.id, "edit");
  },

  openImportModal() {
    this.closeMore();
    this.setData({
      importOpen: true,
      importParsing: false,
      importParseError: "",
      importSenders: [],
      importTargetIndex: 0,
      importTargetName: "",
      importTotalMessages: 0,
      importFileName: "",
      importFilePath: "",
    });
  },

  closeImportModal() {
    if (this.data.importLoading) return;
    this.setData({ importOpen: false });
  },

  chooseImportFile() {
    const that = this;
    wx.chooseMessageFile({
      count: 1,
      type: "file",
      extension: ["html", "htm", "csv", "txt"],
      success: function (res) {
        const file = res.tempFiles && res.tempFiles[0];
        if (!file || !file.path) return;
        that.setData({
          importParsing: true,
          importParseError: "",
          importFileName: file.name || "聊天记录",
          importFilePath: file.path,
          importSenders: [],
          importTargetIndex: 0,
        });
        parseChatFile(that.data.id, file.path)
          .then(function (data) {
            const list = Array.isArray(data.senders) ? data.senders : [];
            that.setData({
              importParsing: false,
              importSenders: list,
              importTotalMessages: data.totalMessages || 0,
              importTargetIndex: 0,
              importTargetName: list[0] || "",
            });
          })
          .catch(function (err) {
            that.setData({
              importParsing: false,
              importParseError: (err && err.message) || "解析失败，请检查文件格式",
            });
          });
      },
    });
  },

  onImportTargetChange(e) {
    const idx = Number(e.detail.value) || 0;
    const senders = this.data.importSenders || [];
    this.setData({
      importTargetIndex: idx,
      importTargetName: senders[idx] || "",
    });
  },

  confirmImport() {
    const filePath = this.data.importFilePath;
    const senders = this.data.importSenders || [];
    const targetName = senders[this.data.importTargetIndex] || senders[0] || "";
    if (!filePath || !targetName || this.data.importLoading) return;
    const previousProfile = this._profile;
    const fileName = this.data.importFileName || "聊天记录";
    const that = this;
    this.setData({
      importLoading: true,
      importOpen: false,
      importProgress: "正在上传并解析聊天记录...",
      banner: "",
    });
    this._chatHistory = this._chatHistory.concat([
      { role: "user", content: "导入聊天记录：" + fileName + "（分析「" + targetName + "」的发言风格）" },
      { role: "assistant", content: "" },
    ]);
    const assistantIdx = this._chatHistory.length - 1;
    this.syncMessages();
    importChatFile(this.data.id, filePath, targetName, function (progress) {
      that.setData({ importProgress: progress });
    })
      .then(function (donePayload) {
        if (!donePayload || !donePayload.profile) {
          const msg = (donePayload && donePayload.assistantMessage) || "分析完成，但未产生修改。";
          const rows = that._chatHistory.slice();
          if (rows[assistantIdx]) {
            rows[assistantIdx] = Object.assign({}, rows[assistantIdx], { content: msg });
          }
          that._chatHistory = rows;
          that.syncMessages();
          return;
        }
        const summary = summarizeProfileChanges(previousProfile, donePayload.profile);
        that._lastChange = {
          before: previousProfile,
          after: donePayload.profile,
          summary: summary,
          message: "导入聊天记录：" + fileName,
          appliedAt: new Date().toISOString(),
        };
        that._profile = mergeManageProfile(previousProfile, donePayload.profile);
        that.syncProfilePanel();
        that.syncLastChangePanel();
        const rows = that._chatHistory.slice();
        if (rows[assistantIdx]) {
          rows[assistantIdx] = Object.assign({}, rows[assistantIdx], {
            content:
              donePayload.assistantMessage || "已根据聊天记录分析结果更新 Agent 风格和知识库。",
          });
        }
        that._chatHistory = rows;
        that.syncMessages();
      })
      .catch(function (err) {
        const detail = (err && err.message) || "导入失败，请检查网络后重试。";
        const rows = that._chatHistory.slice();
        if (rows[assistantIdx]) {
          rows[assistantIdx] = Object.assign({}, rows[assistantIdx], { content: detail });
        }
        that._chatHistory = rows;
        that.syncMessages();
      })
      .finally(function () {
        that.setData({ importLoading: false, importProgress: "" });
      });
  },

  onVoiceTouch(e) {
    const type = (e && e.type) || "";
    if (type === "touchstart") {
      if (this.data.sending || this.data.voiceTranscribing || this.data.importLoading) return;
      this._voiceDidStart = false;
      if (!voice.isRecordReady()) {
        voice
          .requestRecordPermission()
          .then(function () {
            wx.showToast({ title: "请再次按住说话", icon: "none" });
          })
          .catch(function () {});
        return;
      }
      this._voicePressed = true;
      if (!voice.beginRecordingSync()) {
        this._voicePressed = false;
        wx.showToast({ title: "无法启动录音", icon: "none" });
      }
      return;
    }
    if (type === "touchend" || type === "touchcancel") {
      if (!this._voicePressed && !this.data.voiceRecording) return;
      this._voicePressed = false;
      if (this.data.voiceRecording) {
        this._voiceDidStart = true;
        voice.stopRecording();
      }
    }
  },

  onVoiceTapHint() {
    if (this._voiceDidStart || this.data.voiceRecording || this.data.voiceTranscribing) return;
    wx.showToast({ title: "按住说话，松开发送", icon: "none" });
  },

  onVoiceRecorded(res) {
    this.setData({ voiceRecording: false, voiceTranscribing: true });
    const that = this;
    voice
      .transcribe(res.tempFilePath, res.fileSize)
      .then(function (text) {
        that.setData({ voiceTranscribing: false, banner: "已收到语音指令，正在调教：" + text });
        that.sendWithText(text);
      })
      .catch(function (err) {
        that.setData({ voiceTranscribing: false });
        wx.showToast({ title: (err && err.message) || "语音识别失败", icon: "none" });
      });
  },

  onCoverError() {
    this.setData({ agentCover: nextCoverFallback(this.data.agentCover) });
  },

  onAvatarError() {
    this.setData({ userAvatar: "" });
  },

  noop() {},

  goBack() {
    goBackToManage(this.data.id);
  },

  retry() {
    this.loadAll();
  },
});
