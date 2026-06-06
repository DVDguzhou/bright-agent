const config = require("../config");

/**
 * 优先精确位置（需公众平台开通 wx.getLocation），失败则回退模糊定位。
 * config.PREFER_PRECISE_LOCATION 为 false 时仅使用 getFuzzyLocation。
 * @returns {Promise<{ latitude: number, longitude: number, precise: boolean }>}
 */
function requestMapLocation() {
  const preferPrecise = config.PREFER_PRECISE_LOCATION === true;

  function fuzzyLocation() {
    return new Promise(function (resolve, reject) {
      wx.getFuzzyLocation({
        type: "gcj02",
        success: function (res) {
          resolve({
            latitude: res.latitude,
            longitude: res.longitude,
            precise: false,
          });
        },
        fail: reject,
      });
    });
  }

  function preciseLocation() {
    return new Promise(function (resolve, reject) {
      wx.getLocation({
        type: "gcj02",
        isHighAccuracy: true,
        highAccuracyExpireTime: 4000,
        success: function (res) {
          resolve({
            latitude: res.latitude,
            longitude: res.longitude,
            precise: true,
          });
        },
        fail: reject,
      });
    });
  }

  if (!preferPrecise) {
    return fuzzyLocation();
  }
  return preciseLocation().catch(function () {
    return fuzzyLocation();
  });
}

module.exports = {
  requestMapLocation,
};
