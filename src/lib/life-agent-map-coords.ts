/**
 * 根据城市 / 地区文案近似落点（无经纬度 API 时的展示用坐标）。
 * 同一城市多个 Agent 会按 id 做轻微偏移以免完全重叠。
 */

const COORDS: Record<string, [number, number]> = {
  北京: [39.9042, 116.4074],
  上海: [31.2304, 121.4737],
  天津: [39.3434, 117.3616],
  重庆: [29.563, 106.5516],
  杭州: [30.2741, 120.1551],
  宁波: [29.8683, 121.544],
  温州: [28.0006, 120.6994],
  台州: [28.6564, 121.4208],
  绍兴: [30.0303, 120.5804],
  南京: [32.0603, 118.7969],
  苏州: [31.2989, 120.5853],
  无锡: [31.4912, 120.3124],
  深圳: [22.5431, 114.0579],
  广州: [23.1291, 113.2644],
  珠海: [22.2707, 113.5767],
  东莞: [23.0207, 113.7518],
  佛山: [23.0215, 113.1214],
  成都: [30.5728, 104.0668],
  武汉: [30.5928, 114.3055],
  西安: [34.3416, 108.9398],
  郑州: [34.7466, 113.6254],
  长沙: [28.2282, 112.9388],
  青岛: [36.0671, 120.3826],
  沈阳: [41.8057, 123.4328],
  大连: [38.914, 121.6147],
  哈尔滨: [45.8038, 126.535],
  厦门: [24.4798, 118.0819],
  昆明: [25.0389, 102.7183],
  合肥: [31.8206, 117.2272],
  福州: [26.0745, 119.2965],
  济南: [36.6512, 117.12],
  兰州: [36.0611, 103.8343],
  海口: [20.0444, 110.1999],
  乌鲁木齐: [43.8256, 87.6168],
  拉萨: [29.652, 91.1721],
  香港: [22.3193, 114.1694],
  台北: [25.033, 121.5654],
  东京: [35.6762, 139.6503],
  大阪: [34.6937, 135.5023],
  新加坡: [1.3521, 103.8198],
  浙江: [30.2741, 120.1551],
  江苏: [32.0603, 118.7969],
  广东: [23.379, 113.7633],
  山东: [36.6512, 117.12],
  四川: [30.5728, 104.0668],
  湖北: [30.5928, 114.3055],
  河南: [34.7466, 113.6254],
  湖南: [28.2282, 112.9388],
  福建: [26.0745, 119.2965],
  安徽: [31.8206, 117.2272],
  辽宁: [41.8057, 123.4328],
  陕西: [34.3416, 108.9398],
  河北: [38.0428, 114.5149],
  山西: [37.8706, 112.5489],
  吉林: [43.8171, 125.3235],
  黑龙江: [45.8038, 126.535],
  云南: [25.0389, 102.7183],
  广西: [22.817, 108.3665],
  江西: [28.682, 115.8579],
  海南: [20.0444, 110.1999],
  贵州: [26.647, 106.6302],
  甘肃: [36.0611, 103.8343],
  内蒙古: [40.8424, 111.7492],
  宁夏: [38.4872, 106.2309],
  青海: [36.6171, 101.7782],
  新疆: [43.8256, 87.6168],
  西藏: [29.652, 91.1721],
};

function stripAdminSuffix(s: string): string {
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

function lookup(name: string | undefined | null): [number, number] | null {
  if (!name) return null;
  const raw = name.trim();
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

function jitter(id: string, base: [number, number]): [number, number] {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const dLat = ((Math.abs(h) % 1000) / 1000 - 0.5) * 0.14;
  const dLng = ((Math.abs(h >> 9) % 1000) / 1000 - 0.5) * 0.14;
  return [base[0] + dLat, base[1] + dLng];
}

export type MapCoordAgentInput = {
  id: string;
  city?: string | null;
  province?: string | null;
  county?: string | null;
  regions?: string[] | null;
};

export function getLifeAgentLatLng(agent: MapCoordAgentInput): [number, number] {
  const regionFirst =
    Array.isArray(agent.regions) && agent.regions.length > 0 ? String(agent.regions[0]).trim() : null;

  for (const c of [agent.city, regionFirst, agent.county, agent.province]) {
    const found = lookup(c);
    if (found) return jitter(agent.id, found);
  }

  return jitter(agent.id, [34.5, 108.9]);
}
