"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { MapContainer, ScaleControl, TileLayer, Marker, useMap } from "react-leaflet";
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

function clusterIcon(cluster: L.MarkerCluster) {
  const count = cluster.getChildCount();
  let size = 36;
  let fontSize = 13;
  if (count >= 100) { size = 48; fontSize = 14; }
  else if (count >= 10) { size = 42; fontSize = 13; }
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${ACCENT};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${fontSize}px;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3)">${count}</div>`,
    className: "life-agent-map-cluster",
    iconSize: L.point(size, size),
    iconAnchor: L.point(size / 2, size / 2),
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

/**
 * Imperative MarkerClusterGroup layer — avoids 1600+ React <Marker> reconciliation.
 * Adds all markers to a single L.markerClusterGroup for clustering + spiderfy.
 */
function ClusteredMarkers({
  markers,
  highlightAgentId,
  onMarkerClick,
}: {
  markers: { agent: MapAgentMarker; position: L.LatLngTuple }[];
  highlightAgentId: string | null;
  onMarkerClick: (agentId: string) => void;
}) {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const pinIcon = useMemo(() => createPinIcon(), []);
  const highlightIcon = useMemo(() => createHighlightPinIcon(), []);

  useEffect(() => {
    const group = L.markerClusterGroup({
      maxClusterRadius: 45,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: clusterIcon,
      animate: true,
      chunkedLoading: true,
      chunkInterval: 100,
      chunkDelay: 10,
    });

    const leafletMarkers = markers.map(({ agent, position }) => {
      const isHi = Boolean(highlightAgentId && agent.id === highlightAgentId);
      const m = L.marker(position, {
        icon: isHi ? highlightIcon : pinIcon,
        zIndexOffset: isHi ? 800 : 0,
      });
      m.bindTooltip(
        `<span class="text-xs font-semibold text-slate-800">${agent.displayName}</span>`,
        { direction: "top", offset: [0, -6], opacity: 1 },
      );
      m.on("click", () => onMarkerClick(agent.id));
      return m;
    });

    group.addLayers(leafletMarkers);
    map.addLayer(group);
    clusterRef.current = group;

    return () => {
      map.removeLayer(group);
      clusterRef.current = null;
    };
  }, [map, markers, highlightAgentId, pinIcon, highlightIcon, onMarkerClick]);

  return null;
}

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
  const router = useRouter();
  const mapRef = useRef<L.Map | null>(null);
  const userIcon = useMemo(() => createUserLocationIcon(), []);

  const markers = useMemo(() => {
    return agents.map((a) => ({
      agent: a,
      position: getLifeAgentLatLng(a) as L.LatLngTuple,
    }));
  }, [agents]);

  const points = useMemo(() => markers.map((m) => m.position), [markers]);

  const handleMarkerClick = useCallback(
    (agentId: string) => router.push(`/life-agents/${agentId}`),
    [router],
  );

  const ring = rounded ? "rounded-2xl ring-1 ring-slate-200/80" : "";
  const roundMap = rounded ? "rounded-2xl" : "";

  return (
    <div
      className={`relative overflow-hidden ${ring} [&_.life-agent-map-pin]:!border-0 [&_.life-agent-map-pin]:!bg-transparent [&_.life-agent-map-cluster]:!border-0 [&_.life-agent-map-cluster]:!bg-transparent [&_.life-agent-map-user-loc]:!border-0 [&_.life-agent-map-user-loc]:!bg-transparent ${className}`}
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
        <ClusteredMarkers
          markers={markers}
          highlightAgentId={highlightAgentId}
          onMarkerClick={handleMarkerClick}
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
