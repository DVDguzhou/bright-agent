"use client";

import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.heat";
import { MapContainer, ScaleControl, TileLayer, Marker, useMap } from "react-leaflet";
import { getLifeAgentLatLng, type MapCoordAgentInput } from "@/lib/life-agent-map-coords";

export type MapAgentMarker = MapCoordAgentInput & {
  displayName: string;
  headline?: string;
  school?: string;
};

const ACCENT = "#0091ff";

const AVATAR_COLORS = [
  "#0091ff", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6", "#06b6d4",
];

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function createAvatarPinIcon(displayName: string, highlight = false) {
  const ch = displayName.charAt(0);
  const bg = avatarColor(displayName);
  const sz = highlight ? 40 : 32;
  const font = highlight ? 16 : 14;
  const border = highlight ? `3px solid #fff` : `2.5px solid #fff`;
  const shadow = highlight
    ? `0 0 0 3px ${ACCENT}66, 0 2px 10px rgba(0,0,0,.3)`
    : `0 1px 6px rgba(0,0,0,.25)`;
  return L.divIcon({
    className: "life-agent-map-pin",
    html: `<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${bg};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${font}px;border:${border};box-shadow:${shadow};letter-spacing:-0.5px;user-select:none">${escHtml(ch)}</div>`,
    iconSize: [sz, sz],
    iconAnchor: [sz / 2, sz / 2],
  });
}

function createUserLocationIcon() {
  return L.divIcon({
    className: "life-agent-map-user-loc",
    html:
      '<div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center"><span style="position:absolute;width:36px;height:36px;border-radius:50%;background:rgba(0,145,255,.22)"></span><span style="position:relative;width:16px;height:16px;border-radius:50%;background:#0091ff;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35)"></span></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

/* ── Avatar-stack cluster icon ── */

function collectFirstNames(cluster: L.MarkerCluster, n: number): string[] {
  const names: string[] = [];
  function walk(c: unknown) {
    if (names.length >= n) return;
    const node = c as { _markers?: L.Marker[]; _childClusters?: unknown[] };
    for (const m of node._markers ?? []) {
      if (names.length >= n) return;
      names.push((m as unknown as { _agentDisplayName?: string })._agentDisplayName ?? "?");
    }
    for (const sub of node._childClusters ?? []) {
      if (names.length >= n) return;
      walk(sub);
    }
  }
  walk(cluster);
  return names;
}

function avatarStackClusterIcon(cluster: L.MarkerCluster) {
  const count = cluster.getChildCount();
  const names = collectFirstNames(cluster, 4);
  const showCount = Math.min(names.length, count <= 4 ? count : 3);

  const sz = 30;
  const overlap = 12;
  const totalW = sz + (showCount - 1) * (sz - overlap);

  let avatars = "";
  for (let i = 0; i < showCount; i++) {
    const ch = escHtml(names[i].charAt(0));
    const bg = avatarColor(names[i]);
    const left = i * (sz - overlap);
    const zi = showCount - i + 1;
    avatars += `<div style="position:absolute;left:${left}px;top:0;z-index:${zi};width:${sz}px;height:${sz}px;border-radius:50%;background:${bg};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;border:2.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.18);user-select:none">${ch}</div>`;
  }

  const label =
    count >= 10000
      ? `${Math.round(count / 1000)}k`
      : count >= 1000
        ? `${(count / 1000).toFixed(1)}k`
        : String(count);

  const badge = `<div style="position:absolute;right:-6px;top:-8px;z-index:20;min-width:20px;height:20px;border-radius:10px;background:${ACCENT};color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0 5px;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.15);line-height:1">${label}</div>`;

  const iconW = totalW + 14;
  const iconH = sz + 16;

  return L.divIcon({
    html: `<div style="position:relative;width:${totalW}px;height:${sz}px">${avatars}${badge}</div>`,
    className: "life-agent-map-cluster",
    iconSize: L.point(iconW, iconH),
    iconAnchor: L.point(iconW / 2, iconH / 2),
  });
}

function buildPopupHtml(agent: MapAgentMarker): string {
  const ch = escHtml(agent.displayName.charAt(0));
  const bg = avatarColor(agent.displayName);
  const name = escHtml(agent.displayName);
  const school = agent.school ? escHtml(agent.school) : "";
  const headline = agent.headline ? escHtml(agent.headline).slice(0, 60) : "";
  return `<div style="min-width:180px;max-width:240px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
    <div style="width:36px;height:36px;border-radius:50%;background:${bg};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;flex-shrink:0">${ch}</div>
    <div style="min-width:0">
      <div style="font-weight:700;font-size:14px;color:#1e293b;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</div>
      ${school ? `<div style="font-size:12px;color:#64748b;line-height:1.3;margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${school}</div>` : ""}
    </div>
  </div>
  ${headline ? `<div style="font-size:12px;color:#475569;line-height:1.5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:8px">${headline}</div>` : ""}
  <a href="/life-agents/${agent.id}" style="display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:${ACCENT};text-decoration:none">
    查看主页
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
  </a>
</div>`;
}

/* ── Map helper sub-components ── */

function MapInstanceExposer({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
    return () => {
      mapRef.current = null;
    };
  }, [map, mapRef]);
  return null;
}

function MapLayoutFit({
  points,
  userLatLng,
  layoutNonce,
}: {
  points: L.LatLngTuple[];
  userLatLng: { lat: number; lng: number } | null;
  layoutNonce: number;
}) {
  const map = useMap();
  const prevNonce = useRef(0);
  useEffect(() => {
    if (layoutNonce <= 0 || layoutNonce === prevNonce.current) return;
    prevNonce.current = layoutNonce;
    const extra: L.LatLngTuple[] = userLatLng ? [[userLatLng.lat, userLatLng.lng]] : [];
    const all = [...points, ...extra];
    if (all.length === 0) {
      map.setView([35, 105], 4);
      return;
    }
    if (all.length === 1) {
      map.setView(all[0], 12);
      return;
    }
    map.fitBounds(L.latLngBounds(all), { padding: [56, 56], maxZoom: all.length > 2 ? 11 : 14 });
  }, [map, points, userLatLng, layoutNonce]);
  return null;
}

/* ── Heatmap layer (visible at low zoom, fades as you zoom in) ── */

function HeatmapLayer({ points }: { points: L.LatLngTuple[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;

    const heat = L.heatLayer(
      points.map(([lat, lng]) => [lat, lng, 0.5] as [number, number, number]),
      {
        radius: 25,
        blur: 20,
        maxZoom: 11,
        max: 1.0,
        minOpacity: 0.08,
        gradient: {
          0.2: "#bfdbfe",
          0.4: "#60a5fa",
          0.55: "#818cf8",
          0.7: "#a78bfa",
          0.85: "#e879f9",
          1.0: "#f472b6",
        },
      },
    );
    heat.addTo(map);

    if (heat._canvas) {
      heat._canvas.style.transition = "opacity 0.4s ease";
      heat._canvas.style.pointerEvents = "none";
    }

    function syncOpacity() {
      const c = heat._canvas;
      if (!c) return;
      const z = map.getZoom();
      let o: number;
      if (z <= 5) o = 0.8;
      else if (z <= 7) o = 0.6;
      else if (z <= 9) o = 0.35;
      else if (z <= 10) o = 0.15;
      else o = 0;
      c.style.opacity = String(o);
    }

    map.on("zoomend", syncOpacity);
    syncOpacity();

    return () => {
      map.off("zoomend", syncOpacity);
      map.removeLayer(heat);
    };
  }, [map, points]);

  return null;
}

/* ── Clustered markers with avatar-stack icons ── */

function ClusteredMarkers({
  markers,
  highlightAgentId,
}: {
  markers: { agent: MapAgentMarker; position: L.LatLngTuple }[];
  highlightAgentId: string | null;
}) {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    const group = L.markerClusterGroup({
      maxClusterRadius: 45,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: avatarStackClusterIcon,
      animate: true,
      chunkedLoading: true,
      chunkInterval: 100,
      chunkDelay: 10,
    });

    const leafletMarkers = markers.map(({ agent, position }) => {
      const isHi = Boolean(highlightAgentId && agent.id === highlightAgentId);
      const m = L.marker(position, {
        icon: createAvatarPinIcon(agent.displayName, isHi),
        zIndexOffset: isHi ? 800 : 0,
      });
      (m as unknown as { _agentDisplayName: string })._agentDisplayName = agent.displayName;
      m.bindPopup(buildPopupHtml(agent), {
        closeButton: false,
        className: "life-agent-map-popup",
        maxWidth: 260,
        minWidth: 180,
        offset: [0, -8],
      });
      return m;
    });

    group.addLayers(leafletMarkers);
    map.addLayer(group);
    clusterRef.current = group;

    return () => {
      map.removeLayer(group);
      clusterRef.current = null;
    };
  }, [map, markers, highlightAgentId]);

  return null;
}

/* ── Main component ── */

type Props = {
  agents: MapAgentMarker[];
  className?: string;
  highlightAgentId?: string | null;
  userLatLng?: { lat: number; lng: number } | null;
  onLocatePress?: () => void;
  showLocateButton?: boolean;
  mapHeightClass?: string;
  rounded?: boolean;
  mapLayoutNonce?: number;
};

export default function LifeAgentsMapView({
  agents,
  className = "",
  highlightAgentId = null,
  userLatLng = null,
  onLocatePress,
  showLocateButton = true,
  mapHeightClass = "h-[min(62dvh,520px)]",
  rounded = true,
  mapLayoutNonce = 0,
}: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const userIcon = useMemo(() => createUserLocationIcon(), []);

  const markers = useMemo(() => {
    return agents.map((a) => ({
      agent: a,
      position: getLifeAgentLatLng(a) as L.LatLngTuple,
    }));
  }, [agents]);

  const points = useMemo(() => markers.map((m) => m.position), [markers]);

  const ring = rounded ? "rounded-2xl ring-1 ring-slate-200/80" : "";
  const roundMap = rounded ? "rounded-2xl" : "";

  return (
    <div
      className={`relative overflow-hidden ${ring} [&_.life-agent-map-pin]:!border-0 [&_.life-agent-map-pin]:!bg-transparent [&_.life-agent-map-cluster]:!border-0 [&_.life-agent-map-cluster]:!bg-transparent [&_.life-agent-map-user-loc]:!border-0 [&_.life-agent-map-user-loc]:!bg-transparent [&_.life-agent-map-popup_.leaflet-popup-content-wrapper]:!rounded-xl [&_.life-agent-map-popup_.leaflet-popup-content-wrapper]:!shadow-lg [&_.life-agent-map-popup_.leaflet-popup-content-wrapper]:!ring-1 [&_.life-agent-map-popup_.leaflet-popup-content-wrapper]:!ring-black/5 [&_.life-agent-map-popup_.leaflet-popup-tip]:!shadow-lg ${className}`}
      style={rounded ? { minHeight: "min(62dvh, 520px)" } : { minHeight: "100%" }}
    >
      <MapContainer
        center={[35, 105]}
        zoom={4}
        minZoom={3}
        zoomControl={false}
        className={`z-0 w-full ${mapHeightClass} ${roundMap}`}
        style={{ background: "#abcdef" }}
        scrollWheelZoom
        attributionControl={false}
      >
        <MapInstanceExposer mapRef={mapRef} />
        <TileLayer
          url="https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}"
          subdomains={["1", "2", "3", "4"]}
        />
        <ScaleControl position="bottomleft" imperial={false} />
        <MapLayoutFit points={points} userLatLng={userLatLng ?? null} layoutNonce={mapLayoutNonce} />
        <HeatmapLayer points={points} />
        <ClusteredMarkers
          markers={markers}
          highlightAgentId={highlightAgentId}
        />
        {userLatLng ? (
          <Marker
            position={[userLatLng.lat, userLatLng.lng]}
            icon={userIcon}
            zIndexOffset={1200}
            interactive={false}
          />
        ) : null}
      </MapContainer>

      <div className="pointer-events-none absolute inset-0 z-[400]">
        <div className="pointer-events-auto absolute right-3 top-1/2 flex -translate-y-1/2 flex-col gap-2">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-700 shadow-md ring-1 ring-black/5 transition active:scale-95 active:bg-slate-50"
            aria-label="放大"
            onClick={() => mapRef.current?.zoomIn()}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-700 shadow-md ring-1 ring-black/5 transition active:scale-95 active:bg-slate-50"
            aria-label="缩小"
            onClick={() => mapRef.current?.zoomOut()}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
            </svg>
          </button>
          {showLocateButton ? (
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#0091ff] shadow-md ring-1 ring-black/5 transition active:scale-95 active:bg-slate-50"
              aria-label="位置与绑定 Agent"
              title="位置与绑定 Agent"
              onClick={() => onLocatePress?.()}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5V3M12 21v-2M5 12H3M21 12h-2" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
