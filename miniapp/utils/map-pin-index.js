const { getLifeAgentLatLng } = require("./map-coords");
const { buildAreaLabel } = require("./format");
const { resolveLifeAgentCoverDisplayUrl } = require("./covers");
const { cleanLifeAgentIntroText } = require("./intro-clean");
const { agentCategoryColor } = require("./agent-category");

/** 与后端 map-pins 缓存 TTL 对齐 */
const CACHE_TTL_MS = 5 * 60 * 1000;
/** 空间索引网格大小（度） */
const GRID_CELL = 0.5;
const MAP_AVATAR_FALLBACK = "/images/map/agent-avatar-fallback.png";

function resolveMapAvatarUrl(pin) {
  const src = resolveLifeAgentCoverDisplayUrl(
    pin.coverUrl,
    pin.coverImageUrl,
    pin.coverPresetKey
  );
  if (!src || src.indexOf(".svg") >= 0 || src.indexOf("default-cover") >= 0) {
    return MAP_AVATAR_FALLBACK;
  }
  return src;
}

let cache = {
  pins: null,
  grid: null,
  at: 0,
};

function sanitizeLatLng(lat, lng) {
  let la = Number(lat);
  let ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  if (Math.abs(la) > 90 && Math.abs(ln) <= 90) {
    const tmp = la;
    la = ln;
    ln = tmp;
  }
  if (la < -90 || la > 90 || ln < -180 || ln > 180) return null;
  return { lat: la, lng: ln };
}

/** 仅保留地图渲染与列表展示所需字段，不展开原始 API 对象 */
function compactPin(raw) {
  const id = String(raw.id || "");
  const displayName = String(raw.displayName || "Agent");
  const latLng = getLifeAgentLatLng(raw);
  const coords = sanitizeLatLng(latLng[0], latLng[1]);
  if (!coords) return null;
  return {
    id: id,
    displayName: displayName,
    headline: cleanLifeAgentIntroText(raw.headline || "", displayName),
    school: String(raw.school || ""),
    city: String(raw.city || ""),
    province: String(raw.province || ""),
    lat: coords.lat,
    lng: coords.lng,
    catColor: agentCategoryColor(raw.headline, displayName),
    coverUrl: raw.coverUrl || "",
    coverImageUrl: raw.coverImageUrl || "",
    coverPresetKey: raw.coverPresetKey || "",
  };
}

function buildGrid(pins, cell) {
  const grid = {};
  pins.forEach(function (p) {
    const key = Math.floor(p.lat / cell) + ":" + Math.floor(p.lng / cell);
    if (!grid[key]) grid[key] = [];
    grid[key].push(p);
  });
  return grid;
}

function buildPinIndex(rawList) {
  const pins = rawList
    .map(compactPin)
    .filter(function (p) {
      return p != null;
    });
  const grid = buildGrid(pins, GRID_CELL);
  cache = { pins: pins, grid: grid, at: Date.now() };
  return { pins: pins, grid: grid };
}

function getCachedPinIndex() {
  if (!cache.pins || Date.now() - cache.at > CACHE_TTL_MS) return null;
  return { pins: cache.pins, grid: cache.grid };
}

function filterPins(pins, keyword) {
  const q = (keyword || "").trim().toLowerCase();
  if (!q) return pins;
  return pins.filter(function (a) {
    return (
      (a.displayName && a.displayName.toLowerCase().indexOf(q) >= 0) ||
      (a.headline && a.headline.toLowerCase().indexOf(q) >= 0)
    );
  });
}

function pinsInRegion(pins, grid, sw, ne, cell) {
  if (!sw || !ne) return pins;
  const minLat = Math.floor(sw.latitude / cell);
  const maxLat = Math.floor(ne.latitude / cell);
  const minLng = Math.floor(sw.longitude / cell);
  const maxLng = Math.floor(ne.longitude / cell);
  const seen = new Set();
  const out = [];
  for (let la = minLat; la <= maxLat; la++) {
    for (let ln = minLng; ln <= maxLng; ln++) {
      const bucket = grid[la + ":" + ln];
      if (!bucket) continue;
      bucket.forEach(function (p) {
        if (seen.has(p.id)) return;
        if (
          p.lat >= sw.latitude &&
          p.lat <= ne.latitude &&
          p.lng >= sw.longitude &&
          p.lng <= ne.longitude
        ) {
          seen.add(p.id);
          out.push(p);
        }
      });
    }
  }
  return out.length > 0 ? out : pins;
}

function findPinById(pins, id) {
  if (!id || !pins) return null;
  for (let i = 0; i < pins.length; i++) {
    if (pins[i].id === id) return pins[i];
  }
  return null;
}

function enrichPin(pin) {
  if (!pin) return null;
  return Object.assign({}, pin, {
    coverFull: resolveMapAvatarUrl(pin),
    area: buildAreaLabel(pin.city, pin.province),
  });
}

function enrichPins(pins) {
  return pins.map(enrichPin);
}

function buildIncludePoints(pins, maxPoints) {
  if (!pins || pins.length === 0) return [];
  const limit = maxPoints || 100;
  if (pins.length <= limit) {
    return pins.map(function (a) {
      return { latitude: a.lat, longitude: a.lng };
    });
  }
  const step = Math.ceil(pins.length / limit);
  const points = [];
  for (let i = 0; i < pins.length; i += step) {
    points.push({
      latitude: pins[i].lat,
      longitude: pins[i].lng,
    });
  }
  return points;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = function (deg) {
    return (deg * Math.PI) / 180;
  };
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function sortPinsByDistance(pins, lat, lng) {
  return (pins || [])
    .map(function (p) {
      return Object.assign({}, p, {
        distanceKm: haversineKm(lat, lng, p.lat, p.lng),
      });
    })
    .sort(function (a, b) {
      return a.distanceKm - b.distanceKm;
    });
}

function filterPinsWithinKm(pins, lat, lng, maxKm) {
  return sortPinsByDistance(pins, lat, lng).filter(function (p) {
    return p.distanceKm <= maxKm;
  });
}

function formatDistanceKm(km, precise) {
  if (!Number.isFinite(km)) return "";
  if (precise) {
    if (km < 0.1) return "距你 100 米内";
    if (km < 1) return "距你 " + Math.round(km * 1000) + " 米";
    if (km < 10) return "距你 " + km.toFixed(1) + " 公里";
    return "距你 " + Math.round(km) + " 公里";
  }
  if (km < 1) return "约 1 公里内";
  if (km < 10) return "约 " + km.toFixed(1) + " 公里";
  return "约 " + Math.round(km) + " 公里";
}

module.exports = {
  GRID_CELL,
  MAP_AVATAR_FALLBACK,
  buildPinIndex,
  getCachedPinIndex,
  filterPins,
  pinsInRegion,
  findPinById,
  enrichPin,
  enrichPins,
  buildIncludePoints,
  haversineKm,
  sortPinsByDistance,
  filterPinsWithinKm,
  formatDistanceKm,
};
