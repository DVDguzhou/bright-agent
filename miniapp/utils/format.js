const TOPIC_GROUP_LABELS = {
  education: "教育升学",
  career: "职业发展",
  industry: "行业认知",
  cityChoice: "城市选择",
  startup: "创业",
  money: "财务",
  relationship: "感情",
  family: "家庭",
  mental: "心理",
  lifeChoice: "人生选择",
  social: "社交",
  other: "其他",
};

const LIVE_UPDATE_CATEGORY_LABELS = {
  general: "综合",
  market: "行情",
  job: "求职",
  study: "升学",
  housing: "房产",
  life: "生活",
  policy: "当地政策",
  cost: "物价",
  community: "社区",
  transport: "交通",
  weather: "气候",
  resource: "本地资源",
};

function formatSessionTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    const h = d.getHours();
    const m = d.getMinutes();
    return `${h < 10 ? "0" + h : h}:${m < 10 ? "0" + m : m}`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "昨天";
  const y = d.getFullYear();
  if (y === now.getFullYear()) return `${d.getMonth() + 1}/${d.getDate()}`;
  return `${y}/${d.getMonth() + 1}/${d.getDate()}`;
}

function formatRating(score) {
  if (!score || score <= 0) return "—";
  return Number(score).toFixed(1);
}

function formatYuan(cents) {
  if (!cents) return "0";
  return (cents / 100).toFixed(0);
}

function topicGroupLabel(key) {
  return TOPIC_GROUP_LABELS[key] || key || "";
}

function liveUpdateCategoryLabel(key) {
  return LIVE_UPDATE_CATEGORY_LABELS[key] || key || "";
}

function formatFreshDays(days) {
  if (days === 0) return "今天";
  return `${days}天前`;
}

// dedupeAdjacent：去掉相邻重复段（直辖市省=市，如「北京 · 北京」→「北京」）。
function dedupeAdjacent(parts) {
  var out = [];
  for (var i = 0; i < parts.length; i++) {
    if (out.length === 0 || out[out.length - 1] !== parts[i]) out.push(parts[i]);
  }
  return out;
}

function buildAreaLabel(city, province) {
  return dedupeAdjacent([city, province].filter(Boolean)).join(" · ");
}

function buildFullArea(country, province, city, county) {
  return dedupeAdjacent([country, province, city, county].filter(Boolean)).join(" · ");
}

function ratingStars(score) {
  const s = Math.max(0, Math.min(5, Math.round(score || 0)));
  return "★".repeat(s) + "☆".repeat(5 - s);
}

function formatReviewDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  if (!Number.isFinite(diff)) return "";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return minutes + "分钟前";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + "小时前";
  const days = Math.floor(hours / 24);
  if (days < 30) return days + "天前";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.getFullYear() + "/" + (d.getMonth() + 1) + "/" + d.getDate();
}

module.exports = {
  formatSessionTime,
  formatTimeAgo,
  formatRating,
  formatYuan,
  topicGroupLabel,
  liveUpdateCategoryLabel,
  formatFreshDays,
  buildAreaLabel,
  buildFullArea,
  ratingStars,
  formatReviewDate,
};
