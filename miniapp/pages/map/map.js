const { get } = require("../../utils/request");
const { setTabBarSelected } = require("../../utils/tab-bar");
const { getNavMetrics } = require("../../utils/nav-metrics");
const { cleanLifeAgentIntroText } = require("../../utils/intro-clean");
const { LEGEND_ITEMS } = require("../../utils/agent-category");
const { buildMapMarkers, SPIDERFY_MIN_SCALE, MAX_MAP_SCALE, warmPinCoverCache } = require("../../utils/map-marker-icons");
const {
  GRID_CELL,
  buildPinIndex,
  getCachedPinIndex,
  filterPins,
  pinsInRegion,
  findPinById,
  enrichPin,
  enrichPins,
  buildIncludePoints,
  filterPinsWithinKm,
  formatDistanceKm,
  haversineKm,
} = require("../../utils/map-pin-index");
const { requestMapLocation } = require("../../utils/map-location");
const {
  readMapShareProfileId,
  writeMapShareProfileId,
  readMapShareEnabled,
  writeMapShareEnabled,
  readMapUserLocation,
  writeMapUserLocation,
  clearMapUserLocation,
  clearMapGpsPreferences,
} = require("../../utils/map-gps-storage");

const CHINA_CENTER = { lat: 35.0, lng: 105.0 };
/** 地图上最多显示的 pin 数量（聚合后），不是 Agent 总数上限 */
const MAX_PIN_GROUPS = 100;
/** 附近 Agent 搜索半径：精确 / 模糊 */
const NEARBY_RADIUS_PRECISE_KM = 50;
const NEARBY_RADIUS_FUZZY_KM = 120;

Page({
  data: {
    statusBarHeight: 20,
    searchOverlayTop: 28,
    loading: true,
    loadError: "",
    search: "",
    totalPinCount: 0,
    filteredPinCount: 0,
    visibleAgentCount: 0,
    markers: [],
    spiderLines: [],
    legendOpen: false,
    legendItems: LEGEND_ITEMS,
    center: CHINA_CENTER,
    scale: 4,
    selectedAgent: null,
    selectedProfileId: null,
    shareEnabled: false,
    nearbyCount: 0,
    nearbyLabel: "",
    locationPrecise: false,
    locating: false,
    boundAgents: [],
    user: null,
    gpsSheetOpen: false,
    exploreOpen: false,
    exploreTitle: "",
    exploreAgents: [],
    geoError: "",
    rememberedLabel: "",
  },

  onLoad() {
    const nav = getNavMetrics();
    this.setData({
      statusBarHeight: nav.statusBarHeight,
      searchOverlayTop: nav.statusBarHeight + 12,
    });
    this.syncGpsPrefs();
  },

  onShow() {
    setTabBarSelected(this, 2);
    this.syncGpsPrefs();
    const cached = getCachedPinIndex();
    if (cached) {
      this._pins = cached.pins;
      this._grid = cached.grid;
      warmPinCoverCache(cached.pins, 160);
      this.setData({
        loading: false,
        totalPinCount: cached.pins.length,
        loadError: "",
      });
      this.applyMapView({ fitViewport: !this._viewportReady });
      this.syncNearbyAgents();
    } else if (!this._pins || this._pins.length === 0) {
      this.loadPins();
    } else {
      this.applyMapView({ fitViewport: false });
      this.syncNearbyAgents();
    }
    if (this.data.shareEnabled) {
      this.requestUserLocation({ silent: true, recenter: false }).catch(function () {});
    }
    this.syncUserAndBound();
  },

  syncGpsPrefs() {
    const selectedProfileId = readMapShareProfileId();
    const shareEnabled = readMapShareEnabled();
    const savedLoc = readMapUserLocation();
    this._userLat = savedLoc ? savedLoc.lat : null;
    this._userLng = savedLoc ? savedLoc.lng : null;
    this._locationPrecise = savedLoc ? !!savedLoc.precise : false;
    this.setData({
      selectedProfileId: selectedProfileId,
      shareEnabled: shareEnabled,
      locationPrecise: this._locationPrecise,
    });
    this.updateRememberedLabel(selectedProfileId);
    this.syncNearbyAgents();
    if (shareEnabled && savedLoc) {
      this.setData({
        center: { lat: savedLoc.lat, lng: savedLoc.lng },
        scale: this._mapScale || 11,
      });
    }
  },

  nearbyRadiusKm() {
    return this._locationPrecise ? NEARBY_RADIUS_PRECISE_KM : NEARBY_RADIUS_FUZZY_KM;
  },

  syncNearbyAgents() {
    const lat = this._userLat;
    const lng = this._userLng;
    if (!this.data.shareEnabled || lat == null || lng == null) {
      this.setData({ nearbyCount: 0, nearbyLabel: "" });
      return;
    }
    const radiusKm = this.nearbyRadiusKm();
    const pins = filterPins(this._pins || [], this.data.search);
    const nearby = filterPinsWithinKm(pins, lat, lng, radiusKm);
    this._nearbyPins = nearby;
    const modeLabel = this._locationPrecise ? "附近" : "大致附近";
    const label =
      nearby.length > 0
        ? modeLabel + " " + nearby.length + " 个 Agent"
        : radiusKm + " 公里内暂无 Agent";
    this.setData({ nearbyCount: nearby.length, nearbyLabel: label });
  },

  enrichExploreAgents(agents) {
    const lat = this._userLat;
    const lng = this._userLng;
    const useDistance = this.data.shareEnabled && lat != null && lng != null;
    const precise = !!this._locationPrecise;
    return enrichPins(agents || []).map(function (item) {
      const next = Object.assign({}, item);
      if (useDistance && typeof item.distanceKm === "number") {
        next.distanceLabel = formatDistanceKm(item.distanceKm, precise);
      }
      return next;
    });
  },

  applyLocationResult(res, options) {
    const silent = options && options.silent;
    const recenter = !(options && options.silent) || !!(options && options.recenter);
    this._userLat = res.latitude;
    this._userLng = res.longitude;
    this._locationPrecise = !!res.precise;
    writeMapUserLocation(res.latitude, res.longitude, res.precise);
    writeMapShareEnabled(true);
    const payload = {
      shareEnabled: true,
      locating: false,
      locationPrecise: !!res.precise,
      geoError: "",
    };
    if (recenter) {
      payload.center = { lat: res.latitude, lng: res.longitude };
      payload.scale = res.precise ? 13 : 11;
      this._mapScale = payload.scale;
      this._viewportReady = true;
    }
    this.setData(payload);
    this.syncNearbyAgents();
    if (recenter) {
      this._lastRenderKey = "";
      this.refreshMapMarkers();
    }
  },

  requestUserLocation(options) {
    const that = this;
    const silent = options && options.silent;
    if (!silent) {
      this.setData({ locating: true, geoError: "" });
    }
    return requestMapLocation()
      .then(function (res) {
        that.applyLocationResult(res, options);
        return res;
      })
      .catch(function () {
        if (!silent) {
          that.setData({
            locating: false,
            geoError:
              "定位失败，请在系统设置中允许微信使用位置信息，并在小程序权限中开启定位",
          });
        }
        throw new Error("location failed");
      });
  },

  syncUserAndBound() {
    const app = getApp();
    const finish = function (user) {
      this.setData({ user: user });
      if (!user) {
        this.setData({ boundAgents: [] });
        return;
      }
      get("/api/life-agents/mine")
        .then(
          function (res) {
            const raw = Array.isArray(res.data) ? res.data : [];
            const boundAgents = raw
              .filter(function (r) {
                return r && r.id;
              })
              .map(function (r) {
                return {
                  id: String(r.id),
                  displayName: String(r.displayName || "Agent"),
                  headline: cleanLifeAgentIntroText(
                    r.headline || "",
                    r.displayName || ""
                  ),
                };
              });
            this.setData({ boundAgents: boundAgents });
            const selectedProfileId = this.data.selectedProfileId;
            if (
              selectedProfileId &&
              !boundAgents.some(function (b) {
                return b.id === selectedProfileId;
              })
            ) {
              clearMapGpsPreferences();
              this.setData({
                selectedProfileId: null,
                shareEnabled: false,
              });
            }
            this.refreshMapMarkers();
          }.bind(this)
        )
        .catch(function () {
          this.setData({ boundAgents: [] });
        }.bind(this));
    }.bind(this);

    if (app && typeof app.refreshUser === "function") {
      app.refreshUser().then(finish);
    } else {
      get("/api/auth/me")
        .then(function (res) {
          finish(res.data);
        })
        .catch(function () {
          finish(null);
        });
    }
  },

  loadPins() {
    this.setData({ loading: true, loadError: "" });
    get("/api/life-agents/map-pins")
      .then(
        function (res) {
          const list = Array.isArray(res.data) ? res.data : [];
          const index = buildPinIndex(list);
          this._pins = index.pins;
          this._grid = index.grid;
          warmPinCoverCache(index.pins, 160);
          this.setData({
            totalPinCount: index.pins.length,
            loading: false,
            loadError: "",
          });
          this.applyMapView({ fitViewport: true });
        }.bind(this)
      )
      .catch(
        function () {
          this._pins = [];
          this._grid = {};
          this._filteredPins = [];
          this._viewportReady = false;
          this.setData({
            loading: false,
            loadError: "地图数据加载失败，请稍后重试",
            totalPinCount: 0,
            filteredPinCount: 0,
            markers: [],
          });
        }.bind(this)
      );
  },

  fitMapViewport(pins) {
    if (!pins || pins.length === 0) return;
    const that = this;
    if (pins.length === 1) {
      this._mapScale = 10;
      this._viewportReady = true;
      this.setData({
        center: { lat: pins[0].lat, lng: pins[0].lng },
        scale: 10,
      });
      return;
    }
    wx.nextTick(function () {
      const points = buildIncludePoints(pins, MAX_PIN_GROUPS);
      const mapCtx = wx.createMapContext("agentMap", that);
      mapCtx.includePoints({
        points: points,
        padding: [60, 30, 100, 30],
        complete: function () {
          that._viewportReady = true;
        },
      });
    });
  },

  applyMapView(options) {
    const fitViewport = options && options.fitViewport;
    const pins = this._pins || [];
    this._filteredPins = filterPins(pins, this.data.search);
    const filteredPins = this._filteredPins;
    const highlightId = this.data.selectedProfileId;
    this.updateRememberedLabel(highlightId);
    this.syncNearbyAgents();

    if (filteredPins.length === 0) {
      this._markerGroups = [];
      this.setData({
        filteredPinCount: 0,
        visibleAgentCount: 0,
        markers: [],
        spiderLines: [],
      });
      return;
    }

    this._markerGroups = [];
    const payload = {
      filteredPinCount: filteredPins.length,
      visibleAgentCount: filteredPins.length,
      markers: [],
      spiderLines: [],
    };

    if (fitViewport) {
      if (filteredPins.length === 1) {
        payload.center = { lat: filteredPins[0].lat, lng: filteredPins[0].lng };
        payload.scale = 10;
        this._mapScale = 10;
        this._viewportReady = true;
      } else if (!this._viewportReady) {
        payload.center = CHINA_CENTER;
        payload.scale = 4;
        this._mapScale = 4;
      }
    }

    this.setData(payload);

    const that = this;
    wx.nextTick(function () {
      if (fitViewport && filteredPins.length > 1) {
        that.fitMapViewport(filteredPins);
      }
      that.refreshMapMarkers();
    });
  },

  renderMapMarkers(visibleAgents, regionKey) {
    if (!visibleAgents || visibleAgents.length === 0) {
      this._markerGroups = [];
      this._lastRenderKey = "";
      this.setData({ markers: [], spiderLines: [] });
      return;
    }
    const highlightId = this.data.selectedProfileId;
    const scale = this._mapScale || this.data.scale || 4;
    const renderKey =
      Math.round(scale * 2) +
      "|" +
      (highlightId || "") +
      "|" +
      (this.data.search || "") +
      "|" +
      visibleAgents.length +
      "|" +
      (regionKey || "");
    if (renderKey === this._lastRenderKey && this.data.markers.length > 0) {
      return;
    }
    this._lastRenderKey = renderKey;

    this._markerToken = (this._markerToken || 0) + 1;
    const token = this._markerToken;
    const that = this;
    buildMapMarkers(
      this,
      visibleAgents,
      highlightId,
      scale,
      MAX_PIN_GROUPS,
      {
        onProgress: function (result) {
          if (token !== that._markerToken) return;
          that._markerGroups = result.markerGroups || [];
          that.setData({
            markers: result.markers,
            spiderLines: result.spiderLines || [],
          });
        },
      }
    ).then(function (result) {
      if (token !== that._markerToken) return;
      that._markerGroups = result.markerGroups || [];
      that.setData({
        markers: result.markers,
        spiderLines: result.spiderLines || [],
      });
    });
  },

  zoomClusterToBounds(group) {
    const agents = group && group.agents ? group.agents : [];
    if (agents.length === 0) return;
    const that = this;
    const points = agents.map(function (a) {
      return { latitude: a.lat, longitude: a.lng };
    });
    const nextScale = Math.min(
      MAX_MAP_SCALE,
      Math.max((this._mapScale || this.data.scale || 4) + 2, SPIDERFY_MIN_SCALE - 1)
    );
    this._mapScale = nextScale;
    this.setData({ scale: nextScale, selectedAgent: null });
    wx.nextTick(function () {
      const mapCtx = wx.createMapContext("agentMap", that);
      mapCtx.includePoints({
        points: points,
        padding: [80, 40, 120, 40],
        complete: function () {
          that.refreshMapMarkers();
        },
      });
    });
  },

  refreshMapMarkers() {
    const filteredPins = this._filteredPins || [];
    if (filteredPins.length === 0) return;
    const that = this;
    const finish = function (region) {
      const visibleAgents = pinsInRegion(
        filteredPins,
        that._grid || {},
        region && region.southwest,
        region && region.northeast,
        GRID_CELL
      );
      if (visibleAgents.length !== that.data.visibleAgentCount) {
        that.setData({ visibleAgentCount: visibleAgents.length });
      }
      let regionKey = "all";
      if (region && region.southwest && region.northeast) {
        const sw = region.southwest;
        const ne = region.northeast;
        regionKey =
          Math.round(sw.latitude * 50) +
          ":" +
          Math.round(sw.longitude * 50) +
          ":" +
          Math.round(ne.latitude * 50) +
          ":" +
          Math.round(ne.longitude * 50);
      }
      that.renderMapMarkers(visibleAgents, regionKey);
    };

    if (this.data.filteredPinCount === 0) return;
    const mapCtx = wx.createMapContext("agentMap", this);
    mapCtx.getRegion({
      success: finish,
      fail: function () {
        finish(null);
      },
    });
  },

  onRegionChange(e) {
    if (!e || e.type !== "end") return;
    const prevScale = this._mapScale || this.data.scale || 4;
    if (e.detail && e.detail.scale) {
      this._mapScale = e.detail.scale;
    }
    const scaleChanged =
      Math.abs((this._mapScale || prevScale) - prevScale) > 0.35;
    if (this._regionTimer) clearTimeout(this._regionTimer);
    const that = this;
    const delay = scaleChanged ? 180 : 520;
    this._regionTimer = setTimeout(function () {
      that._lastRenderKey = "";
      that.refreshMapMarkers();
    }, delay);
  },

  toggleLegend() {
    this.setData({ legendOpen: !this.data.legendOpen });
  },

  closeLegend() {
    this.setData({ legendOpen: false });
  },

  updateRememberedLabel(selectedProfileId) {
    if (!selectedProfileId) {
      this.setData({ rememberedLabel: "" });
      return;
    }
    const agent = findPinById(this._pins, selectedProfileId);
    this.setData({
      rememberedLabel: agent
        ? agent.displayName
        : "已保存的 Agent（地图上若未展示则无法高亮）",
    });
  },

  onSearchInput(e) {
    const search = e.detail.value || "";
    this.setData({ search: search, selectedAgent: null });
    this._viewportReady = false;
    this.applyMapView({ fitViewport: true });
  },

  onMarkerTap(e) {
    const idx = e.detail.markerId;
    const group =
      this._markerGroups && this._markerGroups[idx]
        ? this._markerGroups[idx]
        : null;
    if (!group) return;
    if (group.kind === "cluster") {
      this.zoomClusterToBounds(group);
      return;
    }
    if (group.agent) {
      const agent = enrichPin(group.agent);
      if (
        this.data.shareEnabled &&
        this._userLat != null &&
        this._userLng != null &&
        agent
      ) {
        agent.distanceLabel = formatDistanceKm(
          haversineKm(this._userLat, this._userLng, agent.lat, agent.lng),
          this._locationPrecise
        );
      }
      this.setData({ selectedAgent: agent });
    }
  },

  closeAgentCard() {
    this.setData({ selectedAgent: null });
  },

  goDetail() {
    const agent = this.data.selectedAgent;
    if (!agent) return;
    wx.navigateTo({
      url: "/pages/agent-detail/agent-detail?id=" + agent.id,
    });
  },

  openAgentLocation(e) {
    if (e && typeof e.stopPropagation === "function") {
      e.stopPropagation();
    }
    const agent = this.data.selectedAgent;
    if (!agent || agent.lat == null || agent.lng == null) return;
    wx.openLocation({
      latitude: agent.lat,
      longitude: agent.lng,
      name: agent.displayName || "Agent",
      address: agent.area || "Agent 服务区域标注位置",
      scale: 15,
    });
  },

  goDiscover() {
    wx.switchTab({ url: "/pages/index/index" });
  },

  openGpsSheet() {
    this.setData({ gpsSheetOpen: true, geoError: "" });
  },

  closeGpsSheet() {
    this.setData({ gpsSheetOpen: false });
  },

  pickAgent(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    writeMapShareProfileId(id);
    this.setData({ selectedProfileId: id, geoError: "" });
    this._lastRenderKey = "";
    this.refreshMapMarkers();
  },

  enableSharing() {
    const that = this;
    this.requestUserLocation().catch(function () {});
  },

  disableSharing() {
    writeMapShareEnabled(false);
    clearMapUserLocation();
    this._userLat = null;
    this._userLng = null;
    this._locationPrecise = false;
    this._nearbyPins = null;
    this.setData({
      shareEnabled: false,
      locationPrecise: false,
      nearbyCount: 0,
      nearbyLabel: "",
    });
  },

  openNearbyList() {
    if (!this.data.shareEnabled || !this._nearbyPins || this._nearbyPins.length === 0) {
      if (!this.data.shareEnabled) {
        this.openGpsSheet();
      }
      return;
    }
    this.setData({
      exploreAgents: this.enrichExploreAgents(this._nearbyPins),
      exploreOpen: true,
      exploreTitle: "身边的 Agent",
    });
  },

  clearBinding() {
    clearMapGpsPreferences();
    this._userLat = null;
    this._userLng = null;
    this._locationPrecise = false;
    this._nearbyPins = null;
    this.setData({
      selectedProfileId: null,
      shareEnabled: false,
      locationPrecise: false,
      nearbyCount: 0,
      nearbyLabel: "",
      geoError: "",
    });
    this.refreshMapMarkers();
  },

  goLogin() {
    this.closeGpsSheet();
    wx.navigateTo({ url: "/pages/login/login" });
  },

  goCreate() {
    wx.navigateTo({ url: "/pages/agent-create/agent-create" });
  },

  onExploreTap() {
    const that = this;
    if (this.data.shareEnabled && this._nearbyPins && this._nearbyPins.length > 0) {
      this.setData({
        exploreAgents: this.enrichExploreAgents(this._nearbyPins),
        exploreOpen: true,
        exploreTitle: "身边的 Agent",
      });
      return;
    }
    const filteredPins = this._filteredPins || [];
    const mapCtx = wx.createMapContext("agentMap", this);
    mapCtx.getRegion({
      success: function (res) {
        const visible = pinsInRegion(
          filteredPins,
          that._grid || {},
          res.southwest,
          res.northeast,
          GRID_CELL
        );
        that.setData({
          exploreAgents: that.enrichExploreAgents(visible),
          exploreOpen: true,
          exploreTitle: "此区域的 Agent",
        });
      },
      fail: function () {
        that.setData({
          exploreAgents: that.enrichExploreAgents(filteredPins.slice()),
          exploreOpen: true,
          exploreTitle: "此区域的 Agent",
        });
      },
    });
  },

  closeExplore() {
    this.setData({ exploreOpen: false, exploreAgents: [], exploreTitle: "" });
  },

  goExploreDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    this.closeExplore();
    wx.navigateTo({ url: "/pages/agent-detail/agent-detail?id=" + id });
  },

  noop() {},
});
