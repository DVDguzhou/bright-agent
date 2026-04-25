"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { MapContainer, ScaleControl, TileLayer, Marker, useMap } from "react-leaflet";
import { getLifeAgentLatLng, type MapCoordAgentInput } from "@/lib/life-agent-map-coords";
import { resolveLifeAgentCoverUrl } from "@/lib/life-agent-covers";
import { agentCategoryColor, LEGEND_ITEMS } from "@/lib/life-agent-category";

export type MapAgentMarker = MapCoordAgentInput & {
  displayName: string;
  headline?: string;
  school?: string;
  coverImageUrl?: string | null;
  coverPresetKey?: string | null;
};

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  const palette = ["#0091ff","#6366f1","#8b5cf6","#ec4899","#f43f5e","#f97316","#eab308","#22c55e","#14b8a6","#06b6d4"];
  return palette[Math.abs(h) % palette.length];
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* Teardrop-pin: pure HTML/CSS with <img> for cover.
 * Design: colored circle body → white ring → cover image → colored triangular tip. */

function createAvatarPinIcon(agent: MapAgentMarker, highlight = false) {
  const bg = agentCategoryColor(agent.headline, agent.displayName);
  const coverSrc = resolveLifeAgentCoverUrl(agent.coverImageUrl, agent.coverPresetKey);
  // Sizes: circle diameter / total width, tip height, image diameter
  const dia = highlight ? 48 : 40;
  const tip = highlight ? 14 : 12;
  const imgD = highlight ? 36 : 30;
  const w = dia;
  const h = dia + tip;
  const border = highlight ? 3 : 2.5;
  const shadow = highlight
    ? "filter:drop-shadow(0 4px 10px rgba(0,0,0,.45))"
    : "filter:drop-shadow(0 2px 6px rgba(0,0,0,.35))";
  const ringExtra = highlight ? `box-shadow:0 0 0 4px ${bg}33;` : "";
  return L.divIcon({
    className: "life-agent-map-pin",
    html: `<div style="width:${w}px;height:${h}px;${shadow};position:relative">`
      + `<div style="width:${dia}px;height:${dia}px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;position:relative;${ringExtra}">`
      + `<div style="width:${imgD}px;height:${imgD}px;border-radius:50%;border:${border}px solid rgba(255,255,255,.92);overflow:hidden;flex-shrink:0">`
      + `<img src="${escHtml(coverSrc)}" style="width:100%;height:100%;object-fit:cover;display:block" alt=""/>`
      + `</div></div>`
      + `<div style="width:0;height:0;border-left:${tip * 0.55}px solid transparent;border-right:${tip * 0.55}px solid transparent;border-top:${tip}px solid ${bg};position:absolute;bottom:0;left:50%;transform:translateX(-50%)"></div>`
      + `</div>`,
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
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

/* ── Cluster pin (same shape, purple body, white badge with count) ── */

function avatarStackClusterIcon(cluster: L.MarkerCluster) {
  const count = cluster.getChildCount();
  const label = escHtml(count > 99 ? "99+" : String(count));
  const dia = 36;
  const tip = 10;
  const w = dia;
  const h = dia + tip;
  const fs = count > 99 ? 11 : count > 9 ? 13 : 14;
  return L.divIcon({
    className: "life-agent-map-cluster",
    html: `<div style="width:${w}px;height:${h}px;filter:drop-shadow(0 3px 8px rgba(124,58,237,.5));position:relative">`
      + `<div style="width:${dia}px;height:${dia}px;border-radius:50%;background:#7c3aed;display:flex;align-items:center;justify-content:center">`
      + `<div style="width:${dia - 8}px;height:${dia - 8}px;border-radius:50%;background:rgba(255,255,255,.94);display:flex;align-items:center;justify-content:center">`
      + `<span style="color:#7c3aed;font-size:${fs}px;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1">${label}</span>`
      + `</div></div>`
      + `<div style="width:0;height:0;border-left:${tip * 0.55}px solid transparent;border-right:${tip * 0.55}px solid transparent;border-top:${tip}px solid #7c3aed;position:absolute;bottom:0;left:50%;transform:translateX(-50%)"></div>`
      + `</div>`,
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
  });
}

function buildPopupHtml(agent: MapAgentMarker): string {
  const ch = escHtml(agent.displayName.charAt(0));
  const bg = avatarColor(agent.displayName);
  const name = escHtml(agent.displayName);
  const school = agent.school ? escHtml(agent.school) : "";
  const headline = agent.headline ? escHtml(agent.headline).slice(0, 60) : "";
  return `<div style="min-width:210px;max-width:260px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:2px">
  <div style="display:flex;align-items:center;gap:11px;margin-bottom:10px">
    <div style="width:42px;height:42px;border-radius:16px;background:linear-gradient(145deg,rgba(255,255,255,.32),rgba(255,255,255,0) 34%),${bg};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;flex-shrink:0;box-shadow:0 10px 20px rgba(15,23,42,.14)">${ch}</div>
    <div style="min-width:0">
      <div style="font-weight:800;font-size:15px;color:#111827;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</div>
      ${school ? `<div style="font-size:12px;color:#64748b;line-height:1.3;margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${school}</div>` : ""}
    </div>
  </div>
  ${headline ? `<div style="font-size:12px;color:#475569;line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:11px">${headline}</div>` : ""}
  <a href="/life-agents/${agent.id}" style="display:inline-flex;align-items:center;justify-content:center;gap:5px;width:100%;border-radius:999px;background:linear-gradient(135deg,#7c3aed,#ec4899);padding:9px 12px;font-size:12px;font-weight:800;color:#fff;text-decoration:none;box-shadow:0 10px 20px rgba(124,58,237,.22)">
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
    if (userLatLng) {
      map.setView([userLatLng.lat, userLatLng.lng], Math.max(map.getZoom(), 10));
    }
  }, [map, points, userLatLng, layoutNonce]);
  return null;
}

/* ── Clustered markers (hidden at low zoom, visible when zoomed in) ── */

const MARKER_SHOW_ZOOM = 8;

function ClusteredMarkers({
  markers,
  highlightAgentId,
}: {
  markers: { agent: MapAgentMarker; position: L.LatLngTuple }[];
  highlightAgentId: string | null;
}) {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const visibleRef = useRef(false);

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
        icon: createAvatarPinIcon(agent, isHi),
        zIndexOffset: isHi ? 800 : 0,
      });
      m.bindPopup(buildPopupHtml(agent), {
        closeButton: false,
        className: "life-agent-map-popup",
        maxWidth: 260,
        minWidth: 180,
        offset: [0, -46],
      });
      return m;
    });

    group.addLayers(leafletMarkers);
    clusterRef.current = group;
    visibleRef.current = false;

    function syncVisibility() {
      const shouldShow = map.getZoom() >= MARKER_SHOW_ZOOM;
      if (shouldShow && !visibleRef.current) {
        map.addLayer(group);
        visibleRef.current = true;
      } else if (!shouldShow && visibleRef.current) {
        map.removeLayer(group);
        visibleRef.current = false;
      }
    }

    map.on("zoomend", syncVisibility);
    syncVisibility();

    return () => {
      map.off("zoomend", syncVisibility);
      if (visibleRef.current) map.removeLayer(group);
      clusterRef.current = null;
    };
  }, [map, markers, highlightAgentId]);

  return null;
}

/* ── Legend panel ── */

function MapLegend() {
  const [open, setOpen] = useState(false);
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-[400]">
      {open ? (
        <div className="pointer-events-auto max-h-[45dvh] w-52 overflow-y-auto rounded-2xl bg-white/92 p-3 shadow-[0_12px_30px_-16px_rgba(15,23,42,.55)] ring-1 ring-white/80 backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">分类图例</span>
            <button
              type="button"
              className="rounded-lg p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              onClick={() => setOpen(false)}
              aria-label="收起图例"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-x-1 gap-y-1.5">
            {LEGEND_ITEMS.map((it) => (
              <div key={it.label} className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: it.color }} />
                <span className="truncate text-[10px] leading-tight text-slate-600">{it.label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-slate-500 shadow-[0_8px_20px_-10px_rgba(15,23,42,.45)] ring-1 ring-white/80 backdrop-blur-md transition hover:text-slate-700 active:scale-95"
          onClick={() => setOpen(true)}
          aria-label="显示图例"
          title="分类图例"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>
        </button>
      )}
    </div>
  );
}

/* ── Main component ── */

type Props = {
  agents: MapAgentMarker[];
  className?: string;
  highlightAgentId?: string | null;
  userLatLng?: { lat: number; lng: number } | null;
  onLocatePress?: () => void;
  onExploreArea?: (agents: MapAgentMarker[]) => void;
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
  onExploreArea,
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

  const ring = rounded ? "rounded-[28px] ring-1 ring-white/70 shadow-[0_24px_70px_-36px_rgba(15,23,42,.55)]" : "";
  const roundMap = rounded ? "rounded-[28px]" : "";

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-sky-100 via-violet-50 to-fuchsia-100 ${ring} [&_.leaflet-container]:!font-sans [&_.leaflet-control-scale-line]:!rounded-full [&_.leaflet-control-scale-line]:!border-0 [&_.leaflet-control-scale-line]:!bg-white/80 [&_.leaflet-control-scale-line]:!px-2 [&_.leaflet-control-scale-line]:!text-[10px] [&_.leaflet-control-scale-line]:!text-slate-500 [&_.life-agent-map-pin]:!border-0 [&_.life-agent-map-pin]:!bg-transparent [&_.life-agent-map-cluster]:!border-0 [&_.life-agent-map-cluster]:!bg-transparent [&_.life-agent-map-user-loc]:!border-0 [&_.life-agent-map-user-loc]:!bg-transparent [&_.life-agent-map-popup_.leaflet-popup-content-wrapper]:!rounded-[24px] [&_.life-agent-map-popup_.leaflet-popup-content-wrapper]:!bg-white/95 [&_.life-agent-map-popup_.leaflet-popup-content-wrapper]:!p-3 [&_.life-agent-map-popup_.leaflet-popup-content-wrapper]:!shadow-[0_24px_60px_-24px_rgba(15,23,42,.45)] [&_.life-agent-map-popup_.leaflet-popup-content-wrapper]:!ring-1 [&_.life-agent-map-popup_.leaflet-popup-content-wrapper]:!ring-white/80 [&_.life-agent-map-popup_.leaflet-popup-tip]:!bg-white/95 [&_.life-agent-map-popup_.leaflet-popup-tip]:!shadow-lg ${className}`}
      style={rounded ? { minHeight: "min(62dvh, 520px)" } : { minHeight: "100%" }}
    >
      <MapContainer
        center={[35, 108]}
        zoom={5}
        minZoom={3}
        maxZoom={18}
        zoomControl={false}
        className={`z-0 w-full ${mapHeightClass} ${roundMap}`}
        style={{ background: "linear-gradient(135deg,#dbeafe,#f5d0fe)" }}
        scrollWheelZoom
        attributionControl={false}
      >
        <MapInstanceExposer mapRef={mapRef} />
        <TileLayer
          url="https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}"
          subdomains={["1", "2", "3", "4"]}
          maxZoom={18}
        />
        <ScaleControl position="bottomleft" imperial={false} />
        <MapLayoutFit points={points} userLatLng={userLatLng ?? null} layoutNonce={mapLayoutNonce} />
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

      <div className="pointer-events-none absolute inset-0 z-[350] bg-[radial-gradient(circle_at_18%_14%,rgba(255,255,255,.55),transparent_28%),radial-gradient(circle_at_82%_22%,rgba(216,180,254,.28),transparent_30%),linear-gradient(to_bottom,rgba(255,255,255,.18),transparent_28%,rgba(15,23,42,.05))]" />

      <MapLegend />

      <div className="pointer-events-none absolute inset-0 z-[400]">
        <div className="pointer-events-auto absolute right-3 top-1/2 flex -translate-y-1/2 flex-col gap-2">
          {showLocateButton ? (
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-[#7c3aed] shadow-[0_12px_30px_-16px_rgba(15,23,42,.55)] ring-1 ring-white/80 backdrop-blur-md transition active:scale-95 active:bg-white"
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
          {onExploreArea ? (
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-[#7c3aed] shadow-[0_12px_30px_-16px_rgba(15,23,42,.55)] ring-1 ring-white/80 backdrop-blur-md transition active:scale-95 active:bg-white"
              aria-label="探索此区域"
              title="探索此区域"
              onClick={() => {
                const map = mapRef.current;
                if (!map) return;
                const bounds = map.getBounds();
                const visible = agents.filter((a) => {
                  const [lat, lng] = getLifeAgentLatLng(a);
                  return bounds.contains([lat, lng]);
                });
                onExploreArea(visible);
              }}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
