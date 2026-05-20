const config = require("../config");

function parseSetCookie(headers) {
  if (!headers) return;
  const raw = headers["Set-Cookie"] || headers["set-cookie"];
  if (!raw) return;
  const list = Array.isArray(raw) ? raw : [raw];
  for (const item of list) {
    const pair = item.split(";")[0];
    const eq = pair.indexOf("=");
    if (eq <= 0) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1);
    if (name === config.SESSION_COOKIE_NAME && value) {
      wx.setStorageSync(config.SESSION_STORAGE_KEY, value);
    }
  }
}

function getCookieHeader() {
  const value = wx.getStorageSync(config.SESSION_STORAGE_KEY);
  if (!value) return "";
  return `${config.SESSION_COOKIE_NAME}=${value}`;
}

function absUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${config.API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

function request(options) {
  const url = options.url.startsWith("http")
    ? options.url
    : `${config.API_BASE}${options.url}`;
  const headers = Object.assign(
    {
      "Content-Type": "application/json",
      "X-BrightAgent-Client": config.CLIENT_HEADER,
    },
    options.header || {}
  );
  const cookie = getCookieHeader();
  if (cookie) headers.Cookie = cookie;

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: options.method || "GET",
      data: options.data,
      header: headers,
      success(res) {
        parseSetCookie(res.header);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res);
        } else {
          reject({ statusCode: res.statusCode, data: res.data || {} });
        }
      },
      fail(err) {
        reject({ statusCode: 0, data: {}, err });
      },
    });
  });
}

function get(url, header) {
  return request({ url, method: "GET", header });
}

function post(url, data, header) {
  return request({ url, method: "POST", data, header });
}

function clearSession() {
  wx.removeStorageSync(config.SESSION_STORAGE_KEY);
  const app = getApp();
  if (app) app.globalData.user = null;
}

module.exports = {
  request,
  get,
  post,
  absUrl,
  clearSession,
  getCookieHeader,
};
