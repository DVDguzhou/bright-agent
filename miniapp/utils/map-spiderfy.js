/** 与 Web Leaflet maxZoom 对齐 */
const SPIDERFY_MIN_SCALE = 16;
const MAX_MAP_SCALE = 18;

function spiderLegRadius(scale, count) {
  const s = Number(scale) || SPIDERFY_MIN_SCALE;
  const zoomFactor = Math.pow(2, MAX_MAP_SCALE - s);
  const countFactor = 1 + Math.min(count, 24) * 0.06;
  return 0.00055 * zoomFactor * countFactor;
}

function spiderfyPositions(centerLat, centerLng, agents, scale) {
  const list = agents || [];
  if (list.length === 0) return [];
  if (list.length === 1) {
    return [
      {
        agent: list[0],
        lat: list[0].lat,
        lng: list[0].lng,
      },
    ];
  }

  const leg = spiderLegRadius(scale, list.length);
  const cosLat = Math.cos((centerLat * Math.PI) / 180) || 1;
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const angle = (2 * Math.PI * i) / list.length - Math.PI / 2;
    out.push({
      agent: list[i],
      lat: centerLat + leg * Math.cos(angle),
      lng: centerLng + (leg * Math.sin(angle)) / cosLat,
    });
  }
  return out;
}

function buildSpiderPolylines(centerLat, centerLng, positions, lineIdStart) {
  const lines = [];
  const start = lineIdStart || 0;
  positions.forEach(function (pos, i) {
    lines.push({
      id: start + i,
      points: [
        { latitude: centerLat, longitude: centerLng },
        { latitude: pos.lat, longitude: pos.lng },
      ],
      color: "#7a1f1fcc",
      width: 2,
      dottedLine: false,
    });
  });
  return lines;
}

module.exports = {
  SPIDERFY_MIN_SCALE,
  MAX_MAP_SCALE,
  spiderfyPositions,
  buildSpiderPolylines,
};
