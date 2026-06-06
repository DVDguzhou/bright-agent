const { get, post, put } = require("./request");

const STORAGE_KEY = "la:favorite-agent-ids";

function parseIds(raw) {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch (e) {
    return [];
  }
}

function getLocalFavoriteIds() {
  return parseIds(wx.getStorageSync(STORAGE_KEY));
}

function setLocalFavoriteIds(ids) {
  wx.setStorageSync(STORAGE_KEY, JSON.stringify(ids.slice(0, 200)));
}

function isFavoriteAgentId(id) {
  return getLocalFavoriteIds().includes(id);
}

function toggleFavoriteAgentId(id) {
  const ids = getLocalFavoriteIds();
  const wasFavorite = ids.includes(id);
  const next = wasFavorite ? ids.filter((x) => x !== id) : ids.concat([id]);
  setLocalFavoriteIds(next);

  return post("/api/life-agents/favorites", { profileId: id })
    .then((res) => {
      if (typeof res.data.favorited === "boolean") {
        const favorited = res.data.favorited;
        const synced = favorited
          ? getLocalFavoriteIds().includes(id)
            ? getLocalFavoriteIds()
            : getLocalFavoriteIds().concat([id])
          : getLocalFavoriteIds().filter((x) => x !== id);
        setLocalFavoriteIds(synced);
        return favorited;
      }
      return !wasFavorite;
    })
    .catch(() => !wasFavorite);
}

function hydrateServerFavorites() {
  return get("/api/life-agents/favorites")
    .then((res) => {
      const ids = res.data && Array.isArray(res.data.ids) ? res.data.ids : [];
      const local = getLocalFavoriteIds();
      const toMerge = local.filter((id) => !ids.includes(id));
      if (toMerge.length === 0) {
        setLocalFavoriteIds(ids);
        return ids;
      }
      return put("/api/life-agents/favorites", { profileIds: local })
        .then(() => get("/api/life-agents/favorites"))
        .then((res2) => {
          const merged = res2.data && Array.isArray(res2.data.ids) ? res2.data.ids : ids;
          setLocalFavoriteIds(merged);
          return merged;
        });
    })
    .catch(() => getLocalFavoriteIds());
}

module.exports = {
  isFavoriteAgentId,
  toggleFavoriteAgentId,
  hydrateServerFavorites,
  getLocalFavoriteIds,
};
