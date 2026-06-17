type Listener = () => void;

export type MobileGestureState = {
  /** Main surface horizontal shift (px), e.g. drawer peek or swipe-back preview */
  translateX: number;
  transitioning: boolean;
  drawerOpen: boolean;
};

let state: MobileGestureState = {
  translateX: 0,
  transitioning: false,
  drawerOpen: false,
};

const listeners = new Set<Listener>();

export function getDrawerWidth() {
  if (typeof window === "undefined") return 304;
  return Math.min(window.innerWidth, 304);
}

export function getMobileGestureState(): MobileGestureState {
  return state;
}

export function setMobileGestureState(patch: Partial<MobileGestureState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function subscribeMobileGesture(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function openMobileDrawer(animated = true) {
  const w = getDrawerWidth();
  setMobileGestureState({
    drawerOpen: true,
    translateX: w,
    transitioning: animated,
  });
  if (animated) {
    window.setTimeout(() => setMobileGestureState({ transitioning: false }), 280);
  }
}

export function closeMobileDrawer(animated = true) {
  setMobileGestureState({
    drawerOpen: false,
    translateX: 0,
    transitioning: animated,
  });
  if (animated) {
    window.setTimeout(() => setMobileGestureState({ transitioning: false }), 280);
  }
}
