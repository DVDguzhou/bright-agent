const AGENT_CATEGORIES = [
  { color: "#3b82f6", kw: ["学习", "考研", "留学", "高考", "教育", "就业", "求职", "面试", "简历", "职场"] },
  { color: "#0891b2", kw: ["招聘", "实习", "跳槽", "薪资", "HR", "职业", "转行", "offer", "校招"] },
  { color: "#f59e0b", kw: ["创业", "融资", "投资", "商业", "副业", "营销"] },
  { color: "#1e40af", kw: ["科技", "编程", "AI", "互联网", "软件", "开发", "产品经理", "技术"] },
  { color: "#14b8a6", kw: ["金融", "理财", "基金", "股票", "保险", "银行", "财务"] },
  { color: "#10b981", kw: ["旅游", "旅行", "攻略", "签证", "酒店"] },
  { color: "#f97316", kw: ["美食", "烹饪", "餐厅", "咖啡"] },
  { color: "#06b6d4", kw: ["景点", "博物馆", "古迹"] },
  { color: "#ec4899", kw: ["购物", "时尚", "穿搭", "美妆"] },
  { color: "#22c55e", kw: ["运动", "健身", "跑步", "瑜伽"] },
  { color: "#e11d48", kw: ["情感", "恋爱", "婚姻", "育儿", "家庭"] },
  { color: "#c2410c", kw: ["娱乐", "明星", "电影", "游戏", "动漫"] },
  { color: "#ef4444", kw: ["医疗", "健康", "医院", "养生"] },
  { color: "#84cc16", kw: ["房产", "买房", "租房", "装修"] },
  { color: "#64748b", kw: ["法律", "律师", "合同", "维权"] },
  { color: "#7a1f1f", kw: ["艺术", "设计", "摄影", "绘画"] },
];

const DEFAULT_CATEGORY_COLOR = "#4a5a2f";

const LEGEND_ITEMS = [
  { label: "学习", color: "#3b82f6" },
  { label: "就业", color: "#0891b2" },
  { label: "创业", color: "#f59e0b" },
  { label: "科技", color: "#1e40af" },
  { label: "金融", color: "#14b8a6" },
  { label: "旅游", color: "#10b981" },
  { label: "美食", color: "#f97316" },
  { label: "景点", color: "#06b6d4" },
  { label: "购物", color: "#ec4899" },
  { label: "运动", color: "#22c55e" },
  { label: "情感", color: "#e11d48" },
  { label: "娱乐", color: "#c2410c" },
  { label: "医疗", color: "#ef4444" },
  { label: "房产", color: "#84cc16" },
  { label: "法律", color: "#64748b" },
  { label: "艺术", color: "#7a1f1f" },
  { label: "宠物", color: "#f472b6" },
  { label: "汽车", color: "#0ea5e9" },
  { label: "农业", color: "#65a30d" },
  { label: "政务", color: "#475569" },
  { label: "生活", color: DEFAULT_CATEGORY_COLOR },
];

function agentCategoryColor(headline, displayName) {
  const text = (headline || "") + " " + (displayName || "");
  if (!text.trim()) return DEFAULT_CATEGORY_COLOR;
  for (let i = 0; i < AGENT_CATEGORIES.length; i++) {
    const cat = AGENT_CATEGORIES[i];
    for (let j = 0; j < cat.kw.length; j++) {
      if (text.indexOf(cat.kw[j]) >= 0) return cat.color;
    }
  }
  return DEFAULT_CATEGORY_COLOR;
}

module.exports = {
  agentCategoryColor,
  DEFAULT_CATEGORY_COLOR,
  LEGEND_ITEMS,
};
