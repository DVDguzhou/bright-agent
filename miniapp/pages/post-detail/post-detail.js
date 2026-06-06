const { get, post, del, absUrl } = require("../../utils/request");
const {
  normalizeCommentPreview,
  truncateText,
} = require("../../utils/posts-feed");
const { formatTimeAgo } = require("../../utils/format");
const { getNavMetrics } = require("../../utils/nav-metrics");

function normalizeDetailComment(raw) {
  const base = normalizeCommentPreview(raw);
  return Object.assign({}, base, {
    preview: truncateText(raw.content, 500),
    timeLabel: formatTimeAgo(raw.createdAt),
    sortAt: raw.createdAt || "",
  });
}

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 44,
    postId: "",
    user: null,
    loading: true,
    error: "",
    post: null,
    comments: [],
    commentText: "",
    submitting: false,
  },

  onLoad(options) {
    const nav = getNavMetrics();
    this.setData({
      statusBarHeight: nav.statusBarHeight,
      navBarHeight: nav.navBarHeight,
      postId: options.id || "",
    });
    this.syncUser();
    this.loadPost();
  },

  syncUser() {
    const app = getApp();
    if (app && app.globalData && app.globalData.user) {
      this.setData({ user: app.globalData.user });
      return;
    }
    get("/api/auth/me")
      .then(
        function (res) {
          this.setData({ user: res.data });
        }.bind(this)
      )
      .catch(function () {
        this.setData({ user: null });
      }.bind(this));
  },

  loadPost() {
    const id = this.data.postId;
    if (!id) {
      this.setData({ loading: false, error: "帖子不存在" });
      return;
    }
    this.setData({ loading: true, error: "" });
    get("/api/posts/" + id)
      .then(
        function (res) {
          const raw = res.data || {};
          const userId = this.data.user && this.data.user.id;
          const images = (Array.isArray(raw.images) ? raw.images : []).map(
            absUrl
          );
          const authorName = String(raw.authorName || "用户");
          const userComments = (Array.isArray(raw.comments)
            ? raw.comments
            : []
          ).map(normalizeDetailComment);
          const agentComments = (Array.isArray(raw.agentReplies)
            ? raw.agentReplies
            : []
          ).map(normalizeDetailComment);
          const comments = userComments
            .concat(agentComments)
            .sort(function (a, b) {
              return (
                new Date(a.sortAt).getTime() - new Date(b.sortAt).getTime()
              );
            });
          this.setData({
            loading: false,
            post: {
              id: String(raw.id),
              content: String(raw.content || ""),
              images: images,
              imageGridClass:
                images.length === 1
                  ? "grid-1"
                  : images.length === 2
                    ? "grid-2"
                    : "grid-3",
              isPrivate: raw.visibility === "private",
              authorName: authorName,
              authorId: String(raw.authorId || ""),
              authorAgentProfileId: String(raw.authorAgentProfileId || ""),
              authorAvatarFull: raw.authorAvatarUrl
                ? absUrl(raw.authorAvatarUrl)
                : "",
              authorInitial: authorName.charAt(0) || "用",
              timeLabel: formatTimeAgo(raw.createdAt),
              likes: Number(raw.likes) || 0,
              likedByMe: !!raw.likedByMe,
              likeLabel:
                (Number(raw.likes) || 0) > 0 ? String(raw.likes) : "赞",
              isMine: !!(userId && raw.authorId === userId),
            },
            comments: comments,
          });
        }.bind(this)
      )
      .catch(
        function () {
          this.setData({ loading: false, error: "加载帖子失败" });
        }.bind(this)
      );
  },

  goBack() {
    wx.navigateBack({
      fail: function () {
        wx.navigateTo({ url: "/pages/posts/posts" });
      },
    });
  },

  goAgent(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: "/pages/agent-detail/agent-detail?id=" + id });
  },

  onLikeTap() {
    if (!this.data.post) return;
    if (!this.data.user) {
      wx.navigateTo({ url: "/pages/login/login" });
      return;
    }
    const postItem = this.data.post;
    const wasLiked = postItem.likedByMe;
    const nextLikes = wasLiked
      ? Math.max(0, postItem.likes - 1)
      : postItem.likes + 1;
    this.setData({
      "post.likedByMe": !wasLiked,
      "post.likes": nextLikes,
      "post.likeLabel": nextLikes > 0 ? String(nextLikes) : "赞",
    });
    const that = this;
    post("/api/posts/" + postItem.id + "/like")
      .then(function (res) {
        const data = res.data || {};
        that.setData({
          "post.likedByMe": !!data.liked,
          "post.likes": data.likes,
          "post.likeLabel": data.likes > 0 ? String(data.likes) : "赞",
        });
      })
      .catch(function () {
        that.setData({
          "post.likedByMe": wasLiked,
          "post.likes": postItem.likes,
          "post.likeLabel": postItem.likes > 0 ? String(postItem.likes) : "赞",
        });
      });
  },

  onDeleteTap() {
    const postItem = this.data.post;
    if (!postItem) return;
    wx.showModal({
      title: "删除动态",
      content: "确定删除这条动态吗？",
      confirmColor: "#7a1f1f",
      success: function (res) {
        if (!res.confirm) return;
        del("/api/posts/" + postItem.id)
          .then(function () {
            wx.navigateBack();
          })
          .catch(function () {
            wx.showToast({ title: "删除失败", icon: "none" });
          });
      },
    });
  },

  onEditTap() {
    const id = this.data.postId;
    if (!id) return;
    wx.navigateTo({ url: "/pages/post-edit/post-edit?id=" + id });
  },

  onCommentInput(e) {
    this.setData({ commentText: e.detail.value || "" });
  },

  submitComment() {
    const text = (this.data.commentText || "").trim();
    if (!text) return;
    if (!this.data.user) {
      wx.navigateTo({ url: "/pages/login/login" });
      return;
    }
    if (this.data.submitting) return;
    this.setData({ submitting: true });
    const that = this;
    post("/api/posts/" + this.data.postId + "/comments", { content: text })
      .then(function () {
        that.setData({ commentText: "", submitting: false });
        that.loadPost();
      })
      .catch(function () {
        that.setData({ submitting: false });
        wx.showToast({ title: "评论失败", icon: "none" });
      });
  },
});
