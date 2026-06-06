import { getLifeAgentLatLng, type MapCoordAgentInput } from "@/lib/life-agent-map-coords";

export const NEARBY_RADIUS_FUZZY_KM = 120;

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 模糊定位下的距离文案（与小程序一致） */
export function formatDistanceKm(km: number): string {
  if (!Number.isFinite(km)) return "";
  if (km < 1) return "约 1 公里内";
  if (km < 10) return `约 ${km.toFixed(1)} 公里`;
  return `约 ${Math.round(km)} 公里`;
}

export type AgentWithDistance<T extends MapCoordAgentInput> = T & {
  distanceKm: number;
  distanceLabel: string;
  mapLat: number;
  mapLng: number;
};

export function agentsWithinKm<T extends MapCoordAgentInput>(
  agents: T[],
  userLat: number,
  userLng: number,
  maxKm: number
): AgentWithDistance<T>[] {
  return agents
    .map((agent) => {
      const [mapLat, mapLng] = getLifeAgentLatLng(agent);
      const distanceKm = haversineKm(userLat, userLng, mapLat, mapLng);
      return {
        ...agent,
        mapLat,
        mapLng,
        distanceKm,
        distanceLabel: formatDistanceKm(distanceKm),
      };
    })
    .filter((a) => a.distanceKm <= maxKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function openAgentOnMap(agent: { displayName: string; mapLat: number; mapLng: number; city?: string; province?: string }) {
  const name = encodeURIComponent(agent.displayName || "Agent");
  const address = encodeURIComponent([agent.city, agent.province].filter(Boolean).join(" ") || "Agent 服务区域");
  const { mapLng, mapLat } = agent;
  window.open(
    `https://uri.amap.com/marker?position=${mapLng},${mapLat}&name=${name}&content=${address}&src=BrightAgent&callnative=1`,
    "_blank",
    "noopener,noreferrer"
  );
}
