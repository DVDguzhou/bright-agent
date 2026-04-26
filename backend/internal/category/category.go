package category

import (
	"strings"
)

// Category 定义与前端 life-agent-category.ts 对齐的分类
type Category struct {
	Label string
	Color string
	KWs   []string
}

var Categories = []Category{
	{Label: "学习", Color: "#3b82f6", KWs: []string{"学习", "考研", "留学", "高考", "教育", "课程", "辅导", "考试", "托福", "雅思", "论文", "学术", "科研", "读博", "硕士", "本科", "GRE", "SAT", "IELTS", "TOEFL", "考公", "公务员", "保研", "考博", "备考", "复习", "培训", "家教", "申请", "招生", "奖学金"}},
	{Label: "就业", Color: "#0891b2", KWs: []string{"就业", "求职", "面试", "简历", "职场", "招聘", "实习", "跳槽", "薪资", "HR", "猎头", "职业", "入职", "转行", "offer", "校招", "社招", "秋招", "春招", "内推", "裁员", "劳动"}},
	{Label: "创业", Color: "#f59e0b", KWs: []string{"创业", "融资", "投资", "商业", "CEO", "合伙", "股权", "估值", "风投", "天使", "孵化", "副业", "开店", "个体户", "商业模式", "盈利", "营收", "自媒体", "品牌", "营销", "私域"}},
	{Label: "科技", Color: "#6366f1", KWs: []string{"科技", "编程", "代码", "AI", "人工智能", "互联网", "软件", "硬件", "开发", "程序", "IT", "区块链", "Web", "前端", "后端", "算法", "数据", "机器学习", "深度学习", "产品经理", "技术", "芯片", "半导体", "云计算", "大模型", "AGI", "GPT", "LLM", "网络安全"}},
	{Label: "金融", Color: "#14b8a6", KWs: []string{"金融", "理财", "基金", "股票", "期货", "保险", "银行", "贷款", "外汇", "加密", "比特币", "会计", "审计", "税务", "经济", "券商", "信托", "财务", "CFA", "CPA", "投行", "风控"}},
	{Label: "旅游", Color: "#10b981", KWs: []string{"旅游", "旅行", "出游", "自驾", "攻略", "签证", "机票", "酒店", "民宿", "度假", "背包", "露营", "穷游", "出境", "入境", "漫游", "航线", "邮轮"}},
	{Label: "美食", Color: "#f97316", KWs: []string{"美食", "做饭", "烹饪", "餐厅", "小吃", "菜谱", "烘焙", "咖啡", "料理", "厨艺", "吃货", "探店", "外卖", "火锅", "烧烤", "甜品", "面包", "酒吧", "茶艺", "品酒"}},
	{Label: "景点", Color: "#06b6d4", KWs: []string{"景点", "名胜", "古迹", "博物馆", "展览", "文化遗产", "寺庙", "古城", "园林", "故宫", "长城", "古镇", "世界遗产"}},
	{Label: "购物", Color: "#ec4899", KWs: []string{"购物", "代购", "时尚", "穿搭", "品牌", "奢侈品", "折扣", "优惠", "美妆", "护肤", "化妆", "服饰", "包包", "鞋", "潮牌", "中古", "买手", "海淘"}},
	{Label: "运动", Color: "#22c55e", KWs: []string{"运动", "健身", "跑步", "篮球", "足球", "游泳", "瑜伽", "马拉松", "户外", "登山", "骑行", "滑雪", "网球", "羽毛球", "体育", "拳击", "攀岩", "冲浪", "跳绳", "减脂", "增肌"}},
	{Label: "情感", Color: "#e11d48", KWs: []string{"情感", "恋爱", "婚姻", "分手", "两性", "亲子", "育儿", "婚恋", "相亲", "脱单", "挽回", "家庭", "夫妻", "离婚", "复合", "暧昧", "约会", "备孕", "怀孕", "产后", "带娃", "早教"}},
	{Label: "娱乐", Color: "#a855f7", KWs: []string{"八卦", "娱乐", "明星", "综艺", "电影", "电视", "音乐", "追星", "网红", "直播", "游戏", "动漫", "影视", "剧集", "小说", "漫画", "手游", "电竞", "二次元", "短视频", "Vlog", "UP主"}},
	{Label: "医疗", Color: "#ef4444", KWs: []string{"医疗", "健康", "医院", "医生", "疾病", "药物", "养生", "保健", "营养", "中医", "心理健康", "抑郁", "焦虑", "失眠", "康复", "理疗", "体检", "口腔", "眼科", "皮肤", "过敏", "疫苗"}},
	{Label: "房产", Color: "#84cc16", KWs: []string{"房产", "买房", "租房", "装修", "房价", "二手房", "新房", "物业", "家居", "家装", "软装", "验房", "贷款买房", "公积金", "学区房", "房东", "租客"}},
	{Label: "法律", Color: "#64748b", KWs: []string{"法律", "律师", "合同", "诉讼", "维权", "知识产权", "专利", "劳动法", "法规", "仲裁", "公证", "遗嘱", "离婚诉讼", "商标", "版权", "刑事", "民事"}},
	{Label: "艺术", Color: "#d946ef", KWs: []string{"艺术", "设计", "画画", "摄影", "书法", "舞蹈", "乐器", "创作", "手工", "陶艺", "绘画", "插画", "UI", "平面", "视觉", "美术", "素描", "水彩", "油画", "钢琴", "吉他", "声乐", "表演"}},
	{Label: "宠物", Color: "#f472b6", KWs: []string{"宠物", "养宠", "萌宠", "猫咪", "狗狗", "猫粮", "狗粮", "宠物医院", "遛狗", "猫砂", "水族", "爬宠", "仓鼠", "兔子", "鹦鹉"}},
	{Label: "汽车", Color: "#0ea5e9", KWs: []string{"汽车", "驾照", "买车", "二手车", "新能源", "电动车", "驾驶", "修车", "车险", "提车", "试驾", "特斯拉", "比亚迪", "充电桩", "加油", "洗车", "改装"}},
	{Label: "农业", Color: "#65a30d", KWs: []string{"农业", "种植", "养殖", "农村", "乡村", "三农", "有机", "农产品", "果园", "牧场", "渔业", "花卉", "园艺", "盆栽"}},
	{Label: "政务", Color: "#475569", KWs: []string{"政务", "政策", "政府", "公共", "社区", "公益", "慈善", "志愿", "环保", "碳中和", "新政", "民生", "社保", "医保", "户口", "落户", "居住证"}},
}

// DefaultCategoryLabel 是未匹配到分类时的默认值（生活）
const DefaultCategoryLabel = "生活"

// ExpandTagsByCategory 根据输入的标签/分类名，找到对应的分类并展开为完整关键词列表
func ExpandTagsByCategory(inputTags []string) []string {
	var result []string
	seen := make(map[string]struct{})

	for _, tag := range inputTags {
		tag = strings.TrimSpace(tag)
		if tag == "" {
			continue
		}
		// 先尝试精确匹配分类标签名
		matched := false
		for _, cat := range Categories {
			if cat.Label == tag {
				for _, kw := range cat.KWs {
					if _, ok := seen[kw]; !ok {
						seen[kw] = struct{}{}
						result = append(result, kw)
					}
				}
				matched = true
				break
			}
		}
		// 如果没有精确匹配分类名，也尝试关键词匹配
		if !matched {
			for _, cat := range Categories {
				for _, kw := range cat.KWs {
					if kw == tag {
						for _, k := range cat.KWs {
							if _, ok := seen[k]; !ok {
								seen[k] = struct{}{}
								result = append(result, k)
							}
						}
						matched = true
						break
					}
				}
				if matched {
					break
				}
			}
		}
		// 如果没匹配到任何分类，保留原始标签
		if !matched {
			if _, ok := seen[tag]; !ok {
				seen[tag] = struct{}{}
				result = append(result, tag)
			}
		}
	}
	return result
}

// MatchCategoriesForTags 根据输入的标签，找出匹配到的所有分类标签名
func MatchCategoriesForTags(inputTags []string) []string {
	var matched []string
	seen := make(map[string]struct{})
	for _, tag := range inputTags {
		tag = strings.TrimSpace(tag)
		if tag == "" {
			continue
		}
		for _, cat := range Categories {
			for _, kw := range cat.KWs {
				if kw == tag {
					if _, ok := seen[cat.Label]; !ok {
						seen[cat.Label] = struct{}{}
						matched = append(matched, cat.Label)
					}
					break
				}
			}
		}
	}
	return matched
}

// AllCategoryLabels 返回所有分类标签名
func AllCategoryLabels() []string {
	labels := make([]string, len(Categories))
	for i, cat := range Categories {
		labels[i] = cat.Label
	}
	return labels
}
