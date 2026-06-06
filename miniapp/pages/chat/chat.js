const { get, post, absUrl } = require("../../utils/request");
const {
  resolveLifeAgentCoverDisplayUrl,
  nextCoverFallback,
} = require("../../utils/covers");
const {
  cleanLifeAgentIntroText,
  cleanLifeAgentIntroMultiline,
} = require("../../utils/intro-clean");
const { formatSessionTime } = require("../../utils/format");
const { getNavMetrics } = require("../../utils/nav-metrics");
const {
  lifeAgentShowsPurchaseUi,
  LIFE_AGENT_UNLIMITED_CHAT,
} = require("../../utils/commerce");
const voice = require("../../utils/voice");

const FEEDBACK_LABELS = {
  helpful: "有帮助",
  not_suitable: "没帮助",
  not_specific: "不够具体",
  factual_error: "事实错了",
  contradiction: "前后矛盾",
  too_confident: "太武断了",
};

const FEEDBACK_MODAL_TITLES = {
  helpful: "👍 有帮助",
  not_suitable: "👎 没帮助",
  not_specific: "不够具体",
  factual_error: "事实错了",
  contradiction: "前后矛盾",
  too_confident: "太武断了",
};

function feedbackCommentOptional(type) {
  return type === "helpful" || type === "not_suitable";
}

function trimSessionTitle(title) {
  const t = (title || "").trim();
  if (t.length <= 18) return t || "未命名会话";
  return t.slice(0, 18) + "...";
}

function userInitial(user) {
  if (!user) return "?";
  return (user.name || user.email || "?").slice(0, 1).toUpperCase();
}

function normalizeMessage(m, sessionId) {
  return {
    role: m.role,
    isUser: m.role === "user",
    content: m.content || "",
    messageId: m.messageId || (m.role === "assistant" ? m.id : ""),
    sessionId: m.sessionId || sessionId || "",
    references: m.references || [],
    pending: !!m.pending,
    error: !!m.error,
    showFeedback:
      m.role === "assistant" &&
      !!(m.messageId || (m.role === "assistant" ? m.id : "")) &&
      !!(m.sessionId || sessionId),
    feedbackType: m.feedbackType || "",
  };
}

Page({
  data: {
    id: "",
    agentName: "",
    headline: "",
    coverFull: "",
    agentInitial: "?",
    welcomeMessage: "",
    sessionId: "",
    messages: [],
    input: "",
    sending: false,
    sessionLoading: false,
    profileLoading: true,
    scrollTo: "",
    statusBarHeight: 44,
    navBarHeight: 44,
    drawerOpen: false,
    sessions: [],
    sessionsLoading: false,
    sampleChips: [],
    remainingQ: -1,
    showPrice: false,
    isLoggedIn: false,
    error: "",
    userInitial: "?",
    userAvatar: "",
    ratingState: null,
    ratingScore: 5,
    ratingComment: "",
    ratingSubmitting: false,
    showUnlimited: LIFE_AGENT_UNLIMITED_CHAT,
    feedbackOptions: [
      { id: "not_specific", label: "不够具体" },
      { id: "factual_error", label: "事实错了" },
      { id: "contradiction", label: "前后矛盾" },
      { id: "too_confident", label: "太武断了" },
    ],
    ratingScores: [1, 2, 3, 4, 5],
    feedbackModalVisible: false,
    feedbackModalTitle: "",
    feedbackModalComment: "",
    feedbackModalRequired: false,
    feedbackModalIndex: -1,
    feedbackModalType: "",
    feedbackModalSubmitting: false,
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
    const sessionId = options.sessionId || "";
    this.setData({ id, sessionId: sessionId || "" });
    if (!id) {
      this.setData({ profileLoading: false, error: "缺少 Agent ID" });
      return;
    }

    this.syncUser();
    this.loadProfile(sessionId);

    voice.bindRecorderEvents({
      onStart: () => {
        this.setData({ voiceRecording: true });
      },
      onStop: (res) => {
        this.onVoiceRecorded(res);
      },
      onError: () => {
        this._voicePressed = false;
        this.setData({ voiceRecording: false, voiceTranscribing: false });
        wx.showToast({ title: "录音失败", icon: "none" });
      },
    });
  },

  onUnload() {
    voice.stopRecording();
    this._voicePressed = false;
  },

  onShow() {
    voice.refreshRecordPermission();
    const app = getApp();
    if (app && typeof app.refreshUser === "function") {
      app.refreshUser().finally(() => this.syncUser());
    } else {
      this.syncUser();
    }
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

  loadProfile(initialSessionId) {
    this.setData({ profileLoading: true, error: "" });
    get(`/api/life-agents/${this.data.id}`)
      .then((res) => {
        const agent = res.data || {};
        if (!agent.displayName) {
          this.setData({ profileLoading: false, error: "Agent 不存在" });
          return;
        }

        const dn = agent.displayName;
        const welcome = cleanLifeAgentIntroMultiline(
          agent.welcomeMessage || "你好，有什么想聊的？",
          dn
        );
        const viewer = agent.viewerState || {};
        const ratingState = viewer.rating || null;
        const chips = (agent.sampleQuestions || [])
          .slice(0, 3)
          .map(function (q) {
            return cleanLifeAgentIntroText(q, dn);
          })
          .filter(Boolean);

        this.setData({
          agentName: dn,
          headline: cleanLifeAgentIntroText(agent.headline || "", dn) || "在线咨询",
          coverFull: resolveLifeAgentCoverDisplayUrl(
            agent.coverUrl,
            agent.coverImageUrl,
            agent.coverPresetKey
          ),
          agentInitial: dn.slice(0, 1),
          welcomeMessage: welcome,
          sampleChips: chips,
          remainingQ:
            viewer.remainingQuestions != null ? viewer.remainingQuestions : -1,
          showPrice: lifeAgentShowsPurchaseUi() && !LIFE_AGENT_UNLIMITED_CHAT,
          isLoggedIn: !!viewer.isLoggedIn,
          ratingState,
          ratingScore:
            ratingState && typeof ratingState.currentScore === "number"
              ? ratingState.currentScore
              : 5,
          ratingComment: (ratingState && ratingState.currentComment) || "",
          messages: [normalizeMessage({ role: "assistant", content: welcome })],
          profileLoading: false,
        });

        if (!viewer.isLoggedIn) return;

        voice.refreshRecordPermission();
        voice.requestRecordPermission().catch(function () {});

        this.bootstrapSessions(initialSessionId, welcome);
      })
      .catch(() => {
        this.setData({ profileLoading: false, error: "加载失败" });
      });
  },

  bootstrapSessions(initialSessionId, welcome) {
    const welcomeMsg = welcome || this.data.welcomeMessage;
    this.setData({ sessionsLoading: true });
    get("/api/life-agents/" + this.data.id + "/chat/sessions")
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : [];
        const sessions = raw.map(function (s) {
          return Object.assign({}, s, {
            titleShort: trimSessionTitle(s.title),
            timeLabel: formatSessionTime(s.updatedAt),
            isActive: false,
          });
        });
        this.setData({ sessions, sessionsLoading: false });

        if (initialSessionId) {
          this.loadSessionById(initialSessionId, welcomeMsg);
          return;
        }
        if (sessions.length > 0) {
          this.loadSessionById(sessions[0].id, welcomeMsg);
          return;
        }
        this.markActiveSession("");
      })
      .catch(() => {
        this.setData({ sessions: [], sessionsLoading: false });
      });
  },

  refreshSessionList() {
    get("/api/life-agents/" + this.data.id + "/chat/sessions")
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : [];
        const activeId = this.data.sessionId;
        const sessions = raw.map(function (s) {
          return Object.assign({}, s, {
            titleShort: trimSessionTitle(s.title),
            timeLabel: formatSessionTime(s.updatedAt),
            isActive: s.id === activeId,
          });
        });
        this.setData({ sessions, sessionsLoading: false });
      })
      .catch(() => {
        this.setData({ sessionsLoading: false });
      });
  },

  loadSessions() {
    this.refreshSessionList();
  },

  markActiveSession(sessionId) {
    const sessions = (this.data.sessions || []).map(function (s) {
      return Object.assign({}, s, { isActive: s.id === sessionId });
    });
    this.setData({ sessions });
  },

  loadSessionById(sessionId, welcome) {
    const welcomeMsg = welcome || this.data.welcomeMessage;
    this.setData({ sessionLoading: true, error: "" });
    get(`/api/life-agents/${this.data.id}/chat/sessions/${sessionId}`)
      .then((res) => {
        const data = res.data || {};
        let msgs;
        if (Array.isArray(data.messages) && data.messages.length) {
          msgs = data.messages.map(function (m) {
            return normalizeMessage(
              {
                role: m.role,
                content: m.content,
                id: m.role === "assistant" ? m.id : undefined,
                references: m.references,
              },
              sessionId
            );
          });
        } else {
          msgs = [normalizeMessage({ role: "assistant", content: welcomeMsg })];
        }
        this.setData({
          sessionId,
          messages: msgs,
          sessionLoading: false,
          scrollTo: "msg-" + (msgs.length - 1),
        });
        this.markActiveSession(sessionId);
      })
      .catch(() => {
        this.setData({
          sessionLoading: false,
          sessionId: "",
          messages: [
            normalizeMessage({ role: "assistant", content: welcomeMsg }),
          ],
        });
        this.markActiveSession("");
      });
  },

  loadSession(e) {
    const sessionId = e.currentTarget.dataset.id;
    this.setData({ drawerOpen: false });
    this.loadSessionById(sessionId);
  },

  newSession() {
    this.setData({
      sessionId: "",
      messages: [
        normalizeMessage({ role: "assistant", content: this.data.welcomeMessage }),
      ],
      drawerOpen: false,
      error: "",
    });
    this.markActiveSession("");
  },

  toggleDrawer() {
    const open = !this.data.drawerOpen;
    this.setData({ drawerOpen: open });
    if (open && this.data.isLoggedIn) {
      this.setData({ sessionsLoading: true });
      this.refreshSessionList();
    }
  },

  onInput(e) {
    this.setData({ input: e.detail.value });
  },

  tapChip(e) {
    const text = e.currentTarget.dataset.text || "";
    if (!text) return;
    this.setData({ input: text });
    this.send();
  },

  send() {
    const text = (this.data.input || "").trim();
    if (!text) return;
    this.sendWithText(text);
  },

  sendWithText(text) {
    const trimmed = (text || "").trim();
    if (!trimmed || this.data.sending || this.data.sessionLoading) return;

    if (!this.data.isLoggedIn) {
      wx.navigateTo({
        url:
          "/pages/login/login?redirect=" +
          encodeURIComponent("/pages/chat/chat?id=" + this.data.id),
      });
      return;
    }

    const userMsg = normalizeMessage({ role: "user", content: trimmed });
    const messages = this.data.messages.concat([userMsg]);
    const placeholder = normalizeMessage({
      role: "assistant",
      content: "",
      pending: true,
    });
    this.setData({
      messages: messages.concat([placeholder]),
      input: "",
      sending: true,
      error: "",
      scrollTo: "msg-" + messages.length,
    });

    post("/api/life-agents/" + this.data.id + "/chat", {
      sessionId: this.data.sessionId || undefined,
      message: trimmed,
      useVoiceReply: false,
    })
      .then((res) => {
        const data = res.data || {};
        const reply = data.reply || "（无回复）";
        const next = this.data.messages.filter(function (m) {
          return !m.pending;
        });
        next.push(
          normalizeMessage(
            {
              role: "assistant",
              content: reply,
              messageId: data.messageId,
              references: data.references,
            },
            data.sessionId || this.data.sessionId
          )
        );
        const patch = {
          messages: next,
          sessionId: data.sessionId || this.data.sessionId,
          sending: false,
          scrollTo: "msg-" + (next.length - 1),
        };
        if (typeof data.remainingQuestions === "number") {
          patch.remainingQ = data.remainingQuestions;
        }
        if (data.rating) {
          patch.ratingState = data.rating;
          if (typeof data.rating.currentScore === "number") {
            patch.ratingScore = data.rating.currentScore;
          }
          if (data.rating.currentComment) {
            patch.ratingComment = data.rating.currentComment;
          }
        }
        this.setData(patch);
        this.refreshSessionsList(data);
      })
      .catch((err) => {
        const next = this.data.messages.filter(function (m) {
          return !m.pending;
        });
        let tip = "发送失败，请稍后重试";
        if (err.statusCode === 401) {
          tip = "请先登录";
          wx.navigateTo({
            url:
              "/pages/login/login?redirect=" +
              encodeURIComponent("/pages/chat/chat?id=" + this.data.id),
          });
        }
        next.push(
          normalizeMessage({ role: "assistant", content: tip, error: true })
        );
        this.setData({ messages: next, sending: false, error: tip });
      });
  },

  refreshSessionsList(data) {
    const sid = data.sessionId;
    if (!sid) return;
    const title = trimSessionTitle(data.sessionTitle || "");
    const now = new Date().toISOString();
    let sessions = this.data.sessions.slice();
    const idx = sessions.findIndex(function (s) {
      return s.id === sid;
    });
    if (idx < 0) {
      sessions.unshift({
        id: sid,
        title: title,
        titleShort: title,
        messageCount: 2,
        updatedAt: now,
        timeLabel: "刚刚",
        isActive: true,
      });
    } else {
      const existing = sessions[idx];
      sessions.splice(idx, 1);
      sessions.unshift(
        Object.assign({}, existing, {
          updatedAt: now,
          timeLabel: "刚刚",
          messageCount: (existing.messageCount || 0) + 2,
          isActive: true,
        })
      );
    }
    sessions = sessions.map(function (s) {
      return Object.assign({}, s, { isActive: s.id === sid });
    });
    this.setData({ sessions });
  },

  onCoverError() {
    const next = nextCoverFallback(this.data.coverFull);
    if (next !== this.data.coverFull) {
      this.setData({ coverFull: next });
    }
  },

  onAvatarError() {
    this.setData({ userAvatar: "" });
  },

  pickRating(e) {
    this.setData({ ratingScore: Number(e.currentTarget.dataset.score) || 5 });
  },

  onRatingComment(e) {
    this.setData({ ratingComment: e.detail.value });
  },

  submitRating() {
    if (this.data.ratingSubmitting) return;
    this.setData({ ratingSubmitting: true });
    post("/api/life-agents/" + this.data.id + "/rating", {
      score: this.data.ratingScore,
      comment: (this.data.ratingComment || "").trim() || undefined,
    })
      .then((res) => {
        const rating = (res.data && res.data.rating) || null;
        this.setData({
          ratingSubmitting: false,
          ratingState: rating || this.data.ratingState,
          error: "",
        });
        wx.showToast({ title: "评分已提交", icon: "none" });
      })
      .catch((err) => {
        let tip = "评分提交失败";
        if (err.data && err.data.error === "RATING_NOT_ELIGIBLE") {
          tip = "还没到可评分节点";
        }
        this.setData({ ratingSubmitting: false, error: tip });
      });
  },

  tapFeedback(e) {
    const index = Number(e.currentTarget.dataset.index);
    const type = e.currentTarget.dataset.type;
    const messages = this.data.messages.slice();
    const msg = messages[index];
    if (!msg || !msg.messageId || !msg.sessionId) return;

    if (type === "helpful") {
      this.submitFeedback(index, type, "");
      return;
    }

    this.setData({
      feedbackModalVisible: true,
      feedbackModalTitle: FEEDBACK_MODAL_TITLES[type] || FEEDBACK_LABELS[type] || "反馈",
      feedbackModalComment: "",
      feedbackModalRequired: !feedbackCommentOptional(type),
      feedbackModalIndex: index,
      feedbackModalType: type,
      feedbackModalSubmitting: false,
    });
  },

  submitFeedback(index, type, comment) {
    const messages = this.data.messages.slice();
    const msg = messages[index];
    if (!msg || !msg.messageId || !msg.sessionId) return;

    this.setData({ feedbackModalSubmitting: true });
    post("/api/life-agents/" + this.data.id + "/chat/feedback", {
      messageId: msg.messageId,
      sessionId: msg.sessionId,
      feedbackType: type,
      comment: comment || undefined,
    })
      .then(() => {
        messages[index] = Object.assign({}, msg, { feedbackType: type });
        this.setData({
          messages: messages,
          error: "",
          feedbackModalVisible: false,
          feedbackModalSubmitting: false,
          feedbackModalComment: "",
        });
        wx.showToast({ title: "感谢反馈", icon: "none" });
      })
      .catch(() => {
        this.setData({
          error: "反馈提交失败",
          feedbackModalSubmitting: false,
        });
      });
  },

  onFeedbackCommentInput(e) {
    this.setData({ feedbackModalComment: e.detail.value || "" });
  },

  closeFeedbackModal() {
    if (this.data.feedbackModalSubmitting) return;
    this.setData({
      feedbackModalVisible: false,
      feedbackModalComment: "",
      feedbackModalIndex: -1,
      feedbackModalType: "",
    });
  },

  confirmFeedbackModal() {
    const type = this.data.feedbackModalType;
    const index = this.data.feedbackModalIndex;
    const comment = (this.data.feedbackModalComment || "").trim();
    if (!feedbackCommentOptional(type) && !comment) {
      wx.showToast({ title: "请填写理由", icon: "none" });
      return;
    }
    this.submitFeedback(index, type, comment);
  },

  noop() {},

  onVoiceTouch(e) {
    const type = (e && e.type) || "";
    if (type === "touchstart") {
      if (
        this.data.sending ||
        this.data.voiceTranscribing ||
        this.data.sessionLoading ||
        this.data.profileLoading
      ) {
        return;
      }
      if (!this.data.isLoggedIn) {
        this.goLogin();
        return;
      }
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
    if (this._voiceDidStart || this.data.voiceRecording || this.data.voiceTranscribing) {
      return;
    }
    wx.showToast({ title: "按住说话，松开发送", icon: "none" });
  },

  onVoiceRecorded(res) {
    this.setData({ voiceRecording: false, voiceTranscribing: true });
    voice
      .transcribe(res.tempFilePath, res.fileSize)
      .then((text) => {
        this.setData({ voiceTranscribing: false });
        this.sendWithText(text);
      })
      .catch((err) => {
        this.setData({ voiceTranscribing: false });
        if (err && err.code === 401) {
          this.goLogin();
          return;
        }
        wx.showToast({
          title: (err && err.message) || "语音识别失败",
          icon: "none",
        });
      });
  },

  onComposerMore() {
    this.toggleDrawer();
  },

  goBack() {
    wx.navigateBack({
      fail: () => {
        wx.navigateTo({
          url: "/pages/agent-detail/agent-detail?id=" + this.data.id,
        });
      },
    });
  },

  goDetail() {
    wx.navigateTo({
      url: "/pages/agent-detail/agent-detail?id=" + this.data.id,
    });
  },

  goLogin() {
    wx.navigateTo({
      url:
        "/pages/login/login?redirect=" +
        encodeURIComponent("/pages/chat/chat?id=" + this.data.id),
    });
  },
});
