const config = require("../../config");
const { get, post, patch, del } = require("../../utils/request");

function formatDate(iso) {
  if (!iso) return "";
  return String(iso).slice(0, 10);
}

function mapAgent(agent, expandedId) {
  const keys = Array.isArray(agent.keys) ? agent.keys : [];
  return {
    profileId: agent.profileId,
    displayName: agent.displayName || "未命名",
    published: !!agent.published,
    apiInvokeEnabled: !!agent.apiInvokeEnabled,
    apiTotalCalls: agent.apiTotalCalls || 0,
    apiSessionCount: agent.apiSessionCount || 0,
    expanded: expandedId === agent.profileId,
    keys: keys.map(function (k) {
      return {
        id: k.id,
        keyPrefix: k.keyPrefix || "",
        name: k.name || "未命名",
        callCount: k.callCount || 0,
        createdAt: formatDate(k.createdAt),
      };
    }),
  };
}

Page({
  data: {
    loading: true,
    agents: [],
    platformKeys: [],
    platformName: "",
    platformBusy: false,
    newPlatformKey: "",
    newInvokeKey: "",
    busyProfileId: "",
    apiBase: config.API_BASE,
    manageProfileId: "",
    showManageBack: false,
    curlExample: "",
  },

  onLoad(options) {
    const profileId = (options && options.profileId) || "";
    this.expandedId = profileId || "";
    const exampleAgentId = profileId || "YOUR_AGENT_ID";
    this.setData({
      manageProfileId: profileId,
      showManageBack: !!profileId,
      curlExample:
        'curl -N -s -X POST "' +
        config.API_BASE +
        "/api/life-agents/" +
        exampleAgentId +
        '/api/chat" \\\n  -H "Authorization: Bearer lai_sk_你的密钥" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"message":"你好","sessionId":""}\'',
    });
    get("/api/auth/me")
      .then((res) => {
        if (!res.data) {
          wx.redirectTo({ url: "/pages/login/login" });
          return;
        }
        getApp().globalData.user = res.data;
        this.loadAll();
      })
      .catch(() => {
        wx.redirectTo({ url: "/pages/login/login" });
      });
  },

  onShow() {
    if (!this.data.loading && this._loadedOnce) {
      this.loadAll();
    }
  },

  loadAll() {
    this.setData({ loading: true });
    Promise.all([
      get("/api/life-agents/mine/api-overview"),
      get("/api/user-api-keys"),
    ])
      .then(
        function (results) {
          const overview = results[0].data || {};
          const rawAgents = Array.isArray(overview.agents) ? overview.agents : [];
          const platformKeys = Array.isArray(results[1].data) ? results[1].data : [];
          this.setData({
            agents: rawAgents.map(
              function (a) {
                return mapAgent(a, this.expandedId);
              }.bind(this)
            ),
            platformKeys: platformKeys.map(function (k) {
              return {
                id: k.id,
                keyPrefix: k.keyPrefix || "",
                name: k.name || "未命名",
                createdAt: formatDate(k.createdAt),
              };
            }),
            loading: false,
          });
          this._loadedOnce = true;
        }.bind(this)
      )
      .catch(
        function () {
          this.setData({ loading: false, agents: [], platformKeys: [] });
          wx.showToast({ title: "加载失败", icon: "none" });
        }.bind(this)
      );
  },

  toggleAgent(e) {
    const id = e.currentTarget.dataset.id;
    this.expandedId = this.expandedId === id ? "" : id;
    const expandedId = this.expandedId;
    this.setData({
      agents: this.data.agents.map(function (a) {
        return Object.assign({}, a, { expanded: a.profileId === expandedId });
      }),
    });
  },

  toggleApiEnabled(e) {
    const profileId = e.currentTarget.dataset.id;
    const enabled = !!e.detail.value;
    this.setData({ busyProfileId: profileId });
    patch("/api/life-agents/" + profileId, { apiInvokeEnabled: enabled })
      .then(() => this.loadAll())
      .catch(() => wx.showToast({ title: "保存失败", icon: "none" }))
      .finally(() => this.setData({ busyProfileId: "" }));
  },

  createInvokeKey(e) {
    const profileId = e.currentTarget.dataset.id;
    const agent = this.data.agents.find(function (a) {
      return a.profileId === profileId;
    });
    if (!agent || !agent.apiInvokeEnabled) return;
    wx.showModal({
      title: "新建调用 Key",
      editable: true,
      placeholderText: "Key 备注（可选）",
      success: (res) => {
        if (!res.confirm) return;
        this.setData({ busyProfileId: profileId });
        post("/api/life-agents/" + profileId + "/invoke-keys", {
          name: (res.content || "").trim() || "Invoke Key",
        })
          .then((r) => {
            const key = r.data && r.data.key;
            if (key) {
              this.setData({ newInvokeKey: key });
              wx.showModal({
                title: "请立即复制（仅显示一次）",
                content: key,
                showCancel: false,
              });
            }
            this.loadAll();
          })
          .catch((err) => {
            const msg = (err.data && err.data.error) || "创建失败";
            wx.showToast({ title: msg, icon: "none" });
          })
          .finally(() => this.setData({ busyProfileId: "" }));
      },
    });
  },

  revokeInvokeKey(e) {
    const profileId = e.currentTarget.dataset.profileId;
    const keyId = e.currentTarget.dataset.keyId;
    wx.showModal({
      title: "吊销 Key",
      content: "确定吊销该调用 Key？",
      success: (res) => {
        if (!res.confirm) return;
        this.setData({ busyProfileId: profileId });
        del("/api/life-agents/" + profileId + "/invoke-keys/" + keyId)
          .then(() => this.loadAll())
          .catch(() => wx.showToast({ title: "吊销失败", icon: "none" }))
          .finally(() => this.setData({ busyProfileId: "" }));
      },
    });
  },

  onPlatformNameInput(e) {
    this.setData({ platformName: e.detail.value || "" });
  },

  createPlatformKey() {
    if (this.data.platformBusy) return;
    this.setData({ platformBusy: true });
    post("/api/user-api-keys", {
      name: (this.data.platformName || "").trim() || "API Key",
    })
      .then((res) => {
        const key = res.data && res.data.key;
        this.setData({ platformName: "" });
        if (key) {
          wx.showModal({
            title: "请立即复制（仅显示一次）",
            content: key,
            showCancel: false,
          });
        }
        this.loadAll();
      })
      .catch(() => wx.showToast({ title: "创建失败", icon: "none" }))
      .finally(() => this.setData({ platformBusy: false }));
  },

  revokePlatformKey(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: "吊销 Key",
      content: "确定吊销此平台 Key？",
      success: (res) => {
        if (!res.confirm) return;
        del("/api/user-api-keys/" + id)
          .then(() => this.loadAll())
          .catch(() => wx.showToast({ title: "吊销失败", icon: "none" }));
      },
    });
  },

  goCreateAgent() {
    wx.navigateTo({ url: "/pages/agent-create/agent-create" });
  },

  goBackManage() {
    const id = this.data.manageProfileId;
    if (!id) {
      wx.navigateBack();
      return;
    }
    wx.navigateBack({
      fail: function () {
        wx.redirectTo({ url: "/pages/agent-manage/agent-manage?id=" + encodeURIComponent(id) });
      },
    });
  },

  copyApiBase() {
    wx.setClipboardData({ data: this.data.apiBase });
  },

  copyCurlExample() {
    wx.setClipboardData({ data: this.data.curlExample });
  },

  goDiscover() {
    wx.switchTab({ url: "/pages/index/index" });
  },
});
