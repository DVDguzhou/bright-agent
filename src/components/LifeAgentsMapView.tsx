"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { MapContainer, ScaleControl, TileLayer, Marker, useMap } from "react-leaflet";
import { getLifeAgentLatLng, type MapCoordAgentInput } from "@/lib/life-agent-map-coords";
import { resolveLifeAgentCoverUrl } from "@/lib/life-agent-covers";

export type MapAgentMarker = MapCoordAgentInput & {
  displayName: string;
  headline?: string;
  school?: string;
  coverImageUrl?: string | null;
  coverPresetKey?: string | null;
};

/* ── Agent 内容分类 → 别针颜色 ──
 * 根据 headline / displayName 关键词匹配确定分类，Agent 更新后颜色自动变化。 */
const AGENT_CATEGORIES: { color: string; kw: string[] }[] = [
  { color: "#3b82f6",  kw: ["学习","考研","留学","高考","教育","课程","辅导","考试","托福","雅思","论文","学术","科研","读博","硕士","本科","GRE","SAT","IELTS","TOEFL","考公","公务员","保研","考博","备考","复习","培训","家教","申请","招生","奖学金"] },               // 学习 Education
  { color: "#0891b2",  kw: ["就业","求职","面试","简历","职场","招聘","实习","跳槽","薪资","HR","猎头","职业","入职","转行","offer","校招","社招","秋招","春招","内推","裁员","劳动"] },                                                                                   // 就业 Career
  { color: "#f59e0b",  kw: ["创业","融资","投资","商业","CEO","合伙","股权","估值","风投","天使","孵化","副业","开店","个体户","商业模式","盈利","营收","自媒体","品牌","营销","私域"] },                                                                                    // 创业 Startup
  { color: "#6366f1",  kw: ["科技","编程","代码","AI","人工智能","互联网","软件","硬件","开发","程序","IT","区块链","Web","前端","后端","算法","数据","机器学习","深度学习","产品经理","技术","芯片","半导体","云计算","大模型","AGI","GPT","LLM","网络安全"] },                  // 科技 Tech
  { color: "#14b8a6",  kw: ["金融","理财","基金","股票","期货","保险","银行","贷款","外汇","加密","比特币","会计","审计","税务","经济","券商","信托","财务","CFA","CPA","投行","风控"] },                                                                                    // 金融 Finance
  { color: "#10b981",  kw: ["旅游","旅行","出游","自驾","攻略","签证","机票","酒店","民宿","度假","背包","露营","穷游","出境","入境","漫游","航线","邮轮"] },                                                                                                               // 旅游 Travel
  { color: "#f97316",  kw: ["美食","做饭","烹饪","餐厅","小吃","菜谱","烘焙","咖啡","料理","厨艺","吃货","探店","外卖","火锅","烧烤","甜品","面包","酒吧","茶艺","品酒"] },                                                                                                  // 美食 Food
  { color: "#06b6d4",  kw: ["景点","名胜","古迹","博物馆","展览","文化遗产","寺庙","古城","园林","故宫","长城","古镇","世界遗产"] },                                                                                                                                        // 景点 Attractions
  { color: "#ec4899",  kw: ["购物","代购","时尚","穿搭","品牌","奢侈品","折扣","优惠","美妆","护肤","化妆","服饰","包包","鞋","潮牌","中古","买手","海淘"] },                                                                                                                // 购物 Shopping
  { color: "#22c55e",  kw: ["运动","健身","跑步","篮球","足球","游泳","瑜伽","马拉松","户外","登山","骑行","滑雪","网球","羽毛球","体育","拳击","攀岩","冲浪","跳绳","减脂","增肌"] },                                                                                        // 运动 Sports
  { color: "#e11d48",  kw: ["情感","恋爱","婚姻","分手","两性","亲子","育儿","婚恋","相亲","脱单","挽回","家庭","夫妻","离婚","复合","暧昧","约会","备孕","怀孕","产后","带娃","早教"] },                                                                                     // 情感 Emotion
  { color: "#a855f7",  kw: ["八卦","娱乐","明星","综艺","电影","电视","音乐","追星","网红","直播","游戏","动漫","影视","剧集","小说","漫画","手游","电竞","二次元","短视频","Vlog","UP主"] },                                                                                 // 八卦 Entertainment
  { color: "#ef4444",  kw: ["医疗","健康","医院","医生","疾病","药物","养生","保健","营养","中医","心理健康","抑郁","焦虑","失眠","康复","理疗","体检","口腔","眼科","皮肤","过敏","疫苗"] },                                                                                  // 医疗 Health
  { color: "#84cc16",  kw: ["房产","买房","租房","装修","房价","二手房","新房","物业","家居","家装","软装","验房","贷款买房","公积金","学区房","房东","租客"] },                                                                                                                // 房产 Real Estate
  { color: "#64748b",  kw: ["法律","律师","合同","诉讼","维权","知识产权","专利","劳动法","法规","仲裁","公证","遗嘱","离婚诉讼","商标","版权","刑事","民事"] },                                                                                                              // 法律 Legal
  { color: "#d946ef",  kw: ["艺术","设计","画画","摄影","书法","舞蹈","乐器","创作","手工","陶艺","绘画","插画","UI","平面","视觉","美术","素描","水彩","油画","钢琴","吉他","声乐","表演"] },                                                                                 // 艺术 Art
  { color: "#f472b6",  kw: ["宠物","养宠","萌宠","猫咪","狗狗","猫粮","狗粮","宠物医院","遛狗","猫砂","水族","爬宠","仓鼠","兔子","鹦鹉"] },                                                                                                                                 // 宠物 Pets
  { color: "#0ea5e9",  kw: ["汽车","驾照","买车","二手车","新能源","电动车","驾驶","修车","车险","提车","试驾","特斯拉","比亚迪","充电桩","加油","洗车","改装"] },                                                                                                              // 汽车 Auto
  { color: "#65a30d",  kw: ["农业","种植","养殖","农村","乡村","三农","有机","农产品","果园","牧场","渔业","花卉","园艺","盆栽"] },                                                                                                                                           // 农业 Agriculture
  { color: "#475569",  kw: ["政务","政策","政府","公共","社区","公益","慈善","志愿","环保","碳中和","新政","民生","社保","医保","户口","落户","居住证"] },                                                                                                                      // 政务 Government
];
const DEFAULT_CATEGORY_COLOR = "#8b5cf6"; // 生活 Lifestyle（未匹配到分类时的默认色）

export const LEGEND_ITEMS: { label: string; color: string }[] = [
  { label: "学习", color: "#3b82f6" },
  { label: "就业", color: "#0891b2" },
  { label: "创业", color: "#f59e0b" },
  { label: "科技", color: "#6366f1" },
  { label: "金融", color: "#14b8a6" },
  { label: "旅游", color: "#10b981" },
  { label: "美食", color: "#f97316" },
  { label: "景点", color: "#06b6d4" },
  { label: "购物", color: "#ec4899" },
  { label: "运动", color: "#22c55e" },
  { label: "情感", color: "#e11d48" },
  { label: "娱乐", color: "#a855f7" },
  { label: "医疗", color: "#ef4444" },
  { label: "房产", color: "#84cc16" },
  { label: "法律", color: "#64748b" },
  { label: "艺术", color: "#d946ef" },
  { label: "宠物", color: "#f472b6" },
  { label: "汽车", color: "#0ea5e9" },
  { label: "农业", color: "#65a30d" },
  { label: "政务", color: "#475569" },
  { label: "生活", color: DEFAULT_CATEGORY_COLOR },
];

export function agentCategoryColor(headline?: string | null, displayName?: string | null): string {
  const text = `${headline ?? ""} ${displayName ?? ""}`;
  if (!text.trim()) return DEFAULT_CATEGORY_COLOR;
  for (const cat of AGENT_CATEGORIES) {
    for (const kw of cat.kw) {
      if (text.includes(kw)) return cat.color;
    }
  }
  return DEFAULT_CATEGORY_COLOR;
}

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  const palette = ["#0091ff","#6366f1","#8b5cf6","#ec4899","#f43f5e","#f97316","#eab308","#22c55e","#14b8a6","#06b6d4"];
  return palette[Math.abs(h) % palette.length];
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* Teardrop-pin SVG: viewBox 0 0 32 46, circle (16,16) r=14, tip (16,44).
 * Design: colored body → white inner circle → colored text (Google/Apple Maps style). */
const PIN_VB = "0 0 32 46";
const PIN_D = "M16 44C10 34 2 26 2 16A14 14 0 1 1 30 16C30 26 22 34 16 44Z";

let _pinClipId = 0;
function createAvatarPinIcon(agent: MapAgentMarker, highlight = false) {
  const bg = agentCategoryColor(agent.headline, agent.displayName);
  const w = highlight ? 30 : 24;
  const h = highlight ? 43 : 34;
  const shadow = highlight
    ? "drop-shadow(0 3px 8px rgba(0,0,0,.45))"
    : "drop-shadow(0 2px 5px rgba(0,0,0,.35))";
  const ring = highlight ? `<circle cx="16" cy="16" r="14" fill="none" stroke="${bg}" stroke-width="4" opacity=".18"/>` : "";
  const coverSrc = resolveLifeAgentCoverUrl(agent.coverImageUrl, agent.coverPresetKey);
  const cid = `pc${++_pinClipId}`;
  const innerContent = `<defs><clipPath id="${cid}"><circle cx="16" cy="16" r="9.5"/></clipPath></defs><image href="${escHtml(coverSrc)}" x="6.5" y="6.5" width="19" height="19" clip-path="url(#${cid})" preserveAspectRatio="xMidYMid slice"/>`;
  return L.divIcon({
    className: "life-agent-map-pin",
    html: `<div style="filter:${shadow}"><svg width="${w}" height="${h}" viewBox="${PIN_VB}">${ring}<path d="${PIN_D}" fill="${bg}"/>${innerContent}</svg></div>`,
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
  const w = 26;
  const h = 38;
  const fs = count > 99 ? 9 : count > 9 ? 11 : 12;
  return L.divIcon({
    className: "life-agent-map-cluster",
    html: `<div style="filter:drop-shadow(0 3px 8px rgba(124,58,237,.5))"><svg width="${w}" height="${h}" viewBox="${PIN_VB}"><path d="${PIN_D}" fill="#7c3aed"/><circle cx="16" cy="16" r="9.5" fill="rgba(255,255,255,.94)"/><text x="16" y="16" text-anchor="middle" dominant-baseline="central" fill="#7c3aed" font-size="${fs}" font-weight="700" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">${label}</text></svg></div>`,
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
        offset: [0, -28],
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

      {onExploreArea ? (
        <div className="pointer-events-none absolute bottom-4 left-0 right-0 z-[400] flex justify-center">
          <button
            type="button"
            className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_4px_16px_-4px_rgba(15,23,42,.35)] ring-1 ring-black/5 backdrop-blur-md transition active:scale-95 active:bg-white"
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
            <svg className="h-4 w-4 text-[#7c3aed]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            探索此区域
          </button>
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-0 z-[400]">
        <div className="pointer-events-auto absolute right-3 top-1/2 flex -translate-y-1/2 flex-col gap-2">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-slate-700 shadow-[0_12px_30px_-16px_rgba(15,23,42,.55)] ring-1 ring-white/80 backdrop-blur-md transition active:scale-95 active:bg-white"
            aria-label="放大"
            onClick={() => mapRef.current?.zoomIn()}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-slate-700 shadow-[0_12px_30px_-16px_rgba(15,23,42,.55)] ring-1 ring-white/80 backdrop-blur-md transition active:scale-95 active:bg-white"
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
        </div>
      </div>
    </div>
  );
}
