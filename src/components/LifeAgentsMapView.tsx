"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import L from "leaflet";
import { MapContainer, Marker, ScaleControl, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getLifeAgentLatLng, type MapCoordAgentInput } from "@/lib/life-agent-map-coords";

export type MapAgentMarker = MapCoordAgentInput & {
  displayName: string;
  headline?: string;
};

const ACCENT = "#0091ff";

function createPinIcon() {
  return L.divIcon({
    className: "life-agent-map-pin",
    html: `<div style="width:16px;height:16px;border-radius:9999px;background:${ACCENT};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.28)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function createHighlightPinIcon() {
  return L.divIcon({
    className: "life-agent-map-pin life-agent-map-pin--highlight",
    html: `<div style="width:22px;height:22px;border-radius:9999px;background:${ACCENT};border:3px solid #fff;box-shadow:0 0 0 3px rgba(0,145,255,.45),0 2px 10px rgba(0,0,0,.3)"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
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

/**
 * 当 layoutNonce 递增时，用当前 Agent 点 +（若有）用户坐标做一次 fitBounds。
 * 由页面在「数据就绪」「首次定位成功」等时机 bump；避免 watchPosition 连续触发。
 */
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

type Props = {
  agents: MapAgentMarker[];
  className?: string;
  /** 选中的绑定 Agent，地图上用更大描边标记 */
  highlightAgentId?: string | null;
  /** 浏览器定位得到的用户坐标 */
  userLatLng?: { lat: number; lng: number } | null;
  /** 点击右侧「定位」：打开绑定 / 权限流程 */
  onLocatePress?: () => void;
  /** 是否展示右侧定位按钮（未登录可由页面置为 false） */
  showLocateButton?: boolean;
  /** 地图区域最小高度（如全屏） */
  mapHeightClass?: string;
  /** 是否圆角卡片样式（默认 true）；全屏地图可 false */
  rounded?: boolean;
  /** 递增时触发「Agent + 我的位置」合并 fitBounds（见 MapLayoutFit） */
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
  const router = useRouter();
  const mapRef = useRef<L.Map | null>(null);
  const pinIcon = useMemo(() => createPinIcon(), []);
  const highlightIcon = useMemo(() => createHighlightPinIcon(), []);
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
      className={`relative overflow-hidden ${ring} [&_.life-agent-map-pin]:!border-0 [&_.life-agent-map-pin]:!bg-transparent [&_.life-agent-map-user-loc]:!border-0 [&_.life-agent-map-user-loc]:!bg-transparent ${className}`}
      style={rounded ? { minHeight: "min(62dvh, 520px)" } : { minHeight: "100%" }}
    >
      <MapContainer
        center={[35, 105]}
        zoom={4}
        zoomControl={false}
        className={`z-0 w-full ${mapHeightClass} ${roundMap}`}
        scrollWheelZoom
        attributionControl
      >
        <MapInstanceExposer mapRef={mapRef} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ScaleControl position="bottomleft" imperial={false} />
        <MapLayoutFit points={points} userLatLng={userLatLng ?? null} layoutNonce={mapLayoutNonce} />
        {markers.map(({ agent, position }) => {
          const isHi = Boolean(highlightAgentId && agent.id === highlightAgentId);
          return (
            <Marker
              key={agent.id}
              position={position}
              icon={isHi ? highlightIcon : pinIcon}
              zIndexOffset={isHi ? 800 : 0}
              eventHandlers={{
                click: () => {
                  router.push(`/life-agents/${agent.id}`);
                },
              }}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={1} permanent={false}>
                <span className="text-xs font-semibold text-slate-800">{agent.displayName}</span>
              </Tooltip>
            </Marker>
          );
        })}
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
