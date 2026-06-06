const config = require("../config");
const { getCookieHeader } = require("./request");

const MAX_BYTES = 2 * 1024 * 1024;

function parseSetCookie(headers) {
  if (!headers) return;
  const raw = headers["Set-Cookie"] || headers["set-cookie"];
  if (!raw) return;
  const list = Array.isArray(raw) ? raw : [raw];
  list.forEach(function (item) {
    const pair = item.split(";")[0];
    const eq = pair.indexOf("=");
    if (eq <= 0) return;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1);
    if (name === config.SESSION_COOKIE_NAME && value) {
      wx.setStorageSync(config.SESSION_STORAGE_KEY, value);
    }
  });
}

function uploadLifeAgentCover(filePath) {
  return new Promise(function (resolve, reject) {
    const header = {
      "X-BrightAgent-Client": config.CLIENT_HEADER,
    };
    const cookie = getCookieHeader();
    if (cookie) header.Cookie = cookie;

    wx.uploadFile({
      url: config.API_BASE + "/api/upload/life-agent-cover",
      filePath: filePath,
      name: "file",
      header: header,
      success: function (res) {
        parseSetCookie(res.header);
        let data = {};
        try {
          data = JSON.parse(res.data || "{}");
        } catch (e) {
          reject(new Error("上传结果解析失败"));
          return;
        }
        if (res.statusCode < 200 || res.statusCode >= 300) {
          const msg =
            data.error === "FILE_TOO_LARGE"
              ? "图片大小不能超过 2MB"
              : data.error === "UNSUPPORTED_TYPE"
                ? "请选择 JPG/PNG/WebP 图片"
                : "图片上传失败";
          reject(new Error(msg));
          return;
        }
        if (!data.url) {
          reject(new Error("图片上传失败"));
          return;
        }
        resolve(data.url);
      },
      fail: function () {
        reject(new Error("图片上传失败，请检查网络"));
      },
    });
  });
}

module.exports = {
  MAX_BYTES,
  uploadLifeAgentCover,
};
