const { patch } = require("../../utils/request");
const { AGENT_CATEGORIES } = require("../../utils/life-agent-create-data");
const { uploadLifeAgentCover } = require("../../utils/upload-cover");
const { syncUserAvatarFromCover } = require("../../utils/sync-user-avatar");
const { resolveLifeAgentCoverDisplayUrl, nextCoverFallback } = require("../../utils/covers");
const { OFFICIAL_CONTACT } = require("../../utils/official-contact");
const voice = require("../../utils/voice");
const {
  loadManageData,
  createFormState,
  buildProfilePayload,
  computeCompletion,
  goBackToManage,
  MBTI_OPTIONS,
  PERSONA_OPTIONS,
  TONE_OPTIONS,
  RESPONSE_STYLE_OPTIONS,
  REGION_OPTIONS,
  regionsFromForm,
} = require("../../utils/agent-manage");

const SECTIONS = [
  { key: "basic", title: "基础形象", hint: "封面、名称、简介和语音能力", open: true },
  { key: "publish", title: "发布信息", hint: "欢迎语、适用范围和上架状态", open: true },
  { key: "persona", title: "人设风格", hint: "影响聊天时像不像你本人", open: false },
  { key: "content", title: "内容素材", hint: "标签、示例问题和示范回答是提升转化的关键", open: false },
  { key: "region", title: "地域身份", hint: "让用户更快判断你是否真懂这个地方或阶段", open: false },
];

function mbtiOptionsForPicker() {
  return MBTI_OPTIONS.filter(Boolean);
}

function initCategoryChips(tagsStr) {
  const tags = String(tagsStr || "")
    .split(/[,，\n]/)
    .map(function (s) {
      return s.trim();
    })
    .filter(Boolean);
  const set = {};
  tags.forEach(function (t) {
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

function initRegionChips(regionsStr) {
  const selected = regionsFromForm({ regions: regionsStr });
  return REGION_OPTIONS.map(function (region) {
    return {
      label: region,
      selected: selected.indexOf(region) >= 0,
      disabled: selected.indexOf(region) < 0 && selected.length >= 2,
    };
  });
}

function formatSavedAt(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("zh-CN");
}

function readFileBase64(filePath) {
  return new Promise(function (resolve, reject) {
    wx.getFileSystemManager().readFile({
      filePath: filePath,
      encoding: "base64",
      success: function (res) {
        resolve(res.data || "");
      },
      fail: reject,
    });
  });
}

function buildSavableSnapshot(form, voiceSamplePending) {
  const built = buildProfilePayload(form, voiceSamplePending);
  if (built.error) return null;
  return { payload: built.payload, serialized: JSON.stringify(built.payload) };
}

Page({
  data: {
    id: "",
    loading: true,
    error: "",
    saveError: "",
    saving: false,
    completion: 0,
    hasVoiceClone: false,
    voiceCloneId: "",
    voiceStatus: "",
    voicePanelOpen: false,
    voiceRecording: false,
    voiceSamplePending: false,
    voiceSaving: false,
    coverPreview: "",
    coverUploading: false,
    lastSavedLabel: "尚未保存本次修改",
    verificationVerified: false,
    officialEmail: OFFICIAL_CONTACT.email,
    officialDesc: OFFICIAL_CONTACT.description,
    sections: SECTIONS,
    form: null,
    mbtiOptions: mbtiOptionsForPicker(),
    mbtiIndex: 0,
    personaOptions: PERSONA_OPTIONS,
    personaIndex: 0,
    toneOptions: TONE_OPTIONS,
    toneIndex: 0,
    responseOptions: RESPONSE_STYLE_OPTIONS,
    responseIndex: 0,
    categoryChips: [],
    regionChips: [],
  },

  onLoad(options) {
    const id = options.id || "";
    this.setData({ id });
    this._voiceSampleBase64 = null;
    this._lastSavedPayload = null;
    this._pendingAutosave = null;
    voice.bindRecorderEvents({
      onStart: function () {
        this.setData({ voiceRecording: true });
      }.bind(this),
      onStop: function (res) {
        this.setData({ voiceRecording: false });
        this.onVoiceSampleRecorded(res);
      }.bind(this),
      onError: function () {
        this.setData({ voiceRecording: false });
      }.bind(this),
    });
    if (!id) {
      this.setData({ loading: false, error: "缺少 Agent ID" });
      return;
    }
    this.loadData();
  },

  onShow() {
    voice.refreshRecordPermission();
  },

  onHide() {
    this.autosaveProfile(true);
  },

  onUnload() {
    this.autosaveProfile(true);
    voice.stopRecording();
  },

  syncFormView(profile, form) {
    const mbtiIdx = Math.max(0, mbtiOptionsForPicker().indexOf(form.mbti || ""));
    this.setData({
      form: form,
      completion: computeCompletion(profile),
      coverPreview: resolveLifeAgentCoverDisplayUrl("", form.coverImageUrl || profile.coverImageUrl, profile.coverPresetKey),
      hasVoiceClone: !!profile.hasVoiceClone,
      voiceCloneId: profile.voiceCloneId || "",
      voiceStatus: profile.hasVoiceClone ? "已可用于语音合成" : "未就绪，建议录一段样本提升陪伴感。",
      verificationVerified: profile.verificationStatus === "verified",
      mbtiIndex: mbtiIdx,
      personaIndex: Math.max(0, PERSONA_OPTIONS.indexOf(form.personaArchetype)),
      toneIndex: Math.max(0, TONE_OPTIONS.indexOf(form.toneStyle)),
      responseIndex: Math.max(0, RESPONSE_STYLE_OPTIONS.indexOf(form.responseStyle)),
      categoryChips: initCategoryChips(form.expertiseTags),
      regionChips: initRegionChips(form.regions),
    });
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
        const profile = result.data.profile;
        const form = createFormState(profile);
        this._coverPresetKey = profile.coverPresetKey || "";
        const snapshot = buildSavableSnapshot(form, null);
        this._lastSavedPayload = snapshot ? snapshot.serialized : null;
        this._pendingAutosave = null;
        this._voiceSampleBase64 = null;
        this.syncFormView(profile, form);
        this.setData({ loading: false, voiceSamplePending: false, voicePanelOpen: false });
      }.bind(this)
    );
  },

  markSaved(profile) {
    const form = createFormState(profile);
    const snapshot = buildSavableSnapshot(form, null);
    if (snapshot) {
      this._lastSavedPayload = snapshot.serialized;
      this._pendingAutosave = null;
    }
    this._voiceSampleBase64 = null;
    this.setData({
      lastSavedLabel: "最近保存：" + formatSavedAt(new Date().toISOString()),
      voiceSamplePending: false,
      voicePanelOpen: false,
    });
    this.syncFormView(profile, form);
  },

  autosaveProfile(silent) {
    if (!this.data.form || this.data.saving || this.data.voiceSaving) return;
    const snapshot = buildSavableSnapshot(this.data.form, this._voiceSampleBase64);
    if (!snapshot) return;
    if (
      snapshot.serialized === this._lastSavedPayload ||
      snapshot.serialized === this._pendingAutosave
    ) {
      return;
    }
    this._pendingAutosave = snapshot.serialized;
    const that = this;
    patch("/api/life-agents/" + this.data.id, snapshot.payload)
      .then(function (res) {
        that.markSaved(res.data || {});
        const app = getApp();
        if (app && typeof app.refreshUser === "function") {
          app.refreshUser();
        }
      })
      .catch(function () {
        that._pendingAutosave = null;
        if (!silent) {
          that.setData({ saveError: "自动保存失败" });
        }
      });
  },

  toggleSection(e) {
    const key = e.currentTarget.dataset.key;
    const sections = this.data.sections.map(function (s) {
      if (s.key === key) return Object.assign({}, s, { open: !s.open });
      return s;
    });
    this.setData({ sections: sections });
  },

  onFieldInput(e) {
    const field = e.currentTarget.dataset.field;
    if (!field || !this.data.form) return;
    const form = Object.assign({}, this.data.form, { [field]: e.detail.value });
    this.setData({
      form: form,
      regionChips: field === "regions" ? initRegionChips(form.regions) : this.data.regionChips,
    });
  },

  onPublishedChange(e) {
    if (!this.data.form) return;
    const form = Object.assign({}, this.data.form, { published: !!e.detail.value });
    this.setData({ form: form });
  },

  onMbtiChange(e) {
    const idx = Number(e.detail.value) || 0;
    const val = mbtiOptionsForPicker()[idx] || "";
    const form = Object.assign({}, this.data.form, { mbti: val });
    this.setData({ mbtiIndex: idx, form: form });
  },

  onPersonaChange(e) {
    const idx = Number(e.detail.value) || 0;
    const form = Object.assign({}, this.data.form, { personaArchetype: PERSONA_OPTIONS[idx] });
    this.setData({ personaIndex: idx, form: form });
  },

  onToneChange(e) {
    const idx = Number(e.detail.value) || 0;
    const form = Object.assign({}, this.data.form, { toneStyle: TONE_OPTIONS[idx] });
    this.setData({ toneIndex: idx, form: form });
  },

  onResponseChange(e) {
    const idx = Number(e.detail.value) || 0;
    const form = Object.assign({}, this.data.form, { responseStyle: RESPONSE_STYLE_OPTIONS[idx] });
    this.setData({ responseIndex: idx, form: form });
  },

  toggleCategory(e) {
    const label = e.currentTarget.dataset.label;
    if (!label || !this.data.form) return;
    const tags = String(this.data.form.expertiseTags || "")
      .split(/[,，\n]/)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
    const selected = tags.indexOf(label) >= 0;
    const nextTags = selected
      ? tags.filter(function (t) {
          return t !== label;
        })
      : tags.concat([label]);
    const form = Object.assign({}, this.data.form, { expertiseTags: nextTags.join("、") });
    this.setData({ form: form, categoryChips: initCategoryChips(form.expertiseTags) });
  },

  toggleRegion(e) {
    const region = e.currentTarget.dataset.region;
    const disabled = e.currentTarget.dataset.disabled === "true" || e.currentTarget.dataset.disabled === true;
    if (!region || disabled || !this.data.form) return;
    const selected = regionsFromForm(this.data.form);
    const active = selected.indexOf(region) >= 0;
    const next = active
      ? selected.filter(function (r) {
          return r !== region;
        })
      : selected.length < 2
        ? selected.concat([region])
        : selected;
    const form = Object.assign({}, this.data.form, { regions: next.join(", ") });
    this.setData({ form: form, regionChips: initRegionChips(form.regions) });
  },

  chooseCoverImage() {
    if (this.data.coverUploading || this.data.saving) return;
    const that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: function (res) {
        const file = res.tempFiles && res.tempFiles[0];
        if (!file || !file.tempFilePath) return;
        that.setData({ coverUploading: true });
        uploadLifeAgentCover(file.tempFilePath)
          .then(function (url) {
            const form = Object.assign({}, that.data.form, { coverImageUrl: url });
            that.setData({
              form: form,
              coverPreview: resolveLifeAgentCoverDisplayUrl("", url, ""),
              coverUploading: false,
            });
            return syncUserAvatarFromCover(url).catch(function () {
              wx.showToast({ title: "封面已上传，头像同步失败", icon: "none" });
            });
          })
          .catch(function (err) {
            that.setData({ coverUploading: false });
            wx.showToast({ title: (err && err.message) || "上传失败", icon: "none" });
          });
      },
    });
  },

  clearCoverImage() {
    if (!this.data.form) return;
    const form = Object.assign({}, this.data.form, { coverImageUrl: "" });
    this.setData({
      form: form,
      coverPreview: resolveLifeAgentCoverDisplayUrl("", "", this._coverPresetKey || ""),
    });
    const that = this;
    syncUserAvatarFromCover("").catch(function () {
      wx.showToast({ title: "已恢复默认，头像同步失败", icon: "none" });
    });
  },

  onCoverError() {
    this.setData({ coverPreview: nextCoverFallback(this.data.coverPreview) });
  },

  toggleVoicePanel() {
    this.setData({ voicePanelOpen: !this.data.voicePanelOpen });
  },

  onVoiceSampleTouch(e) {
    const type = (e && e.type) || "";
    if (type === "touchstart") {
      if (this.data.voiceSaving || this.data.saving) return;
      if (!voice.isRecordReady()) {
        voice
          .requestRecordPermission()
          .then(function () {
            wx.showToast({ title: "请再次按住录制", icon: "none" });
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
      if (this.data.voiceRecording) voice.stopRecording();
    }
  },

  onVoiceSampleRecorded(res) {
    const that = this;
    readFileBase64(res.tempFilePath)
      .then(function (base64) {
        if (!base64) throw new Error("empty");
        that._voiceSampleBase64 = base64;
        that.setData({
          voiceSamplePending: true,
          voicePanelOpen: false,
          voiceStatus: "已录制新样本，可以单独上传，或和整页资料一起保存。",
        });
      })
      .catch(function () {
        wx.showToast({ title: "录音读取失败", icon: "none" });
      });
  },

  saveVoiceOnly() {
    if (!this._voiceSampleBase64 || this.data.voiceSaving) return;
    const that = this;
    this.setData({ voiceSaving: true, saveError: "" });
    patch("/api/life-agents/" + this.data.id, { voiceSampleBase64: this._voiceSampleBase64 })
      .then(function (res) {
        that.markSaved(res.data || {});
        wx.showToast({ title: "音色已上传", icon: "success" });
      })
      .catch(function () {
        that.setData({ saveError: "音色上传失败，请稍后重试" });
        wx.showToast({ title: "上传失败", icon: "none" });
      })
      .finally(function () {
        that.setData({ voiceSaving: false });
      });
  },

  copyOfficialEmail() {
    wx.setClipboardData({ data: OFFICIAL_CONTACT.email });
  },

  saveProfile() {
    if (!this.data.form || this.data.saving) return;
    const built = buildProfilePayload(this.data.form, this._voiceSampleBase64);
    if (built.error) {
      this.setData({ saveError: built.error });
      wx.showToast({ title: built.error, icon: "none" });
      return;
    }
    this.setData({ saving: true, saveError: "" });
    const that = this;
    patch("/api/life-agents/" + this.data.id, built.payload)
      .then(function (res) {
        that.setData({ saving: false });
        that.markSaved(res.data || {});
        const app = getApp();
        if (app && typeof app.refreshUser === "function") {
          app.refreshUser();
        }
        wx.showToast({ title: "已保存", icon: "success" });
      })
      .catch(function () {
        that.setData({ saving: false, saveError: "保存失败，请稍后重试" });
        wx.showToast({ title: "保存失败", icon: "none" });
      });
  },

  goBack() {
    goBackToManage(this.data.id);
  },

  retry() {
    this.loadData();
  },
});
