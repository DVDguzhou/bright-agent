const config = require("../config");
const { getCookieHeader } = require("./request");

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

function uploadAgentChatFile(agentId, endpoint, filePath, formData) {
  return new Promise(function (resolve, reject) {
    const header = {
      "X-BrightAgent-Client": config.CLIENT_HEADER,
    };
    const cookie = getCookieHeader();
    if (cookie) header.Cookie = cookie;

    wx.uploadFile({
      url: config.API_BASE + "/api/life-agents/" + agentId + endpoint,
      filePath: filePath,
      name: "file",
      formData: formData || {},
      header: header,
      success: function (res) {
        parseSetCookie(res.header);
        resolve(res);
      },
      fail: function (err) {
        reject(err || new Error("上传失败"));
      },
    });
  });
}

function parseJsonResponse(res) {
  let data = {};
  try {
    data = JSON.parse(res.data || "{}");
  } catch (e) {
    data = {};
  }
  if (res.statusCode < 200 || res.statusCode >= 300) {
    const msg =
      data.detail ||
      data.error ||
      (typeof data === "string" ? data : "") ||
      "请求失败";
    throw { statusCode: res.statusCode, data: data, message: msg };
  }
  return data;
}

function parseSSE(text) {
  const events = [];
  const parts = String(text || "").split("\n\n");
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part.trim()) continue;
    let eventType = "";
    let eventData = "";
    const lines = part.split("\n");
    for (let j = 0; j < lines.length; j++) {
      const line = lines[j];
      if (line.indexOf("event: ") === 0) eventType = line.slice(7).trim();
      else if (line.indexOf("data: ") === 0) eventData = line.slice(6);
    }
    if (!eventData) continue;
    try {
      events.push({ type: eventType, data: JSON.parse(eventData) });
    } catch (e) {
      /* ignore malformed chunk */
    }
  }
  return events;
}

function parseChatFile(agentId, filePath) {
  return uploadAgentChatFile(agentId, "/parse-chat", filePath).then(function (res) {
    return parseJsonResponse(res);
  });
}

function importChatFile(agentId, filePath, targetName, onProgress) {
  return uploadAgentChatFile(agentId, "/import-chat", filePath, {
    targetName: targetName || "",
  }).then(function (res) {
    const ct =
      (res.header && (res.header["Content-Type"] || res.header["content-type"])) || "";
    const body = String(res.data || "");
    if (ct.indexOf("text/event-stream") >= 0 || body.indexOf("event:") >= 0) {
      const events = parseSSE(body);
      let donePayload = null;
      for (let i = 0; i < events.length; i++) {
        const ev = events[i];
        if (ev.type === "progress" && onProgress) {
          onProgress(
            "已解析 " +
              (ev.data.totalMessages || 0) +
              " 条消息（" +
              (ev.data.targetMessages || 0) +
              " 条来自目标），正在 AI 分析风格..."
          );
        } else if (ev.type === "error") {
          throw { message: ev.data.detail || ev.data.error || "分析出错" };
        } else if (ev.type === "done") {
          donePayload = ev.data;
        }
      }
      return donePayload || {};
    }
    if (res.statusCode < 200 || res.statusCode >= 300) {
      return parseJsonResponse(res);
    }
    let data = {};
    try {
      data = JSON.parse(body || "{}");
    } catch (e) {
      data = {};
    }
    return data;
  });
}

module.exports = {
  parseChatFile,
  importChatFile,
};
