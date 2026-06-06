const { get, post, del } = require("../../utils/request");
const {
  normalizePost,
  filterPostsForTab,
} = require("../../utils/posts-feed");
const { getNavMetrics } = require("../../utils/nav-metrics");

Page({
  data: {
    tab: "plaza",
    user: null,
    posts: [],
    loading: true,
    error: "",
    nextCursor: "",
    hasMore: false,
    loadingMore: false,
    skeletonRows: [1, 2, 3],
    drawerOpen: false,
  },

  onLoad() {
    getNavMetrics();
    this.syncUser();
    this.resetAndLoad();
  },

  onShow() {
    this.syncUser();
    const app = getApp();
    if (app && app.globalData) {
      const preferredTab = app.globalData.postsPreferredTab;
      if (preferredTab && preferredTab !== this.data.tab) {
        app.globalData.postsPreferredTab = "";
        this.setData({ tab: preferredTab, posts: [] });
      }
      if (app.globalData.postsNeedRefresh) {
        app.globalData.postsNeedRefresh = false;
        this.resetAndLoad();
      }
    }
  },

  onPullDownRefresh() {
    this.resetAndLoad(true);
  },

  onReachBottom() {
    this.loadMore();
  },

  syncUser() {
    const app = getApp();
    const finish = function (user) {
      this.setData({ user: user });
    }.bind(this);
    if (app && app.globalData && app.globalData.user) {
      finish(app.globalData.user);
      return;
    }
    if (app && typeof app.refreshUser === "function") {
      app.refreshUser().then(finish).catch(function () {
        finish(null);
      });
      return;
    }
    get("/api/auth/me")
      .then(function (res) {
        finish(res.data);
      })
      .catch(function () {
        finish(null);
      });
  },

  resetAndLoad(fromPull) {
    this.setData({
      loading: !fromPull,
      error: "",
      nextCursor: "",
      hasMore: false,
    });
    this.fetchPosts("", fromPull);
  },

  fetchPosts(cursor, fromPull) {
    const that = this;
    const tab = this.data.tab;
    const scopeParam = tab === "mine" ? "&scope=mine" : "&scope=plaza";
    const url = cursor
      ? "/api/posts?cursor=" +
        encodeURIComponent(cursor) +
        "&limit=20" +
        scopeParam
      : "/api/posts?limit=20" + scopeParam;

    get(url)
      .then(function (res) {
        const data = res.data || {};
        const userId = that.data.user && that.data.user.id;
        const items = filterPostsForTab(data.items, tab).map(function (raw) {
          return normalizePost(raw, userId);
        });
        let posts = items;
        if (cursor && !fromPull) {
          const seen = {};
          that.data.posts.forEach(function (p) {
            seen[p.id] = true;
          });
          posts = that.data.posts.concat(
            items.filter(function (p) {
              return !seen[p.id];
            })
          );
        }
        that.setData({
          posts: posts,
          loading: false,
          loadingMore: false,
          error: "",
          nextCursor: data.nextCursor || "",
          hasMore: !!data.hasMore,
        });
        if (fromPull) wx.stopPullDownRefresh();
      })
      .catch(function () {
        that.setData({
          loading: false,
          loadingMore: false,
          error: cursor ? that.data.error : "加载动态失败",
        });
        if (fromPull) wx.stopPullDownRefresh();
      });
  },

  loadMore() {
    if (this.data.loadingMore || !this.data.hasMore || !this.data.nextCursor) {
      return;
    }
    this.setData({ loadingMore: true });
    this.fetchPosts(this.data.nextCursor, false);
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (!tab || tab === this.data.tab) return;
    if (tab === "mine" && !this.data.user) {
      wx.navigateTo({ url: "/pages/login/login" });
      return;
    }
    this.setData({ tab: tab, posts: [] });
    this.resetAndLoad();
  },

  openDrawer() {
    this.setData({ drawerOpen: true });
  },

  closeDrawer() {
    this.setData({ drawerOpen: false });
  },

  goDiscover() {
    wx.switchTab({ url: "/pages/index/index" });
  },

  goSearch() {
    wx.navigateTo({ url: "/pages/search/search" });
  },

  goCreate() {
    if (!this.data.user) {
      wx.navigateTo({ url: "/pages/login/login" });
      return;
    }
    wx.navigateTo({ url: "/pages/post-create/post-create" });
  },

  goPostDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: "/pages/post-detail/post-detail?id=" + id });
  },

  goAgent(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: "/pages/agent-detail/agent-detail?id=" + id });
  },

  onLikeTap(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    if (!this.data.user) {
      wx.navigateTo({ url: "/pages/login/login" });
      return;
    }
    const index = this.data.posts.findIndex(function (p) {
      return p.id === id;
    });
    if (index < 0) return;
    const target = this.data.posts[index];
    const wasLiked = target.likedByMe;
    const nextLikes = wasLiked
      ? Math.max(0, target.likes - 1)
      : target.likes + 1;
    const key = "posts[" + index + "]";
    this.setData({
      [key + ".likedByMe"]: !wasLiked,
      [key + ".likes"]: nextLikes,
      [key + ".likeLabel"]: nextLikes > 0 ? String(nextLikes) : "赞",
    });
    const that = this;
    post("/api/posts/" + id + "/like")
      .then(function (res) {
        const data = res.data || {};
        that.setData({
          [key + ".likedByMe"]: !!data.liked,
          [key + ".likes"]: data.likes,
          [key + ".likeLabel"]:
            data.likes > 0 ? String(data.likes) : "赞",
        });
      })
      .catch(function () {
        that.setData({
          [key + ".likedByMe"]: wasLiked,
          [key + ".likes"]: target.likes,
          [key + ".likeLabel"]:
            target.likes > 0 ? String(target.likes) : "赞",
        });
      });
  },

  onDeleteTap(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    const that = this;
    wx.showModal({
      title: "删除动态",
      content: "确定删除这条动态吗？",
      confirmColor: "#7a1f1f",
      success(res) {
        if (!res.confirm) return;
        del("/api/posts/" + id)
          .then(function () {
            that.setData({
              posts: that.data.posts.filter(function (p) {
                return p.id !== id;
              }),
            });
          })
          .catch(function () {
            wx.showToast({ title: "删除失败", icon: "none" });
          });
      },
    });
  },

  onEditTap(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: "/pages/post-edit/post-edit?id=" + id });
  },

  retryLoad() {
    this.resetAndLoad();
  },

  noop() {},
});
