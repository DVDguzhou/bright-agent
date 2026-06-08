package main

import (
	"encoding/json"
	"fmt"
	"log"
	"sort"
	"strings"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
)

// labelRulesForProfile 去掉「研途榜样导入 / AI / 导入」等痕迹，换成自然表述。
// creatorName 用于把「研途榜样导入」替换成 Agent 昵称；文件模式可传空（则用「学长本人」）。
func labelRulesForProfile(creatorName string) []replaceRule {
	if strings.TrimSpace(creatorName) == "" {
		creatorName = "学长本人"
	}
	rules := []replaceRule{
		{From: "研途榜样导入", To: creatorName},
		{From: "研途榜样·AI分身", To: "个人整理"},
		{From: "研途榜样公众号", To: "学长投稿"},
		{From: "研途榜样｜考研经验（原文整理）", To: "考研经验"},
		{From: "研途榜样｜", To: ""},
		{From: "「研途榜样」", To: "「学长分享」"},
		{From: "研途榜样", To: "上岸经验"},
		{From: "（AI人设扩写）", To: ""},
		{From: "AI人设扩写", To: ""},
		{From: "（AI分身）", To: ""},
		{From: "AI分身", To: ""},
		{From: "人设扩写", To: ""},
		{From: "批量导入", To: ""},
		{From: "（原文整理）", To: ""},
		{From: "原文整理", To: "经历分享"},
		{From: "GPT整理", To: "整理"},
		{From: "AI整理", To: "整理"},
		{From: "AI生成", To: ""},
		{From: "自动生成", To: ""},
		{From: "yantu-import@demo.com", To: ""},
	}
	sortRulesByLength(rules)
	return rules
}

func sortRulesByLength(rules []replaceRule) {
	sort.Slice(rules, func(i, j int) bool {
		if len(rules[i].From) != len(rules[j].From) {
			return len(rules[i].From) > len(rules[j].From)
		}
		return rules[i].From < rules[j].From
	})
}

func effectiveRules(
	p models.LifeAgentProfile,
	nameRules []replaceRule,
	scope string,
	replaceWith string,
	extra []replaceRule,
	stripLabels bool,
) []replaceRule {
	var base []replaceRule
	if scope == "profile" {
		base = rulesForProfile(p, replaceWith)
	} else {
		base = nameRules
	}
	out := mergeRules(base, extra)
	if stripLabels {
		out = mergeRules(out, labelRulesForProfile(p.DisplayName))
	}
	return out
}

func sanitizeSource(s *string, rules []replaceRule) *string {
	if s == nil {
		return nil
	}
	v := applyRules(strings.TrimSpace(*s), rules)
	v = strings.TrimSpace(v)
	if v == "" || stigmaRemain(v) {
		neutral := "个人经历"
		return &neutral
	}
	return &v
}

func stigmaRemain(s string) bool {
	lower := strings.ToLower(s)
	markers := []string{"导入", "研途榜样", "ai", "gpt", "自动生成", "原文整理", "人设扩写"}
	for _, m := range markers {
		if strings.Contains(lower, strings.ToLower(m)) {
			return true
		}
	}
	return false
}

func applyRulesJSONArray(arr models.JSONArray, rules []replaceRule) models.JSONArray {
	if len(arr) == 0 || len(rules) == 0 {
		return arr
	}
	b, err := json.Marshal(arr)
	if err != nil {
		return arr
	}
	s := applyRules(string(b), rules)
	var out models.JSONArray
	if err := json.Unmarshal([]byte(s), &out); err != nil {
		return arr
	}
	return out
}

func needsUserNameFix(name string) bool {
	n := strings.TrimSpace(name)
	if n == "" {
		return false
	}
	lower := strings.ToLower(n)
	markers := []string{"导入", "研途榜样", "import", "ai", "gpt", "自动生成"}
	for _, m := range markers {
		if strings.Contains(lower, strings.ToLower(m)) {
			return true
		}
	}
	return false
}

func pickUserDisplayName(profiles []models.LifeAgentProfile, email string) string {
	if len(profiles) == 1 {
		return profiles[0].DisplayName
	}
	if strings.HasPrefix(email, "persona+") && len(profiles) > 0 {
		return profiles[0].DisplayName
	}
	return "学长本人"
}

func previewFixUserNames(apply bool) int {
	var users []models.User
	if err := db.DB.Find(&users).Error; err != nil {
		log.Fatalf("query users: %v", err)
	}
	n := 0
	for _, u := range users {
		if u.Name == nil || !needsUserNameFix(*u.Name) {
			continue
		}
		var profiles []models.LifeAgentProfile
		if err := db.DB.Where("user_id = ?", u.ID).Find(&profiles).Error; err != nil {
			log.Fatalf("query profiles for user %s: %v", u.ID, err)
		}
		newName := pickUserDisplayName(profiles, u.Email)
		fmt.Printf("  创建者 %s: %q → %q（%d 个 Agent）\n", u.Email, *u.Name, newName, len(profiles))
		if apply {
			if err := db.DB.Model(&models.User{}).Where("id = ?", u.ID).Update("name", newName).Error; err != nil {
				log.Fatalf("update user %s: %v", u.ID, err)
			}
		}
		n++
	}
	return n
}
