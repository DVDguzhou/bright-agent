/** Prefer mp4/aac first — DashScope ASR supports wav/mp3/mp4, not webm. */
export function pickRecorderMimeType(): string {
  const candidates = [
    "audio/mp4",
    "audio/aac",
    "audio/webm;codecs=opus",
    "audio/webm",
  ];
  if (typeof MediaRecorder === "undefined") {
    return "audio/webm";
  }
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return "audio/webm";
}

export function voiceFilenameForBlob(blob: Blob): string {
  const type = blob.type.toLowerCase();
  if (type.includes("mp4") || type.includes("m4a")) return "voice.m4a";
  if (type.includes("aac")) return "voice.aac";
  if (type.includes("mpeg") || type.includes("mp3")) return "voice.mp3";
  if (type.includes("wav")) return "voice.wav";
  if (type.includes("ogg")) return "voice.ogg";
  return "voice.webm";
}

/** ~0.5s of compressed speech; below this ASR usually returns nothing useful. */
export const MIN_VOICE_BLOB_BYTES = 800;
