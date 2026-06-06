const { post, absUrl } = require("../../utils/request");
const { hydrateServerFavorites } = require("../../utils/favorites");

const DEFAULT_AVATAR = absUrl("/life-agent-cover-presets/default-cover.png");

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function mapSignupError(code) {
  if (code === "EMAIL_EXISTS") return "该邮箱已被注册";
  if (code === "NAME_EXISTS") return "该用户名已被使用，请换一个";
  if (code === "INVALID_EMAIL") return "不能使用此类邮箱注册，请使用真实邮箱";
  if (code === "INVALID_CODE") return "验证码错误或已过期，请重新获取";
  if (code === "PASSWORD_TOO_SHORT") return "密码至少 8 位";
  if (code === "PASSWORD_TOO_LONG") return "密码不能超过 72 位";
  if (code === "TERMS_REQUIRED") return "请阅读并同意隐私政策";
  if (code === "RATE_LIMITED") return "操作过于频繁，请稍后再试";
  if (code === "EMAIL_SEND_FAILED") return "邮件发送失败，请稍后重试";
  if (code === "VALIDATION_ERROR") return "请检查输入";
  return "注册失败";
}

function compressAvatar(tempPath) {
  return new Promise(function (resolve, reject) {
    wx.compressImage({
      src: tempPath,
      quality: 80,
      success: function (res) {
        wx.getFileSystemManager().readFile({
          filePath: res.tempFilePath,
          encoding: "base64",
          success: function (r) {
            resolve("data:image/jpeg;base64," + r.data);
          },
          fail: reject,
        });
      },
      fail: reject,
    });
  });
}

Page({
  data: {
    email: "",
    verificationCode: "",
    password: "",
    name: "",
    avatarUrl: "",
    avatarPreview: DEFAULT_AVATAR,
    acceptTerms: false,
    codeSent: false,
    countdown: 0,
    loading: false,
    sendCodeLoading: false,
    avatarUploading: false,
    error: "",
    drawerOpen: false,
    sendCodeBtnLabel: "发送验证码",
    submitBtnLabel: "注册",
    avatarBtnLabel: "上传头像",
    showCodeHint: false,
    showClearAvatar: false,
  },

  onLoad() {},

  onUnload() {
    if (this.timer) clearInterval(this.timer);
  },

  onShow() {
    const app = getApp();
    if (app && typeof app.refreshUser === "function") {
      app.refreshUser().then(function (user) {
        if (user) {
          wx.switchTab({ url: "/pages/mine/mine" });
        }
      }).catch(function () {});
    }
  },

  updateSendCodeLabel() {
    let label = "发送验证码";
    if (this.data.countdown > 0) {
      label = this.data.countdown + "s";
    } else if (this.data.codeSent) {
      label = "重新发送";
    }
    this.setData({ sendCodeBtnLabel: label });
  },

  startCountdown() {
    this.setData({ countdown: 60, codeSent: true, showCodeHint: true });
    this.updateSendCodeLabel();
    const that = this;
    this.timer = setInterval(function () {
      const next = that.data.countdown - 1;
      if (next <= 0) {
        clearInterval(that.timer);
        that.setData({ countdown: 0 });
      } else {
        that.setData({ countdown: next });
      }
      that.updateSendCodeLabel();
    }, 1000);
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

  goLogin() {
    wx.navigateTo({ url: "/pages/login/login" });
  },

  goPrivacy() {
    wx.navigateTo({ url: "/pages/privacy/privacy" });
  },

  goSupport() {
    wx.navigateTo({ url: "/pages/support/support" });
  },

  onEmailInput(e) {
    const email = e.detail.value.trim();
    const patch = { email: email, error: "" };
    if (this.data.codeSent) {
      patch.codeSent = false;
      patch.verificationCode = "";
      patch.showCodeHint = false;
    }
    this.setData(patch);
    this.updateSendCodeLabel();
  },

  onCodeInput(e) {
    const raw = e.detail.value || "";
    this.setData({
      verificationCode: raw.replace(/\D/g, "").slice(0, 6),
      error: "",
    });
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value, error: "" });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value, error: "" });
  },

  onTermsChange(e) {
    const values = e.detail.value || [];
    let accepted = false;
    for (let i = 0; i < values.length; i++) {
      if (values[i] === "terms") {
        accepted = true;
        break;
      }
    }
    this.setData({ acceptTerms: accepted, error: "" });
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

    const that = this;
    this.setData({ sendCodeLoading: true, error: "" });
    post("/api/auth/signup/send-code", { email: email })
      .then(function () {
        that.startCountdown();
        wx.showToast({ title: "验证码已发送", icon: "none" });
      })
      .catch(function (err) {
        const code = err && err.data && err.data.error;
        that.setData({ error: mapSignupError(code) });
      })
      .then(function () {
        that.setData({ sendCodeLoading: false });
      });
  },

  chooseAvatar() {
    if (this.data.avatarUploading) return;
    const that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: function (res) {
        const file = res.tempFiles && res.tempFiles[0];
        if (!file) return;
        if (file.size > 8 * 1024 * 1024) {
          that.setData({ error: "头像图片不能超过 8MB" });
          return;
        }
        that.setData({ avatarUploading: true, error: "", avatarBtnLabel: "处理中..." });
        compressAvatar(file.tempFilePath)
          .then(function (dataUrl) {
            that.setData({
              avatarUrl: dataUrl,
              avatarPreview: dataUrl,
              avatarUploading: false,
              avatarBtnLabel: "更换头像",
              showClearAvatar: true,
            });
          })
          .catch(function () {
            that.setData({
              error: "头像处理失败，请换一张图片重试",
              avatarUploading: false,
              avatarBtnLabel: that.data.avatarUrl ? "更换头像" : "上传头像",
            });
          });
      },
    });
  },

  clearAvatar() {
    this.setData({
      avatarUrl: "",
      avatarPreview: DEFAULT_AVATAR,
      avatarBtnLabel: "上传头像",
      showClearAvatar: false,
      error: "",
    });
  },

  afterSignupSuccess(res) {
    const app = getApp();
    if (app && res.data && res.data.user) {
      app.globalData.user = res.data.user;
      if (typeof app.syncTabBar === "function") {
        app.syncTabBar();
      }
    }
    const finish = function () {
      wx.showToast({ title: "注册成功", icon: "success" });
      setTimeout(function () {
        wx.switchTab({ url: "/pages/mine/mine" });
      }, 400);
    };
    if (app && typeof app.refreshUser === "function") {
      app.refreshUser().then(function (user) {
        if (user) hydrateServerFavorites();
      }).then(finish).catch(finish);
      return;
    }
    finish();
  },

  submit() {
    const email = this.data.email.trim();
    const name = this.data.name.trim();
    const password = this.data.password;
    const verificationCode = this.data.verificationCode.trim();

    if (!email || !isValidEmail(email)) {
      this.setData({ error: "请输入有效邮箱" });
      return;
    }
    if (!this.data.codeSent) {
      this.setData({ error: "请先获取邮箱验证码" });
      return;
    }
    if (!/^\d{6}$/.test(verificationCode)) {
      this.setData({ error: "请输入 6 位验证码" });
      return;
    }
    if (name.length < 2 || name.length > 32) {
      this.setData({ error: "用户名至少 2 位，最多 32 位" });
      return;
    }
    if (password.length < 8) {
      this.setData({ error: "密码至少 8 位" });
      return;
    }
    if (password.length > 72) {
      this.setData({ error: "密码不能超过 72 位" });
      return;
    }
    if (!this.data.acceptTerms) {
      this.setData({ error: "请阅读并同意隐私政策" });
      return;
    }

    const body = {
      email: email,
      password: password,
      name: name,
      verificationCode: verificationCode,
      acceptTerms: true,
    };
    if (this.data.avatarUrl) {
      body.avatarUrl = this.data.avatarUrl;
    }

    const that = this;
    this.setData({ loading: true, error: "", submitBtnLabel: "注册中..." });
    post("/api/auth/signup", body)
      .then(function (res) {
        that.afterSignupSuccess(res);
      })
      .catch(function (err) {
        const code = err && err.data && err.data.error;
        that.setData({
          error: mapSignupError(code),
          loading: false,
          submitBtnLabel: "注册",
        });
      })
      .then(function () {
        if (that.data.loading) {
          that.setData({ loading: false, submitBtnLabel: "注册" });
        }
      });
  },
});
