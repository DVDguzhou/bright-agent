const CO_EDIT_PENDING_VOICE_STORAGE_PREFIX =
  "life-agent-co-edit-pending-voice:";

function pendingVoicePromptKey(agentId) {
  return `${CO_EDIT_PENDING_VOICE_STORAGE_PREFIX}${agentId}`;
}

function mergeVoiceDraft(existing, nextSegment) {
  const prev = (existing || "").trim();
  const next = (nextSegment || "").trim();
  if (!prev) return next;
  if (!next) return prev;
  return `${prev}\n${next}`;
}

function loadVoiceDraft(agentId) {
  if (!agentId) return "";
  try {
    return (wx.getStorageSync(pendingVoicePromptKey(agentId)) || "").trim();
  } catch (e) {
    return "";
  }
}

function saveVoiceDraft(agentId, text) {
  if (!agentId) return;
  const key = pendingVoicePromptKey(agentId);
  const trimmed = (text || "").trim();
  try {
    if (trimmed) {
      wx.setStorageSync(key, trimmed);
    } else {
      wx.removeStorageSync(key);
    }
  } catch (e) {
    /* ignore */
  }
}

module.exports = {
  pendingVoicePromptKey,
  mergeVoiceDraft,
  loadVoiceDraft,
  saveVoiceDraft,
};
