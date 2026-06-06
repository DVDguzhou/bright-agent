const STORAGE_KEY = "la:search-history";
const MAX = 20;

function read() {
  try {
    const raw = wx.getStorageSync(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr)
      ? arr.filter(function (x) {
          return typeof x === "string" && x.trim().length > 0;
        })
      : [];
  } catch (e) {
    return [];
  }
}

function write(items) {
  try {
    wx.setStorageSync(STORAGE_KEY, JSON.stringify(items.slice(0, MAX)));
  } catch (e) {
    /* ignore */
  }
}

function getSearchHistory() {
  return read();
}

function addSearchHistory(term) {
  const t = (term || "").trim();
  if (!t) return;
  const next = [t].concat(read().filter(function (x) {
    return x !== t;
  }));
  write(next);
}

function clearSearchHistory() {
  write([]);
}

module.exports = {
  getSearchHistory,
  addSearchHistory,
  clearSearchHistory,
};
