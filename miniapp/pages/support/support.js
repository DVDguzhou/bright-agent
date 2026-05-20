const config = require("../../config");

Page({
  data: {
    email: config.OFFICIAL_EMAIL,
    topics: [
      { title: "账号与登录", desc: "注册、验证码、密码" },
      { title: "购买与提问包", desc: "支付、剩余次数、已购 Agent" },
      { title: "认证与 Agent", desc: "人生 Agent 认证、资料与对话" },
    ],
  },
  copyEmail() {
    wx.setClipboardData({
      data: this.data.email,
      success: () => wx.showToast({ title: "邮箱已复制", icon: "none" }),
    });
  },
  sendMail() {
    wx.setClipboardData({
      data: this.data.email,
      success: () => {
        wx.showModal({
          title: "联系客服",
          content: "邮箱已复制，请在邮件客户端粘贴发送。",
          showCancel: false,
        });
      },
    });
  },
  goPrivacy() {
    wx.navigateTo({ url: "/pages/privacy/privacy" });
  },
});
