package lifeagent

import "strings"

// AnswerPolicy decides how to answer: grounded reconcile, advisory general, soft personal, or hard fallback.
type AnswerPolicy string

const (
	PolicyGrounded      AnswerPolicy = "grounded"
	PolicyAdvisory      AnswerPolicy = "advisory"
	PolicySoftPersonal  AnswerPolicy = "soft_personal"
	PolicyHardFallback  AnswerPolicy = "hard_fallback"
)

// ClassifyAnswerPolicy picks response strategy from retrieval hits and question shape.
func ClassifyAnswerPolicy(message string, plan RetrievalPlan, opts *ChatOptions) AnswerPolicy {
	hasTargets := PlanHasArbitrationTargets(plan)
	if opts != nil && !allowsGeneralKnowledge(opts) && !hasTargets {
		return PolicyHardFallback
	}
	if hasTargets && asksPersonalExperience(message) {
		return PolicyGrounded
	}
	if asksPersonalExperience(message) && !hasTargets {
		return PolicySoftPersonal
	}
	if isAdvisoryQuestion(message) {
		return PolicyAdvisory
	}
	if hasTargets {
		return PolicyGrounded
	}
	if opts != nil && !allowsGeneralKnowledge(opts) {
		return PolicyHardFallback
	}
	return PolicyAdvisory
}

func asksPersonalExperience(message string) bool {
	norm := normalize(message)
	return containsAnyNormalized(norm, []string{
		"你当时", "你那会", "你那个时候", "你当年", "你大二", "你大三", "你大四", "你大一",
		"你的经历", "你经历", "你做过", "你参加", "你去过", "你读过", "你学过",
		"你本人", "你自己", "你个人", "你的故事", "你的故事", "分享一下你",
		"能不能说说你", "讲讲你", "聊聊你",
	})
}

func isAdvisoryQuestion(message string) bool {
	norm := normalize(message)
	return containsAnyNormalized(norm, []string{
		"怎么办", "怎么选", "怎么准备", "怎么规划", "怎么取舍", "如何", "建议",
		"值不值", "要不要", "该不该", "有没有必要", "推荐吗", "靠谱吗",
		"怎么学", "怎么入门", "怎么提升", "怎么坚持", "路径", "规划",
	})
}

func answerPolicyGuidance(policy AnswerPolicy) string {
	switch policy {
	case PolicyAdvisory:
		return "【通识建议场景】这是给建议/方法类问题。用「一般来说」「我见过有人」「大概可以」这类说法；不要编造「我当年/我那时候」式的个人经历；没有素材就别装亲历。"
	case PolicySoftPersonal:
		return "【个人经历但素材不足】对方在问你的事，但你这边没有对应素材。用推测/模糊语气（「我猜」「可能」「看情况」「记不太清了」），不要断言具体发生过什么；别整段说「没经历过/不太懂」。"
	case PolicyGrounded:
		return "【个人经历对齐】具体经历、时间线必须和注入素材一致；用了哪条素材的信息，最终正文里要有对应引用标注。"
	default:
		return ""
	}
}

func attributionForPolicy(policy AnswerPolicy) string {
	switch policy {
	case PolicyGrounded:
		return AttributionGrounded
	case PolicyHardFallback:
		return AttributionFallback
	default:
		return AttributionGeneral
	}
}

func ApplyClaimGuardWithPolicy(message, content string, facts []StructuredFactForAI, plan RetrievalPlan, policy AnswerPolicy) string {
	content = strings.TrimSpace(content)
	if content == "" {
		return content
	}

	confirmed := filterConfirmedFacts(facts)
	content = applyClaimLevelFixes(content, confirmed)

	if intent, ok := detectFactIntent(message); ok {
		matched := factsForKey(intent.Key, facts)
		if len(matched) > 0 {
			expected := matched[0].FactValue
			if intent.Key != "event_name" && !strings.Contains(content, expected) {
				return buildFactReply(intent.Key, matched)
			}
		}
		if len(matched) == 0 && policy != PolicyAdvisory {
			return pickRandom(fallbackSpeculative)
		}
	}

	return content
}
