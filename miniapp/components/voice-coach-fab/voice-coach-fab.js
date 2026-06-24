const voice = require("../../utils/voice");
const voiceDraft = require("../../utils/voice-draft");

const VOICE_CANCEL_SWIPE_PX = 36;

Component({
  properties: {
    agentId: { type: String, value: "" },
    agentName: { type: String, value: "Agent" },
  },

  data: {
    draftText: "",
    submitHint: "",
    voiceRecording: false,
    voiceTranscribing: false,
    voiceActive: false,
    voiceCancelled: false,
    liveText: "",
    recordSeconds: 0,
  },

  lifetimes: {
    attached() {
      this._voicePressed = false;
      this._voiceDidStart = false;
      this._touchStartY = 0;
      this._cancelled = false;
      this._recordTimer = null;
      this.loadDraft();
      voice.bindRecorderEvents({
        onStart: () => {
          this.startRecordTimer();
          this.setData({
            voiceRecording: true,
            voiceActive: true,
            voiceCancelled: false,
            liveText: "录音中…",
          });
        },
        onStop: (res) => {
          this.stopRecordTimer();
          this.onVoiceRecorded(res);
        },
        onError: () => {
          this.stopRecordTimer();
          this._voicePressed = false;
          this.setData({
            voiceRecording: false,
            voiceTranscribing: false,
            voiceActive: false,
            liveText: "",
          });
          wx.showToast({ title: "录音失败", icon: "none" });
        },
      });
      voice.refreshRecordPermission();
    },

    detached() {
      voice.stopRecording();
      this.stopRecordTimer();
      this._voicePressed = false;
    },
  },

  observers: {
    agentId: function () {
      this.loadDraft();
    },
  },

  pageLifetimes: {
    show() {
      voice.refreshRecordPermission();
      this.loadDraft();
    },
  },

  methods: {
    loadDraft() {
      const id = this.properties.agentId;
      const draftText = voiceDraft.loadVoiceDraft(id);
      this.setData({ draftText });
    },

    persistDraft(text) {
      voiceDraft.saveVoiceDraft(this.properties.agentId, text);
    },

    startRecordTimer() {
      this.stopRecordTimer();
      this._recordStartedAt = Date.now();
      this._recordTimer = setInterval(() => {
        const sec = Math.floor((Date.now() - this._recordStartedAt) / 1000);
        const mm = String(Math.floor(sec / 60)).padStart(2, "0");
        const ss = String(sec % 60).padStart(2, "0");
        this.setData({
          recordSeconds: sec,
          liveText: `录音中 ${mm}:${ss}`,
        });
      }, 500);
    },

    stopRecordTimer() {
      if (this._recordTimer) {
        clearInterval(this._recordTimer);
        this._recordTimer = null;
      }
    },

    showHint(message) {
      this.setData({ submitHint: message || "" });
      if (this._hintTimer) clearTimeout(this._hintTimer);
      if (!message) return;
      this._hintTimer = setTimeout(() => {
        this.setData({ submitHint: "" });
      }, 3000);
    },

    onFabTouch(e) {
      const type = (e && e.type) || "";
      if (type === "touchstart") {
        if (this.data.voiceTranscribing) return;
        this._voiceDidStart = false;
        this._cancelled = false;
        this._touchStartY =
          e.touches && e.touches[0] ? e.touches[0].clientY : 0;
        this.showHint("");
        if (!voice.isRecordReady()) {
          voice
            .requestRecordPermission()
            .then(() => {
              this.showHint("请再次按住说话");
            })
            .catch(() => {});
          return;
        }
        this._voicePressed = true;
        if (!voice.beginRecordingSync()) {
          this._voicePressed = false;
          wx.showToast({ title: "无法启动录音", icon: "none" });
        }
        return;
      }
      if (type === "touchmove") {
        if (!this._voicePressed || !this.data.voiceRecording) return;
        const y = e.touches && e.touches[0] ? e.touches[0].clientY : 0;
        const cancelled = this._touchStartY - y > VOICE_CANCEL_SWIPE_PX;
        this._cancelled = cancelled;
        this.setData({ voiceCancelled: cancelled });
        return;
      }
      if (type === "touchend" || type === "touchcancel") {
        if (!this._voicePressed && !this.data.voiceRecording) return;
        this._voicePressed = false;
        if (this._cancelled) {
          this.handleCancel();
          return;
        }
        if (this.data.voiceRecording) {
          this._voiceDidStart = true;
          voice.stopRecording();
        }
      }
    },

    handleCancel() {
      this._skipTranscribe = true;
      this._voiceDidStart = true;
      this._cancelled = false;
      this.stopRecordTimer();
      voice.stopRecording();
      this.setData({
        voiceRecording: false,
        voiceTranscribing: false,
        voiceActive: false,
        voiceCancelled: false,
        liveText: "",
      });
      this.showHint("已取消");
    },

    onVoiceRecorded(res) {
      if (this._skipTranscribe) {
        this._skipTranscribe = false;
        this.setData({
          voiceRecording: false,
          voiceTranscribing: false,
          voiceActive: false,
          liveText: "",
        });
        return;
      }
      this.setData({
        voiceRecording: false,
        voiceActive: true,
        voiceTranscribing: true,
        liveText: "正在转文字…",
      });
      voice
        .transcribe(res.tempFilePath, res.fileSize)
        .then((text) => {
          const merged = voiceDraft.mergeVoiceDraft(this.data.draftText, text);
          this.persistDraft(merged);
          this.setData({
            draftText: merged,
            voiceTranscribing: false,
            voiceActive: false,
            liveText: "",
          });
          this.showHint("已记录，继续长按可补充");
        })
        .catch((err) => {
          this.setData({
            voiceTranscribing: false,
            voiceActive: false,
            liveText: "",
          });
          if (err && err.code === 401) {
            wx.redirectTo({ url: "/pages/login/login" });
            return;
          }
          this.showHint((err && err.message) || "语音识别失败");
        });
    },

    onFabTap() {
      if (
        this._voiceDidStart ||
        this.data.voiceRecording ||
        this.data.voiceTranscribing
      ) {
        return;
      }
      this.openCoEdit();
    },

    openCoEdit() {
      const agentId = (this.properties.agentId || "").trim();
      if (!agentId) return;
      const draft = (this.data.draftText || "").trim();
      this.persistDraft(draft);
      wx.navigateTo({
        url:
          "/pages/agent-manage-coedit/agent-manage-coedit?id=" +
          encodeURIComponent(agentId),
      });
    },

    onDraftInput(e) {
      const draftText = (e.detail && e.detail.value) || "";
      this.setData({ draftText });
      this.persistDraft(draftText);
    },

    clearDraft() {
      this.setData({ draftText: "" });
      this.persistDraft("");
      this.showHint("已清空语音草稿");
    },

    noop() {},
  },
});
