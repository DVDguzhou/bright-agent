/**
 * 地图定位：仅使用 wx.getFuzzyLocation（须在公众平台开通并在 app.json 声明）。
 * @returns {Promise<{ latitude: number, longitude: number, precise: boolean }>}
 */
function requestMapLocation() {
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

module.exports = {
  requestMapLocation,
};
