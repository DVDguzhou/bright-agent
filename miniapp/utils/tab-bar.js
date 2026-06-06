function getTabBarFromPage(page) {
  if (!page || typeof page.getTabBar !== "function") return null;
  return page.getTabBar() || null;
}

function syncTabBarAuth(page) {
  const tabBar = getTabBarFromPage(page);
  if (tabBar && typeof tabBar.syncUser === "function") {
    tabBar.syncUser();
  }
}

function setTabBarSelected(page, index) {
  const tabBar = getTabBarFromPage(page);
  if (!tabBar) return;
  tabBar.setData({ selected: index });
  if (typeof tabBar.syncUser === "function") {
    tabBar.syncUser();
  }
}

module.exports = {
  syncTabBarAuth,
  setTabBarSelected,
};
