"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getLifeAgentLatLng, type MapCoordAgentInput } from "@/lib/life-agent-map-coords";

export type MapAgentMarker = MapCoordAgentInput & {
  displayName: string;
  headline?: string;
};

function createPinIcon() {
  return L.divIcon({
    className: "life-agent-map-pin",
    html:
      '<div style="width:16px;height:16px;border-radius:9999px;background:#0284c7;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.28)"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function MapFitBounds({ points }: { points: L.LatLngTuple[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) {
      map.setView([35, 105], 4);
      return;
    }
    if (points.length === 1) {
      map.setView(points[0], 9);
      return;
    }
    const b = L.latLngBounds(points);
    map.fitBounds(b, { padding: [48, 48], maxZoom: 11 });
  }, [map, points]);
  return null;
}

type Props = {
  agents: MapAgentMarker[];
  className?: string;
};

export default function LifeAgentsMapView({ agents, className = "" }: Props) {
  const router = useRouter();
  const pinIcon = useMemo(() => createPinIcon(), []);

  const markers = useMemo(() => {
    return agents.map((a) => ({
      agent: a,
      position: getLifeAgentLatLng(a) as L.LatLngTuple,
    }));
  }, [agents]);

  const points = useMemo(() => markers.map((m) => m.position), [markers]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ring-1 ring-slate-200/80 [&_.life-agent-map-pin]:!border-0 [&_.life-agent-map-pin]:!bg-transparent ${className}`}
      style={{ minHeight: "min(62dvh, 520px)" }}
    >
      <MapContainer
        center={[35, 105]}
        zoom={4}
        className="z-0 h-[min(62dvh,520px)] w-full rounded-2xl"
        scrollWheelZoom
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapFitBounds points={points} />
        {markers.map(({ agent, position }) => (
          <Marker
            key={agent.id}
            position={position}
            icon={pinIcon}
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
        ))}
      </MapContainer>
    </div>
  );
}
