const { get, post } = require("../../utils/request");

Page({
  data: {
    id: "",
    agentName: "",
    sessionId: "",
    messages: [],
    input: "",
    sending: false,
    scrollTo: "",
  },
  onLoad(options) {
    const id = options.id || "";
    this.setData({ id });
    if (!id) return;
    get(`/api/life-agents/${id}`)
      .then((res) => {
        const agent = res.data || {};
        const welcome = agent.welcomeMessage || "你好，有什么想聊的？";
        this.setData({
          agentName: agent.displayName || "Agent",
          messages: [{ role: "assistant", content: welcome }],
        });
        wx.setNavigationBarTitle({ title: agent.displayName || "对话" });
      })
      .catch(() => {
        wx.showToast({ title: "加载失败", icon: "none" });
      });
  },
  onInput(e) {
    this.setData({ input: e.detail.value });
  },
  send() {
    const text = (this.data.input || "").trim();
    if (!text || this.data.sending) return;

    const userMsg = { role: "user", content: text };
    const messages = this.data.messages.concat([userMsg]);
    const placeholder = { role: "assistant", content: "思考中…", pending: true };
    this.setData({
      messages: messages.concat([placeholder]),
      input: "",
      sending: true,
      scrollTo: `msg-${messages.length}`,
    });

    post(`/api/life-agents/${this.data.id}/chat`, {
      sessionId: this.data.sessionId || undefined,
      message: text,
      useVoiceReply: false,
    })
      .then((res) => {
        const data = res.data || {};
        const reply = data.reply || "（无回复）";
        const next = this.data.messages.filter((m) => !m.pending);
        next.push({ role: "assistant", content: reply });
        this.setData({
          messages: next,
          sessionId: data.sessionId || this.data.sessionId,
          sending: false,
          scrollTo: `msg-${next.length - 1}`,
        });
      })
      .catch((err) => {
        const next = this.data.messages.filter((m) => !m.pending);
        let tip = "发送失败";
        if (err.statusCode === 401) {
          tip = "请先登录";
          wx.navigateTo({ url: "/pages/login/login" });
        }
        next.push({ role: "assistant", content: tip, error: true });
        this.setData({ messages: next, sending: false });
      });
  },
});
