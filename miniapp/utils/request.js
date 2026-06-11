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
  const s = String(path).trim();
  if (
    s.startsWith("data:") ||
    s.startsWith("http://") ||
    s.startsWith("https://")
  ) {
    return s;
  }
  const base = (config.CDN_BASE || config.API_BASE).replace(/\/+$/, "");
  return `${base}${s.startsWith("/") ? s : `/${s}`}`;
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
          reject({
            statusCode: res.statusCode,
            data: res.data || {},
            url,
            message:
              (res.data && (res.data.error || res.data.message)) ||
              `HTTP ${res.statusCode}`,
          });
        }
      },
      fail(err) {
        reject({
          statusCode: 0,
          data: {},
          err,
          url,
          message: (err && err.errMsg) || "NETWORK_ERROR",
        });
      },
    });
  });
}

function formatRequestError(err) {
  if (!err) return "网络请求失败";
  const msg = String(err.message || (err.err && err.err.errMsg) || "");
  if (msg.indexOf("url not in domain list") >= 0 || msg.indexOf("合法域名") >= 0) {
    return "请求域名未配置，请在微信公众平台加入 www.brightagent.cn";
  }
  if (err.statusCode) return `接口返回 ${err.statusCode}`;
  return msg || "网络连接失败";
}

function get(url, header) {
  return request({ url, method: "GET", header });
}

function post(url, data, header) {
  return request({ url, method: "POST", data, header });
}

function put(url, data, header) {
  return request({ url, method: "PUT", data, header });
}

function patch(url, data, header) {
  return request({ url, method: "PATCH", data, header });
}

function del(url, data, header) {
  return request({ url, method: "DELETE", data, header });
}

function notifyAuthCleared() {
  try {
    const pages = getCurrentPages();
    const cur = pages[pages.length - 1];
    if (!cur) return;
    const route = cur.route || "";
    if (route.indexOf("pages/mine/mine") >= 0 && typeof cur.refresh === "function") {
      cur.refresh();
      return;
    }
    if (route.indexOf("pages/account/account") >= 0) {
      return;
    }
    if (typeof cur.onShow === "function") {
      cur.onShow();
    }
  } catch (e) {
    /* ignore */
  }
}

function clearSession() {
  wx.removeStorageSync(config.SESSION_STORAGE_KEY);
  const app = getApp();
  if (app) {
    app.globalData.user = null;
    if (typeof app.syncTabBar === "function") {
      app.syncTabBar();
    }
  }
  notifyAuthCleared();
}

module.exports = {
  request,
  get,
  post,
  put,
  patch,
  del,
  absUrl,
  clearSession,
  getCookieHeader,
  formatRequestError,
};
