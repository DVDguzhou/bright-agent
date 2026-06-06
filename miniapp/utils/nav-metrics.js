function getNavMetrics() {
  const sys = wx.getSystemInfoSync();
  const menu = wx.getMenuButtonBoundingClientRect();
  const statusBarHeight = sys.statusBarHeight || 44;
  const navBarHeight = (menu.top - statusBarHeight) * 2 + menu.height;
  return {
    statusBarHeight,
    navBarHeight,
    menuRight: sys.windowWidth - menu.left + 8,
    capsuleHeight: menu.height,
  };
}

module.exports = { getNavMetrics };
