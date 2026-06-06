const { getNavMetrics } = require("../../utils/nav-metrics");

Component({
  properties: {
    leftMode: { type: String, value: "menu" },
    activeTab: { type: String, value: "" },
  },
  data: {
    statusBarHeight: 44,
    navBarHeight: 44,
    menuRight: 16,
  },
  lifetimes: {
    attached() {
      const nav = getNavMetrics();
      this.setData({
        statusBarHeight: nav.statusBarHeight,
        navBarHeight: nav.navBarHeight,
        menuRight: nav.menuRight,
      });
    },
  },
  methods: {
    onLeftTap() {
      this.triggerEvent(this.properties.leftMode === "back" ? "back" : "menu");
    },
    onPosts() {
      this.triggerEvent("posts");
    },
    onDiscover() {
      this.triggerEvent("discover");
    },
    onSearch() {
      this.triggerEvent("search");
    },
  },
});
