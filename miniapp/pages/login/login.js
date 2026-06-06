const { post } = require("../../utils/request");
const { hydrateServerFavorites } = require("../../utils/favorites");

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

Page({
  data: {
    mode: "code",
    email: "",
    password: "",
    code: "",
    codeSent: false,
    countdown: 0,
    loading: false,
    sendCodeLoading: false,
    error: "",
    drawerOpen: false,
  },

  onLoad(options) {
    if (options.redirect) {
      this.redirect = decodeURIComponent(options.redirect);
    }
  },

  onUnload() {
    if (this.timer) clearInterval(this.timer);
  },

  onShow() {
    const app = getApp();
    if (app && typeof app.refreshUser === "function") {
      app.refreshUser().then((user) => {
        if (user) {
          wx.switchTab({ url: "/pages/mine/mine" });
        }
      }).catch(function () {});
    }
  },

  openDrawer() {
    this.setData({ drawerOpen: true });
  },

  closeDrawer() {
    this.setData({ drawerOpen: false });
  },

  goPosts() {
    wx.navigateTo({ url: "/pages/posts/posts" });
  },

  goDiscover() {
    wx.switchTab({ url: "/pages/index/index" });
  },

  goSearch() {
    wx.navigateTo({ url: "/pages/search/search" });
  },

  goSignup() {
    wx.navigateTo({ url: "/pages/signup/signup" });
  },

  switchToPassword() {
    this.setData({ mode: "password", error: "" });
  },

  switchToCode() {
    this.setData({ mode: "code", error: "" });
  },

  onEmailInput(e) {
    this.setData({ email: e.detail.value.trim() });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  onCodeInput(e) {
    const raw = e.detail.value || "";
    this.setData({ code: raw.replace(/\D/g, "").slice(0, 6) });
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
    const email = this.data.email;
    if (!email) {
      this.setData({ error: "请输入邮箱" });
      return;
    }
    if (!isValidEmail(email)) {
      this.setData({ error: "请输入有效邮箱" });
      return;
    }
    if (this.data.countdown > 0 || this.data.sendCodeLoading) return;

    this.setData({ sendCodeLoading: true, error: "" });
    post("/api/auth/email/send-code", { email })
      .then(() => {
        this.startCountdown();
        wx.showToast({ title: "验证码已发送", icon: "none" });
      })
      .catch((err) => {
        const code = err.data && err.data.error;
        let msg = "发送失败";
        if (code === "EMAIL_SEND_FAILED") {
          msg = "邮件发送失败，请稍后重试";
        } else if (code === "EMAIL_NOT_REGISTERED") {
          msg = "该邮箱尚未注册，请先注册";
        } else if (code === "VALIDATION_ERROR") {
          msg = "请输入有效邮箱";
        }
        this.setData({ error: msg });
      })
      .finally(() => this.setData({ sendCodeLoading: false }));
  },

  afterLoginSuccess() {
    const app = getApp();
    const finish = () => {
      wx.showToast({ title: "登录成功", icon: "success" });
      setTimeout(() => {
        if (this.redirect) {
          wx.redirectTo({ url: this.redirect, fail: () => wx.navigateBack() });
        } else {
          wx.switchTab({ url: "/pages/index/index" });
        }
      }, 400);
    };

    if (app && typeof app.refreshUser === "function") {
      app
        .refreshUser()
        .then((user) => {
          if (user) hydrateServerFavorites();
        })
        .finally(finish);
      return;
    }
    finish();
  },

  submit() {
    const { mode, email, password, code } = this.data;
    if (!email) {
      this.setData({ error: "请填写邮箱" });
      return;
    }
    if (!isValidEmail(email)) {
      this.setData({ error: "请输入有效邮箱" });
      return;
    }
    if (mode === "code" && !code) {
      this.setData({ error: "请输入验证码" });
      return;
    }
    if (mode === "password" && !password) {
      this.setData({ error: "请输入密码" });
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
          if (typeof app.syncTabBar === "function") {
            app.syncTabBar();
          }
        }
        this.afterLoginSuccess();
      })
      .catch((err) => {
        const errCode = err.data && err.data.error;
        let msg = "登录失败";
        if (errCode === "INVALID_CODE") msg = "验证码错误或已过期";
        else if (errCode === "INVALID_CREDENTIALS") msg = "邮箱或密码错误";
        else if (errCode === "VALIDATION_ERROR") {
          msg = mode === "password" ? "请填写有效的邮箱和密码" : "请检查输入";
        } else if (errCode === "USE_OTHER_LOGIN") {
          msg = "该账号请使用注册时的登录方式，或联系客服";
        }
        this.setData({ error: msg });
      })
      .finally(() => this.setData({ loading: false }));
  },

  goPrivacy() {
    wx.navigateTo({ url: "/pages/privacy/privacy" });
  },

  goSupport() {
    wx.navigateTo({ url: "/pages/support/support" });
  },
});
