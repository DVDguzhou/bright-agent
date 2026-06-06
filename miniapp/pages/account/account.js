const { get, post, del, clearSession } = require("../../utils/request");

function isPlaceholderEmail(email) {
  const v = String(email || "").trim().toLowerCase();
  return v.endsWith("@placeholder.local");
}

function validatePassword(pwd) {
  const v = String(pwd || "");
  if (v.length < 8) return "新密码至少 8 位";
  if (v.length > 72) return "新密码不能超过 72 位";
  return "";
}

function mapChangePasswordError(code) {
  if (code === "WRONG_PASSWORD") return "当前密码不正确";
  if (code === "PASSWORD_TOO_SHORT") return "新密码至少 8 位";
  if (code === "PASSWORD_TOO_LONG") return "新密码不能超过 72 位";
  if (code === "VALIDATION_ERROR") return "请检查输入";
  if (code === "UNAUTHORIZED") return "请先登录";
  return "修改失败，请稍后重试";
}

function mapDeleteError(code) {
  if (code === "WRONG_PASSWORD") return "密码不正确";
  if (code === "PASSWORD_REQUIRED") return "请输入当前密码以确认注销";
  if (code === "CONFIRM_REQUIRED") return "请输入 DELETE 确认";
  return "注销失败，请稍后重试";
}

Page({
  data: {
    loading: true,
    accountLine: "",
    isPlaceholder: false,
    oldPassword: "",
    newPassword: "",
    newPassword2: "",
    pwdError: "",
    pwdOk: false,
    pwdSubmitting: false,
    saveBtnLabel: "保存新密码",
    deleteConfirm: "",
    deletePassword: "",
    deleteError: "",
    deleting: false,
    deleteBtnLabel: "永久注销账号",
    showDeletePassword: false,
    placeholderNotice:
      "当前账号通过微信或手机号注册，无独立邮箱密码。如需邮箱登录，请前往 brightagent.cn 注册并绑定新邮箱账号。",
    dangerDesc:
      "永久删除账号及关联的个人资料、对话记录、已购提问包等数据，且无法恢复。若你创建了人生 Agent，也会一并删除。",
  },

  onLoad() {
    this.loadUser();
  },

  loadUser() {
    this.setData({ loading: true });
    const that = this;
    get("/api/auth/me")
      .then(function (res) {
        const user = res.data;
        if (!user) {
          wx.redirectTo({
            url: "/pages/login/login?redirect=" + encodeURIComponent("/pages/account/account"),
          });
          return;
        }
        getApp().globalData.user = user;
        const email = user.email || "";
        const phone = user.phone || "";
        let accountLine = "";
        if (email) {
          accountLine = "登录邮箱：" + email;
        } else if (phone) {
          accountLine = "登录手机：" + phone;
        } else {
          accountLine = "当前账号";
        }
        const isPlaceholder = isPlaceholderEmail(email);
        that.setData({
          loading: false,
          accountLine: accountLine,
          isPlaceholder: isPlaceholder,
          showDeletePassword: !isPlaceholder,
        });
      })
      .catch(function () {
        wx.redirectTo({
          url: "/pages/login/login?redirect=" + encodeURIComponent("/pages/account/account"),
        });
      });
  },

  onOldPasswordInput(e) {
    this.setData({ oldPassword: e.detail.value, pwdError: "", pwdOk: false });
  },

  onNewPasswordInput(e) {
    this.setData({ newPassword: e.detail.value, pwdError: "", pwdOk: false });
  },

  onNewPassword2Input(e) {
    this.setData({ newPassword2: e.detail.value, pwdError: "", pwdOk: false });
  },

  submitPassword() {
    if (this.data.pwdSubmitting) return;
    const oldPassword = this.data.oldPassword;
    const newPassword = this.data.newPassword;
    const newPassword2 = this.data.newPassword2;
    const pwdCheck = validatePassword(newPassword);
    if (pwdCheck) {
      this.setData({ pwdError: pwdCheck, pwdOk: false });
      return;
    }
    if (newPassword !== newPassword2) {
      this.setData({ pwdError: "两次输入的新密码不一致", pwdOk: false });
      return;
    }
    if (!oldPassword) {
      this.setData({ pwdError: "请输入当前密码", pwdOk: false });
      return;
    }

    const that = this;
    this.setData({ pwdSubmitting: true, pwdError: "", pwdOk: false, saveBtnLabel: "保存中..." });
    post("/api/auth/change-password", {
      oldPassword: oldPassword,
      newPassword: newPassword,
    })
      .then(function () {
        that.setData({
          pwdOk: true,
          pwdError: "",
          oldPassword: "",
          newPassword: "",
          newPassword2: "",
          pwdSubmitting: false,
          saveBtnLabel: "保存新密码",
        });
      })
      .catch(function (err) {
        const code = err && err.data && err.data.error;
        that.setData({
          pwdError: mapChangePasswordError(code),
          pwdOk: false,
          pwdSubmitting: false,
          saveBtnLabel: "保存新密码",
        });
      });
  },

  onDeleteConfirmInput(e) {
    this.setData({ deleteConfirm: e.detail.value, deleteError: "" });
  },

  onDeletePasswordInput(e) {
    this.setData({ deletePassword: e.detail.value, deleteError: "" });
  },

  deleteAccount() {
    if (this.data.deleting) return;
    const deleteConfirm = this.data.deleteConfirm.trim();
    if (deleteConfirm !== "DELETE") {
      this.setData({ deleteError: "请在下方输入大写 DELETE 以确认注销" });
      return;
    }

    const body = { confirm: "DELETE" };
    if (this.data.showDeletePassword) {
      if (!this.data.deletePassword) {
        this.setData({ deleteError: "请输入当前密码以确认注销" });
        return;
      }
      body.password = this.data.deletePassword;
    }

    const that = this;
    this.setData({ deleting: true, deleteError: "", deleteBtnLabel: "注销中…" });
    del("/api/auth/account", body)
      .then(function () {
        clearSession();
        wx.showToast({ title: "账号已注销", icon: "none", duration: 2000 });
        setTimeout(function () {
          wx.reLaunch({ url: "/pages/login/login" });
        }, 500);
      })
      .catch(function (err) {
        const code = err && err.data && err.data.error;
        that.setData({
          deleteError: mapDeleteError(code),
          deleting: false,
          deleteBtnLabel: "永久注销账号",
        });
      });
  },

  goPrivacy() {
    wx.navigateTo({ url: "/pages/privacy/privacy" });
  },

  goMine() {
    wx.switchTab({ url: "/pages/mine/mine" });
  },
});
