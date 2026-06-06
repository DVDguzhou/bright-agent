const PROFILE_KEY = "lifeAgentMapShareProfileId";
const ENABLED_KEY = "lifeAgentMapShareEnabled";
const USER_LOC_KEY = "lifeAgentMapUserLocation";

function readMapShareProfileId() {
  try {
    const v = wx.getStorageSync(PROFILE_KEY);
    return v && String(v).trim() ? String(v).trim() : null;
  } catch (e) {
    return null;
  }
}

function writeMapShareProfileId(id) {
  try {
    if (id) wx.setStorageSync(PROFILE_KEY, id);
    else wx.removeStorageSync(PROFILE_KEY);
  } catch (e) {
    /* ignore */
  }
}

function readMapShareEnabled() {
  try {
    return wx.getStorageSync(ENABLED_KEY) === "1";
  } catch (e) {
    return false;
  }
}

function writeMapShareEnabled(on) {
  try {
    if (on) wx.setStorageSync(ENABLED_KEY, "1");
    else wx.removeStorageSync(ENABLED_KEY);
  } catch (e) {
    /* ignore */
  }
}

function readMapUserLocation() {
  try {
    const raw = wx.getStorageSync(USER_LOC_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.lat === "number" &&
      typeof parsed.lng === "number" &&
      Number.isFinite(parsed.lat) &&
      Number.isFinite(parsed.lng)
    ) {
      return {
        lat: parsed.lat,
        lng: parsed.lng,
        precise: !!parsed.precise,
      };
    }
  } catch (e) {
    /* ignore */
  }
  return null;
}

function writeMapUserLocation(lat, lng, precise) {
  try {
    wx.setStorageSync(
      USER_LOC_KEY,
      JSON.stringify({ lat: lat, lng: lng, precise: !!precise })
    );
  } catch (e) {
    /* ignore */
  }
}

function clearMapUserLocation() {
  try {
    wx.removeStorageSync(USER_LOC_KEY);
  } catch (e) {
    /* ignore */
  }
}

function clearMapGpsPreferences() {
  writeMapShareProfileId(null);
  writeMapShareEnabled(false);
  clearMapUserLocation();
}

module.exports = {
  readMapShareProfileId,
  writeMapShareProfileId,
  readMapShareEnabled,
  writeMapShareEnabled,
  readMapUserLocation,
  writeMapUserLocation,
  clearMapUserLocation,
  clearMapGpsPreferences,
};
