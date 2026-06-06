const config = require("../../config");
const { getNavMetrics } = require("../../utils/nav-metrics");

const OFFICIAL = config.OFFICIAL_CONTACT || {
  email: config.OFFICIAL_EMAIL,
  description: "账号、订单、认证与商务合作",
  replyHint: "工作日 24 小时内回复",
};

const EMAIL = OFFICIAL.email || config.OFFICIAL_EMAIL || "";
const DESCRIPTION = OFFICIAL.description || "账号、订单、认证与商务合作";
const REPLY_HINT = OFFICIAL.replyHint || "工作日 24 小时内回复";

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    menuRight: 16,
    redirecting: false,
    copied: false,
    email: EMAIL,
    descText:
      DESCRIPTION +
      "。请发邮件说明你的账号、订单或认证问题，我们会尽快回复。",
    replyHint: REPLY_HINT,
    mailBtnLabel: "发送邮件至 " + EMAIL,
    copyLabel: "复制邮箱地址",
    tips: [
      "注册邮箱或手机号",
      "问题类型与出现时间",
      "相关 Agent 名称或订单信息（如有）",
    ],
    topics: [
      {
        title: "账号与登录",
        desc: "注册、验证码、密码、微信/手机号绑定",
      },
      {
        title: "对话与 Agent",
        desc: "聊天异常、Agent 回复、认证与资料问题",
      },
      {
        title: "认证与 Agent",
        desc: "人生 Agent 认证、资料修改、音色与对话",
      },
    ],
  },

  onLoad() {
    const nav = getNavMetrics();
    this.setData({
      statusBarHeight: nav.statusBarHeight,
      navBarHeight: nav.navBarHeight,
      menuRight: nav.menuRight,
    });

    const supportId = String(config.PLATFORM_SUPPORT_AGENT_ID || "").trim();
    if (!supportId) return;

    this.setData({ redirecting: true });
    const that = this;
    wx.redirectTo({
      url: "/pages/chat/chat?id=" + supportId,
      fail: function () {
        that.setData({ redirecting: false });
        wx.showToast({ title: "无法打开客服对话", icon: "none" });
      },
    });
  },

  goBack() {
    wx.switchTab({
      url: "/pages/map/map",
      fail: function () {
        wx.navigateBack();
      },
    });
  },

  copyEmail() {
    const that = this;
    wx.setClipboardData({
      data: this.data.email,
      success: function () {
        that.setData({ copied: true, copyLabel: "已复制邮箱" });
        wx.showToast({ title: "邮箱已复制", icon: "none" });
        setTimeout(function () {
          that.setData({ copied: false, copyLabel: "复制邮箱地址" });
        }, 2000);
      },
    });
  },

  sendMailHint() {
    const that = this;
    wx.setClipboardData({
      data: this.data.email,
      success: function () {
        wx.showModal({
          title: "发送邮件",
          content:
            "邮箱已复制。请打开手机邮件 App，粘贴收件人并说明你的账号与问题。",
          showCancel: false,
        });
        that.setData({ copied: true, copyLabel: "已复制邮箱" });
        setTimeout(function () {
          that.setData({ copied: false, copyLabel: "复制邮箱地址" });
        }, 2000);
      },
    });
  },

  goPrivacy() {
    wx.navigateTo({ url: "/pages/privacy/privacy" });
  },
});
