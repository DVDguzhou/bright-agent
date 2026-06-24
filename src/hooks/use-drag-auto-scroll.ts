"use client";

import { useEffect } from "react";

const EDGE_PX = 72;
const MAX_SPEED_PX = 20;

function scrollForPointerY(clientY: number) {
  const viewportHeight = window.innerHeight;
  let delta = 0;

  if (clientY < EDGE_PX) {
    const intensity = (EDGE_PX - clientY) / EDGE_PX;
    delta = -MAX_SPEED_PX * intensity * intensity;
  } else if (clientY > viewportHeight - EDGE_PX) {
    const intensity = (clientY - (viewportHeight - EDGE_PX)) / EDGE_PX;
    delta = MAX_SPEED_PX * intensity * intensity;
  }

  if (delta !== 0) {
    window.scrollBy({ top: delta, left: 0 });
  }
}

/** Scroll the page while an HTML5 drag is active and the pointer nears the viewport edge. */
export function useDragAutoScroll(active: boolean) {
  useEffect(() => {
    if (!active) return;

    let pointerY = 0;
    let frame = 0;

    const tick = () => {
      scrollForPointerY(pointerY);
      frame = requestAnimationFrame(tick);
    };

    const onDragOver = (event: DragEvent) => {
      pointerY = event.clientY;
    };

    frame = requestAnimationFrame(tick);
    document.addEventListener("dragover", onDragOver, true);

    return () => {
      document.removeEventListener("dragover", onDragOver, true);
      cancelAnimationFrame(frame);
    };
  }, [active]);
}
