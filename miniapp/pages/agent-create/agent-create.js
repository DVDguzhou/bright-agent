const { get, post } = require("../../utils/request");
const { absUrl } = require("../../utils/request");
const { getNavMetrics } = require("../../utils/nav-metrics");
const {
  PROFILE_CHAT_FIELDS,
  DEFAULT_FORM,
  QUICK_START_TEMPLATES,
  EXPERIENCE_TOPICS,
  AGENT_CATEGORIES,
  PERSONA_OPTIONS,
  TONE_OPTIONS,
  RESPONSE_STYLE_OPTIONS,
  MBTI_OPTIONS,
  FIRST_EXPERIENCE_QUESTION,
} = require("../../utils/life-agent-create-data");

const DEFAULT_COVER = absUrl("/life-agent-cover-presets/default-cover.png");

function cloneForm(form) {
  return Object.assign({}, DEFAULT_FORM, form || {});
}

function isSkipField(value) {
  const v = String(value || "").trim();
  return /^(暂无|无|没有|跳过|pass)$/i.test(v);
}

function isFilledField(value) {
  const s = String(value || "").trim();
  return s !== "" && !isSkipField(s);
}

function splitTags(text) {
  return String(text || "")
    .split(/[,，、\n]/)
    .map(function (s) {
      return s.trim();
    })
    .filter(Boolean);
}

function joinTags(tags) {
  return tags.join(", ");
}

function yuanInputToCents(v) {
  const n = parseFloat(String(v || "").trim());
  if (!isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

function mapCreateError(code, detail) {
  if (code === "UNAUTHORIZED") return "请先登录后再创建";
  if (code === "LIFE_AGENT_LIMIT_REACHED") {
    return "每个账号目前只能创建 1 个 Agent。你已经创建过了，可以去「我创建的」继续管理。";
  }
  if (code === "VALIDATION_ERROR" && detail) return String(detail);
  return "创建失败，请检查输入内容";
}

function initCategories(selectedTags) {
  const set = {};
  selectedTags.forEach(function (t) {
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

function indexOfOption(list, value) {
  const idx = list.indexOf(value);
  return idx >= 0 ? idx : 0;
}

function isRecalledMessage(content) {
  return String(content || "").includes("你撤回了一条消息");
}

function clearFormFromField(form, startIdx) {
  const next = Object.assign({}, form);
  for (let i = startIdx; i < PROFILE_CHAT_FIELDS.length; i++) {
    const key = PROFILE_CHAT_FIELDS[i].key;
    next[key] = DEFAULT_FORM[key] || "";
  }
  return next;
}

function countUserAnswersBefore(history, endIndex) {
  let count = 0;
  for (let i = 0; i < endIndex; i++) {
    if (history[i].role === "user" && !isRecalledMessage(history[i].content)) count++;
  }
  return count;
}

function isExperienceSkipIntent(value) {
  const v = String(value || "").trim();
  return /^(没有了|够了|可以了|跳过|pass|结束|下一步)$/i.test(v);
}

function isDefaultAvatarUrl(url) {
  return /default-cover\.(png|svg)/i.test(String(url || ""));
}

function countValidKnowledgeEntries(entries) {
  return entries.filter(function (e) {
    return (e.content || "").trim().length >= 1;
  }).length;
}

function userInitial(user) {
  if (!user) return "我";
  const name = user.name || user.email || "";
  return name ? name.slice(0, 1).toUpperCase() : "我";
}

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    initLoading: true,
    needLogin: false,
    limitReached: false,
    step: 0,
    progressSteps: [1, 2, 3, 4, 5],
    visualStep: 0,
    templates: QUICK_START_TEMPLATES.map(function (t) {
      return Object.assign({}, t, { initial: t.label.slice(0, 1) });
    }),
    experienceTopics: EXPERIENCE_TOPICS.map(function (t) {
      return Object.assign({}, t, { initial: t.label.slice(0, 1) });
    }),
    form: cloneForm(),
    categories: initCategories([]),
    selectedTagCount: 0,
    personaOptions: PERSONA_OPTIONS,
    toneOptions: TONE_OPTIONS,
    responseOptions: RESPONSE_STYLE_OPTIONS,
    mbtiOptions: MBTI_OPTIONS,
    personaIndex: indexOfOption(PERSONA_OPTIONS, DEFAULT_FORM.personaArchetype),
    toneIndex: indexOfOption(TONE_OPTIONS, DEFAULT_FORM.toneStyle),
    responseIndex: indexOfOption(RESPONSE_STYLE_OPTIONS, DEFAULT_FORM.responseStyle),
    mbtiIndex: 0,
    mbtiLabel: "未设置",
    chatHistory: [],
    chatFieldIndex: 0,
    chatDone: false,
    chatInput: "",
    chatLoading: false,
    sampleHistory: [],
    sampleQuestions: [],
    sampleDone: false,
    sampleInput: "",
    sampleLoading: false,
    experienceHistory: [],
    experienceDone: false,
    experienceInput: "",
    experienceLoading: false,
    selectedTopic: "",
    topicPicked: false,
    knowledgeEntries: [],
    structuredFacts: [],
    coverPreview: DEFAULT_COVER,
    notSuitableFor: "",
    knowledgePreview: [],
    error: "",
    submitting: false,
    submitBtnLabel: "发布我的 Agent",
    showTopicPicker: false,
    showExperienceNext: false,
    showProfileNext: false,
    profileProgress: "",
    experienceRoundCount: 0,
    defaultCover: DEFAULT_COVER,
    chatScrollId: "",
    experienceScrollId: "",
    userAvatar: "",
    userInitial: "我",
  },

  onLoad() {
    const nav = getNavMetrics();
    this.knowledgeEntries = [];
    this.structuredFacts = [];
    this.isContinuingExperience = false;
    this.experienceResumeMode = false;
    this.setData({
      statusBarHeight: nav.statusBarHeight,
      navBarHeight: nav.navBarHeight,
    });
    this.bootstrap();
  },

  onShow() {
    this.syncUserAvatar();
  },

  syncUserAvatar() {
    const app = getApp();
    const user = (app && app.globalData && app.globalData.user) || null;
    const rawAvatar = user && user.avatarUrl;
    const url = rawAvatar && !isDefaultAvatarUrl(rawAvatar) ? absUrl(rawAvatar) : "";
    this.setData({
      userInitial: userInitial(user),
      userAvatar: url,
    });
  },

  onUserAvatarError() {
    this.setData({ userAvatar: "" });
  },

  bootstrap() {
    const that = this;
    get("/api/auth/me")
      .then(function (res) {
        if (!res.data) {
          that.setData({ initLoading: false, needLogin: true });
          return null;
        }
        getApp().globalData.user = res.data;
        that.syncUserAvatar();
        return get("/api/life-agents/mine");
      })
      .then(function (res) {
        if (!res) return;
        const count = Array.isArray(res.data) ? res.data.length : 0;
        if (count >= 1) {
          that.setData({ initLoading: false, limitReached: true });
          return;
        }
        that.setData({ initLoading: false, step: 0, visualStep: 0 });
      })
      .catch(function () {
        that.setData({ initLoading: false, needLogin: true });
      });
  },

  updateVisualStep(step) {
    let visual = 0;
    if (step === 1) visual = 1;
    else if (step === 2) visual = 2;
    else if (step === 3) visual = 3;
    else if (step === 4) visual = 4;
    else if (step === 6) visual = 5;
    this.setData({ visualStep: visual });
  },

  scrollChatToBottom() {
    const that = this;
    this.setData({ chatScrollId: "" });
    setTimeout(function () {
      that.setData({ chatScrollId: "create-chat-bottom" });
    }, 50);
  },

  scrollExperienceToBottom() {
    const that = this;
    this.setData({ experienceScrollId: "" });
    setTimeout(function () {
      that.setData({ experienceScrollId: "experience-chat-bottom" });
    }, 50);
  },

  goBack() {
    const step = this.data.step;
    if (step === 0) {
      wx.navigateBack({ fail: function () { wx.switchTab({ url: "/pages/index/index" }); } });
      return;
    }
    if (step === 1) {
      this.setData({ step: 0, error: "" });
      this.updateVisualStep(0);
      return;
    }
    if (step === 2) {
      this.setData({ step: 1, error: "" });
      this.updateVisualStep(1);
      return;
    }
    if (step === 3) {
      this.setData({ step: 2, error: "" });
      this.updateVisualStep(2);
      return;
    }
    if (step === 4) {
      this.setData({ step: 3, error: "" });
      this.updateVisualStep(3);
      return;
    }
    if (step === 6) {
      this.setData({ step: 4, error: "" });
      this.updateVisualStep(4);
    }
  },

  goLogin() {
    wx.navigateTo({
      url: "/pages/login/login?redirect=" + encodeURIComponent("/pages/agent-create/agent-create"),
    });
  },

  goMyAgents() {
    wx.navigateTo({ url: "/pages/my-agents/my-agents" });
  },

  applyTemplate(e) {
    const that = this;
    const id = e.currentTarget.dataset.id;
    const tpl = QUICK_START_TEMPLATES.filter(function (t) { return t.id === id; })[0];
    if (!tpl) return;
    const merged = cloneForm(Object.assign({}, DEFAULT_FORM, tpl.form || {}));
    const tags = splitTags(merged.expertiseTags);
    let startIdx = 0;
    let chatHistory = [];
    if (Object.keys(tpl.form || {}).length === 0) {
      chatHistory = [{ role: "assistant", content: PROFILE_CHAT_FIELDS[0].prompt }];
      startIdx = 0;
    } else {
      startIdx = PROFILE_CHAT_FIELDS.length;
      for (let i = 0; i < PROFILE_CHAT_FIELDS.length; i++) {
        const key = PROFILE_CHAT_FIELDS[i].key;
        const val = merged[key] || "";
        if (!isFilledField(val)) {
          startIdx = i;
          break;
        }
      }
      if (startIdx >= PROFILE_CHAT_FIELDS.length) {
        chatHistory = [
          { role: "assistant", content: "已按「" + tpl.label + "」模板自动填好了基础资料。你只需要补充自己的具体信息。" },
          { role: "assistant", content: "名字还没填——" + PROFILE_CHAT_FIELDS[0].prompt },
        ];
        startIdx = 0;
      } else {
        chatHistory = [
          { role: "assistant", content: "已按「" + tpl.label + "」模板自动填好了大部分资料，接下来补充几个你的具体信息就行。" },
          { role: "assistant", content: PROFILE_CHAT_FIELDS[startIdx].prompt },
        ];
      }
    }
    this.setData({
      step: 1,
      visualStep: 1,
      form: merged,
      categories: initCategories(tags),
      selectedTagCount: tags.length,
      sampleQuestions: tpl.sampleQuestions || [],
      chatHistory: chatHistory,
      chatFieldIndex: startIdx,
      chatDone: false,
      chatInput: "",
      sampleHistory: [],
      sampleDone: tpl.sampleQuestions && tpl.sampleQuestions.length > 0,
      sampleInput: "",
      experienceHistory: [],
      experienceDone: false,
      selectedTopic: "",
      topicPicked: false,
      knowledgeEntries: [],
      knowledgePreview: [],
      error: "",
      showProfileNext: false,
      profileProgress: "基础资料 0/" + PROFILE_CHAT_FIELDS.length,
    }, function () {
      that.scrollChatToBottom();
    });
    this.knowledgeEntries = [];
    this.structuredFacts = [];
  },

  onChatInput(e) {
    this.setData({ chatInput: e.detail.value, error: "" });
  },

  onSampleInput(e) {
    this.setData({ sampleInput: e.detail.value, error: "" });
  },

  onExperienceInput(e) {
    this.setData({ experienceInput: e.detail.value, error: "" });
  },

  onNotSuitableInput(e) {
    this.setData({ notSuitableFor: e.detail.value });
  },

  setFormField(key, value) {
    const patch = {};
    patch["form." + key] = value;
    this.setData(patch);
  },

  sendProfileAnswer() {
    const that = this;
    if (this.data.chatDone || this.data.chatLoading) return;
    const raw = (this.data.chatInput || "").trim();
    if (!raw) {
      this.setData({ error: "请输入内容，或回复「跳过」以略过非必填项" });
      return;
    }
    const field = PROFILE_CHAT_FIELDS[this.data.chatFieldIndex];
    if (field && field.required && isSkipField(raw)) {
      const msg =
        field.key === "displayName"
          ? "Agent 名称为必填项，请填写 1 到 10 个字"
          : "首次欢迎语为必填项，请填写后再继续";
      this.setData({ error: msg });
      return;
    }
    if (field) {
      this.setFormField(field.key, raw);
    }
    const history = this.data.chatHistory.concat([
      { role: "user", content: raw, fieldKey: field ? field.key : "" },
    ]);
    const nextIndex = this.data.chatFieldIndex + 1;
    const form = Object.assign({}, this.data.form);
    if (field) form[field.key] = raw;

    if (nextIndex < PROFILE_CHAT_FIELDS.length) {
      history.push({ role: "assistant", content: PROFILE_CHAT_FIELDS[nextIndex].prompt });
      this.setData({
        chatHistory: history,
        chatFieldIndex: nextIndex,
        chatInput: "",
        error: "",
        form: form,
        profileProgress:
          "基础资料 " + nextIndex + "/" + PROFILE_CHAT_FIELDS.length,
      }, function () {
        that.scrollChatToBottom();
      });
      return;
    }

    if (!isFilledField(form.displayName)) {
      this.setData({ error: "Agent 名称为必填项，请填写后再继续" });
      return;
    }
    if (form.displayName.trim().length > 10) {
      this.setData({ error: "Agent 名称长度需为 1 到 10 个字" });
      return;
    }
    if (!isFilledField(form.welcomeMessage)) {
      this.setData({ error: "首次欢迎语为必填项，请填写后再继续" });
      return;
    }

    history.push({
      role: "assistant",
      content: "很好！基础资料收集完成。接下来用户可能会问你什么问题？",
    });
    const sampleHistory = [{ role: "assistant", content: "用户可能会问你什么问题？" }];
    const sampleDone = this.data.sampleQuestions.length > 0;
    this.setData({
      chatHistory: history,
      chatDone: true,
      chatInput: "",
      form: form,
      sampleHistory: sampleHistory,
      sampleDone: sampleDone,
      showProfileNext: sampleDone,
      profileProgress: "基础资料完成",
      error: "",
    }, function () {
      that.scrollChatToBottom();
    });
  },

  sendSampleAnswer() {
    if (!this.data.chatDone || this.data.sampleDone || this.data.sampleLoading) return;
    const answer = (this.data.sampleInput || "").trim();
    if (!answer) return;
    const that = this;
    const history = this.data.sampleHistory.concat([
      { role: "user", content: answer, sampleIndex: this.data.sampleQuestions.length },
    ]);
    this.setData({ sampleLoading: true, sampleInput: "", sampleHistory: history, error: "" }, function () {
      that.scrollChatToBottom();
    });

    post("/api/life-agents/create/next-question", {
      basicInfo: {
        displayName: this.data.form.displayName,
        headline: this.data.form.headline,
        shortBio: this.data.form.shortBio,
      },
      chatHistory: history,
      knowledgeEntries: this.knowledgeEntries.map(function (e) {
        return { category: e.category, title: e.title, content: e.content };
      }),
      topic: "sample_questions",
    })
      .then(function (res) {
        const data = res.data || {};
        if (data.done) {
          that.setData({
            sampleHistory: history.concat([
              { role: "assistant", content: "示例问题已记录完成，确认无误后可进入下一步。" },
            ]),
            sampleDone: true,
            showProfileNext: true,
            sampleLoading: false,
          }, function () {
            that.scrollChatToBottom();
          });
          return;
        }
        const questions = that.data.sampleQuestions.concat([answer]);
        that.setData({
          sampleQuestions: questions,
          sampleHistory: history.concat([
            {
              role: "assistant",
              content: "还有其他问题吗？可以继续写，或者直接说「没有了」或「跳过」。",
            },
          ]),
          sampleLoading: false,
        }, function () {
          that.scrollChatToBottom();
        });
      })
      .catch(function () {
        that.setData({
          sampleHistory: history.concat([
            {
              role: "assistant",
              content: "出了点小问题，你可以继续补充回答，或稍后再试一次。",
            },
          ]),
          sampleLoading: false,
        }, function () {
          that.scrollChatToBottom();
        });
      });
  },

  finishSamplePhase() {
    this.setData({ sampleDone: true, showProfileNext: true, error: "" });
  },

  goStep2() {
    const form = this.data.form;
    if (!this.data.chatDone) {
      this.setData({ error: "请先完成基础资料对话" });
      return;
    }
    if (!this.data.sampleDone) {
      this.setData({ error: "请先完成示例问题，或直接说「没有了」结束" });
      return;
    }
    if (!isFilledField(form.displayName) || form.displayName.trim().length > 10) {
      this.setData({ error: "请填写 Agent 名称（1 到 10 个字）" });
      return;
    }
    if (!isFilledField(form.welcomeMessage)) {
      this.setData({ error: "请填写首次欢迎语" });
      return;
    }
    this.setData({ step: 2, visualStep: 2, error: "" });
  },

  toggleCategory(e) {
    const label = e.currentTarget.dataset.label;
    const tags = splitTags(this.data.form.expertiseTags);
    const idx = tags.indexOf(label);
    if (idx >= 0) {
      tags.splice(idx, 1);
    } else if (tags.length < 5) {
      tags.push(label);
    }
    const categories = initCategories(tags);
    const form = Object.assign({}, this.data.form, { expertiseTags: joinTags(tags) });
    this.setData({
      categories: categories,
      selectedTagCount: tags.length,
      form: form,
      error: "",
    });
  },

  goStep3() {
    const that = this;
    if (this.data.selectedTagCount < 1) {
      this.setData({ error: "请至少选择一个擅长领域" });
      return;
    }
    const history = [{ role: "assistant", content: FIRST_EXPERIENCE_QUESTION }];
    this.setData({
      step: 3,
      visualStep: 3,
      experienceHistory: history,
      experienceDone: false,
      experienceInput: "",
      selectedTopic: "",
      topicPicked: false,
      showTopicPicker: true,
      showExperienceNext: false,
      experienceRoundCount: 0,
      error: "",
    }, function () {
      that.scrollExperienceToBottom();
    });
  },

  pickExperienceTopic(e) {
    const topic = e.currentTarget.dataset.key;
    if (this.data.experienceLoading || this.data.topicPicked) return;
    const topicItem = EXPERIENCE_TOPICS.filter(function (t) { return t.key === topic; })[0];
    const label = topicItem ? topicItem.label : topic;
    const that = this;
    const history = this.data.experienceHistory.concat([
      { role: "user", content: label },
      { role: "assistant", content: "" },
    ]);
    const assistantIndex = history.length - 1;
    this.setData({
      experienceHistory: history,
      experienceLoading: true,
      selectedTopic: topic,
      topicPicked: true,
      showTopicPicker: false,
      error: "",
    }, function () {
      that.scrollExperienceToBottom();
    });

    post("/api/life-agents/create/next-question", {
      basicInfo: {
        displayName: this.data.form.displayName,
        headline: this.data.form.headline,
        shortBio: this.data.form.shortBio,
      },
      chatHistory: history.slice(0, -1),
      knowledgeEntries: this.knowledgeEntries.map(function (e) {
        return { category: e.category, title: e.title, content: e.content };
      }),
      topic: topic,
    })
      .then(function (res) {
        that.applyQuestionResponse(res.data || {}, history, assistantIndex, true);
      })
      .catch(function () {
        that.replaceExperienceMessage(
          history,
          assistantIndex,
          "出了点小问题，你可以继续补充回答，或稍后再试一次。"
        );
        that.setData({ experienceLoading: false });
      });
  },

  replaceExperienceMessage(history, index, text) {
    const that = this;
    const next = history.map(function (msg, i) {
      if (i === index) return { role: msg.role, content: text };
      return msg;
    });
    this.setData({ experienceHistory: next }, function () {
      that.scrollExperienceToBottom();
    });
  },

  applyQuestionResponse(data, history, assistantIndex, isTopicStart) {
    const that = this;
    const form = Object.assign({}, this.data.form);
    if (data.extractedTone) {
      if (data.extractedTone.personaArchetype) form.personaArchetype = data.extractedTone.personaArchetype;
      if (data.extractedTone.toneStyle) form.toneStyle = data.extractedTone.toneStyle;
      if (data.extractedTone.responseStyle) form.responseStyle = data.extractedTone.responseStyle;
    }
    if (data.suggestedTags && data.suggestedTags.length) {
      const merged = splitTags(form.expertiseTags);
      data.suggestedTags.forEach(function (t) {
        if (merged.indexOf(t) < 0) merged.push(t);
      });
      form.expertiseTags = joinTags(merged.slice(0, 8));
    }
    if (data.knowledgeAdd && data.knowledgeAdd.length) {
      data.knowledgeAdd.forEach(function (item) {
        if (!item || !item.content) return;
        const exists = that.knowledgeEntries.some(function (e) {
          return e.content === item.content;
        });
        if (!exists) {
          that.knowledgeEntries.push({
            category: item.category || "经验",
            title: item.title || item.content.slice(0, 20),
            content: item.content,
            tags: item.tags || [item.category || "经验"],
          });
        }
      });
    }
    if (data.factCandidates && data.factCandidates.length) {
      data.factCandidates.forEach(function (f) {
        if (!f.factKey || !f.factValue) return;
        const key = f.factKey + ":" + f.factValue;
        const exists = that.structuredFacts.some(function (x) {
          return x.factKey + ":" + x.factValue === key;
        });
        if (!exists) that.structuredFacts.push(f);
      });
    }

    let nextHistory = history.slice();
    const shouldEnd = data.done && !this.isContinuingExperience && !this.experienceResumeMode;
    if (shouldEnd) {
      nextHistory[assistantIndex] = {
        role: "assistant",
        content:
          data.summaryMessage ||
          "很好！你的经验已经记录下来，可以继续下一步设置 Agent 的回答风格。",
      };
      this.setData({
        experienceHistory: nextHistory,
        experienceDone: true,
        experienceLoading: false,
        showExperienceNext: true,
        form: form,
        knowledgePreview: that.knowledgeEntries.slice(0, 5),
        experienceRoundCount: nextHistory.filter(function (m) {
          return m.role === "user";
        }).length,
        personaIndex: indexOfOption(PERSONA_OPTIONS, form.personaArchetype),
        toneIndex: indexOfOption(TONE_OPTIONS, form.toneStyle),
        responseIndex: indexOfOption(RESPONSE_STYLE_OPTIONS, form.responseStyle),
      }, function () {
        that.scrollExperienceToBottom();
      });
      if (this.isContinuingExperience) {
        this.isContinuingExperience = false;
      }
      return;
    }

    nextHistory[assistantIndex] = {
      role: "assistant",
      content:
        data.nextQuestion ||
        (data.done
          ? "还想补充什么吗？可以说说具体经历，或回复「没有了」结束。"
          : "还能补充一些具体经历吗？"),
    };
    this.setData({
      experienceHistory: nextHistory,
      experienceLoading: false,
      experienceDone: false,
      showExperienceNext: false,
      form: form,
      knowledgePreview: that.knowledgeEntries.slice(0, 5),
      experienceRoundCount: nextHistory.filter(function (m) {
        return m.role === "user";
      }).length,
      personaIndex: indexOfOption(PERSONA_OPTIONS, form.personaArchetype),
      toneIndex: indexOfOption(TONE_OPTIONS, form.toneStyle),
      responseIndex: indexOfOption(RESPONSE_STYLE_OPTIONS, form.responseStyle),
    }, function () {
      that.scrollExperienceToBottom();
    });
    if (this.isContinuingExperience) {
      this.isContinuingExperience = false;
    }
    if (isTopicStart) {
      /* no-op */
    }
  },

  sendExperienceAnswer() {
    const that = this;
    if (!this.data.topicPicked || this.data.experienceDone || this.data.experienceLoading) return;
    const answer = (this.data.experienceInput || "").trim();
    if (!answer) return;
    if (isExperienceSkipIntent(answer)) {
      this.finishExperiencePhase(true);
      return;
    }
    let entries = this.knowledgeEntries.slice();
    if (!/^(暂无|无|没有)$/i.test(answer)) {
      const exists = entries.some(function (e) {
        return e.content === answer;
      });
      if (!exists) {
        entries.push({
          category: "经验",
          title: answer.length > 20 ? answer.slice(0, 20) + "…" : answer,
          content: answer,
          tags: ["经验"],
        });
      }
    }
    this.knowledgeEntries = entries;
    const history = this.data.experienceHistory.concat([
      { role: "user", content: answer },
      { role: "assistant", content: "" },
    ]);
    const assistantIndex = history.length - 1;
    this.setData({
      experienceHistory: history,
      experienceInput: "",
      experienceLoading: true,
      error: "",
    }, function () {
      that.scrollExperienceToBottom();
    });

    post("/api/life-agents/create/next-question", {
      basicInfo: {
        displayName: this.data.form.displayName,
        headline: this.data.form.headline,
        shortBio: this.data.form.shortBio,
      },
      chatHistory: history.slice(0, -1),
      knowledgeEntries: entries.map(function (e) {
        return { category: e.category, title: e.title, content: e.content };
      }),
      topic: this.data.selectedTopic || "experience",
    })
      .then(function (res) {
        that.applyQuestionResponse(res.data || {}, history, assistantIndex, false);
      })
      .catch(function () {
        that.replaceExperienceMessage(
          history,
          assistantIndex,
          "出了点小问题，你可以继续补充回答，或稍后再试一次。"
        );
        that.setData({ experienceLoading: false });
      });
  },

  goStep4() {
    const valid = this.knowledgeEntries.filter(function (e) {
      return (e.content || "").trim().length >= 1;
    });
    if (!this.data.experienceDone) {
      this.setData({ error: "请先完成经验补充对话" });
      return;
    }
    if (valid.length < 2) {
      this.setData({ error: "至少需要记录 2 条有效经验，请继续补充" });
      return;
    }
    this.experienceResumeMode = false;
    this.setData({ step: 4, visualStep: 4, error: "" });
  },

  finishExperiencePhaseManual() {
    this.finishExperiencePhase(false);
  },

  continueExperience() {
    const that = this;
    if (this.data.experienceLoading) return;
    this.isContinuingExperience = true;
    this.experienceResumeMode = true;
    const prevHistory = this.data.experienceHistory.slice();
    const history = prevHistory.concat([{ role: "assistant", content: "" }]);
    const assistantIndex = history.length - 1;
    this.setData({
      experienceHistory: history,
      experienceDone: false,
      showExperienceNext: false,
      experienceLoading: true,
      error: "",
    }, function () {
      that.scrollExperienceToBottom();
    });

    post("/api/life-agents/create/next-question", {
      basicInfo: {
        displayName: this.data.form.displayName,
        headline: this.data.form.headline,
        shortBio: this.data.form.shortBio,
      },
      chatHistory: prevHistory,
      knowledgeEntries: this.knowledgeEntries.map(function (e) {
        return { category: e.category, title: e.title, content: e.content };
      }),
      topic: this.data.selectedTopic || "experience",
    })
      .then(function (res) {
        that.applyQuestionResponse(res.data || {}, history, assistantIndex, false);
      })
      .catch(function () {
        that.replaceExperienceMessage(
          history,
          assistantIndex,
          "出了点小问题，你可以继续补充回答，或稍后再试一次。"
        );
        that.setData({ experienceLoading: false });
        that.isContinuingExperience = false;
      });
  },

  finishExperiencePhase(fromSkipIntent) {
    const that = this;
    const skipMsg = fromSkipIntent === true;
    this.isContinuingExperience = false;
    this.experienceResumeMode = false;
    const validCount = countValidKnowledgeEntries(this.knowledgeEntries);
    if (validCount < 2) {
      this.setData({
        error: skipMsg
          ? "至少需要记录 2 条有效经验才能结束，请再补充一些具体经历"
          : "至少需要记录 2 条有效经验，请继续补充",
      });
      return;
    }
    const history = this.data.experienceHistory.concat([
      {
        role: "assistant",
        content:
          "很好！你的经验已经记录下来，可以继续下一步设置 Agent 的回答风格。",
      },
    ]);
    this.setData({
      experienceHistory: history,
      experienceDone: true,
      showExperienceNext: true,
      experienceInput: "",
      experienceLoading: false,
      error: "",
    }, function () {
      that.scrollExperienceToBottom();
    });
  },

  onPersonaChange(e) {
    const idx = Number(e.detail.value);
    this.setData({
      personaIndex: idx,
      "form.personaArchetype": PERSONA_OPTIONS[idx],
    });
  },

  onToneChange(e) {
    const idx = Number(e.detail.value);
    this.setData({
      toneIndex: idx,
      "form.toneStyle": TONE_OPTIONS[idx],
    });
  },

  onResponseChange(e) {
    const idx = Number(e.detail.value);
    this.setData({
      responseIndex: idx,
      "form.responseStyle": RESPONSE_STYLE_OPTIONS[idx],
    });
  },

  onMbtiChange(e) {
    const idx = Number(e.detail.value);
    const val = MBTI_OPTIONS[idx] === "未设置" ? "" : MBTI_OPTIONS[idx];
    this.setData({
      mbtiIndex: idx,
      mbtiLabel: val || "未设置",
      "form.mbti": val,
    });
  },

  goStep6() {
    const form = this.data.form;
    if (!form.personaArchetype || !form.toneStyle || !form.responseStyle) {
      this.setData({ error: "请设置 Agent 的角色、语气和回答习惯" });
      return;
    }
    this.setData({
      step: 6,
      visualStep: 5,
      knowledgePreview: this.knowledgeEntries.slice(0, 5),
      coverPreview: this.data.userAvatar || DEFAULT_COVER,
      error: "",
    });
  },

  onRecallUserMessage(e) {
    const phase = e.currentTarget.dataset.phase;
    const index = Number(e.currentTarget.dataset.index);
    if (!phase || !isFinite(index) || index <= 0) return;
    const that = this;
    wx.showModal({
      title: "撤回消息",
      content: "撤回后需重新回答该问题，之后的内容也会一并清除。",
      confirmText: "撤回",
      cancelText: "取消",
      success: function (res) {
        if (!res.confirm) return;
        if (phase === "profile") that.recallProfileMessage(index);
        else if (phase === "sample") that.recallSampleMessage(index);
        else if (phase === "experience") that.recallExperienceMessage(index);
      },
    });
  },

  recallProfileMessage(msgIndex) {
    const that = this;
    if (this.data.chatDone || this.data.chatLoading) return;
    const history = this.data.chatHistory;
    const msg = history[msgIndex];
    if (!msg || msg.role !== "user" || isRecalledMessage(msg.content)) return;

    let fieldIdx = -1;
    if (msg.fieldKey) {
      fieldIdx = PROFILE_CHAT_FIELDS.findIndex(function (f) {
        return f.key === msg.fieldKey;
      });
    }
    if (fieldIdx < 0) {
      fieldIdx = countUserAnswersBefore(history, msgIndex);
    }
    if (fieldIdx < 0 || fieldIdx >= PROFILE_CHAT_FIELDS.length) return;

    const recalledText = msg.content;
    const newHistory = history.slice(0, msgIndex);
    const form = clearFormFromField(this.data.form, fieldIdx);

    this.setData({
      chatHistory: newHistory,
      chatFieldIndex: fieldIdx,
      form: form,
      chatInput: recalledText,
      profileProgress: "基础资料 " + fieldIdx + "/" + PROFILE_CHAT_FIELDS.length,
      error: "",
    }, function () {
      that.scrollChatToBottom();
    });
  },

  recallSampleMessage(msgIndex) {
    const that = this;
    if (!this.data.chatDone || this.data.sampleDone || this.data.sampleLoading) return;
    const history = this.data.sampleHistory;
    const msg = history[msgIndex];
    if (!msg || msg.role !== "user" || isRecalledMessage(msg.content)) return;

    let qIdx =
      typeof msg.sampleIndex === "number" ? msg.sampleIndex : countUserAnswersBefore(history, msgIndex);
    const recalledText = msg.content;
    const newHistory = history.slice(0, msgIndex);
    const questions = this.data.sampleQuestions.slice(0, qIdx);

    this.setData({
      sampleHistory: newHistory,
      sampleQuestions: questions,
      sampleInput: recalledText,
      showProfileNext: false,
      error: "",
    }, function () {
      that.scrollChatToBottom();
    });
  },

  recallExperienceMessage(msgIndex) {
    const that = this;
    if (!this.data.topicPicked || this.data.experienceDone || this.data.experienceLoading) return;
    const history = this.data.experienceHistory;
    const msg = history[msgIndex];
    if (!msg || msg.role !== "user" || isRecalledMessage(msg.content)) return;

    const userRound = countUserAnswersBefore(history, msgIndex);
    const recalledText = msg.content;
    const newHistory = history.slice(0, msgIndex);

    if (userRound === 0) {
      this.knowledgeEntries = this.knowledgeEntries.slice();
      this.setData({
        experienceHistory: newHistory,
        selectedTopic: "",
        topicPicked: false,
        showTopicPicker: true,
        experienceInput: "",
        experienceRoundCount: 0,
        showExperienceNext: false,
        knowledgePreview: this.knowledgeEntries.slice(0, 5),
        error: "",
      }, function () {
        that.scrollExperienceToBottom();
      });
      return;
    }

    const entries = this.knowledgeEntries.slice();
    const answer = recalledText.trim();
    if (answer && !/^(暂无|无|没有)$/i.test(answer)) {
      for (let i = entries.length - 1; i >= 0; i--) {
        if (entries[i].content === answer) {
          entries.splice(i, 1);
          break;
        }
      }
    }
    this.knowledgeEntries = entries;

    this.setData({
      experienceHistory: newHistory,
      experienceInput: recalledText,
      experienceRoundCount: newHistory.filter(function (m) {
        return m.role === "user";
      }).length,
      showExperienceNext: false,
      knowledgePreview: entries.slice(0, 5),
      error: "",
    }, function () {
      that.scrollExperienceToBottom();
    });
  },

  submitCreate() {
    if (this.data.submitting) return;
    const form = this.data.form;
    const displayName = (form.displayName || "").trim();
    if (displayName.length < 1 || displayName.length > 10) {
      this.setData({ error: "Agent 名称长度需为 1 到 10 个字" });
      return;
    }
    const validEntries = this.knowledgeEntries.filter(function (e) {
      return (e.content || "").trim().length >= 1;
    });
    if (validEntries.length < 2) {
      this.setData({ error: "至少需要记录 2 条有效经验" });
      return;
    }
    const pricePerQuestion = yuanInputToCents(form.pricePerQuestion);
    if (pricePerQuestion === null) {
      this.setData({ error: "请填写有效的提问价格" });
      return;
    }

    const payload = {
      displayName: displayName,
      headline: (form.headline || "").trim(),
      shortBio: form.shortBio || "",
      longBio: form.longBio || "",
      education: form.education || "",
      school: form.school || "",
      job: form.job || "",
      income: form.income || "",
      country: form.country || "",
      province: form.province || "",
      city: form.city || "",
      county: form.county || "",
      regions: [],
      audience: form.audience || "",
      welcomeMessage: form.welcomeMessage || "",
      notSuitableFor: (this.data.notSuitableFor || "").trim() || undefined,
      pricePerQuestion: pricePerQuestion,
      mbti: form.mbti || undefined,
      personaArchetype: form.personaArchetype,
      toneStyle: form.toneStyle,
      responseStyle: form.responseStyle,
      forbiddenPhrases: splitTags(form.forbiddenPhrases).slice(0, 8),
      exampleReplies: [form.exampleReply1, form.exampleReply2, form.exampleReply3]
        .map(function (s) { return (s || "").trim(); })
        .filter(Boolean)
        .slice(0, 3),
      expertiseTags: splitTags(form.expertiseTags).slice(0, 8),
      sampleQuestions: (this.data.sampleQuestions || [])
        .map(function (s) { return String(s).trim(); })
        .filter(Boolean),
      knowledgeEntries: validEntries.map(function (e) {
        const tags = Array.isArray(e.tags) ? e.tags.filter(Boolean) : [];
        return {
          category: e.category,
          title: e.title,
          content: e.content,
          tags: tags.length ? tags : [e.category || "经验"],
        };
      }),
      structuredFacts: this.structuredFacts
        .filter(function (f) { return f.factKey && f.factValue; })
        .map(function (f) {
          return {
            factKey: f.factKey,
            factValue: f.factValue,
            factType: f.factType,
            source: f.source,
            confidence: f.confidence,
            status: f.status,
          };
        }),
    };

    const that = this;
    this.setData({ submitting: true, submitBtnLabel: "创建中...", error: "" });
    post("/api/life-agents", payload)
      .then(function (res) {
        const id = res.data && res.data.id;
        wx.showToast({ title: "创建成功", icon: "success" });
        setTimeout(function () {
          if (id) {
            wx.redirectTo({ url: "/pages/agent-detail/agent-detail?id=" + id });
          } else {
            wx.navigateTo({ url: "/pages/my-agents/my-agents" });
          }
        }, 400);
      })
      .catch(function (err) {
        const code = err && err.data && err.data.error;
        const detail = err && err.data && err.data.detail;
        that.setData({
          error: mapCreateError(code, detail),
          submitting: false,
          submitBtnLabel: "发布我的 Agent",
        });
      });
  },
});
