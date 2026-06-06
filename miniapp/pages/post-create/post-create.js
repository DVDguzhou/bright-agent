const { get, post, absUrl } = require("../../utils/request");
const { getNavMetrics } = require("../../utils/nav-metrics");
const {
  uploadLifeAgentCover,
  MAX_BYTES,
} = require("../../utils/upload-cover");

const MAX_CONTENT_LENGTH = 2000;
const MAX_IMAGES = 9;

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    menuRight: 16,
    authLoading: true,
    user: null,
    userAvatar: "",
    userInitial: "用",
    content: "",
    contentLength: 0,
    images: [],
    imageUrls: [],
    imageGridClass: "grid-1",
    visibility: "public",
    visibilityHint: "公开发布 · 所有人可见",
    submitting: false,
    uploadingImage: false,
    canSubmit: false,
    submitLabel: "发布",
    showPrivateTip: false,
  },

  onLoad() {
    const nav = getNavMetrics();
    this.setData({
      statusBarHeight: nav.statusBarHeight,
      navBarHeight: nav.navBarHeight,
      menuRight: nav.menuRight,
    });
    this.checkAuth();
  },

  checkAuth() {
    const app = getApp();
    const finish = function (user) {
      if (!user) {
        wx.redirectTo({ url: "/pages/login/login" });
        return;
      }
      const name = user.name || user.email || "用户";
      this.setData({
        authLoading: false,
        user: user,
        userAvatar: user.avatarUrl ? absUrl(user.avatarUrl) : "",
        userInitial: name.charAt(0).toUpperCase(),
      });
    }.bind(this);

    if (app && typeof app.refreshUser === "function") {
      app.refreshUser().then(finish).catch(function () {
        finish(null);
      });
      return;
    }
    get("/api/auth/me")
      .then(function (res) {
        if (app) app.globalData.user = res.data;
        finish(res.data);
      })
      .catch(function () {
        finish(null);
      });
  },

  syncFormState(content, images, submitting) {
    const trimmed = (content || "").trim();
    const canSubmit =
      trimmed.length > 0 &&
      !submitting &&
      !this.data.uploadingImage;
    this.setData({
      contentLength: trimmed.length,
      canSubmit: canSubmit,
      submitLabel: submitting ? "发布中…" : "发布",
      imageGridClass:
        images.length === 1
          ? "grid-1"
          : images.length === 2
            ? "grid-2"
            : "grid-3",
    });
  },

  onContentInput(e) {
    let value = e.detail.value || "";
    if (value.length > MAX_CONTENT_LENGTH) {
      value = value.slice(0, MAX_CONTENT_LENGTH);
    }
    this.setData({ content: value });
    this.syncFormState(value, this.data.images, this.data.submitting);
  },

  setVisibility(e) {
    const visibility = e.currentTarget.dataset.visibility;
    if (!visibility || visibility === this.data.visibility) return;
    this.setData({
      visibility: visibility,
      visibilityHint:
        visibility === "public"
          ? "公开发布 · 所有人可见"
          : "私密发布 · 仅自己可见",
      showPrivateTip: visibility === "private",
    });
  },

  chooseImage() {
    if (this.data.uploadingImage) return;
    if (this.data.images.length >= MAX_IMAGES) {
      wx.showToast({ title: "最多 9 张图片", icon: "none" });
      return;
    }
    const remain = MAX_IMAGES - this.data.images.length;
    const that = this;
    wx.chooseMedia({
      count: remain,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      sizeType: ["compressed"],
      success: function (res) {
        const files = res.tempFiles || [];
        that.uploadImagesSequential(files);
      },
    });
  },

  uploadImagesSequential(files) {
    const that = this;
    let index = 0;

    function next() {
      if (index >= files.length) {
        that.setData({ uploadingImage: false });
        that.syncFormState(that.data.content, that.data.images, that.data.submitting);
        return;
      }
      const file = files[index];
      index++;
      if (file.size > MAX_BYTES) {
        wx.showToast({ title: "图片不能超过 2MB", icon: "none" });
        next();
        return;
      }
      that.setData({ uploadingImage: true });
      uploadLifeAgentCover(file.tempFilePath)
        .then(function (url) {
          const images = that.data.images.concat([url]);
          const imageUrls = that.data.imageUrls.concat([absUrl(url)]);
          that.setData({ images: images, imageUrls: imageUrls });
          next();
        })
        .catch(function (err) {
          that.setData({ uploadingImage: false });
          wx.showToast({
            title: (err && err.message) || "图片上传失败",
            icon: "none",
          });
          that.syncFormState(that.data.content, that.data.images, that.data.submitting);
        });
    }

    next();
  },

  removeImage(e) {
    const index = Number(e.currentTarget.dataset.index);
    if (!Number.isFinite(index) || index < 0) return;
    const images = this.data.images.slice();
    const imageUrls = this.data.imageUrls.slice();
    images.splice(index, 1);
    imageUrls.splice(index, 1);
    this.setData({ images: images, imageUrls: imageUrls });
    this.syncFormState(this.data.content, images, this.data.submitting);
  },

  goBack() {
    wx.navigateBack({
      fail: function () {
        wx.navigateTo({ url: "/pages/posts/posts" });
      },
    });
  },

  submitPost() {
    if (!this.data.canSubmit || this.data.submitting) return;
    const trimmed = (this.data.content || "").trim();
    if (!trimmed) return;

    this.setData({ submitting: true });
    this.syncFormState(this.data.content, this.data.images, true);

    const that = this;
    post("/api/posts", {
      content: trimmed,
      images: this.data.images,
      visibility: this.data.visibility,
    })
      .then(function () {
        const app = getApp();
        if (app && app.globalData) {
          app.globalData.postsNeedRefresh = true;
          app.globalData.postsPreferredTab =
            that.data.visibility === "private" ? "mine" : "plaza";
        }
        wx.showToast({ title: "发布成功", icon: "success" });
        setTimeout(function () {
          wx.navigateBack({
            fail: function () {
              wx.redirectTo({ url: "/pages/posts/posts" });
            },
          });
        }, 400);
      })
      .catch(function (err) {
        const msg =
          (err && err.data && err.data.message) ||
          (err && err.data && err.data.error) ||
          "发布失败，请稍后重试";
        wx.showToast({ title: String(msg), icon: "none" });
        that.setData({ submitting: false });
        that.syncFormState(that.data.content, that.data.images, false);
      });
  },

  onAvatarError() {
    this.setData({ userAvatar: "" });
  },
});
