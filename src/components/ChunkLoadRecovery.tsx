"use client";

import { useEffect } from "react";

const RETRY_KEY = "chunk-load-recovery:reloaded";

function isChunkLikeMessage(message: string): boolean {
  const text = message.toLowerCase();
  return (
    text.includes("chunkloaderror") ||
    text.includes("loading chunk") ||
    text.includes("failed to fetch dynamically imported module") ||
    text.includes("/_next/static/chunks/") ||
    text.includes("err_network_changed")
  );
}

function reloadOnce() {
  if (typeof window === "undefined") return;
  try {
    if (window.sessionStorage.getItem(RETRY_KEY) === "1") return;
    window.sessionStorage.setItem(RETRY_KEY, "1");
  } catch {
    // ignore
  }
  window.location.reload();
}

export function ChunkLoadRecovery() {
  useEffect(() => {
    try {
      window.sessionStorage.removeItem(RETRY_KEY);
    } catch {
      // ignore
    }

    const onError = (event: ErrorEvent) => {
      const message = String(event.message ?? "");
      const target = event.target;
      let resourceUrl = "";
      if (target instanceof HTMLScriptElement) {
        resourceUrl = target.src;
      } else if (target instanceof HTMLLinkElement) {
        resourceUrl = target.href;
      }

      if (isChunkLikeMessage(message) || resourceUrl.includes("/_next/static/chunks/")) {
        reloadOnce();
      }
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        typeof reason === "string"
          ? reason
          : reason instanceof Error
            ? `${reason.name}: ${reason.message}`
            : JSON.stringify(reason ?? "");

      if (isChunkLikeMessage(message)) {
        reloadOnce();
      }
    };

    window.addEventListener("error", onError, true);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError, true);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
