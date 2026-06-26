package lifeagent

import "strings"

const (
	sparseEntryRunesThreshold  = 80
	sparseSingleEntryThreshold = 120
)

// CatalogSparsity describes whether retrieved sources are too thin to elaborate into stories.
type CatalogSparsity struct {
	IsSparse      bool
	MaxEntryRunes int
}

// AssessCatalogSparsity checks if citation catalog items are too short for elaborate fiction.
func AssessCatalogSparsity(catalog CitationCatalog) CatalogSparsity {
	if len(catalog.Items) == 0 {
		return CatalogSparsity{}
	}
	maxRunes := 0
	knowledgeCount := 0
	totalKnowledgeRunes := 0
	for _, item := range catalog.Items {
		n := len([]rune(strings.TrimSpace(item.FullContent)))
		if n > maxRunes {
			maxRunes = n
		}
		if item.SourceType == "knowledge" {
			knowledgeCount++
			totalKnowledgeRunes += n
		}
	}
	sparse := maxRunes > 0 && maxRunes < sparseEntryRunesThreshold
	if knowledgeCount == 1 && totalKnowledgeRunes > 0 && totalKnowledgeRunes < sparseSingleEntryThreshold {
		sparse = true
	}
	return CatalogSparsity{IsSparse: sparse, MaxEntryRunes: maxRunes}
}

// AssessPlanSparsity builds a temporary catalog from a retrieval plan.
func AssessPlanSparsity(plan RetrievalPlan) CatalogSparsity {
	return AssessCatalogSparsity(BuildCitationCatalog(plan))
}

func sparseDraftKnowledgeGuidance() string {
	return "【素材极短 - 硬约束】\n" +
		"编号素材是唯一事实源。「详细点」= 把素材里的**事实**说得更口语、更有态度，不是编故事。\n" +
		"允许：口语重述 + 模糊情绪（记不太清/就那样/懒得展开/心关上了）。\n" +
		"禁止：素材里没有的地点、人物、过程、原因链、对话场景（如社团、明心湖、冷战、异地等）。\n\n"
}

func sparseReconcileRule() string {
	return "10. 【稀疏素材 - 最高优先级】草稿里凡素材未明确写出的情节/地点/人物/过程，一律删除。\n" +
		"    保留：素材事实的口语转述 + 不超过 2 句模糊感受（这些感受句不加引用）。\n" +
		"    输出应明显短于草稿；宁可短，不要编全。\n"
}

func sparseReconcileUserSuffix() string {
	return "\n\n注意：用户要求展开，但编号素材很短。请删去草稿中素材未支持的情节，输出保持简短。"
}

func sparseLengthTarget() LengthTarget {
	return LengthTarget{Label: "sparse_elaborate", MinChars: 80, MaxChars: 160, MinParas: 1, MaxParas: 2}
}

func sparseLengthPromptHint(pref LengthPreference) string {
	raw := pref.Raw
	if raw == "" {
		raw = "详细点"
	}
	return "对方要求展开（原话「" + raw + "」），但素材只有一两句。请把素材里的**事实**用更口语的方式说一遍，可加模糊感受（「那会儿挺短」「后来就没再碰了」），大约 80–160 字、1–2 段。**禁止**补地点、人物、过程、原因链、对话场景。"
}

func wantsElaboration(p PerceptionSnapshot) bool {
	if p.MetaInstr.Present && p.MetaInstr.Type == "want_detail" {
		return true
	}
	if p.LengthPref.Source == "explicit" && p.LengthPref.Direction == "elaborate" {
		return true
	}
	if p.LengthPref.Source == "sticky" && p.LengthPref.TurnsAgo <= 2 && p.LengthPref.Direction == "elaborate" {
		return true
	}
	return false
}

// ApplySparseStrategyOverride clamps elaborate targets when catalog is sparse.
func ApplySparseStrategyOverride(s *Strategy, sparsity CatalogSparsity, perc PerceptionSnapshot, plan RetrievalPlan) {
	if s == nil || !sparsity.IsSparse || !wantsElaboration(perc) {
		return
	}
	if hasIntroBackgroundMaterial(perc.IntroIntent, plan) {
		return
	}
	lt := sparseLengthTarget()
	s.LengthTarget = lt
	s.PromptLengthHint = sparseLengthPromptHint(perc.LengthPref)
	if s.Debug != "" {
		s.Debug += " | sparse=1"
	} else {
		s.Debug = "sparse=1"
	}
}
