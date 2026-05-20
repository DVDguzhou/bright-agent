const { post, clearSession } = require("../../utils/request");

Page({
  data: {
    mode: "code",
    email: "",
    password: "",
    code: "",
    codeSent: false,
    countdown: 0,
    loading: false,
    error: "",
  },
  onLoad(options) {
    if (options.redirect) {
      this.redirect = decodeURIComponent(options.redirect);
    }
  },
  onUnload() {
    if (this.timer) clearInterval(this.timer);
  },
  switchMode(e) {
    this.setData({ mode: e.currentTarget.dataset.mode, error: "" });
  },
  onEmailInput(e) {
    this.setData({ email: e.detail.value.trim() });
  },
  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },
  onCodeInput(e) {
    this.setData({ code: e.detail.value.trim() });
  },
  startCountdown() {
    this.setData({ countdown: 60, codeSent: true });
    this.timer = setInterval(() => {
      const next = this.data.countdown - 1;
      if (next <= 0) {
        clearInterval(this.timer);
        this.setData({ countdown: 0 });
      } else {
        this.setData({ countdown: next });
      }
    }, 1000);
  },
  sendCode() {
    if (!this.data.email || this.data.countdown > 0) return;
    this.setData({ loading: true, error: "" });
    post("/api/auth/email/send-code", { email: this.data.email })
      .then(() => {
        this.startCountdown();
        wx.showToast({ title: "验证码已发送", icon: "none" });
      })
      .catch((err) => {
        const msg =
          err.data && err.data.error === "EMAIL_SEND_FAILED"
            ? "邮件发送失败，请稍后重试"
            : "发送失败";
        this.setData({ error: msg });
      })
      .finally(() => this.setData({ loading: false }));
  },
  submit() {
    const { mode, email, password, code } = this.data;
    if (!email) {
      this.setData({ error: "请填写邮箱" });
      return;
    }
    this.setData({ loading: true, error: "" });
    const req =
      mode === "code"
        ? post("/api/auth/email/verify", { email, code })
        : post("/api/auth/login", { email, password });
    req
      .then((res) => {
        const app = getApp();
        if (app && res.data && res.data.user) {
          app.globalData.user = res.data.user;
        }
        wx.showToast({ title: "登录成功", icon: "success" });
        setTimeout(() => {
          if (this.redirect) {
            wx.redirectTo({ url: this.redirect, fail: () => wx.navigateBack() });
          } else {
            wx.navigateBack({ fail: () => wx.reLaunch({ url: "/pages/index/index" }) });
          }
        }, 400);
      })
      .catch((err) => {
        const code = err.data && err.data.error;
        let msg = "登录失败";
        if (code === "INVALID_CODE") msg = "验证码错误或已过期";
        else if (code === "INVALID_CREDENTIALS") msg = "邮箱或密码错误";
        else if (code === "VALIDATION_ERROR") msg = "请检查填写内容";
        this.setData({ error: msg });
      })
      .finally(() => this.setData({ loading: false }));
  },
  logoutHint() {
    clearSession();
  },
});
