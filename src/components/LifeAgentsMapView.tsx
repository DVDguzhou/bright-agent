"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { MapContainer, ScaleControl, TileLayer, Marker, useMap } from "react-leaflet";
import { getLifeAgentLatLng, type MapCoordAgentInput } from "@/lib/life-agent-map-coords";
import { resolveLifeAgentCoverUrl, isLifeAgentDefaultCoverUrl, DEFAULT_COVER_PNG_URL } from "@/lib/life-agent-covers";
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
  // 杂志色板：酒红 / 墨黑 / 橄榄 / 深蓝灰（无紫色、无粉色）。
  const palette = ["#c2271d", "#181816", "#4a5a2f", "#3a3935", "#9e1f17", "#5d7140"];
  return palette[Math.abs(h) % palette.length];
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* Teardrop-pin: pure HTML/CSS with <img> for cover.
 * Design: colored circle body → white ring → cover image → colored triangular tip. */

function createAvatarPinIcon(agent: MapAgentMarker, highlight = false) {
  const bg = agentCategoryColor(agent.headline, agent.displayName);
  let coverSrc = resolveLifeAgentCoverUrl(agent.coverImageUrl, agent.coverPresetKey);
  if (isLifeAgentDefaultCoverUrl(coverSrc)) coverSrc = DEFAULT_COVER_PNG_URL;
  // Sizes: outer circle, tip, border thickness
  const dia = highlight ? 38 : 30;
  const tip = highlight ? 10 : 8;
  const w = dia;
  const h = dia + tip;
  const ring = highlight ? 3 : 2.5;
  const shadow = highlight
    ? "filter:drop-shadow(0 3px 8px rgba(0,0,0,.45))"
    : "filter:drop-shadow(0 2px 5px rgba(0,0,0,.35))";
  const outerGlow = highlight ? `box-shadow:0 0 0 3px ${bg}33;` : "";
  return L.divIcon({
    className: "life-agent-map-pin",
    html: `<div style="width:${w}px;height:${h}px;${shadow};position:relative">`
      + `<div style="width:${dia}px;height:${dia}px;border-radius:50%;background:#fff;border:${ring}px solid ${bg};display:flex;align-items:center;justify-content:center;position:relative;${outerGlow}overflow:hidden">`
      + `<img src="${escHtml(coverSrc)}" style="width:100%;height:100%;object-fit:cover;display:block" alt=""/>`
      + `</div>`
      + `<div style="width:0;height:0;border-left:${tip * 0.6}px solid transparent;border-right:${tip * 0.6}px solid transparent;border-top:${tip}px solid ${bg};position:absolute;bottom:0;left:50%;transform:translateX(-50%)"></div>`
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

/* ── Cluster pin (same shape, oxblood body, white badge with count) ── */

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
    html: `<div style="width:${w}px;height:${h}px;filter:drop-shadow(0 3px 8px rgba(122,31,31,.4));position:relative">`
      + `<div style="width:${dia}px;height:${dia}px;border-radius:50%;background:#c2271d;display:flex;align-items:center;justify-content:center">`
      + `<div style="width:${dia - 8}px;height:${dia - 8}px;border-radius:50%;background:rgba(255,255,255,.94);display:flex;align-items:center;justify-content:center">`
      + `<span style="color:#c2271d;font-size:${fs}px;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1">${label}</span>`
      + `</div></div>`
      + `<div style="width:0;height:0;border-left:${tip * 0.55}px solid transparent;border-right:${tip * 0.55}px solid transparent;border-top:${tip}px solid #c2271d;position:absolute;bottom:0;left:50%;transform:translateX(-50%)"></div>`
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
  const serif = `'Source Han Serif SC','Noto Serif SC','Songti SC','STSong',Georgia,serif`;
  const sans = `-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif`;
  let avatarSrc = resolveLifeAgentCoverUrl(agent.coverImageUrl, agent.coverPresetKey);
  if (isLifeAgentDefaultCoverUrl(avatarSrc)) avatarSrc = "";
  const avatarBlock = avatarSrc
    ? `<div style="width:40px;height:40px;border-radius:50%;background:${bg};flex-shrink:0;overflow:hidden;display:flex;align-items:center;justify-content:center">`
      + `<img src="${escHtml(avatarSrc)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block" onerror="this.style.display='none';this.parentElement.innerHTML='<span style=\\'color:#fbfbf9;font-family:${serif};font-weight:600;font-size:18px;letter-spacing:.02em\\'>${ch}</span>'"/>`
      + `</div>`
    : `<div style="width:40px;height:40px;border-radius:50%;background:${bg};color:#fbfbf9;display:flex;align-items:center;justify-content:center;font-family:${serif};font-weight:600;font-size:18px;flex-shrink:0;letter-spacing:.02em">${ch}</div>`;
  return `<div style="min-width:220px;max-width:260px;font-family:${sans};padding:2px;color:#181816">
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;padding-bottom:9px;border-bottom:1px solid #dedcd6">
    ${avatarBlock}
    <div style="min-width:0;flex:1">
      <div style="font-family:${serif};font-weight:700;font-size:15px;color:#181816;line-height:1.25;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</div>
      ${school ? `<div style="font-size:10px;color:#8e8c86;line-height:1.3;margin-top:3px;letter-spacing:.14em;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${school}</div>` : ""}
    </div>
  </div>
  ${headline ? `<div style="font-size:12.5px;color:#4d4c48;line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:12px;font-style:italic">${headline}</div>` : ""}
  <a href="/life-agents/${agent.id}" style="display:flex;align-items:center;justify-content:space-between;gap:6px;width:100%;box-sizing:border-box;border-radius:0;background:#181816;padding:9px 12px;font-size:11px;font-weight:600;color:#fbfbf9;text-decoration:none;letter-spacing:.18em;text-transform:uppercase;font-family:${sans}">
    <span>查看主页</span>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
  </a>
</div>`;
}

/* ── Map helper sub-components ── */

const CHINA_DEFAULT_CENTER: L.LatLngTuple = [35.0, 105.0];
const CHINA_DEFAULT_ZOOM = 5;

/** 中国大陆近似范围，用于默认视野优先聚焦国内 Agent */
function isInChinaBounds([lat, lng]: L.LatLngTuple): boolean {
  return lat >= 18 && lat <= 54 && lng >= 73 && lng <= 135;
}

function pickInitialFitPoints(points: L.LatLngTuple[]): L.LatLngTuple[] {
  const chinaPoints = points.filter(isInChinaBounds);
  return chinaPoints.length > 0 ? chinaPoints : points;
}

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
    } else if (points.length > 0) {
      const fitPoints = pickInitialFitPoints(points);
      if (fitPoints.length === 1) {
        map.setView(fitPoints[0], 10);
      } else {
        const bounds = L.latLngBounds(fitPoints);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
      }
    } else {
      map.setView(CHINA_DEFAULT_CENTER, CHINA_DEFAULT_ZOOM);
    }
  }, [map, points, userLatLng, layoutNonce]);
  return null;
}

/* ── Clustered markers (always visible; markercluster handles grouping) ── */

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
        icon: createAvatarPinIcon(agent, isHi),
        zIndexOffset: isHi ? 800 : 0,
      });
      m.bindPopup(buildPopupHtml(agent), {
        closeButton: false,
        className: "life-agent-map-popup",
        maxWidth: 260,
        minWidth: 180,
        offset: [0, -34],
      });
      return m;
    });

    group.addLayers(leafletMarkers);
    clusterRef.current = group;
    map.addLayer(group);

    return () => {
      map.removeLayer(group);
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
        <div className="pointer-events-auto max-h-[45dvh] w-52 overflow-y-auto rounded-2xl bg-paper/92 p-3 shadow-[0_12px_30px_-16px_rgba(15,23,42,.55)] ring-1 ring-paper/80 backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500">分类图例</span>
            <button
              type="button"
              className="rounded-lg p-0.5 text-ink-300 transition hover:bg-paper-200 hover:text-ink-500"
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
                <span className="truncate text-[10px] leading-tight text-ink-500">{it.label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-xl bg-paper/90 text-ink-400 shadow-[0_8px_20px_-10px_rgba(15,23,42,.45)] ring-1 ring-paper/80 backdrop-blur-md transition hover:text-ink-600 active:scale-95"
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
  allAgents?: MapAgentMarker[];
  className?: string;
  highlightAgentId?: string | null;
  userLatLng?: { lat: number; lng: number } | null;
  nearbyLabel?: string | null;
  onNearbyBannerClick?: () => void;
  onLocatePress?: () => void;
  onExploreArea?: (agents: MapAgentMarker[]) => void;
  onExplorePress?: () => boolean;
  showLocateButton?: boolean;
  mapHeightClass?: string;
  rounded?: boolean;
  mapLayoutNonce?: number;
};

export default function LifeAgentsMapView({
  agents,
  allAgents,
  className = "",
  highlightAgentId = null,
  userLatLng = null,
  nearbyLabel = null,
  onNearbyBannerClick,
  onLocatePress,
  onExploreArea,
  onExplorePress,
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

  const ring = rounded ? "rounded-lg ring-1 ring-ink/10 shadow-[0_18px_52px_-28px_rgba(17,21,19,.28)]" : "";
  const roundMap = rounded ? "rounded-lg" : "";

  return (
    <div
      className={`relative overflow-hidden bg-white ${ring} [&_.leaflet-container]:!font-sans [&_.leaflet-control-scale-line]:!rounded-md [&_.leaflet-control-scale-line]:!border-0 [&_.leaflet-control-scale-line]:!bg-white/85 [&_.leaflet-control-scale-line]:!px-2 [&_.leaflet-control-scale-line]:!text-[10px] [&_.leaflet-control-scale-line]:!text-ink-400 [&_.life-agent-map-pin]:!border-0 [&_.life-agent-map-pin]:!bg-transparent [&_.life-agent-map-cluster]:!border-0 [&_.life-agent-map-cluster]:!bg-transparent [&_.life-agent-map-user-loc]:!border-0 [&_.life-agent-map-user-loc]:!bg-transparent [&_.life-agent-map-popup_.leaflet-popup-content-wrapper]:!rounded-md [&_.life-agent-map-popup_.leaflet-popup-content-wrapper]:!bg-white/[0.97] [&_.life-agent-map-popup_.leaflet-popup-content-wrapper]:!p-3 [&_.life-agent-map-popup_.leaflet-popup-content-wrapper]:!shadow-[0_18px_50px_-20px_rgba(17,21,19,.34)] [&_.life-agent-map-popup_.leaflet-popup-content-wrapper]:!ring-1 [&_.life-agent-map-popup_.leaflet-popup-content-wrapper]:!ring-ink/10 [&_.life-agent-map-popup_.leaflet-popup-tip]:!bg-white/[0.97] [&_.life-agent-map-popup_.leaflet-popup-tip]:!shadow-none ${className}`}
      style={rounded ? { minHeight: "min(62dvh, 520px)" } : { minHeight: "100%" }}
    >
      <MapContainer
        center={CHINA_DEFAULT_CENTER}
        zoom={CHINA_DEFAULT_ZOOM}
        minZoom={3}
        maxZoom={18}
        zoomControl={false}
        className={`z-0 w-full ${mapHeightClass} ${roundMap}`}
        style={{ background: "#f7f8f6" }}
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

      <div className="pointer-events-none absolute inset-0 z-[350] bg-[linear-gradient(to_bottom,rgba(255,255,255,.18),transparent_24%,rgba(17,21,19,.04))]" />

      <MapLegend />

      {nearbyLabel && onNearbyBannerClick ? (
        <button
          type="button"
          className="pointer-events-auto absolute bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-1/2 z-[420] flex max-w-[min(100%-1.5rem,24rem)] -translate-x-1/2 items-center justify-between gap-3 rounded-lg bg-ink/90 px-4 py-2.5 text-left shadow-lg backdrop-blur-sm active:opacity-95"
          onClick={onNearbyBannerClick}
        >
          <span className="truncate text-sm font-semibold text-paper">{nearbyLabel}</span>
          <span className="shrink-0 text-xs text-paper/80">查看列表 ›</span>
        </button>
      ) : null}

      <div className="pointer-events-none absolute inset-0 z-[400]">
        <div className="pointer-events-auto absolute right-3 top-1/2 flex -translate-y-1/2 flex-col gap-2">
          {showLocateButton ? (
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/90 text-ink-600 shadow-[0_12px_30px_-16px_rgba(17,21,19,.45)] ring-1 ring-white/80 backdrop-blur-md transition active:scale-95 active:bg-white"
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
              className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/90 text-ink-600 shadow-[0_12px_30px_-16px_rgba(17,21,19,.45)] ring-1 ring-white/80 backdrop-blur-md transition active:scale-95 active:bg-white"
              aria-label="探索此区域"
              title="探索此区域"
              onClick={() => {
                if (onExplorePress?.()) return;
                if (!onExploreArea) return;
                const map = mapRef.current;
                if (!map) return;
                const bounds = map.getBounds();
                const pool = allAgents ?? agents;
                const visible = pool.filter((a) => {
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
