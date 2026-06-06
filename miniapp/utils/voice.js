const config = require("../config");
const { getCookieHeader } = require("./request");

const MIN_AUDIO_BYTES = 800;

let recorder = null;
let handlers = {};
let recordReady = false;

const RECORDER_OPTIONS = {
  duration: 60000,
  sampleRate: 16000,
  numberOfChannels: 1,
  encodeBitRate: 48000,
  format: "mp3",
};

function getRecorder() {
  if (!recorder) {
    recorder = wx.getRecorderManager();
    recorder.onStart(function () {
      if (handlers.onStart) handlers.onStart();
    });
    recorder.onStop(function (res) {
      if (handlers.onStop) handlers.onStop(res);
    });
    recorder.onError(function (err) {
      if (handlers.onError) handlers.onError(err);
    });
  }
  return recorder;
}

function bindRecorderEvents(nextHandlers) {
  handlers = nextHandlers || {};
  getRecorder();
}

function refreshRecordPermission() {
  wx.getSetting({
    success: function (res) {
      recordReady = !!(
        res.authSetting && res.authSetting["scope.record"]
      );
    },
  });
}

function isRecordReady() {
  return recordReady;
}

function requestRecordPermission() {
  return new Promise(function (resolve, reject) {
    wx.getSetting({
      success: function (res) {
        if (res.authSetting && res.authSetting["scope.record"]) {
          recordReady = true;
          resolve(true);
          return;
        }
        wx.authorize({
          scope: "scope.record",
          success: function () {
            recordReady = true;
            resolve(true);
          },
          fail: function () {
            wx.showModal({
              title: "需要麦克风权限",
              content: "请允许使用麦克风，以便语音输入",
              confirmText: "去设置",
              success: function (modal) {
                if (modal.confirm) {
                  wx.openSetting({
                    success: function (setting) {
                      recordReady = !!(
                        setting.authSetting &&
                        setting.authSetting["scope.record"]
                      );
                    },
                  });
                }
              },
            });
            reject(new Error("no permission"));
          },
        });
      },
      fail: reject,
    });
  });
}

/** 必须在 touchstart / longpress 回调里同步调用 */
function beginRecordingSync() {
  if (!recordReady) {
    return false;
  }
  try {
    getRecorder().start(RECORDER_OPTIONS);
    return true;
  } catch (e) {
    return false;
  }
}

function stopRecording() {
  try {
    getRecorder().stop();
  } catch (e) {
    /* ignore */
  }
}

function mapTranscribeError(statusCode, data) {
  const err = (data && data.error) || "";
  if (statusCode === 401) {
    return { message: "请先登录后再使用语音", code: 401 };
  }
  if (err === "recording too short") {
    return { message: "说话时间太短，请长按至少一秒" };
  }
  if (err === "speech-to-text not configured") {
    return { message: "语音转写未配置，请联系管理员" };
  }
  if (err === "transcription failed") {
    return { message: "语音识别服务异常，请稍后重试" };
  }
  return { message: "语音识别失败，请重试" };
}

function transcribe(tempFilePath, fileSize) {
  return new Promise(function (resolve, reject) {
    if (fileSize != null && fileSize < MIN_AUDIO_BYTES) {
      reject({ message: "说话时间太短，请长按至少一秒" });
      return;
    }

    const header = {
      "X-BrightAgent-Client": config.CLIENT_HEADER,
    };
    const cookie = getCookieHeader();
    if (cookie) header.Cookie = cookie;

    wx.uploadFile({
      url: config.API_BASE + "/api/transcribe",
      filePath: tempFilePath,
      name: "audio",
      formData: { language: "zh" },
      header: header,
      success: function (res) {
        let data = {};
        try {
          data = JSON.parse(res.data || "{}");
        } catch (e) {
          reject({ message: "识别结果解析失败" });
          return;
        }
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(mapTranscribeError(res.statusCode, data));
          return;
        }
        const text = (data.text || "").trim();
        if (!text) {
          reject({ message: "没有识别到内容，请再说一次" });
          return;
        }
        resolve(text);
      },
      fail: function () {
        reject({ message: "语音识别失败，请检查网络" });
      },
    });
  });
}

module.exports = {
  bindRecorderEvents,
  refreshRecordPermission,
  requestRecordPermission,
  isRecordReady,
  beginRecordingSync,
  stopRecording,
  transcribe,
};
