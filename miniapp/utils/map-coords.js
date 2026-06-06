/** 城市坐标（与 Web life-agent-map-coords.ts 核心子集一致） */
const COORDS = {
  北京: [39.9042, 116.4074],
  上海: [31.2304, 121.4737],
  天津: [39.3434, 117.3616],
  重庆: [29.563, 106.5516],
  杭州: [30.2741, 120.1551],
  宁波: [29.8683, 121.544],
  温州: [28.0006, 120.6994],
  南京: [32.0603, 118.7969],
  苏州: [31.2989, 120.5853],
  深圳: [22.5431, 114.0579],
  广州: [23.1291, 113.2644],
  成都: [30.5728, 104.0668],
  武汉: [30.5928, 114.3055],
  西安: [34.3416, 108.9398],
  郑州: [34.7466, 113.6254],
  长沙: [28.2282, 112.9388],
  青岛: [36.0671, 120.3826],
  厦门: [24.4798, 118.0819],
  香港: [22.3193, 114.1694],
  台北: [25.033, 121.5654],
  东京: [35.6762, 139.6503],
  新加坡: [1.3521, 103.8198],
  波士顿: [42.3601, -71.0589],
  纽约: [40.7128, -74.006],
  旧金山: [37.7749, -122.4194],
  伦敦: [51.5074, -0.1278],
  浙江: [30.2741, 120.1551],
  江苏: [32.0603, 118.7969],
  广东: [23.379, 113.7633],
  四川: [30.5728, 104.0668],
  湖北: [30.5928, 114.3055],
};

function stripAdminSuffix(s) {
  return s
    .replace(/壮族自治区$/, "")
    .replace(/回族自治区$/, "")
    .replace(/维吾尔自治区$/, "")
    .replace(/自治区$/, "")
    .replace(/特别行政区$/, "")
    .replace(/省$/, "")
    .replace(/市$/, "")
    .trim();
}

function lookup(name) {
  if (!name) return null;
  const raw = String(name).trim();
  if (!raw) return null;
  if (COORDS[raw]) return COORDS[raw];
  const stripped = stripAdminSuffix(raw);
  if (COORDS[stripped]) return COORDS[stripped];
  for (const key of Object.keys(COORDS)) {
    if (stripped === key) return COORDS[key];
    if (stripped.startsWith(key) || key.startsWith(stripped)) return COORDS[key];
  }
  return null;
}

function jitter(id, base) {
  const sid = String(id || "");
  let h = 0;
  for (let i = 0; i < sid.length; i++) h = (h * 31 + sid.charCodeAt(i)) | 0;
  const dLat = ((Math.abs(h) % 1000) / 1000 - 0.5) * 0.04;
  const dLng = ((Math.abs(h >> 9) % 1000) / 1000 - 0.5) * 0.06;
  return [base[0] + dLat, base[1] + dLng];
}

function getLifeAgentLatLng(agent) {
  const agentId = String((agent && agent.id) || "");
  const regionFirst =
    Array.isArray(agent.regions) && agent.regions.length > 0
      ? String(agent.regions[0]).trim()
      : null;
  for (const c of [agent.county, agent.city, regionFirst, agent.province]) {
    const found = lookup(c);
    if (found) return jitter(agentId, found);
  }
  return jitter(agentId, [34.5, 108.9]);
}

module.exports = { getLifeAgentLatLng };
