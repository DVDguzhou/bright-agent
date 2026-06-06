const privacy = require("../../utils/privacy-content");

Page({
  data: {
    effectiveDate: privacy.effectiveDate,
    siteUrl: privacy.siteUrl,
    sections: privacy.sections,
    introText:
      "欢迎使用 BrightAgent。我们重视您的个人信息与隐私保护。本政策说明我们如何收集、使用、存储及保护您的信息。",
    contactLabel: "联系我们：",
    backLinkLabel: "返回发现页",
  },

  copySite() {
    wx.setClipboardData({
      data: this.data.siteUrl,
      success: function () {
        wx.showToast({ title: "网址已复制", icon: "none" });
      },
    });
  },

  goDiscover() {
    wx.switchTab({ url: "/pages/index/index" });
  },
});
