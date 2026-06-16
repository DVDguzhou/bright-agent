package handler

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"hash/fnv"
	"io"
	"log"
	"net/http"
	"net/url"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/agent-marketplace/backend/internal/category"
	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/lifeagent"
	"github.com/agent-marketplace/backend/internal/middleware"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/agent-marketplace/backend/internal/tts"
	"github.com/agent-marketplace/backend/internal/yantuseed"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func ptrStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
func strOpt(v string) *string {
	if v == "" {
		return nil
	}
	return &v
}

var errLifeAgentLimitReached = errors.New("life agent limit reached")

func wantsEventStream(c *gin.Context) bool {
	return strings.Contains(strings.ToLower(c.GetHeader("Accept")), "text/event-stream")
}

func isMiniAppClient(c *gin.Context) bool {
	return strings.EqualFold(strings.TrimSpace(c.GetHeader("X-BrightAgent-Client")), "miniapp")
}

// 无限对话模式下 API 返回的 remainingQuestions 哨兵值（前端不展示次数）。
const lifeAgentUnlimitedRemainingSentinel = -1

func lifeAgentViewerRemaining(cfg *config.Config, remaining int) int {
	if cfg.LifeAgentUnlimitedChat {
		return lifeAgentUnlimitedRemainingSentinel
	}
	return remaining
}

func writeSSE(c *gin.Context, eventType string, payload interface{}) {
	data, _ := json.Marshal(payload)
	fmt.Fprintf(c.Writer, "event: %s\ndata: %s\n\n", eventType, data)
	c.Writer.Flush()
}

func buildStoredAudioURL(msg *models.LifeAgentChatMessage) string {
	if msg == nil {
		return ""
	}
	if msg.AudioURL != nil && strings.TrimSpace(*msg.AudioURL) != "" {
		return strings.TrimSpace(*msg.AudioURL)
	}
	if msg.AudioFormat != nil && strings.TrimSpace(*msg.AudioFormat) != "" {
		return "/api/audio/" + msg.ID + "." + strings.TrimSpace(*msg.AudioFormat)
	}
	return ""
}

func coalesceVerificationStatus(v string) string {
	switch v {
	case "verified", "pending":
		return v
	default:
		return "none"
	}
}

func lifeAgentClaimStatus(p *models.LifeAgentProfile) gin.H {
	isFeatured := p.FeaturedRank != nil || strings.TrimSpace(ptrStr(p.FeaturedCollection)) != ""
	claimed := isFeatured
	if !claimed {
		h := fnv.New32a()
		_, _ = h.Write([]byte(p.ID))
		claimed = h.Sum32()%10 < 8
	}
	if claimed {
		return gin.H{"status": "claimed", "label": "已认领", "isClaimed": true}
	}
	return gin.H{"status": "unclaimed", "label": "未认领", "isClaimed": false}
}

// 用户/接口可保存的预设键（产品侧枚举）；与是否已部署静态 PNG 无关。
var allowedLifeAgentCoverPresets = map[string]struct{}{
	"01-student-panda":  {},
	"02-robot-pro":      {},
	"03-scholar-owl":    {},
	"04-social-fox":     {},
	"05-achiever-dino":  {},
	"06-wellness-cloud": {},
	"07-city-bear":      {},
	"08-service-dog":    {},
}

// 仓库里确有 public/life-agent-cover-presets/{key}.png 时才加入；与前端 SHIPPED_LIFE_AGENT_PRESET_PNG_KEYS 同步。
// lifeAgentCoverURL 只对本 map 中的键返回 .png，否则一律默认 SVG，避免长期 404 裂图。
var lifeAgentShippedCoverPresetPNGs = map[string]struct{}{
	// 例如部署了 03-scholar-owl.png 后追加: "03-scholar-owl": {},
}

func validateLifeAgentCoverImageURL(u string) bool {
	if u == "" || len(u) > 512 {
		return false
	}
	if strings.Contains(u, "..") {
		return false
	}
	// 允许 Unsplash CDN 外链封面（免版税图库，见 https://unsplash.com/license）
	if parsed, err := url.Parse(u); err == nil && parsed.Scheme == "https" && parsed.Host == "images.unsplash.com" &&
		strings.HasPrefix(parsed.Path, "/photo-") {
		return true
	}
	if !strings.HasPrefix(u, "/") {
		return false
	}
	return strings.HasPrefix(u, "/uploads/life-agent-covers/") ||
		strings.HasPrefix(u, "/api/upload/life-agent-cover/") ||
		strings.HasPrefix(u, "/life-agent-cover-presets/")
}

// 与前端 public/life-agent-cover-presets/default-cover.png 一致（另有 default-cover.svg 作备用资源）
const lifeAgentDefaultCoverURL = "/life-agent-cover-presets/default-cover.png"

func lifeAgentCoverURL(p *models.LifeAgentProfile) string {
	if p.CoverImageURL != nil && strings.TrimSpace(*p.CoverImageURL) != "" {
		return strings.TrimSpace(*p.CoverImageURL)
	}
	if p.CoverPresetKey != nil {
		k := strings.TrimSpace(*p.CoverPresetKey)
		if k != "" {
			if _, ok := lifeAgentShippedCoverPresetPNGs[k]; ok {
				return "/life-agent-cover-presets/" + k + ".png"
			}
		}
	}
	return lifeAgentDefaultCoverURL
}

func userStoredAvatarFallback(avatarURL *string) string {
	if avatarURL != nil {
		if s := strings.TrimSpace(*avatarURL); s != "" {
			return s
		}
	}
	return lifeAgentDefaultCoverURL
}

// userDisplayAvatarURL 用户展示头像：优先返回名下 Agent 封面；尚无 Agent 时回退 users.avatar_url（如注册时上传的头像）。
func userDisplayAvatarURL(userID string, avatarURL *string) string {
	var p models.LifeAgentProfile
	if err := db.DB.Where("user_id = ?", userID).Order("published DESC, updated_at DESC").First(&p).Error; err != nil {
		return userStoredAvatarFallback(avatarURL)
	}
	return lifeAgentCoverURL(&p)
}

// SyncPrimaryAgentCoverToUserAvatar 从主 Agent 解析封面，并绑定到用户头像及全部 Agent。
func SyncPrimaryAgentCoverToUserAvatar(userID string) error {
	var p models.LifeAgentProfile
	err := db.DB.Where("user_id = ?", userID).Order("published DESC, updated_at DESC").First(&p).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		return err
	}
	resolved := lifeAgentCoverURL(&p)
	return applyAvatarBinding(userID, &resolved)
}

// buildUserDisplayAvatarMap 批量解析用户展示头像（与 Agent 封面绑定）。
func buildUserDisplayAvatarMap(userIDs []string) map[string]string {
	out := make(map[string]string, len(userIDs))
	if len(userIDs) == 0 {
		return out
	}
	uniq := make([]string, 0, len(userIDs))
	seen := make(map[string]bool, len(userIDs))
	for _, id := range userIDs {
		if id == "" || seen[id] {
			continue
		}
		seen[id] = true
		uniq = append(uniq, id)
	}
	if len(uniq) == 0 {
		return out
	}

	var agents []models.LifeAgentProfile
	db.DB.Where("user_id IN ?", uniq).Order("published DESC, updated_at DESC").Find(&agents)
	picked := make(map[string]bool, len(uniq))
	for _, a := range agents {
		if picked[a.UserID] {
			continue
		}
		picked[a.UserID] = true
		out[a.UserID] = lifeAgentCoverURL(&a)
	}
	missing := make([]string, 0, len(uniq))
	for _, id := range uniq {
		if _, ok := out[id]; !ok {
			missing = append(missing, id)
		}
	}
	if len(missing) > 0 {
		var users []models.User
		db.DB.Select("id", "avatar_url").Where("id IN ?", missing).Find(&users)
		for _, u := range users {
			out[u.ID] = userStoredAvatarFallback(u.AvatarURL)
		}
		for _, id := range missing {
			if _, ok := out[id]; !ok {
				out[id] = lifeAgentDefaultCoverURL
			}
		}
	}
	return out
}

// buildFeedbackSignals 从 DB 聚合该 Agent 的反馈信号，用于 Feedback-Aware Retrieval。
// 按 source_refs 中的 topicID / entryID 归类反馈计数。
func buildFeedbackSignals(profileID string) *lifeagent.FeedbackSignals {
	var feedbacks []models.LifeAgentFeedback
	db.DB.Where("profile_id = ?", profileID).Find(&feedbacks)
	if len(feedbacks) == 0 {
		return nil
	}

	topicStats := make(map[string]lifeagent.FeedbackStat)
	entryStats := make(map[string]lifeagent.FeedbackStat)

	for _, fb := range feedbacks {
		for _, raw := range fb.SourceRefs {
			refMap, ok := raw.(map[string]interface{})
			if !ok {
				continue
			}
			sourceType, _ := refMap["sourceType"].(string)
			refID, _ := refMap["id"].(string)
			if refID == "" {
				continue
			}

			var statsMap map[string]lifeagent.FeedbackStat
			switch sourceType {
			case "topic":
				statsMap = topicStats
			case "knowledge":
				statsMap = entryStats
			default:
				continue
			}

			stat := statsMap[refID]
			switch fb.FeedbackType {
			case "helpful":
				stat.Helpful++
			case "not_specific":
				stat.NotSpecific++
			case "factual_error":
				stat.FactualError++
			case "contradiction":
				stat.Contradiction++
			case "too_confident":
				stat.TooConfident++
			}
			statsMap[refID] = stat
		}
	}

	if len(topicStats) == 0 && len(entryStats) == 0 {
		return nil
	}
	return &lifeagent.FeedbackSignals{
		TopicStats: topicStats,
		EntryStats: entryStats,
	}
}

func loadMindScoreInput(profileID string, p *models.LifeAgentProfile, cfg *config.Config) lifeagent.MindScoreInput {
	var entries []models.LifeAgentKnowledgeEntry
	db.DB.Where("profile_id = ?", profileID).Order("sort_order").Find(&entries)
	var timelineRows []models.LifeAgentTimelineEvent
	db.DB.Where("profile_id = ? AND status IN ?", profileID, []string{"confirmed", "needs_clarification"}).
		Order("sequence_order ASC, created_at ASC").Limit(20).Find(&timelineRows)
	var facts []models.LifeAgentStructuredFact
	db.DB.Where("profile_id = ?", profileID).Find(&facts)
	var topics []models.LifeAgentTopicSummary
	db.DB.Where("profile_id = ?", profileID).Find(&topics)
	var totalSess, helpful, notSpecific, notSuitable, factualError, contradiction, tooConfident, blindSpots int64
	db.DB.Model(&models.LifeAgentChatSession{}).Where("profile_id = ?", profileID).Count(&totalSess)
	db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id = ? AND feedback_type = ?", profileID, "helpful").Count(&helpful)
	db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id = ? AND feedback_type = ?", profileID, "not_specific").Count(&notSpecific)
	db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id = ? AND feedback_type = ?", profileID, "not_suitable").Count(&notSuitable)
	db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id = ? AND feedback_type = ?", profileID, "factual_error").Count(&factualError)
	db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id = ? AND feedback_type = ?", profileID, "contradiction").Count(&contradiction)
	db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id = ? AND feedback_type = ?", profileID, "too_confident").Count(&tooConfident)
	db.DB.Model(&models.LifeAgentBlindSpot{}).Where("profile_id = ? AND resolved = ?", profileID, false).Count(&blindSpots)
	return lifeagent.MindScoreInput{
		Profile:      p,
		Entries:      entries,
		Facts:        facts,
		Topics:       topics,
		HasVoice:     cfg.VoiceReplyConfigured(ptrStr(p.VoiceCloneID)),
		SessionCount: totalSess,
		Helpful:      helpful,
		NotSpecific:  notSpecific,
		NotSuitable:  notSuitable,
		FactualError: factualError,
		Contradict:   contradiction,
		TooConfident: tooConfident,
		BlindSpots:   blindSpots,
	}
}

type mindScoreFeedbackCounts struct {
	Helpful      int64
	NotSpecific  int64
	NotSuitable  int64
	FactualError int64
	Contradict   int64
	TooConfident int64
	BlindSpots   int64
}

func batchComputeMindScores(profiles []models.LifeAgentProfile, cfg *config.Config) map[string]lifeagent.MindScoreBreakdown {
	if len(profiles) == 0 {
		return nil
	}
	ids := make([]string, len(profiles))
	for i, p := range profiles {
		ids[i] = p.ID
	}

	var allEntries []models.LifeAgentKnowledgeEntry
	db.DB.Where("profile_id IN ?", ids).Order("sort_order").Find(&allEntries)
	entriesByProfile := make(map[string][]models.LifeAgentKnowledgeEntry, len(ids))
	for _, e := range allEntries {
		entriesByProfile[e.ProfileID] = append(entriesByProfile[e.ProfileID], e)
	}

	var allFacts []models.LifeAgentStructuredFact
	db.DB.Where("profile_id IN ?", ids).Find(&allFacts)
	factsByProfile := make(map[string][]models.LifeAgentStructuredFact, len(ids))
	for _, f := range allFacts {
		factsByProfile[f.ProfileID] = append(factsByProfile[f.ProfileID], f)
	}

	var allTopics []models.LifeAgentTopicSummary
	db.DB.Where("profile_id IN ?", ids).Find(&allTopics)
	topicsByProfile := make(map[string][]models.LifeAgentTopicSummary, len(ids))
	for _, t := range allTopics {
		topicsByProfile[t.ProfileID] = append(topicsByProfile[t.ProfileID], t)
	}

	type aggRow struct {
		ProfileID string `gorm:"column:profile_id"`
		Cnt       int64  `gorm:"column:cnt"`
	}
	sessMap := make(map[string]int64, len(ids))
	var sessRows []aggRow
	db.DB.Raw("SELECT profile_id, COUNT(*) AS cnt FROM life_agent_chat_sessions WHERE profile_id IN ? GROUP BY profile_id", ids).Scan(&sessRows)
	for _, r := range sessRows {
		sessMap[r.ProfileID] = r.Cnt
	}

	fbMap := make(map[string]mindScoreFeedbackCounts, len(ids))
	type fbRow struct {
		ProfileID    string `gorm:"column:profile_id"`
		FeedbackType string `gorm:"column:feedback_type"`
		Cnt          int64  `gorm:"column:cnt"`
	}
	var fbRows []fbRow
	db.DB.Raw("SELECT profile_id, feedback_type, COUNT(*) AS cnt FROM life_agent_feedbacks WHERE profile_id IN ? GROUP BY profile_id, feedback_type", ids).Scan(&fbRows)
	for _, r := range fbRows {
		c := fbMap[r.ProfileID]
		switch r.FeedbackType {
		case "helpful":
			c.Helpful = r.Cnt
		case "not_specific":
			c.NotSpecific = r.Cnt
		case "not_suitable":
			c.NotSuitable = r.Cnt
		case "factual_error":
			c.FactualError = r.Cnt
		case "contradiction":
			c.Contradict = r.Cnt
		case "too_confident":
			c.TooConfident = r.Cnt
		}
		fbMap[r.ProfileID] = c
	}
	var blindRows []aggRow
	db.DB.Raw("SELECT profile_id, COUNT(*) AS cnt FROM life_agent_blind_spots WHERE profile_id IN ? AND resolved = ? GROUP BY profile_id", ids, false).Scan(&blindRows)
	for _, r := range blindRows {
		c := fbMap[r.ProfileID]
		c.BlindSpots = r.Cnt
		fbMap[r.ProfileID] = c
	}

	out := make(map[string]lifeagent.MindScoreBreakdown, len(profiles))
	for i := range profiles {
		p := profiles[i]
		fb := fbMap[p.ID]
		out[p.ID] = lifeagent.ComputeMindScore(lifeagent.MindScoreInput{
			Profile:      &p,
			Entries:      entriesByProfile[p.ID],
			Facts:        factsByProfile[p.ID],
			Topics:       topicsByProfile[p.ID],
			HasVoice:     cfg.VoiceReplyConfigured(ptrStr(p.VoiceCloneID)),
			SessionCount: sessMap[p.ID],
			Helpful:      fb.Helpful,
			NotSpecific:  fb.NotSpecific,
			NotSuitable:  fb.NotSuitable,
			FactualError: fb.FactualError,
			Contradict:   fb.Contradict,
			TooConfident: fb.TooConfident,
			BlindSpots:   fb.BlindSpots,
		})
	}
	return out
}

func mindScoreToJSON(score lifeagent.MindScoreBreakdown, delta *int) gin.H {
	resp := gin.H{
		"total":                score.Total,
		"level":                score.Level,
		"levelLabel":           score.LevelLabel,
		"foundation":           score.Foundation,
		"topicCoverage":        score.TopicCoverage,
		"topicDepth":           score.TopicDepth,
		"experience":           score.Experience,
		"relationship":         score.Relationship,
		"opinion":              score.Opinion,
		"style":                score.Style,
		"conversation":         score.Conversation,
		"feedbackFix":          score.FeedbackFix,
		"feedbackQualityRatio": score.FeedbackQualityRatio,
	}
	if delta != nil {
		resp["delta"] = *delta
	}
	return resp
}

func buildNextSuggestionContext(profileID string, p *models.LifeAgentProfile, cfg *config.Config, lastMessage string, turnCount int, toneChanged, exampleRepliesChanged bool) lifeagent.NextSuggestionContext {
	input := loadMindScoreInput(profileID, p, cfg)
	var blindSpots []models.LifeAgentBlindSpot
	db.DB.Where("profile_id = ? AND resolved = ?", profileID, false).Order("created_at DESC").Limit(10).Find(&blindSpots)
	topicLabels := make(map[string]string)
	for _, t := range input.Topics {
		topicLabels[t.ID] = t.TopicLabel
	}
	var bsForAlert []lifeagent.BlindSpotForFollowUp
	for _, s := range blindSpots {
		bsForAlert = append(bsForAlert, lifeagent.BlindSpotForFollowUp{UserQuestion: s.UserQuestion, Route: s.Route})
	}
	return lifeagent.NextSuggestionContext{
		Profile:               p,
		Entries:               input.Entries,
		Facts:                 input.Facts,
		Topics:                input.Topics,
		HasVoice:              input.HasVoice,
		FeedbackSignals:       buildFeedbackSignals(profileID),
		TopicLabels:           topicLabels,
		BlindSpots:            bsForAlert,
		LastMessage:           lastMessage,
		TurnCount:             turnCount,
		ToneChanged:           toneChanged,
		ExampleRepliesChanged: exampleRepliesChanged,
	}
}

func buildLifeAgentRatingState(profileID, buyerID string) gin.H {
	var usedQuestions int
	db.DB.Raw(
		"SELECT COALESCE(SUM(questions_used), 0) FROM life_agent_question_packs WHERE profile_id = ? AND buyer_id = ? AND status = ?",
		profileID, buyerID, "paid",
	).Scan(&usedQuestions)

	var rating models.LifeAgentRating
	hasRating := db.DB.Where("profile_id = ? AND buyer_id = ?", profileID, buyerID).First(&rating).Error == nil

	currentMilestone := (usedQuestions / 10) * 10
	eligible := currentMilestone >= 10 && (usedQuestions%10 == 0 || (hasRating && rating.LastRatedMilestone == currentMilestone))
	nextMilestone := 10
	if currentMilestone >= 10 {
		if eligible && (!hasRating || rating.LastRatedMilestone < currentMilestone) {
			nextMilestone = currentMilestone
		} else {
			nextMilestone = currentMilestone + 10
		}
	}

	state := gin.H{
		"usedQuestions":      usedQuestions,
		"eligible":           eligible,
		"nextMilestone":      nextMilestone,
		"currentMilestone":   currentMilestone,
		"lastRatedMilestone": 0,
		"currentScore":       nil,
		"currentComment":     "",
	}
	if hasRating {
		state["lastRatedMilestone"] = rating.LastRatedMilestone
		state["currentScore"] = rating.Score
		state["currentComment"] = ptrStr(rating.Comment)
	}
	return state
}

func buildLifeAgentRatingsSummary(profileID string, limit int) gin.H {
	var average float64
	var raters int64
	db.DB.Model(&models.LifeAgentRating{}).Where("profile_id = ?", profileID).Count(&raters)
	db.DB.Model(&models.LifeAgentRating{}).Where("profile_id = ?", profileID).Select("COALESCE(AVG(score),0)").Scan(&average)

	var recent []models.LifeAgentRating
	db.DB.Where("profile_id = ?", profileID).Order("updated_at DESC").Limit(limit).Find(&recent)
	list := make([]gin.H, 0, len(recent))
	for _, r := range recent {
		list = append(list, gin.H{
			"id":        r.ID,
			"score":     r.Score,
			"comment":   r.Comment,
			"updatedAt": r.UpdatedAt.Format("2006-01-02 15:04"),
		})
	}

	return gin.H{
		"averageScore": average,
		"raters":       raters,
		"recent":       list,
	}
}

func buildLifeAgentChatReferences(refs models.JSONAny) []gin.H {
	list := make([]gin.H, 0, len(refs))
	for _, item := range refs {
		refMap, ok := item.(map[string]interface{})
		if !ok {
			continue
		}
		list = append(list, gin.H{
			"id":         refMap["id"],
			"sourceType": refMap["sourceType"],
			"factKey":    refMap["factKey"],
			"topicGroup": refMap["topicGroup"],
			"topicKey":   refMap["topicKey"],
			"category":   refMap["category"],
			"title":      refMap["title"],
			"excerpt":    refMap["excerpt"],
			"confidence": refMap["confidence"],
		})
	}
	return list
}

func buildStructuredFactResponses(facts []models.LifeAgentStructuredFact) []gin.H {
	list := make([]gin.H, 0, len(facts))
	for _, fact := range facts {
		list = append(list, gin.H{
			"id":              fact.ID,
			"factKey":         fact.FactKey,
			"factValue":       fact.FactValue,
			"factType":        fact.FactType,
			"source":          fact.Source,
			"confidence":      fact.Confidence,
			"status":          fact.Status,
			"evidence":        fact.Evidence,
			"lastConfirmedAt": fact.LastConfirmedAt,
		})
	}
	return list
}

func buildTopicSummaryResponses(topics []models.LifeAgentTopicSummary) []gin.H {
	list := make([]gin.H, 0, len(topics))
	for _, topic := range topics {
		list = append(list, gin.H{
			"id":                topic.ID,
			"topicGroup":        topic.TopicGroup,
			"topicKey":          topic.TopicKey,
			"topicLabel":        topic.TopicLabel,
			"summary":           topic.Summary,
			"aliases":           topic.Aliases,
			"questionPatterns":  topic.QuestionPatterns,
			"sourceEntryIds":    topic.SourceEntryIDs,
			"source":            topic.Source,
			"confidence":        topic.Confidence,
			"status":            topic.Status,
			"manualEdited":      topic.ManualEdited,
			"mergedIntoTopicId": topic.MergedIntoTopicID,
		})
	}
	return list
}

func buildLifeAgentSessionTitle(message string) string {
	title := strings.TrimSpace(message)
	if title == "" {
		return "新的聊天"
	}
	runes := []rune(title)
	if len(runes) > 40 {
		return string(runes[:40])
	}
	return title
}

func encodeLifeAgentListCursor(t time.Time, id string) string {
	raw := t.UTC().Format(time.RFC3339Nano) + "\n" + id
	return base64.RawURLEncoding.EncodeToString([]byte(raw))
}

func decodeLifeAgentListCursor(s string) (time.Time, string, error) {
	var zero time.Time
	b, err := base64.RawURLEncoding.DecodeString(strings.TrimSpace(s))
	if err != nil {
		return zero, "", err
	}
	i := bytes.IndexByte(b, '\n')
	if i < 0 {
		return zero, "", fmt.Errorf("life agent list cursor: no separator")
	}
	t, err := time.Parse(time.RFC3339Nano, string(b[:i]))
	if err != nil {
		return zero, "", err
	}
	id := string(b[i+1:])
	if strings.TrimSpace(id) == "" {
		return zero, "", fmt.Errorf("life agent list cursor: empty id")
	}
	return t, id, nil
}

// lifeAgentListResponseItems 将一批已排序的 profile 转为广场列表 JSON（含聚合统计）。
func sampleQuestionInputFromProfile(p *models.LifeAgentProfile, entries []models.LifeAgentKnowledgeEntry) lifeagent.SampleQuestionInput {
	in := lifeagent.SampleQuestionInput{
		DisplayName:   p.DisplayName,
		Headline:      p.Headline,
		ShortBio:      p.ShortBio,
		ExpertiseTags: []string(p.ExpertiseTags),
		Job:           ptrStr(p.Job),
		School:        ptrStr(p.School),
	}
	for _, e := range entries {
		in.Knowledge = append(in.Knowledge, lifeagent.KnowledgeSnippet{
			Title:   e.Title,
			Content: e.Content,
			Tags:    []string(e.Tags),
		})
	}
	return in
}

func sampleQuestionsForDisplay(p *models.LifeAgentProfile, entries []models.LifeAgentKnowledgeEntry) []string {
	return lifeagent.DisplaySampleQuestions([]string(p.SampleQuestions), sampleQuestionInputFromProfile(p, entries))
}

func batchKnowledgeEntriesByProfileIDs(ids []string) map[string][]models.LifeAgentKnowledgeEntry {
	out := make(map[string][]models.LifeAgentKnowledgeEntry, len(ids))
	if len(ids) == 0 {
		return out
	}
	var entries []models.LifeAgentKnowledgeEntry
	db.DB.Where("profile_id IN ?", ids).Order("profile_id ASC, sort_order ASC").Find(&entries)
	for _, e := range entries {
		out[e.ProfileID] = append(out[e.ProfileID], e)
	}
	return out
}

func lifeAgentListResponseItems(profiles []models.LifeAgentProfile, cfg *config.Config) []gin.H {
	if len(profiles) == 0 {
		return []gin.H{}
	}
	ids := make([]string, len(profiles))
	userIDs := make(map[string]bool)
	for i, p := range profiles {
		ids[i] = p.ID
		userIDs[p.UserID] = true
	}
	uniqueUserIDs := make([]string, 0, len(userIDs))
	for uid := range userIDs {
		uniqueUserIDs = append(uniqueUserIDs, uid)
	}
	var users []models.User
	db.DB.Where("id IN ?", uniqueUserIDs).Find(&users)
	userMap := make(map[string]models.User)
	for _, u := range users {
		userMap[u.ID] = u
	}
	type aggRow struct {
		ProfileID string `gorm:"column:profile_id"`
		Cnt       int64  `gorm:"column:cnt"`
	}
	kMap := make(map[string]int64)
	var kRows []aggRow
	db.DB.Raw("SELECT profile_id, COUNT(*) AS cnt FROM life_agent_knowledge_entries WHERE profile_id IN ? GROUP BY profile_id", ids).Scan(&kRows)
	for _, r := range kRows {
		kMap[r.ProfileID] = r.Cnt
	}
	qpMap := make(map[string]int64)
	var qpRows []aggRow
	db.DB.Raw("SELECT profile_id, COUNT(*) AS cnt FROM life_agent_question_packs WHERE profile_id IN ? GROUP BY profile_id", ids).Scan(&qpRows)
	for _, r := range qpRows {
		qpMap[r.ProfileID] = r.Cnt
	}
	sessMap := make(map[string]int64)
	var sessRows []aggRow
	db.DB.Raw("SELECT profile_id, COUNT(*) AS cnt FROM life_agent_chat_sessions WHERE profile_id IN ? GROUP BY profile_id", ids).Scan(&sessRows)
	for _, r := range sessRows {
		sessMap[r.ProfileID] = r.Cnt
	}
	type ratingAgg struct {
		ProfileID string  `gorm:"column:profile_id"`
		Raters    int64   `gorm:"column:raters"`
		Avg       float64 `gorm:"column:avg"`
	}
	ratingMap := make(map[string]gin.H)
	var ratingRows []ratingAgg
	db.DB.Raw("SELECT profile_id, COUNT(*) AS raters, COALESCE(AVG(score),0) AS avg FROM life_agent_ratings WHERE profile_id IN ? GROUP BY profile_id", ids).Scan(&ratingRows)
	for _, r := range ratingRows {
		ratingMap[r.ProfileID] = gin.H{"averageScore": r.Avg, "raters": r.Raters, "recent": []gin.H{}}
	}
	for _, id := range ids {
		if _, ok := ratingMap[id]; !ok {
			ratingMap[id] = gin.H{"averageScore": 0.0, "raters": 0, "recent": []gin.H{}}
		}
	}
	resp := make([]gin.H, 0, len(profiles))
	mindScores := batchComputeMindScores(profiles, cfg)
	kbByProfile := batchKnowledgeEntriesByProfileIDs(ids)
	for _, p := range profiles {
		u := userMap[p.UserID]
		ratingsSummary := ratingMap[p.ID]
		cu := lifeAgentCoverURL(&p)
		ms := mindScores[p.ID]
		resp = append(resp, gin.H{
			"id":                  p.ID,
			"displayName":         p.DisplayName,
			"headline":            p.Headline,
			"shortBio":            p.ShortBio,
			"audience":            p.Audience,
			"welcomeMessage":      p.WelcomeMessage,
			"pricePerQuestion":    p.PricePerQuestion,
			"expertiseTags":       p.ExpertiseTags,
			"sampleQuestions":     sampleQuestionsForDisplay(&p, kbByProfile[p.ID]),
			"education":           ptrStr(p.Education),
			"income":              ptrStr(p.Income),
			"job":                 ptrStr(p.Job),
			"school":              ptrStr(p.School),
			"country":             ptrStr(p.Country),
			"province":            ptrStr(p.Province),
			"city":                ptrStr(p.City),
			"county":              ptrStr(p.County),
			"regions":             p.Regions,
			"verificationStatus":  coalesceVerificationStatus(p.VerificationStatus),
			"claim":               lifeAgentClaimStatus(&p),
			"creator":             gin.H{"id": u.ID, "name": u.Name},
			"knowledgeCount":      kMap[p.ID],
			"soldQuestionPacks":   qpMap[p.ID],
			"sessionCount":        sessMap[p.ID],
			"ratings":             ratingsSummary,
			"coverImageUrl":       ptrStr(p.CoverImageURL),
			"coverPresetKey":      ptrStr(p.CoverPresetKey),
			"coverUrl":            cu,
			"mindScore":           ms.Total,
			"mindScoreLevel":      ms.Level,
			"mindScoreLevelLabel": ms.LevelLabel,
			"featuredRank":        p.FeaturedRank,
			"featuredCollection":  ptrStr(p.FeaturedCollection),
		})
	}
	return resp
}

// globalFeaturedFirstSQL 把"全站精选"（设置了 featured_rank 且不属于任何合集）排到最前。
// 合集成员（featured_collection 非空）不污染主广场首屏，只在各自合集内置顶。
const globalFeaturedFirstSQL = "CASE WHEN featured_rank IS NOT NULL AND featured_collection IS NULL THEN 0 ELSE 1 END ASC"

func LifeAgentsList(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 可选合集过滤：/api/life-agents?collection=kaoyan 仅返回该校园/专题合集的成员
		collection := strings.TrimSpace(c.Query("collection"))

		limitStr := strings.TrimSpace(c.Query("limit"))
		if limitStr == "" {
			q := db.DB.Where("published = ?", true)
			if collection != "" {
				q = q.Where("featured_collection = ?", collection).
					Order("featured_rank IS NULL ASC").Order("featured_rank ASC")
			} else {
				q = q.Order(globalFeaturedFirstSQL).Order("featured_rank ASC")
			}
			var profiles []models.LifeAgentProfile
			if err := q.Order("updated_at DESC").Order("id DESC").Find(&profiles).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
				return
			}
			c.JSON(http.StatusOK, lifeAgentListResponseItems(profiles, cfg))
			return
		}

		limit, err := strconv.Atoi(limitStr)
		if err != nil || limit < 1 {
			limit = 24
		}
		if limit > 100 {
			limit = 100
		}

		// Seeded random ordering: deterministic per-session shuffle using MD5(seed||id).
		// seed is validated as a non-negative integer before embedding in SQL.
		if seedStr := strings.TrimSpace(c.Query("seed")); seedStr != "" {
			seed, seedErr := strconv.Atoi(seedStr)
			if seedErr != nil || seed < 0 {
				seed = 0
			}
			offset := 0
			if offStr := strings.TrimSpace(c.Query("offset")); offStr != "" {
				offset, _ = strconv.Atoi(offStr)
				if offset < 0 {
					offset = 0
				}
			}

			// Use fmt.Sprintf with validated integer to avoid GORM ORDER BY param-binding issues.
			orderSQL := fmt.Sprintf("MD5(CONCAT(%d, id))", seed)
			q := db.DB.Where("published = ?", true)
			if collection != "" {
				// 合集内：先按 featured_rank 置顶，再 seeded 随机
				q = q.Where("featured_collection = ?", collection).
					Order("featured_rank IS NULL ASC").Order("featured_rank ASC")
			} else {
				// 主广场：全站精选浮到首屏，其余维持 seeded 随机曝光
				q = q.Order(globalFeaturedFirstSQL).Order("featured_rank ASC")
			}
			var profiles []models.LifeAgentProfile
			if err := q.
				Order(orderSQL).
				Offset(offset).
				Limit(limit + 1).
				Find(&profiles).Error; err != nil {
				log.Printf("[life-agents-list] seeded query failed (seed=%d, offset=%d, limit=%d): %v", seed, offset, limit, err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
				return
			}

			nextCursor := ""
			if len(profiles) > limit {
				profiles = profiles[:limit]
				nextCursor = strconv.Itoa(offset + limit)
			}

			c.JSON(http.StatusOK, gin.H{
				"items":      lifeAgentListResponseItems(profiles, cfg),
				"nextCursor": nextCursor,
			})
			return
		}

		q := db.DB.Where("published = ?", true)
		if collection != "" {
			q = q.Where("featured_collection = ?", collection)
		}
		if cur := strings.TrimSpace(c.Query("cursor")); cur != "" {
			t, id, derr := decodeLifeAgentListCursor(cur)
			if derr != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_CURSOR"})
				return
			}
			q = q.Where("(updated_at < ?) OR (updated_at = ? AND id < ?)", t, t, id)
		}

		var profiles []models.LifeAgentProfile
		if err := q.Order("updated_at DESC").Order("id DESC").Limit(limit + 1).Find(&profiles).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}

		nextCursor := ""
		if len(profiles) > limit {
			profiles = profiles[:limit]
			last := profiles[len(profiles)-1]
			nextCursor = encodeLifeAgentListCursor(last.UpdatedAt, last.ID)
		}

		c.JSON(http.StatusOK, gin.H{
			"items":      lifeAgentListResponseItems(profiles, cfg),
			"nextCursor": nextCursor,
		})
	}
}

func LifeAgentsCreate(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		var body struct {
			DisplayName        string   `json:"displayName" binding:"required,min=1,max=10"`
			Headline           string   `json:"headline"`
			ShortBio           string   `json:"shortBio"`
			LongBio            string   `json:"longBio"`
			Audience           string   `json:"audience"`
			WelcomeMessage     string   `json:"welcomeMessage" binding:"required,min=1"`
			PricePerQuestion   int      `json:"pricePerQuestion"`
			Education          string   `json:"education"`
			Income             string   `json:"income"`
			Job                string   `json:"job"`
			School             string   `json:"school"`
			Country            string   `json:"country"`
			Province           string   `json:"province"`
			City               string   `json:"city"`
			County             string   `json:"county"`
			Regions            []string `json:"regions" binding:"omitempty,max=2,dive,min=1"`
			MBTI               string   `json:"mbti"`
			PersonaArchetype   string   `json:"personaArchetype"`
			ToneStyle          string   `json:"toneStyle"`
			ResponseStyle      string   `json:"responseStyle"`
			ForbiddenPhrases   []string `json:"forbiddenPhrases" binding:"max=8,dive,min=1"`
			ExampleReplies     []string `json:"exampleReplies" binding:"omitempty,max=5,dive,min=10"`
			ExpertiseTags      []string `json:"expertiseTags" binding:"omitempty,max=8,dive,min=1"`
			SampleQuestions    []string `json:"sampleQuestions"`
			NotSuitableFor     string   `json:"notSuitableFor"`
			VerificationStatus string   `json:"verificationStatus"` // none, pending, verified
			VoiceSampleBase64  string   `json:"voiceSampleBase64"`  // 音色采集音频 base64
			CoverPresetKey     string   `json:"coverPresetKey"`
			CoverImageURL      string   `json:"coverImageUrl"`
			KnowledgeEntries   []struct {
				Category string   `json:"category" binding:"required"`
				Title    string   `json:"title" binding:"required"`
				Content  string   `json:"content" binding:"required"`
				Tags     []string `json:"tags" binding:"required,min=1,dive,min=1"`
			} `json:"knowledgeEntries" binding:"required,min=2,max=30,dive"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR", "detail": err.Error()})
			return
		}
		var existingProfiles int64
		if err := db.DB.Model(&models.LifeAgentProfile{}).Where("user_id = ?", user.ID).Count(&existingProfiles).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}
		if existingProfiles > 0 {
			c.JSON(http.StatusConflict, gin.H{"error": "LIFE_AGENT_LIMIT_REACHED"})
			return
		}
		body.DisplayName = strings.TrimSpace(body.DisplayName)
		body.Headline = strings.TrimSpace(body.Headline)
		if len([]rune(body.DisplayName)) < 1 || len([]rune(body.DisplayName)) > 10 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR", "detail": "displayName length must be between 1 and 10"})
			return
		}
		if body.PricePerQuestion <= 0 {
			body.PricePerQuestion = 990
		}

		profileID := models.GenID()
		var voiceClonePtr *string
		if body.VoiceSampleBase64 != "" {
			_, _ = tts.SaveVoiceSample(profileID, body.VoiceSampleBase64)
			if cfg.ResolveTTSProvider() == "dashscope" {
				raw, mime, derr := tts.DecodeBase64AudioPayload(body.VoiceSampleBase64)
				if derr != nil {
					log.Printf("life-agents create: voice sample decode: %v", derr)
				} else {
					pref := tts.SanitizePreferredVoiceName(profileID, body.DisplayName)
					vid, eerr := tts.EnrollDashScopeVoice(tts.DashScopeEnrollParams{
						APIKey:        cfg.DashScopeTTSEffectiveKey(),
						URL:           cfg.DashScopeVoiceEnrollURL,
						TargetModel:   cfg.DashScopeVCModel,
						PreferredName: pref,
						Audio:         raw,
						MIME:          mime,
					})
					if eerr != nil {
						log.Printf("life-agents create: dashscope voice enroll: %v (mime=%s len=%d)", eerr, mime, len(raw))
					} else if vid != "" {
						voiceClonePtr = &vid
					}
				}
			}
		}
		var coverImgPtr *string
		if u := strings.TrimSpace(body.CoverImageURL); u != "" {
			if !validateLifeAgentCoverImageURL(u) {
				c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR", "detail": "invalid coverImageUrl"})
				return
			}
			coverImgPtr = &u
		}
		var coverPresetPtr *string
		if k := strings.TrimSpace(body.CoverPresetKey); k != "" {
			if _, ok := allowedLifeAgentCoverPresets[k]; !ok {
				c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR", "detail": "invalid coverPresetKey"})
				return
			}
			coverPresetPtr = &k
		}
		if coverImgPtr != nil {
			coverPresetPtr = nil
		}
		if coverImgPtr == nil && coverPresetPtr == nil {
			var owner models.User
			if db.DB.Select("avatar_url").Where("id = ?", user.ID).First(&owner).Error == nil &&
				owner.AvatarURL != nil && strings.TrimSpace(*owner.AvatarURL) != "" {
				s := strings.TrimSpace(*owner.AvatarURL)
				coverImgPtr = &s
			}
		}
		p := models.LifeAgentProfile{
			ID:                 profileID,
			UserID:             user.ID,
			DisplayName:        body.DisplayName,
			Headline:           body.Headline,
			ShortBio:           body.ShortBio,
			LongBio:            body.LongBio,
			Audience:           body.Audience,
			WelcomeMessage:     body.WelcomeMessage,
			PricePerQuestion:   body.PricePerQuestion,
			ExpertiseTags:      models.JSONArray(category.ExpandTagsByCategory(body.ExpertiseTags)),
			SampleQuestions:    models.JSONArray(body.SampleQuestions),
			Education:          strOpt(body.Education),
			Income:             strOpt(body.Income),
			Job:                strOpt(body.Job),
			School:             strOpt(body.School),
			Country:            strOpt(body.Country),
			Province:           strOpt(body.Province),
			City:               strOpt(body.City),
			County:             strOpt(body.County),
			Regions:            models.JSONArray(body.Regions),
			MBTI:               strOpt(body.MBTI),
			PersonaArchetype:   strOpt(body.PersonaArchetype),
			ToneStyle:          strOpt(body.ToneStyle),
			ResponseStyle:      strOpt(body.ResponseStyle),
			ForbiddenPhrases:   models.JSONArray(body.ForbiddenPhrases),
			ExampleReplies:     models.JSONArray(body.ExampleReplies),
			NotSuitableFor:     strOpt(body.NotSuitableFor),
			VerificationStatus: coalesceVerificationStatus(body.VerificationStatus),
			VoiceCloneID:       voiceClonePtr,
			CoverImageURL:      coverImgPtr,
			CoverPresetKey:     coverPresetPtr,
			Published:          true,
		}
		if err := db.DB.Transaction(func(tx *gorm.DB) error {
			var lockedUser models.User
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
				Select("id").
				Where("id = ?", user.ID).
				First(&lockedUser).Error; err != nil {
				return err
			}
			var currentProfiles int64
			if err := tx.Model(&models.LifeAgentProfile{}).Where("user_id = ?", user.ID).Count(&currentProfiles).Error; err != nil {
				return err
			}
			if currentProfiles > 0 {
				return errLifeAgentLimitReached
			}
			if err := tx.Create(&p).Error; err != nil {
				return err
			}
			for i, e := range body.KnowledgeEntries {
				k := models.LifeAgentKnowledgeEntry{
					ID:        models.GenID(),
					ProfileID: profileID,
					Category:  e.Category,
					Title:     e.Title,
					Content:   e.Content,
					Tags:      models.JSONArray(e.Tags),
					SortOrder: i,
				}
				analysis := prepareLifeAgentKnowledgeEntry(&k, "manual_create", nil, nil, nil, "initial_create")
				if err := tx.Create(&k).Error; err != nil {
					return err
				}
				if err := createTimelineEventForKnowledge(tx, k, analysis); err != nil {
					return err
				}
			}
			return nil
		}); err != nil {
			if errors.Is(err, errLifeAgentLimitReached) {
				c.JSON(http.StatusConflict, gin.H{"error": "LIFE_AGENT_LIMIT_REACHED"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}
		resolved := lifeAgentCoverURL(&p)
		if err := applyAvatarBinding(user.ID, &resolved); err != nil {
			log.Printf("life-agents create: sync avatar binding user=%s: %v", user.ID, err)
		}
		refreshLifeAgentStructuredFacts(profileID)
		refreshLifeAgentTopicSummaries(profileID)
		var entries []models.LifeAgentKnowledgeEntry
		db.DB.Where("profile_id = ?", profileID).Order("sort_order").Find(&entries)
		var facts []models.LifeAgentStructuredFact
		db.DB.Where("profile_id = ?", profileID).Order("fact_key ASC, created_at ASC").Find(&facts)
		var topics []models.LifeAgentTopicSummary
		db.DB.Where("profile_id = ?", profileID).Order("topic_group ASC, topic_key ASC").Find(&topics)
		var timelineRows []models.LifeAgentTimelineEvent
		db.DB.Where("profile_id = ?", profileID).Order("sequence_order ASC, created_at ASC").Find(&timelineRows)
		c.JSON(http.StatusOK, gin.H{
			"id":               profileID,
			"voiceCloneId":     ptrStr(voiceClonePtr),
			"knowledgeEntries": entries,
			"structuredFacts":  buildStructuredFactResponses(facts),
			"topicSummaries":   buildTopicSummaryResponses(topics),
			"timelineEvents":   timelineRows,
		})
	}
}

func LifeAgentsCreateNextQuestion(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		_ = middleware.MustGetUser(c)
		var body lifeagent.CreateQuestionInput
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR", "detail": err.Error()})
			return
		}
		out, err := lifeagent.GenerateNextCreateQuestion(
			c.Request.Context(),
			cfg.OpenAIApiKey, cfg.OpenAIModel, cfg.OpenAIBaseURL,
			&body,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "LLM_ERROR", "detail": err.Error()})
			return
		}
		resp := gin.H{
			"done":             out.Done,
			"nextQuestion":     out.NextQuestion,
			"summaryMessage":   out.SummaryMessage,
			"extractedTone":    out.ExtractedTone,
			"suggestedTags":    out.SuggestedTags,
			"knowledgeAdd":     out.KnowledgeAdd,
			"factCandidates":   out.FactCandidates,
			"referenceQuote":   out.ReferenceQuote,
			"answerHighlights": out.AnswerHighlights,
		}
		if wantsEventStream(c) {
			streamText := strings.TrimSpace(out.NextQuestion)
			if out.Done {
				streamText = strings.TrimSpace(out.SummaryMessage)
			}
			c.Header("Content-Type", "text/event-stream")
			c.Header("Cache-Control", "no-cache")
			c.Header("Connection", "keep-alive")
			c.Header("X-Accel-Buffering", "no")
			c.Status(http.StatusOK)
			lifeagent.EmitReplyChunks(streamText, func(chunk string) {
				writeSSE(c, "content", gin.H{"content": chunk})
			})
			writeSSE(c, "done", resp)
			return
		}
		c.JSON(http.StatusOK, resp)
	}
}

func LifeAgentsCreateProfileSummary(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		_ = middleware.MustGetUser(c)
		var body lifeagent.ProfileSummaryInput
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR", "detail": err.Error()})
			return
		}
		out, err := lifeagent.GenerateProfileCreateSummary(
			c.Request.Context(),
			cfg.OpenAIApiKey, cfg.OpenAIModel, cfg.OpenAIBaseURL,
			&body,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "LLM_ERROR", "detail": err.Error()})
			return
		}
		resp := gin.H{
			"summaryMessage":   out.SummaryMessage,
			"profile":          out.Profile,
			"knowledgeEntries": out.KnowledgeEntries,
			"structuredFacts":  out.StructuredFacts,
		}
		if wantsEventStream(c) {
			c.Header("Content-Type", "text/event-stream")
			c.Header("Cache-Control", "no-cache")
			c.Header("Connection", "keep-alive")
			c.Header("X-Accel-Buffering", "no")
			c.Status(http.StatusOK)
			lifeagent.EmitReplyChunks(strings.TrimSpace(out.SummaryMessage), func(chunk string) {
				writeSSE(c, "content", gin.H{"content": chunk})
			})
			writeSSE(c, "done", resp)
			return
		}
		c.JSON(http.StatusOK, resp)
	}
}

func LifeAgentsMine(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		var profiles []models.LifeAgentProfile
		db.DB.Where("user_id = ?", user.ID).Order("updated_at DESC").Find(&profiles)
		var resp []gin.H
		for _, p := range profiles {
			var kCount, qpCount, sessCount int64
			var revenue int
			db.DB.Model(&models.LifeAgentKnowledgeEntry{}).Where("profile_id = ?", p.ID).Count(&kCount)
			db.DB.Model(&models.LifeAgentQuestionPack{}).Where("profile_id = ?", p.ID).Count(&qpCount)
			db.DB.Model(&models.LifeAgentChatSession{}).Where("profile_id = ?", p.ID).Count(&sessCount)
			db.DB.Model(&models.LifeAgentQuestionPack{}).Where("profile_id = ? AND status = ?", p.ID, "paid").Select("COALESCE(SUM(amount_paid),0)").Scan(&revenue)
			mindScore := lifeagent.ComputeMindScore(loadMindScoreInput(p.ID, &p, cfg))
			resp = append(resp, gin.H{
				"id":                  p.ID,
				"displayName":         p.DisplayName,
				"headline":            p.Headline,
				"shortBio":            p.ShortBio,
				"pricePerQuestion":    p.PricePerQuestion,
				"country":             ptrStr(p.Country),
				"province":            ptrStr(p.Province),
				"city":                ptrStr(p.City),
				"county":              ptrStr(p.County),
				"regions":             p.Regions,
				"verificationStatus":  coalesceVerificationStatus(p.VerificationStatus),
				"published":           p.Published,
				"knowledgeCount":      kCount,
				"sessionCount":        sessCount,
				"soldPacks":           qpCount,
				"totalRevenue":        revenue,
				"mindScore":           mindScore.Total,
				"mindScoreLevel":      mindScore.Level,
				"mindScoreLevelLabel": mindScore.LevelLabel,
			})
		}
		c.JSON(http.StatusOK, resp)
	}
}

// LifeAgentsDelete 删除当前用户创建的人生 Agent（级联删除关联数据）
func LifeAgentsDelete(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ? AND user_id = ?", id, user.ID).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "NOT_FOUND"})
			return
		}
		if err := yantuseed.DeleteLifeAgentProfileCascade(db.DB, id); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"ok": true})
	}
}

// LifeAgentsFeedbackAll 返回当前用户所有人生 Agent 的反馈汇总
func LifeAgentsFeedbackAll(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		var owner models.User
		if err := db.DB.Select("id", "notifications_read_at").Where("id = ?", user.ID).First(&owner).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}
		var profiles []models.LifeAgentProfile
		db.DB.Where("user_id = ?", user.ID).Find(&profiles)
		if len(profiles) == 0 {
			c.JSON(http.StatusOK, gin.H{
				"counts":      gin.H{"helpful": 0, "notSpecific": 0, "notSuitable": 0, "factualError": 0, "contradiction": 0, "tooConfident": 0},
				"ratings":     gin.H{"averageScore": 0, "raters": 0, "recent": []gin.H{}},
				"recent":      []gin.H{},
				"coEdit":      []gin.H{},
				"unreadCount": 0,
			})
			return
		}
		ids := make([]string, len(profiles))
		profileMap := make(map[string]string)
		for i, p := range profiles {
			ids[i] = p.ID
			profileMap[p.ID] = p.DisplayName
		}
		var helpful, notSpecific, notSuitable, factualError, contradiction, tooConfident int64
		db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id IN ? AND feedback_type = ?", ids, "helpful").Count(&helpful)
		db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id IN ? AND feedback_type = ?", ids, "not_specific").Count(&notSpecific)
		db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id IN ? AND feedback_type = ?", ids, "not_suitable").Count(&notSuitable)
		db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id IN ? AND feedback_type = ?", ids, "factual_error").Count(&factualError)
		db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id IN ? AND feedback_type = ?", ids, "contradiction").Count(&contradiction)
		db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id IN ? AND feedback_type = ?", ids, "too_confident").Count(&tooConfident)
		var recent []models.LifeAgentFeedback
		db.DB.Where("profile_id IN ?", ids).Order("created_at DESC").Limit(50).Find(&recent)
		var recentRatings []models.LifeAgentRating
		db.DB.Where("profile_id IN ?", ids).Order("updated_at DESC").Limit(20).Find(&recentRatings)
		var recentCoEdit []models.LifeAgentCoEditEvent
		db.DB.Where("profile_id IN ? AND status IN ?", ids, []string{"processed", "failed"}).
			Order("processed_at DESC").Limit(30).Find(&recentCoEdit)
		var list []gin.H
		for _, f := range recent {
			list = append(list, gin.H{
				"id":               f.ID,
				"profileId":        f.ProfileID,
				"profileName":      profileMap[f.ProfileID],
				"feedbackType":     f.FeedbackType,
				"assistantExcerpt": f.AssistantExcerpt,
				"comment":          f.Comment,
				"createdAt":        f.CreatedAt.Format("2006-01-02 15:04"),
			})
		}
		var coEditList []gin.H
		for _, e := range recentCoEdit {
			row := gin.H{
				"id":          e.ID,
				"profileId":   e.ProfileID,
				"profileName": profileMap[e.ProfileID],
				"status":      e.Status,
				"rawMessage":  e.RawMessage,
				"createdAt":   e.CreatedAt.Format("2006-01-02 15:04"),
			}
			if e.AssistantMessage != nil {
				row["assistantMessage"] = *e.AssistantMessage
			}
			if e.ChangesSummary != nil {
				row["changesSummary"] = *e.ChangesSummary
			}
			if e.ErrorDetail != nil {
				row["errorDetail"] = *e.ErrorDetail
			}
			if e.ProcessedAt != nil {
				row["processedAt"] = e.ProcessedAt.Format("2006-01-02 15:04")
			}
			coEditList = append(coEditList, row)
		}
		var average float64
		var raters int64
		db.DB.Model(&models.LifeAgentRating{}).Where("profile_id IN ?", ids).Count(&raters)
		db.DB.Model(&models.LifeAgentRating{}).Where("profile_id IN ?", ids).Select("COALESCE(AVG(score),0)").Scan(&average)
		var ratingList []gin.H
		for _, r := range recentRatings {
			ratingList = append(ratingList, gin.H{
				"id":          r.ID,
				"profileId":   r.ProfileID,
				"profileName": profileMap[r.ProfileID],
				"score":       r.Score,
				"comment":     r.Comment,
				"updatedAt":   r.UpdatedAt.Format("2006-01-02 15:04"),
			})
		}
		c.JSON(http.StatusOK, gin.H{
			"counts": gin.H{
				"helpful":       helpful,
				"notSpecific":   notSpecific,
				"notSuitable":   notSuitable,
				"factualError":  factualError,
				"contradiction": contradiction,
				"tooConfident":  tooConfident,
			},
			"ratings": gin.H{
				"averageScore": average,
				"raters":       raters,
				"recent":       ratingList,
			},
			"recent":      list,
			"coEdit":      coEditList,
			"unreadCount": countUnreadAgentNotifications(ids, owner.NotificationsReadAt),
		})
	}
}

// LifeAgentsFeedbackMarkRead 标记当前用户的 Agent 反馈/评分提醒为已读
func LifeAgentsFeedbackMarkRead(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		now := time.Now().UTC()
		if err := db.DB.Model(&models.User{}).Where("id = ?", user.ID).Update("notifications_read_at", now).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"ok": true, "unreadCount": 0, "readAt": now.Format(time.RFC3339)})
	}
}

func countUnreadAgentNotifications(profileIDs []string, readAt *time.Time) int64 {
	if len(profileIDs) == 0 {
		return 0
	}
	var feedbackCount, ratingCount, coEditCount int64
	fbQuery := db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id IN ?", profileIDs)
	rtQuery := db.DB.Model(&models.LifeAgentRating{}).Where("profile_id IN ?", profileIDs)
	// 已处理的调教事件（理解完成/失败）也算未读通知，告诉用户"你的 Agent 已经理解了 X 条新记忆"
	ceQuery := db.DB.Model(&models.LifeAgentCoEditEvent{}).
		Where("profile_id IN ?", profileIDs).
		Where("status IN ?", []string{"processed", "failed"})
	if readAt != nil {
		fbQuery = fbQuery.Where("created_at > ?", *readAt)
		rtQuery = rtQuery.Where("updated_at > ?", *readAt)
		ceQuery = ceQuery.Where("processed_at > ?", *readAt)
	}
	fbQuery.Count(&feedbackCount)
	rtQuery.Count(&ratingCount)
	ceQuery.Count(&coEditCount)
	return feedbackCount + ratingCount + coEditCount
}

// LifeAgentsPurchased 返回当前用户购买过额度的人生 Agent（作为咨询者）
func LifeAgentsPurchased(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		var packs []models.LifeAgentQuestionPack
		db.DB.Where("buyer_id = ? AND status = ?", user.ID, "paid").Order("created_at DESC").Find(&packs)
		seen := make(map[string]bool)
		profileIDs := make([]string, 0, len(packs))
		remainingMap := make(map[string]int)
		var resp []gin.H
		for _, pk := range packs {
			remainingMap[pk.ProfileID] += pk.QuestionCount - pk.QuestionsUsed
			if seen[pk.ProfileID] {
				continue
			}
			seen[pk.ProfileID] = true
			profileIDs = append(profileIDs, pk.ProfileID)
		}
		if len(profileIDs) == 0 {
			c.JSON(http.StatusOK, resp)
			return
		}
		var profiles []models.LifeAgentProfile
		if err := db.DB.Where("id IN ?", profileIDs).Find(&profiles).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}
		profileMap := make(map[string]models.LifeAgentProfile, len(profiles))
		for _, p := range profiles {
			profileMap[p.ID] = p
		}
		for _, profileID := range profileIDs {
			var p models.LifeAgentProfile
			var ok bool
			p, ok = profileMap[profileID]
			if !ok {
				continue
			}
			cu := lifeAgentCoverURL(&p)
			resp = append(resp, gin.H{
				"id":                 p.ID,
				"displayName":        p.DisplayName,
				"headline":           p.Headline,
				"pricePerQuestion":   p.PricePerQuestion,
				"remainingQuestions": remainingMap[profileID],
				"verificationStatus": coalesceVerificationStatus(p.VerificationStatus),
				"coverImageUrl":      ptrStr(p.CoverImageURL),
				"coverPresetKey":     ptrStr(p.CoverPresetKey),
				"coverUrl":           cu,
			})
		}
		c.JSON(http.StatusOK, resp)
	}
}

func LifeAgentsGet(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ?", id).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "NOT_FOUND"})
			return
		}
		var u models.User
		db.DB.Where("id = ?", p.UserID).First(&u)
		var entries []models.LifeAgentKnowledgeEntry
		db.DB.Where("profile_id = ?", id).Order("sort_order").Find(&entries)
		var facts []models.LifeAgentStructuredFact
		db.DB.Where("profile_id = ?", id).Order("fact_key ASC, created_at ASC").Find(&facts)
		var topics []models.LifeAgentTopicSummary
		db.DB.Where("profile_id = ?", id).Order("topic_group ASC, topic_key ASC").Find(&topics)

		user := middleware.MustGetUser(c)
		remaining := 0
		var ratingState gin.H
		if user != nil {
			var packs []models.LifeAgentQuestionPack
			db.DB.Where("profile_id = ? AND buyer_id = ? AND status = ?", id, user.ID, "paid").Find(&packs)
			for _, pk := range packs {
				remaining += pk.QuestionCount - pk.QuestionsUsed
			}
			ratingState = buildLifeAgentRatingState(id, user.ID)
		}

		var sessCount, qpCount int64
		db.DB.Model(&models.LifeAgentChatSession{}).Where("profile_id = ?", id).Count(&sessCount)
		db.DB.Model(&models.LifeAgentQuestionPack{}).Where("profile_id = ?", id).Count(&qpCount)
		ratingsSummary := buildLifeAgentRatingsSummary(id, 5)
		mindScore := lifeagent.ComputeMindScore(loadMindScoreInput(id, &p, cfg))

		cu := lifeAgentCoverURL(&p)
		c.JSON(http.StatusOK, gin.H{
			"id":                 p.ID,
			"displayName":        p.DisplayName,
			"headline":           p.Headline,
			"shortBio":           p.ShortBio,
			"longBio":            p.LongBio,
			"audience":           p.Audience,
			"welcomeMessage":     p.WelcomeMessage,
			"pricePerQuestion":   p.PricePerQuestion,
			"expertiseTags":      p.ExpertiseTags,
			"sampleQuestions":    sampleQuestionsForDisplay(&p, entries),
			"education":          ptrStr(p.Education),
			"income":             ptrStr(p.Income),
			"job":                ptrStr(p.Job),
			"school":             ptrStr(p.School),
			"country":            ptrStr(p.Country),
			"province":           ptrStr(p.Province),
			"city":               ptrStr(p.City),
			"county":             ptrStr(p.County),
			"regions":            p.Regions,
			"verificationStatus": coalesceVerificationStatus(p.VerificationStatus),
			"claim":              lifeAgentClaimStatus(&p),
			"mbti":               ptrStr(p.MBTI),
			"personaArchetype":   ptrStr(p.PersonaArchetype),
			"toneStyle":          ptrStr(p.ToneStyle),
			"responseStyle":      ptrStr(p.ResponseStyle),
			"forbiddenPhrases":   p.ForbiddenPhrases,
			"exampleReplies":     p.ExampleReplies,
			"notSuitableFor":     ptrStr(p.NotSuitableFor),
			"published":          p.Published,
			"creator":            gin.H{"id": u.ID, "name": u.Name},
			"knowledgeEntries":   entries,
			"structuredFacts":    buildStructuredFactResponses(facts),
			"topicSummaries":     buildTopicSummaryResponses(topics),
			"stats": gin.H{
				"sessionCount":      sessCount,
				"soldQuestionPacks": qpCount,
				"knowledgeCount":    len(entries),
				"topicCount":        len(topics),
				"mindScore":         mindScore.Total,
				"mindScoreLevel":    mindScore.Level,
			},
			"mindScore":      mindScoreToJSON(mindScore, nil),
			"ratings":        ratingsSummary,
			"hasVoiceClone":  cfg.VoiceReplyConfigured(ptrStr(p.VoiceCloneID)),
			"coverImageUrl":  ptrStr(p.CoverImageURL),
			"coverPresetKey": ptrStr(p.CoverPresetKey),
			"coverUrl":       cu,
			"viewerState": gin.H{
				"isLoggedIn":         user != nil,
				"isOwner":            user != nil && user.ID == p.UserID,
				"remainingQuestions": lifeAgentViewerRemaining(cfg, remaining),
				"unlimitedChat":      cfg.LifeAgentUnlimitedChat,
				"rating":             ratingState,
			},
		})
	}
}

func LifeAgentsUpdate(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ?", id).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "NOT_FOUND"})
			return
		}
		if p.UserID != user.ID {
			c.JSON(http.StatusForbidden, gin.H{"error": "FORBIDDEN"})
			return
		}
		beforeScore := lifeagent.ComputeMindScore(loadMindScoreInput(id, &p, cfg)).Total
		var body struct {
			DisplayName        *string   `json:"displayName"`
			Headline           *string   `json:"headline"`
			ShortBio           *string   `json:"shortBio"`
			LongBio            *string   `json:"longBio"`
			Audience           *string   `json:"audience"`
			WelcomeMessage     *string   `json:"welcomeMessage"`
			PricePerQuestion   *int      `json:"pricePerQuestion"`
			Published          *bool     `json:"published"`
			Education          *string   `json:"education"`
			Income             *string   `json:"income"`
			Job                *string   `json:"job"`
			School             *string   `json:"school"`
			Country            *string   `json:"country"`
			Province           *string   `json:"province"`
			City               *string   `json:"city"`
			County             *string   `json:"county"`
			Regions            *[]string `json:"regions" binding:"omitempty,max=2,dive,min=1"`
			VerificationStatus *string   `json:"verificationStatus"`
			MBTI               *string   `json:"mbti"`
			PersonaArchetype   *string   `json:"personaArchetype"`
			ToneStyle          *string   `json:"toneStyle"`
			ResponseStyle      *string   `json:"responseStyle"`
			ExpertiseTags      []string  `json:"expertiseTags"`
			SampleQuestions    []string  `json:"sampleQuestions"`
			ForbiddenPhrases   []string  `json:"forbiddenPhrases"`
			ExampleReplies     []string  `json:"exampleReplies"`
			NotSuitableFor     *string   `json:"notSuitableFor"`
			KnowledgeEntries   *[]struct {
				Category string   `json:"category"`
				Title    string   `json:"title"`
				Content  string   `json:"content"`
				Tags     []string `json:"tags"`
			} `json:"knowledgeEntries"`
			VoiceSampleBase64           *string `json:"voiceSampleBase64"`
			CoverPresetKey              *string `json:"coverPresetKey"`
			CoverImageURL               *string `json:"coverImageUrl"`
			ApiInvokeEnabled            *bool   `json:"apiInvokeEnabled"`
			ApiPriceFollowsConsultation *bool   `json:"apiPriceFollowsConsultation"`
			ApiPricePerCallCents        *int    `json:"apiPricePerCallCents"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}
		upd := db.DB.Model(&p)
		if body.DisplayName != nil {
			name := strings.TrimSpace(*body.DisplayName)
			if len([]rune(name)) < 1 || len([]rune(name)) > 10 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
				return
			}
			upd.Update("display_name", name)
		}
		if body.Headline != nil {
			upd.Update("headline", strings.TrimSpace(*body.Headline))
		}
		if body.ShortBio != nil {
			upd.Update("short_bio", *body.ShortBio)
		}
		if body.LongBio != nil {
			upd.Update("long_bio", *body.LongBio)
		}
		if body.Audience != nil {
			upd.Update("audience", *body.Audience)
		}
		if body.WelcomeMessage != nil {
			upd.Update("welcome_message", *body.WelcomeMessage)
		}
		if body.PricePerQuestion != nil {
			upd.Update("price_per_question", *body.PricePerQuestion)
		}
		if body.Published != nil {
			upd.Update("published", *body.Published)
		}
		if body.ApiInvokeEnabled != nil {
			upd.Update("api_invoke_enabled", *body.ApiInvokeEnabled)
		}
		if body.ApiPriceFollowsConsultation != nil && *body.ApiPriceFollowsConsultation {
			if err := db.DB.Model(&p).Updates(map[string]interface{}{"api_price_per_call_cents": nil}).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
				return
			}
		}
		if body.ApiPriceFollowsConsultation != nil && !*body.ApiPriceFollowsConsultation && body.ApiPricePerCallCents != nil {
			v := *body.ApiPricePerCallCents
			if v < 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
				return
			}
			upd.Update("api_price_per_call_cents", v)
		}
		if body.ApiPriceFollowsConsultation == nil && body.ApiPricePerCallCents != nil {
			v := *body.ApiPricePerCallCents
			if v < 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
				return
			}
			upd.Update("api_price_per_call_cents", v)
		}
		if body.Education != nil {
			upd.Update("education", *body.Education)
		}
		if body.Income != nil {
			upd.Update("income", *body.Income)
		}
		if body.Job != nil {
			upd.Update("job", *body.Job)
		}
		if body.School != nil {
			upd.Update("school", *body.School)
		}
		if body.Country != nil {
			upd.Update("country", *body.Country)
		}
		if body.Province != nil {
			upd.Update("province", *body.Province)
		}
		if body.City != nil {
			upd.Update("city", *body.City)
		}
		if body.County != nil {
			upd.Update("county", *body.County)
		}
		if body.Regions != nil {
			upd.Update("regions", models.JSONArray(*body.Regions))
		}
		if body.VerificationStatus != nil {
			upd.Update("verification_status", coalesceVerificationStatus(*body.VerificationStatus))
		}
		if body.MBTI != nil {
			upd.Update("mbti", *body.MBTI)
		}
		if body.PersonaArchetype != nil {
			upd.Update("persona_archetype", *body.PersonaArchetype)
		}
		if body.ToneStyle != nil {
			upd.Update("tone_style", *body.ToneStyle)
		}
		if body.ResponseStyle != nil {
			upd.Update("response_style", *body.ResponseStyle)
		}
		if body.NotSuitableFor != nil {
			upd.Update("not_suitable_for", *body.NotSuitableFor)
		}
		if body.ExpertiseTags != nil {
			upd.Update("expertise_tags", models.JSONArray(category.ExpandTagsByCategory(body.ExpertiseTags)))
		}
		if body.SampleQuestions != nil {
			upd.Update("sample_questions", models.JSONArray(body.SampleQuestions))
		}
		if body.ForbiddenPhrases != nil {
			upd.Update("forbidden_phrases", models.JSONArray(body.ForbiddenPhrases))
		}
		if body.ExampleReplies != nil {
			upd.Update("example_replies", models.JSONArray(body.ExampleReplies))
		}
		coverUpdates := map[string]interface{}{}
		if body.CoverImageURL != nil {
			s := strings.TrimSpace(*body.CoverImageURL)
			if s == "" {
				coverUpdates["cover_image_url"] = nil
			} else if validateLifeAgentCoverImageURL(s) {
				coverUpdates["cover_image_url"] = s
				coverUpdates["cover_preset_key"] = nil
			} else {
				c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
				return
			}
		}
		if body.CoverPresetKey != nil {
			s := strings.TrimSpace(*body.CoverPresetKey)
			if s == "" {
				coverUpdates["cover_preset_key"] = nil
			} else if _, ok := allowedLifeAgentCoverPresets[s]; ok {
				coverUpdates["cover_preset_key"] = s
				coverUpdates["cover_image_url"] = nil
			} else {
				c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
				return
			}
		}
		if len(coverUpdates) > 0 {
			if err := db.DB.Model(&p).Updates(coverUpdates).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
				return
			}
			if err := db.DB.Where("id = ?", id).First(&p).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
				return
			}
			resolved := lifeAgentCoverURL(&p)
			if err := applyAvatarBinding(p.UserID, &resolved); err != nil {
				log.Printf("life-agents update: sync avatar binding user=%s: %v", p.UserID, err)
			}
		}
		if body.KnowledgeEntries != nil {
			if err := db.DB.Transaction(func(tx *gorm.DB) error {
				if err := tx.Where("profile_id = ?", id).Delete(&models.LifeAgentKnowledgeEntry{}).Error; err != nil {
					return err
				}
				if err := tx.Where("profile_id = ?", id).Delete(&models.LifeAgentTimelineEvent{}).Error; err != nil {
					return err
				}
				for i, e := range *body.KnowledgeEntries {
					k := models.LifeAgentKnowledgeEntry{
						ID:        models.GenID(),
						ProfileID: id,
						Category:  e.Category,
						Title:     e.Title,
						Content:   e.Content,
						Tags:      models.JSONArray(e.Tags),
						SortOrder: i,
					}
					analysis := prepareLifeAgentKnowledgeEntry(&k, "manual_update", nil, nil, nil, "replace_knowledge_entries")
					if err := tx.Create(&k).Error; err != nil {
						return err
					}
					if err := createTimelineEventForKnowledge(tx, k, analysis); err != nil {
						return err
					}
				}
				return nil
			}); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
				return
			}
		}
		refreshLifeAgentStructuredFacts(id)
		refreshLifeAgentTopicSummaries(id)
		if body.VoiceSampleBase64 != nil && strings.TrimSpace(*body.VoiceSampleBase64) != "" {
			s := strings.TrimSpace(*body.VoiceSampleBase64)
			_, _ = tts.SaveVoiceSample(p.ID, s)
			if cfg.ResolveTTSProvider() == "dashscope" {
				raw, mime, derr := tts.DecodeBase64AudioPayload(s)
				if derr != nil {
					log.Printf("life-agents update: voice decode: %v", derr)
				} else {
					dn := p.DisplayName
					if body.DisplayName != nil {
						dn = strings.TrimSpace(*body.DisplayName)
					}
					pref := tts.SanitizePreferredVoiceName(p.ID, dn)
					vid, eerr := tts.EnrollDashScopeVoice(tts.DashScopeEnrollParams{
						APIKey:        cfg.DashScopeTTSEffectiveKey(),
						URL:           cfg.DashScopeVoiceEnrollURL,
						TargetModel:   cfg.DashScopeVCModel,
						PreferredName: pref,
						Audio:         raw,
						MIME:          mime,
					})
					if eerr != nil {
						log.Printf("life-agents update: voice enroll: %v (mime=%s len=%d)", eerr, mime, len(raw))
					} else if vid != "" {
						db.DB.Model(&p).Update("voice_clone_id", vid)
					}
				}
			}
		}
		db.DB.Where("id = ?", id).First(&p)
		var entries []models.LifeAgentKnowledgeEntry
		db.DB.Where("profile_id = ?", id).Order("sort_order").Find(&entries)
		var facts []models.LifeAgentStructuredFact
		db.DB.Where("profile_id = ?", id).Order("fact_key ASC, created_at ASC").Find(&facts)
		var topics []models.LifeAgentTopicSummary
		db.DB.Where("profile_id = ?", id).Order("topic_group ASC, topic_key ASC").Find(&topics)
		var timelineRows []models.LifeAgentTimelineEvent
		db.DB.Where("profile_id = ?", id).Order("sequence_order ASC, created_at ASC").Find(&timelineRows)
		afterScore := lifeagent.ComputeMindScore(loadMindScoreInput(id, &p, cfg))
		delta := afterScore.Total - beforeScore
		nextSuggestion := lifeagent.GenerateNextSuggestion(buildNextSuggestionContext(id, &p, cfg, "", 0, false, false))
		c.JSON(http.StatusOK, gin.H{
			"id":                            p.ID,
			"displayName":                   p.DisplayName,
			"headline":                      p.Headline,
			"shortBio":                      p.ShortBio,
			"longBio":                       p.LongBio,
			"audience":                      p.Audience,
			"welcomeMessage":                p.WelcomeMessage,
			"pricePerQuestion":              p.PricePerQuestion,
			"expertiseTags":                 p.ExpertiseTags,
			"sampleQuestions":               sampleQuestionsForDisplay(&p, entries),
			"education":                     ptrStr(p.Education),
			"income":                        ptrStr(p.Income),
			"job":                           ptrStr(p.Job),
			"school":                        ptrStr(p.School),
			"country":                       ptrStr(p.Country),
			"province":                      ptrStr(p.Province),
			"city":                          ptrStr(p.City),
			"county":                        ptrStr(p.County),
			"regions":                       p.Regions,
			"mbti":                          ptrStr(p.MBTI),
			"personaArchetype":              ptrStr(p.PersonaArchetype),
			"toneStyle":                     ptrStr(p.ToneStyle),
			"responseStyle":                 ptrStr(p.ResponseStyle),
			"forbiddenPhrases":              p.ForbiddenPhrases,
			"exampleReplies":                p.ExampleReplies,
			"notSuitableFor":                ptrStr(p.NotSuitableFor),
			"voiceCloneId":                  ptrStr(p.VoiceCloneID),
			"hasVoiceClone":                 cfg.VoiceReplyConfigured(ptrStr(p.VoiceCloneID)),
			"published":                     p.Published,
			"apiInvokeEnabled":              p.ApiInvokeEnabled,
			"apiPriceFollowsConsultation":   p.ApiPricePerCallCents == nil,
			"apiPricePerCallCents":          p.ApiPricePerCallCents,
			"effectiveApiPricePerCallCents": effectiveLifeAgentAPIPriceCents(&p),
			"apiTotalCalls":                 p.ApiTotalCalls,
			"coverImageUrl":                 ptrStr(p.CoverImageURL),
			"coverPresetKey":                ptrStr(p.CoverPresetKey),
			"coverUrl":                      lifeAgentCoverURL(&p),
			"knowledgeEntries":              entries,
			"structuredFacts":               buildStructuredFactResponses(facts),
			"topicSummaries":                buildTopicSummaryResponses(topics),
			"timelineEvents":                timelineRows,
			"mindScore":                     mindScoreToJSON(afterScore, &delta),
			"nextSuggestion":                nextSuggestion,
		})
	}
}

// LifeAgentsModifyViaChat —— 对话调教接口（写入同步、理解异步）。
//
// 流程：
//  1. 立即把用户原话写入 LifeAgentCoEditEvent(status=pending)，避免上游 LLM 慢/失败导致丢失。
//  2. 立刻返回 { eventId, status: "pending" }，前端展示"已记录，正在理解中…"。
//  3. 后台 goroutine 调 LLM 解析意图并应用到 profile / knowledge，
//     处理完成后把事件更新为 processed / failed，前端通过轮询 events 接口拿到结果。
func LifeAgentsModifyViaChat(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ?", id).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "NOT_FOUND"})
			return
		}
		if p.UserID != user.ID {
			c.JSON(http.StatusForbidden, gin.H{"error": "FORBIDDEN"})
			return
		}
		var body struct {
			Message     string                       `json:"message" binding:"required"`
			ChatHistory []lifeagent.ChatMessageForAI `json:"chatHistory"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR", "detail": err.Error()})
			return
		}

		// ① 同步写入：先把用户原话落库为 pending 事件，保证不会因 LLM 失败而丢失。
		event := models.LifeAgentCoEditEvent{
			ID:         models.GenID(),
			ProfileID:  id,
			UserID:     user.ID,
			RawMessage: body.Message,
			Status:     "pending",
			CreatedAt:  time.Now().UTC(),
		}
		if err := db.DB.Create(&event).Error; err != nil {
			log.Printf("life-agents modify: persist event failed profile=%s user=%s: %v", id, user.ID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR", "detail": err.Error()})
			return
		}

		// ② 后台理解：完全脱离客户端的 request ctx，自带超时；不阻塞 HTTP 响应。
		chatHistory := append([]lifeagent.ChatMessageForAI(nil), body.ChatHistory...)
		go processCoEditEvent(cfg, event.ID, id, user.ID, body.Message, chatHistory)

		// ③ 立刻回包，前端切到"已记录，正在理解中…"占位。
		c.JSON(http.StatusAccepted, gin.H{
			"eventId":   event.ID,
			"status":    "pending",
			"message":   "已记录，正在理解中…",
			"createdAt": event.CreatedAt.Format(time.RFC3339),
		})
	}
}

// processCoEditEvent 异步执行：调 LLM 解析 → 应用变更 → 更新事件状态。
// 不管成功失败，都会写一条结果到 life_agent_co_edit_events 行里。
func processCoEditEvent(cfg *config.Config, eventID, profileID, userID, userMessage string, chatHistory []lifeagent.ChatMessageForAI) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("life-agents modify: panic in async processor event=%s profile=%s: %v", eventID, profileID, r)
			finalizeCoEditEventFailed(eventID, fmt.Sprintf("内部错误：%v", r))
		}
	}()

	var p models.LifeAgentProfile
	if err := db.DB.Where("id = ?", profileID).First(&p).Error; err != nil {
		finalizeCoEditEventFailed(eventID, "找不到该 Agent")
		return
	}
	var entries []models.LifeAgentKnowledgeEntry
	db.DB.Where("profile_id = ?", profileID).Order("sort_order").Find(&entries)
	var timelineRows []models.LifeAgentTimelineEvent
	db.DB.Where("profile_id = ? AND status IN ?", profileID, []string{"confirmed", "needs_clarification"}).
		Order("sequence_order ASC, created_at ASC").Limit(20).Find(&timelineRows)

	var coEditEvent models.LifeAgentCoEditEvent
	recordedAt := time.Now().UTC()
	if err := db.DB.Where("id = ?", eventID).First(&coEditEvent).Error; err == nil {
		recordedAt = coEditEvent.CreatedAt
	}

	state := buildModifyStateString(&p, entries, timelineRows, userMessage, &recordedAt)
	trimmedHistory := trimChatHistoryForModify(chatHistory, 10)

	ctx, cancel := context.WithTimeout(context.Background(), 150*time.Second)
	defer cancel()
	intent, err := lifeagent.InterpretModificationIntent(
		ctx,
		cfg.OpenAIApiKey, cfg.OpenAIModel, cfg.OpenAIBaseURL,
		state, trimmedHistory, userMessage,
	)
	if err != nil {
		log.Printf("life-agents modify: LLM error event=%s profile=%s user=%s: %v", eventID, profileID, userID, err)
		finalizeCoEditEventFailed(eventID, fmt.Sprintf("AI 暂时未响应：%v", err))
		return
	}
	if intent == nil {
		intent = &lifeagent.ModifyIntent{}
	}
	if intent.Changes != nil {
		lifeagent.StampKnowledgeAddRecordedAt(intent.Changes, recordedAt)
	}

	summary, timelineClarification := applyModifyIntentChanges(&p, &entries, profileID, intent.Changes, eventID, &recordedAt)

	refreshLifeAgentStructuredFacts(profileID)
	refreshLifeAgentTopicSummaries(profileID)

	reply := normalizeCoEditAssistantReply(intent.Reply, intent.Changes, summary, timelineClarification)
	finalizeCoEditEventProcessed(eventID, reply, summary)
}

func normalizeCoEditAssistantReply(rawReply string, changes *lifeagent.ModifyIntentChanges, summary, timelineClarification string) string {
	if strings.TrimSpace(timelineClarification) != "" {
		return strings.TrimSpace(timelineClarification)
	}
	reply := strings.TrimSpace(rawReply)
	if strings.Contains(reply, "无修改需求") {
		reply = ""
	}
	hasKnowledge := changes != nil && len(changes.KnowledgeAdd) > 0
	if reply != "" {
		return reply
	}
	switch {
	case summary != "" && hasKnowledge:
		return "已记成一条新知识，并更新了相关设置。"
	case hasKnowledge:
		return "已记成一条新知识。"
	case summary != "":
		return "好的，我按你的意思更新了。"
	default:
		return "好的，这条暂未入库。"
	}
}

func finalizeCoEditEventProcessed(eventID, reply, summary string) {
	now := time.Now().UTC()
	updates := map[string]interface{}{
		"status":            "processed",
		"assistant_message": reply,
		"processed_at":      now,
	}
	if summary != "" {
		updates["changes_summary"] = summary
	}
	if err := db.DB.Model(&models.LifeAgentCoEditEvent{}).Where("id = ?", eventID).Updates(updates).Error; err != nil {
		log.Printf("life-agents modify: failed to mark event processed event=%s: %v", eventID, err)
	}
	if strings.TrimSpace(summary) != "" {
		var event models.LifeAgentCoEditEvent
		if err := db.DB.Where("id = ?", eventID).First(&event).Error; err == nil {
			createLifeAgentGrowthEvent(
				event.ProfileID,
				"co_edit_applied",
				"owner",
				growthEventTitle("co_edit_applied", ""),
				summary,
				models.JSONMap{"rawMessage": event.RawMessage},
				&eventID,
			)
		}
	}
}

func finalizeCoEditEventFailed(eventID, detail string) {
	now := time.Now().UTC()
	if err := db.DB.Model(&models.LifeAgentCoEditEvent{}).Where("id = ?", eventID).Updates(map[string]interface{}{
		"status":       "failed",
		"error_detail": detail,
		"processed_at": now,
	}).Error; err != nil {
		log.Printf("life-agents modify: failed to mark event failed event=%s: %v", eventID, err)
	}
}

func prepareLifeAgentKnowledgeEntry(k *models.LifeAgentKnowledgeEntry, sourceType string, sourceEventID, sourceSessionID *string, recordedAt *time.Time, changeReason string) lifeagent.TimelineAnalysis {
	if k == nil {
		return lifeagent.TimelineAnalysis{}
	}
	if strings.TrimSpace(sourceType) == "" {
		sourceType = "manual"
	}
	k.SourceType = sourceType
	k.SourceEventID = sourceEventID
	k.SourceSessionID = sourceSessionID
	if k.Revision <= 0 {
		k.Revision = 1
	}
	if strings.TrimSpace(changeReason) != "" {
		k.ChangeReason = strOpt(changeReason)
	}

	facets := lifeagent.ParseKnowledgeFacetTags(k.FacetTags)
	if len(facets.Subjects) == 0 && len(facets.Aspects) == 0 {
		facets = lifeagent.InferKnowledgeFacetTags(k.Title, k.Category, k.Content, []string(k.Tags))
	}
	if recordedAt != nil && !recordedAt.IsZero() && len(facets.RecordTime) == 0 {
		facets.RecordTime = []string{lifeagent.FormatCoEditRecordedAt(*recordedAt)}
	}
	facets = lifeagent.NormalizeKnowledgeFacetTags(facets)
	k.FacetTags = models.JSONMap(lifeagent.KnowledgeFacetTagsToMap(facets))

	analysis := lifeagent.AnalyzeKnowledgeTimeline(k.Title, k.Category, k.Content, facets, recordedAt)
	k.TimelineStatus = analysis.Status
	k.TimelineMeta = models.JSONMap(timelineAnalysisToMap(analysis))
	return analysis
}

func createTimelineEventForKnowledge(tx *gorm.DB, k models.LifeAgentKnowledgeEntry, analysis lifeagent.TimelineAnalysis) error {
	if tx == nil || !analysis.ShouldTrack {
		return nil
	}
	event := models.LifeAgentTimelineEvent{
		ID:                    models.GenID(),
		ProfileID:             k.ProfileID,
		PeriodLabel:           analysis.PeriodLabel,
		PeriodGranularity:     analysis.PeriodGranularity,
		SequenceOrder:         analysis.SequenceOrder,
		EventType:             analysis.EventType,
		Title:                 analysis.Title,
		Summary:               analysis.Summary,
		Causes:                models.JSONArray(analysis.Causes),
		Outcomes:              models.JSONArray(analysis.Outcomes),
		Tradeoffs:             models.JSONArray(analysis.Tradeoffs),
		SourceEntryIDs:        models.JSONArray([]string{k.ID}),
		Confidence:            analysis.Confidence,
		Status:                analysis.Status,
		MissingFields:         models.JSONArray(analysis.MissingFields),
		ClarificationQuestion: strOpt(analysis.ClarificationQuestion),
	}
	return tx.Create(&event).Error
}

func timelineAnalysisToMap(a lifeagent.TimelineAnalysis) map[string]interface{} {
	return map[string]interface{}{
		"shouldTrack":           a.ShouldTrack,
		"status":                a.Status,
		"periodLabel":           a.PeriodLabel,
		"periodGranularity":     a.PeriodGranularity,
		"sequenceOrder":         a.SequenceOrder,
		"eventType":             a.EventType,
		"missingFields":         a.MissingFields,
		"clarificationQuestion": a.ClarificationQuestion,
		"confidence":            a.Confidence,
	}
}

// applyModifyIntentChanges 把 LLM 解析出的 Changes 应用到 profile / knowledge_entries 上，
// 返回一段简短的中文摘要（"新增 2 条知识 · 更新欢迎语"），用于通知中心展示。
func applyModifyIntentChanges(p *models.LifeAgentProfile, entries *[]models.LifeAgentKnowledgeEntry, profileID string, ch *lifeagent.ModifyIntentChanges, eventID string, recordedAt *time.Time) (string, string) {
	if ch == nil {
		return "", ""
	}
	parts := []string{}
	timelineClarification := ""
	upd := db.DB.Model(p)
	if len(ch.ExpertiseTags) > 0 {
		tags := ch.ExpertiseTags
		if len(tags) > 8 {
			tags = tags[:8]
		}
		upd.Update("expertise_tags", models.JSONArray(tags))
		parts = append(parts, "更新擅长标签")
	}
	if len(ch.SampleQuestions) > 0 {
		qs := ch.SampleQuestions
		if len(qs) > 6 {
			qs = qs[:6]
		}
		upd.Update("sample_questions", models.JSONArray(qs))
		parts = append(parts, "更新示例问题")
	}
	if ch.WelcomeMessage != "" {
		upd.Update("welcome_message", ch.WelcomeMessage)
		parts = append(parts, "更新欢迎语")
	}
	if ch.PersonaArchetype != "" {
		upd.Update("persona_archetype", ch.PersonaArchetype)
		parts = append(parts, "更新角色定位")
	}
	if ch.ToneStyle != "" {
		upd.Update("tone_style", ch.ToneStyle)
		parts = append(parts, "更新语气")
	}
	if ch.ResponseStyle != "" {
		upd.Update("response_style", ch.ResponseStyle)
		parts = append(parts, "更新回答习惯")
	}
	if len(ch.ForbiddenPhrases) > 0 {
		fp := ch.ForbiddenPhrases
		if len(fp) > 8 {
			fp = fp[:8]
		}
		upd.Update("forbidden_phrases", models.JSONArray(fp))
		parts = append(parts, "更新禁用语")
	}
	if len(ch.ExampleReplies) > 0 {
		er := ch.ExampleReplies
		if len(er) > 5 {
			er = er[:5]
		}
		upd.Update("example_replies", models.JSONArray(er))
		parts = append(parts, "更新示范回答")
	}
	addedCount := 0
	for i, add := range ch.KnowledgeAdd {
		if add.Content == "" {
			continue
		}
		tags := add.Tags
		if len(tags) == 0 {
			tags = []string{add.Category}
		}
		cat, title := add.Category, add.Title
		if cat == "" {
			cat = "经验"
		}
		if title == "" {
			title = add.Content
			if len(title) > 50 {
				title = title[:50] + "..."
			}
		}
		k := models.LifeAgentKnowledgeEntry{
			ID:        models.GenID(),
			ProfileID: profileID,
			Category:  cat,
			Title:     title,
			Content:   add.Content,
			Tags:      models.JSONArray(tags),
			SortOrder: len(*entries) + i,
		}
		analysis := prepareLifeAgentKnowledgeEntry(&k, "chat_training", strOpt(eventID), nil, recordedAt, "co_edit_chat")
		if err := db.DB.Create(&k).Error; err == nil {
			if err := createTimelineEventForKnowledge(db.DB, k, analysis); err != nil {
				log.Printf("life-agents modify: create timeline event failed entry=%s: %v", k.ID, err)
			}
			*entries = append(*entries, k)
			addedCount++
			if timelineClarification == "" && analysis.Status == "needs_clarification" {
				timelineClarification = analysis.ClarificationQuestion
			}
		}
	}
	if addedCount > 0 {
		parts = append(parts, fmt.Sprintf("新增 %d 条知识", addedCount))
	}
	return strings.Join(parts, " · "), timelineClarification
}

// LifeAgentsCoEditEvents —— 轮询接口：返回某 Agent 最近的调教事件（含 pending 状态）。
// 前端依赖这个接口完成"理解结果回执"：发送消息后每 2s 轮询一次，看到 pending→processed/failed
// 就把对应聊天气泡换成 AI 的回复，并刷新 manage 资料。
func LifeAgentsCoEditEvents(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ?", id).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "NOT_FOUND"})
			return
		}
		if p.UserID != user.ID {
			c.JSON(http.StatusForbidden, gin.H{"error": "FORBIDDEN"})
			return
		}
		limit := 50
		if n := c.Query("limit"); n != "" {
			if parsed, err := strconv.Atoi(n); err == nil && parsed > 0 && parsed <= 200 {
				limit = parsed
			}
		}
		q := db.DB.Where("profile_id = ?", id)
		if sinceStr := c.Query("since"); sinceStr != "" {
			if t, err := time.Parse(time.RFC3339, sinceStr); err == nil {
				q = q.Where("created_at >= ?", t)
			}
		}
		var events []models.LifeAgentCoEditEvent
		q.Order("created_at ASC").Limit(limit).Find(&events)
		out := make([]gin.H, 0, len(events))
		for _, e := range events {
			row := gin.H{
				"id":         e.ID,
				"rawMessage": e.RawMessage,
				"status":     e.Status,
				"createdAt":  e.CreatedAt.Format(time.RFC3339),
			}
			if e.AssistantMessage != nil {
				row["assistantMessage"] = *e.AssistantMessage
			}
			if e.ChangesSummary != nil {
				row["changesSummary"] = *e.ChangesSummary
			}
			if e.ErrorDetail != nil {
				row["errorDetail"] = *e.ErrorDetail
			}
			if e.ProcessedAt != nil {
				row["processedAt"] = e.ProcessedAt.Format(time.RFC3339)
			}
			out = append(out, row)
		}
		c.JSON(http.StatusOK, gin.H{"events": out})
	}
}

// buildModifyStateString 给 LLM 调教接口准备的 Agent 状态摘要。
//
// 历史版本会把所有 knowledge 全文塞进去（每条 120 字摘要 × N 条），输入 token
// 经常 3000+，packyapi 中转就经常打不进 60s。新版按"骨架 + 全量标题 + top-K
// 相关条目"的 RAG 做法：
//   - 骨架字段（名称/语气/角色/欢迎语/禁忌/示范）始终带上；
//   - 知识库全部条目仅展示 title + 分类 + 标签，LLM 至少知道有什么；
//   - 跟用户当前消息最相关的 top-K 条目额外展开 content 摘要，供 LLM 判断
//     是否要新增/修改；
//   - 示范回答仅取前 3 条；样例问题截断至 6 条。
//
// 实测能把输入 token 从 3000+ 压到 600~1000，速度提升 3~5 倍，且因为
// "lost in the middle" 现象的减弱，表现力反而更稳。
func buildModifyStateString(p *models.LifeAgentProfile, entries []models.LifeAgentKnowledgeEntry, timelineRows []models.LifeAgentTimelineEvent, userMessage string, recordedAt *time.Time) string {
	var b strings.Builder
	if recordedAt != nil {
		b.WriteString(fmt.Sprintf("本条调教时间: %s\n", lifeagent.FormatCoEditRecordedAt(*recordedAt)))
	}
	b.WriteString(fmt.Sprintf("名称: %s\n", p.DisplayName))
	b.WriteString(fmt.Sprintf("一句话介绍: %s\n", p.Headline))
	b.WriteString(fmt.Sprintf("目标人群: %s\n", p.Audience))
	b.WriteString(fmt.Sprintf("欢迎语: %s\n", p.WelcomeMessage))
	if len(p.ExpertiseTags) > 0 {
		b.WriteString(fmt.Sprintf("擅长标签: %s\n", strings.Join(p.ExpertiseTags, ", ")))
	}
	if len(p.SampleQuestions) > 0 {
		samples := p.SampleQuestions
		if len(samples) > 6 {
			samples = samples[:6]
		}
		b.WriteString(fmt.Sprintf("示例问题: %s\n", strings.Join(samples, " | ")))
	}
	b.WriteString(fmt.Sprintf("角色: %s | 语气: %s | 回答习惯: %s\n",
		ptrStr(p.PersonaArchetype), ptrStr(p.ToneStyle), ptrStr(p.ResponseStyle)))
	if len(p.ForbiddenPhrases) > 0 {
		b.WriteString(fmt.Sprintf("禁止用语: %s\n", strings.Join(p.ForbiddenPhrases, ", ")))
	}
	if len(p.ExampleReplies) > 0 {
		examples := p.ExampleReplies
		if len(examples) > 3 {
			examples = examples[:3]
		}
		b.WriteString("示范回答:\n")
		for i, r := range examples {
			excerpt := lifeagent.TruncateToRunes(r, 80)
			b.WriteString(fmt.Sprintf("  %d. %s\n", i+1, excerpt))
		}
	}
	if len(timelineRows) > 0 {
		b.WriteString("\n【已确认/待确认的人生时间线】\n")
		for i, ev := range timelineRows {
			if i >= 8 {
				break
			}
			status := ev.Status
			if status == "" {
				status = "confirmed"
			}
			b.WriteString(fmt.Sprintf("- %s：%s（%s）[%s]\n", ev.PeriodLabel, ev.Title, ev.EventType, status))
		}
		b.WriteString("如果用户新增关键人生节点但没说时间，优先追问时间；如果和这里主线冲突，不要直接覆盖。\n")
	}

	if len(entries) == 0 {
		b.WriteString("\n【知识库】当前没有条目\n")
		return b.String()
	}

	// 找出跟当前用户消息最相关的 top-K 知识条目（按 n-gram 重叠数排序）。
	const topK = 3
	relevant := selectRelevantKnowledgeIndexes(entries, userMessage, topK)
	relevantSet := make(map[int]bool, len(relevant))
	for _, idx := range relevant {
		relevantSet[idx] = true
	}

	b.WriteString(fmt.Sprintf("\n【知识库目录】共 %d 条，下面仅列标题，相关 %d 条会在【相关知识详情】展开：\n",
		len(entries), len(relevant)))
	for i, e := range entries {
		tagStr := ""
		if len(e.Tags) > 0 {
			tagStr = " #" + strings.Join(e.Tags, " #")
		}
		marker := " "
		if relevantSet[i] {
			marker = "★"
		}
		b.WriteString(fmt.Sprintf("%s %d. [%s] %s%s\n", marker, i+1, e.Category, e.Title, tagStr))
	}

	if len(relevant) > 0 {
		b.WriteString("\n【相关知识详情】跟用户这句话最相关的条目内容：\n")
		for _, idx := range relevant {
			e := entries[idx]
			excerpt := lifeagent.TruncateToRunes(e.Content, 150)
			b.WriteString(fmt.Sprintf("- 第 %d 条 [%s] %s\n  %s\n", idx+1, e.Category, e.Title, excerpt))
		}
	}

	return b.String()
}

// selectRelevantKnowledgeIndexes 用 2~3 字 n-gram 重叠度做轻量级中文检索，
// 找出跟 userMessage 最相关的 topK 条目下标。
//
// 不引入分词依赖、不调 LLM、不依赖向量；对"我喜欢张雪峰"这种短句也有效。
// 命中的 n-gram 越多分越高，且优先考虑 title / tags / category（权重 ≥ 内容）。
func selectRelevantKnowledgeIndexes(entries []models.LifeAgentKnowledgeEntry, userMessage string, topK int) []int {
	if topK <= 0 || len(entries) == 0 {
		return nil
	}
	ngrams := extractMatchNGrams(userMessage)
	if len(ngrams) == 0 {
		return nil
	}
	type scored struct {
		idx   int
		score int
	}
	scoredList := make([]scored, 0, len(entries))
	for i, e := range entries {
		title := strings.ToLower(e.Title)
		category := strings.ToLower(e.Category)
		content := strings.ToLower(e.Content)
		tags := strings.ToLower(strings.Join(e.Tags, " "))
		s := 0
		for ng := range ngrams {
			if ng == "" {
				continue
			}
			if strings.Contains(title, ng) {
				s += 4
			}
			if strings.Contains(tags, ng) {
				s += 3
			}
			if strings.Contains(category, ng) {
				s += 2
			}
			if strings.Contains(content, ng) {
				s += 1
			}
		}
		if s > 0 {
			scoredList = append(scoredList, scored{idx: i, score: s})
		}
	}
	if len(scoredList) == 0 {
		return nil
	}
	sort.SliceStable(scoredList, func(a, b int) bool {
		return scoredList[a].score > scoredList[b].score
	})
	if len(scoredList) > topK {
		scoredList = scoredList[:topK]
	}
	out := make([]int, 0, len(scoredList))
	for _, s := range scoredList {
		out = append(out, s.idx)
	}
	sort.Ints(out)
	return out
}

var matchSplitRe = regexp.MustCompile(`[\s,.;:!?()\[\]{}"'、，。；：！？\-_/\\|]+`)

// extractMatchNGrams 把消息切成可用于子串匹配的 2~3 字 n-gram 集合。
// 对汉字按 rune 取相邻 2 字、3 字片段；对 ASCII 单词整体保留（长度 >=2）。
func extractMatchNGrams(s string) map[string]struct{} {
	norm := strings.ToLower(strings.TrimSpace(s))
	if norm == "" {
		return nil
	}
	chunks := matchSplitRe.Split(norm, -1)
	out := make(map[string]struct{}, 32)
	for _, chunk := range chunks {
		chunk = strings.TrimSpace(chunk)
		if chunk == "" {
			continue
		}
		runes := []rune(chunk)
		if len(runes) <= 6 {
			out[chunk] = struct{}{}
		}
		if len(runes) >= 2 {
			for i := 0; i <= len(runes)-2; i++ {
				out[string(runes[i:i+2])] = struct{}{}
			}
		}
		if len(runes) >= 3 {
			for i := 0; i <= len(runes)-3; i++ {
				out[string(runes[i:i+3])] = struct{}{}
			}
		}
	}
	return out
}

// trimChatHistoryForModify 给调教 LLM 的对话历史限长：
// 只保留最近 N 轮（一个 user + 一个 assistant 为一轮）。
// 太长的历史不仅慢，对意图理解也基本没帮助，反而会污染当前指令。
func trimChatHistoryForModify(history []lifeagent.ChatMessageForAI, maxTurns int) []lifeagent.ChatMessageForAI {
	if maxTurns <= 0 || len(history) == 0 {
		return history
	}
	maxMessages := maxTurns * 2
	if len(history) <= maxMessages {
		return history
	}
	return history[len(history)-maxMessages:]
}

func buildManageProfileResp(p *models.LifeAgentProfile, entries []models.LifeAgentKnowledgeEntry) gin.H {
	type ke struct {
		ID             string         `json:"id"`
		Category       string         `json:"category"`
		Title          string         `json:"title"`
		Content        string         `json:"content"`
		Tags           []string       `json:"tags"`
		FacetTags      models.JSONMap `json:"facetTags"`
		SourceType     string         `json:"sourceType"`
		TimelineStatus string         `json:"timelineStatus"`
		TimelineMeta   models.JSONMap `json:"timelineMeta"`
		Revision       int            `json:"revision"`
		CreatedAt      time.Time      `json:"createdAt"`
		UpdatedAt      time.Time      `json:"updatedAt"`
	}
	var keList []ke
	for _, e := range entries {
		keList = append(keList, ke{
			ID: e.ID, Category: e.Category, Title: e.Title, Content: e.Content, Tags: []string(e.Tags),
			FacetTags: e.FacetTags, SourceType: e.SourceType, TimelineStatus: e.TimelineStatus,
			TimelineMeta: e.TimelineMeta, Revision: e.Revision, CreatedAt: e.CreatedAt, UpdatedAt: e.UpdatedAt,
		})
	}
	var facts []models.LifeAgentStructuredFact
	db.DB.Where("profile_id = ?", p.ID).Order("fact_key ASC, created_at ASC").Find(&facts)
	var topics []models.LifeAgentTopicSummary
	db.DB.Where("profile_id = ?", p.ID).Order("topic_group ASC, topic_key ASC").Find(&topics)
	var timelineRows []models.LifeAgentTimelineEvent
	db.DB.Where("profile_id = ?", p.ID).Order("sequence_order ASC, created_at ASC").Find(&timelineRows)
	return gin.H{
		"id":               p.ID,
		"displayName":      p.DisplayName,
		"headline":         p.Headline,
		"shortBio":         p.ShortBio,
		"longBio":          p.LongBio,
		"audience":         p.Audience,
		"welcomeMessage":   p.WelcomeMessage,
		"pricePerQuestion": p.PricePerQuestion,
		"expertiseTags":    p.ExpertiseTags,
		"sampleQuestions":  sampleQuestionsForDisplay(p, entries),
		"education":        ptrStr(p.Education),
		"income":           ptrStr(p.Income),
		"job":              ptrStr(p.Job),
		"school":           ptrStr(p.School),
		"country":          ptrStr(p.Country),
		"province":         ptrStr(p.Province),
		"city":             ptrStr(p.City),
		"county":           ptrStr(p.County),
		"regions":          p.Regions,
		"mbti":             ptrStr(p.MBTI),
		"personaArchetype": ptrStr(p.PersonaArchetype),
		"toneStyle":        ptrStr(p.ToneStyle),
		"responseStyle":    ptrStr(p.ResponseStyle),
		"forbiddenPhrases": p.ForbiddenPhrases,
		"exampleReplies":   p.ExampleReplies,
		"notSuitableFor":   ptrStr(p.NotSuitableFor),
		"published":        p.Published,
		"knowledgeEntries": keList,
		"structuredFacts":  buildStructuredFactResponses(facts),
		"topicSummaries":   buildTopicSummaryResponses(topics),
		"timelineEvents":   timelineRows,
		"coverImageUrl":    ptrStr(p.CoverImageURL),
		"coverPresetKey":   ptrStr(p.CoverPresetKey),
		"coverUrl":         lifeAgentCoverURL(p),
	}
}

func LifeAgentsManage(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ?", id).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "NOT_FOUND"})
			return
		}
		if p.UserID != user.ID {
			c.JSON(http.StatusForbidden, gin.H{"error": "FORBIDDEN"})
			return
		}
		var entries []models.LifeAgentKnowledgeEntry
		db.DB.Where("profile_id = ?", id).Order("sort_order").Find(&entries)
		var facts []models.LifeAgentStructuredFact
		db.DB.Where("profile_id = ?", id).Order("fact_key ASC, created_at ASC").Find(&facts)
		var topics []models.LifeAgentTopicSummary
		db.DB.Where("profile_id = ?", id).Order("topic_group ASC, topic_key ASC").Find(&topics)
		var timelineRows []models.LifeAgentTimelineEvent
		db.DB.Where("profile_id = ?", id).Order("sequence_order ASC, created_at ASC").Find(&timelineRows)
		var packs []models.LifeAgentQuestionPack
		db.DB.Where("profile_id = ?", id).Order("created_at DESC").Limit(50).Find(&packs)
		var sessions []models.LifeAgentChatSession
		db.DB.Where("profile_id = ?", id).Order("updated_at DESC").Limit(50).Find(&sessions)
		var totalRevenue int
		var totalPacks, totalSess int64
		var helpful, notSpecific, notSuitable, factualError, contradiction, tooConfident int64
		db.DB.Model(&models.LifeAgentQuestionPack{}).Where("profile_id = ? AND status = ?", id, "paid").Select("COALESCE(SUM(amount_paid),0)").Scan(&totalRevenue)
		db.DB.Model(&models.LifeAgentQuestionPack{}).Where("profile_id = ?", id).Count(&totalPacks)
		db.DB.Model(&models.LifeAgentChatSession{}).Where("profile_id = ?", id).Count(&totalSess)
		db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id = ? AND feedback_type = ?", id, "helpful").Count(&helpful)
		db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id = ? AND feedback_type = ?", id, "not_specific").Count(&notSpecific)
		db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id = ? AND feedback_type = ?", id, "not_suitable").Count(&notSuitable)
		db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id = ? AND feedback_type = ?", id, "factual_error").Count(&factualError)
		db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id = ? AND feedback_type = ?", id, "contradiction").Count(&contradiction)
		db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id = ? AND feedback_type = ?", id, "too_confident").Count(&tooConfident)
		var recentFb []models.LifeAgentFeedback
		db.DB.Where("profile_id = ?", id).Order("created_at DESC").Limit(20).Find(&recentFb)
		type fbResp struct {
			ID               string  `json:"id"`
			FeedbackType     string  `json:"feedbackType"`
			AssistantExcerpt *string `json:"assistantExcerpt"`
			Comment          *string `json:"comment"`
			CreatedAt        string  `json:"createdAt"`
		}
		fbList := make([]fbResp, 0, len(recentFb))
		for _, f := range recentFb {
			fbList = append(fbList, fbResp{
				ID: f.ID, FeedbackType: f.FeedbackType,
				AssistantExcerpt: f.AssistantExcerpt, Comment: f.Comment,
				CreatedAt: f.CreatedAt.Format("2006-01-02 15:04"),
			})
		}
		ratingsSummary := buildLifeAgentRatingsSummary(id, 20)

		var blindSpotCount int64
		db.DB.Model(&models.LifeAgentBlindSpot{}).Where("profile_id = ? AND resolved = ?", id, false).Count(&blindSpotCount)

		// 构建反馈告警（红/橙/黄/蓝）供仪表盘展示
		manageFbSignals := buildFeedbackSignals(id)
		var manageBlindSpots []models.LifeAgentBlindSpot
		db.DB.Where("profile_id = ? AND resolved = ?", id, false).Order("created_at DESC").Limit(10).Find(&manageBlindSpots)
		manageTopicLabels := make(map[string]string)
		for _, t := range topics {
			manageTopicLabels[t.ID] = t.TopicLabel
		}
		var bsForAlert []lifeagent.BlindSpotForFollowUp
		for _, s := range manageBlindSpots {
			bsForAlert = append(bsForAlert, lifeagent.BlindSpotForFollowUp{UserQuestion: s.UserQuestion, Route: s.Route})
		}
		feedbackAlerts := lifeagent.BuildFeedbackAlerts(manageFbSignals, manageTopicLabels, bsForAlert)
		mindScore := lifeagent.ComputeMindScore(loadMindScoreInput(id, &p, cfg))
		nextSuggestion := lifeagent.GenerateNextSuggestion(buildNextSuggestionContext(id, &p, cfg, "", 0, false, false))
		growthLog := buildGrowthLogPayload(id, user.ID, true, 8)

		type packResp struct {
			ID            string `json:"id"`
			QuestionCount int    `json:"questionCount"`
			QuestionsUsed int    `json:"questionsUsed"`
			AmountPaid    int    `json:"amountPaid"`
			CreatedAt     string `json:"createdAt"`
			Buyer         gin.H  `json:"buyer"`
		}
		packResps := make([]packResp, 0, len(packs))
		for _, pk := range packs {
			var b models.User
			db.DB.Where("id = ?", pk.BuyerID).First(&b)
			packResps = append(packResps, packResp{
				ID: pk.ID, QuestionCount: pk.QuestionCount, QuestionsUsed: pk.QuestionsUsed,
				AmountPaid: pk.AmountPaid, CreatedAt: pk.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
				Buyer: gin.H{"email": b.Email, "name": b.Name},
			})
		}
		type sessResp struct {
			ID           string `json:"id"`
			Title        string `json:"title"`
			MessageCount int64  `json:"messageCount"`
			CreatedAt    string `json:"createdAt"`
			UpdatedAt    string `json:"updatedAt"`
			Buyer        gin.H  `json:"buyer"`
		}
		sessResps := make([]sessResp, 0, len(sessions))
		for _, s := range sessions {
			var b models.User
			db.DB.Where("id = ?", s.BuyerID).First(&b)
			var cnt int64
			db.DB.Model(&models.LifeAgentChatMessage{}).Where("session_id = ?", s.ID).Count(&cnt)
			sessResps = append(sessResps, sessResp{
				ID: s.ID, Title: "咨询会话", MessageCount: cnt,
				CreatedAt: s.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
				UpdatedAt: s.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
				Buyer:     gin.H{"email": b.Email, "name": b.Name},
			})
		}

		c.JSON(http.StatusOK, gin.H{
			"profile": gin.H{
				"id":                            p.ID,
				"displayName":                   p.DisplayName,
				"headline":                      p.Headline,
				"shortBio":                      p.ShortBio,
				"longBio":                       p.LongBio,
				"audience":                      p.Audience,
				"welcomeMessage":                p.WelcomeMessage,
				"pricePerQuestion":              p.PricePerQuestion,
				"expertiseTags":                 p.ExpertiseTags,
				"sampleQuestions":               sampleQuestionsForDisplay(&p, entries),
				"education":                     ptrStr(p.Education),
				"income":                        ptrStr(p.Income),
				"job":                           ptrStr(p.Job),
				"school":                        ptrStr(p.School),
				"country":                       ptrStr(p.Country),
				"province":                      ptrStr(p.Province),
				"city":                          ptrStr(p.City),
				"county":                        ptrStr(p.County),
				"regions":                       p.Regions,
				"verificationStatus":            coalesceVerificationStatus(p.VerificationStatus),
				"mbti":                          ptrStr(p.MBTI),
				"personaArchetype":              ptrStr(p.PersonaArchetype),
				"toneStyle":                     ptrStr(p.ToneStyle),
				"responseStyle":                 ptrStr(p.ResponseStyle),
				"forbiddenPhrases":              p.ForbiddenPhrases,
				"exampleReplies":                p.ExampleReplies,
				"notSuitableFor":                ptrStr(p.NotSuitableFor),
				"published":                     p.Published,
				"knowledgeEntries":              entries,
				"structuredFacts":               buildStructuredFactResponses(facts),
				"topicSummaries":                buildTopicSummaryResponses(topics),
				"timelineEvents":                timelineRows,
				"voiceCloneId":                  ptrStr(p.VoiceCloneID),
				"hasVoiceClone":                 cfg.VoiceReplyConfigured(ptrStr(p.VoiceCloneID)),
				"coverImageUrl":                 ptrStr(p.CoverImageURL),
				"coverPresetKey":                ptrStr(p.CoverPresetKey),
				"coverUrl":                      lifeAgentCoverURL(&p),
				"apiInvokeEnabled":              p.ApiInvokeEnabled,
				"apiPriceFollowsConsultation":   p.ApiPricePerCallCents == nil,
				"apiPricePerCallCents":          p.ApiPricePerCallCents,
				"effectiveApiPricePerCallCents": effectiveLifeAgentAPIPriceCents(&p),
				"apiTotalCalls":                 p.ApiTotalCalls,
			},
			"stats": gin.H{
				"totalRevenue":   totalRevenue,
				"soldPacks":      totalPacks,
				"sessionCount":   totalSess,
				"topicCount":     len(topics),
				"blindSpotCount": blindSpotCount,
				"mindScore":      mindScore.Total,
				"mindScoreLevel": mindScore.Level,
			},
			"mindScore":      mindScoreToJSON(mindScore, nil),
			"nextSuggestion": nextSuggestion,
			"feedback": gin.H{
				"counts":  gin.H{"helpful": helpful, "notSpecific": notSpecific, "notSuitable": notSuitable, "factualError": factualError, "contradiction": contradiction, "tooConfident": tooConfident},
				"recent":  fbList,
				"ratings": ratingsSummary,
				"alerts":  feedbackAlerts,
			},
			"questionPacks": packResps,
			"chatSessions":  sessResps,
			"growth":        growthLog,
		})
	}
}

func LifeAgentsPurchase(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		var body struct {
			QuestionCount int `json:"questionCount" binding:"required,min=1,max=500"`
			AmountPaid    int `json:"amountPaid" binding:"required,min=0"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ?", id).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "PROFILE_NOT_FOUND"})
			return
		}
		expected := p.PricePerQuestion * body.QuestionCount
		if body.AmountPaid < expected {
			c.JSON(http.StatusBadRequest, gin.H{"error": "INSUFFICIENT_PAYMENT"})
			return
		}
		pack := models.LifeAgentQuestionPack{
			ID:            models.GenID(),
			ProfileID:     id,
			BuyerID:       user.ID,
			QuestionCount: body.QuestionCount,
			AmountPaid:    body.AmountPaid,
			Status:        "paid",
		}
		db.DB.Create(&pack)
		var remaining int
		db.DB.Raw("SELECT COALESCE(SUM(question_count - questions_used), 0) FROM life_agent_question_packs WHERE profile_id = ? AND buyer_id = ? AND status = ?", id, user.ID, "paid").Scan(&remaining)
		c.JSON(http.StatusOK, gin.H{"packId": pack.ID, "remainingQuestions": remaining})
	}
}

func LifeAgentsChatSessions(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}

		id := c.Param("id")
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ?", id).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "PROFILE_NOT_FOUND"})
			return
		}

		var sessions []models.LifeAgentChatSession
		db.DB.Where("profile_id = ? AND buyer_id = ?", id, user.ID).
			Order("updated_at DESC").
			Limit(50).
			Find(&sessions)

		resp := make([]gin.H, 0, len(sessions))
		for _, s := range sessions {
			var messageCount int64
			db.DB.Model(&models.LifeAgentChatMessage{}).Where("session_id = ?", s.ID).Count(&messageCount)
			resp = append(resp, gin.H{
				"id":           s.ID,
				"title":        s.Title,
				"messageCount": messageCount,
				"createdAt":    s.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
				"updatedAt":    s.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
			})
		}

		c.JSON(http.StatusOK, resp)
	}
}

func LifeAgentsBuyerChatSessions(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}

		var sessions []models.LifeAgentChatSession
		db.DB.Where("buyer_id = ?", user.ID).
			Order("updated_at DESC").
			Limit(100).
			Find(&sessions)

		if len(sessions) == 0 {
			c.JSON(http.StatusOK, []gin.H{})
			return
		}

		profileIDs := make([]string, 0, len(sessions))
		seenProfiles := make(map[string]bool)
		for _, session := range sessions {
			if seenProfiles[session.ProfileID] {
				continue
			}
			seenProfiles[session.ProfileID] = true
			profileIDs = append(profileIDs, session.ProfileID)
		}

		var profiles []models.LifeAgentProfile
		db.DB.Where("id IN ?", profileIDs).Find(&profiles)
		profileMap := make(map[string]models.LifeAgentProfile)
		for _, profile := range profiles {
			profileMap[profile.ID] = profile
		}

		resp := make([]gin.H, 0, len(sessions))
		for _, session := range sessions {
			profile, ok := profileMap[session.ProfileID]
			if !ok {
				continue
			}
			var messageCount int64
			db.DB.Model(&models.LifeAgentChatMessage{}).Where("session_id = ?", session.ID).Count(&messageCount)
			resp = append(resp, gin.H{
				"id":           session.ID,
				"title":        session.Title,
				"messageCount": messageCount,
				"createdAt":    session.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
				"updatedAt":    session.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
				"profile": gin.H{
					"id":                 profile.ID,
					"displayName":        profile.DisplayName,
					"headline":           profile.Headline,
					"verificationStatus": coalesceVerificationStatus(profile.VerificationStatus),
					"coverUrl":           lifeAgentCoverURL(&profile),
					"coverImageUrl":      ptrStr(profile.CoverImageURL),
					"coverPresetKey":     ptrStr(profile.CoverPresetKey),
				},
			})
		}

		c.JSON(http.StatusOK, resp)
	}
}

func LifeAgentsChatSessionDetail(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}

		id := c.Param("id")
		sessionID := c.Param("sessionId")

		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ?", id).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "PROFILE_NOT_FOUND"})
			return
		}

		var session models.LifeAgentChatSession
		if err := db.DB.Where("id = ? AND profile_id = ? AND buyer_id = ?", sessionID, id, user.ID).First(&session).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "SESSION_NOT_FOUND"})
			return
		}

		var msgs []models.LifeAgentChatMessage
		db.DB.Select("id", "role", "content", "audio_url", "audio_format", "audio_duration_sec", "refs", "created_at").
			Where("session_id = ?", sessionID).
			Order("created_at ASC").
			Find(&msgs)

		messages := make([]gin.H, 0, len(msgs))
		for _, msg := range msgs {
			item := gin.H{
				"id":        msg.ID,
				"role":      msg.Role,
				"content":   msg.Content,
				"createdAt": msg.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			}
			if msg.Role == "assistant" {
				item["references"] = buildLifeAgentChatReferences(msg.Refs)
				if audioURL := buildStoredAudioURL(&msg); audioURL != "" {
					item["audioUrl"] = audioURL
				}
				if msg.AudioDurationSec != nil {
					item["audioDurationSec"] = *msg.AudioDurationSec
				}
			}
			messages = append(messages, item)
		}

		c.JSON(http.StatusOK, gin.H{
			"session": gin.H{
				"id":           session.ID,
				"title":        session.Title,
				"createdAt":    session.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
				"updatedAt":    session.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
				"messageCount": len(messages),
			},
			"messages": messages,
		})
	}
}

func LifeAgentsChat(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		chatStartTime := time.Now()
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		var body struct {
			SessionID     string `json:"sessionId"`
			Message       string `json:"message" binding:"required,min=2,max=2000"`
			UseVoiceReply bool   `json:"useVoiceReply"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ?", id).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "PROFILE_NOT_FOUND"})
			return
		}
		if !p.Published {
			c.JSON(http.StatusNotFound, gin.H{"error": "PROFILE_NOT_FOUND"})
			return
		}
		var packs []models.LifeAgentQuestionPack
		remaining := lifeAgentUnlimitedRemainingSentinel
		var packToConsume *models.LifeAgentQuestionPack
		if !cfg.LifeAgentUnlimitedChat {
			db.DB.Where("profile_id = ? AND buyer_id = ? AND status = ?", id, user.ID, "paid").Order("created_at ASC").Find(&packs)
			remaining = 0
			for i := range packs {
				r := packs[i].QuestionCount - packs[i].QuestionsUsed
				remaining += r
				if r > 0 && packToConsume == nil {
					packToConsume = &packs[i]
				}
			}
			if remaining <= 0 || packToConsume == nil {
				c.JSON(http.StatusPaymentRequired, gin.H{"error": "NO_QUESTIONS_LEFT"})
				return
			}
		}
		sessionID := body.SessionID
		var sessionSummary string
		if sessionID != "" {
			var sess models.LifeAgentChatSession
			if db.DB.Where("id = ? AND profile_id = ? AND buyer_id = ?", sessionID, id, user.ID).First(&sess).Error != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "SESSION_NOT_FOUND"})
				return
			}
			if len(sess.MemoryJSON) > 0 {
				sessionSummary = lifeagent.ConversationMemoryFromMap(map[string]interface{}(sess.MemoryJSON)).SummaryText
			} else if sess.Summary != nil {
				sessionSummary = *sess.Summary
			}
		} else {
			title := buildLifeAgentSessionTitle(body.Message)
			sess := models.LifeAgentChatSession{
				ID:        models.GenID(),
				ProfileID: id,
				BuyerID:   user.ID,
				Title:     title,
				Status:    "active",
			}
			db.DB.Create(&sess)
			sessionID = sess.ID
		}
		// 跨会话记忆：加载当前买家与该 agent 之前会话的摘要
		var crossMemory string
		var agentSelfAnchor string
		{
			var prevSessions []models.LifeAgentChatSession
			db.DB.Where("profile_id = ? AND buyer_id = ? AND id != ? AND summary IS NOT NULL AND summary != ''",
				id, user.ID, sessionID).Order("updated_at DESC").Limit(3).Find(&prevSessions)
			memories := make([]lifeagent.ConversationMemory, 0, len(prevSessions))
			for _, s := range prevSessions {
				if len(s.MemoryJSON) > 0 {
					memories = append(memories, lifeagent.ConversationMemoryFromMap(map[string]interface{}(s.MemoryJSON)))
				} else if s.Summary != nil && *s.Summary != "" {
					memories = append(memories, lifeagent.ConversationMemory{SummaryText: *s.Summary})
				}
			}
			crossMemory = lifeagent.BuildCrossSessionMemoryForQuery(memories, body.Message)
			agentSelfAnchor = lifeagent.BuildAgentSelfConsistencyAnchor(memories)
		}
		var entries []models.LifeAgentKnowledgeEntry
		db.DB.Where("profile_id = ?", id).Order("sort_order").Find(&entries)
		var facts []models.LifeAgentStructuredFact
		db.DB.Where("profile_id = ?", id).Order("fact_key ASC, created_at ASC").Find(&facts)
		var topics []models.LifeAgentTopicSummary
		db.DB.Where("profile_id = ?", id).Order("topic_group ASC, topic_key ASC").Find(&topics)
		var timelineRows []models.LifeAgentTimelineEvent
		db.DB.Where("profile_id = ? AND status IN ?", id, []string{"confirmed", "needs_clarification"}).
			Order("sequence_order ASC, created_at ASC").Limit(20).Find(&timelineRows)
		timelineForAI := lifeagent.BuildTimelineEventsForAI(timelineRows)
		var hist []lifeagent.ChatMessageForAI
		var msgs []models.LifeAgentChatMessage
		// 取最近 20 条（DESC），再反转为时间正序，确保 LLM 看到的是最新上下文
		db.DB.Select("role", "content", "refs", "created_at").
			Where("session_id = ?", sessionID).
			Order("created_at DESC").
			Limit(20).
			Find(&msgs)
		for i, j := 0, len(msgs)-1; i < j; i, j = i+1, j-1 {
			msgs[i], msgs[j] = msgs[j], msgs[i]
		}
		// 提取最近 assistant 回复引用过的素材 ID，用于检索去重
		var recentlyUsedEntryIDs []string
		recentUsedSet := map[string]bool{}
		for _, m := range msgs {
			hist = append(hist, lifeagent.ChatMessageForAI{Role: m.Role, Content: m.Content})
			if m.Role == "assistant" && len(m.Refs) > 0 {
				for _, r := range m.Refs {
					if rm, ok := r.(map[string]interface{}); ok {
						if rid, _ := rm["id"].(string); rid != "" && !recentUsedSet[rid] {
							recentUsedSet[rid] = true
							recentlyUsedEntryIDs = append(recentlyUsedEntryIDs, rid)
						}
					}
				}
			}
		}
		entriesForAI := lifeagent.BuildKnowledgeEntriesForAI(entries)
		// 加载实时动态（未过期）
		var liveUpdateRows []models.LifeAgentLiveUpdate
		db.DB.Where("profile_id = ? AND (expires_at IS NULL OR expires_at > ?)", id, time.Now()).
			Order("pinned DESC, created_at DESC").Limit(10).Find(&liveUpdateRows)
		liveUpdatesForAI := make([]lifeagent.LiveUpdateForAI, len(liveUpdateRows))
		now := time.Now()
		for i, lu := range liveUpdateRows {
			loc := ""
			if lu.Location != nil {
				loc = *lu.Location
			}
			liveUpdatesForAI[i] = lifeagent.LiveUpdateForAI{
				ID:        lu.ID,
				Content:   lu.Content,
				Category:  lu.Category,
				Location:  loc,
				CreatedAt: lu.CreatedAt.Format(time.RFC3339),
				FreshDays: int(now.Sub(lu.CreatedAt).Hours() / 24),
			}
		}

		factsForAI := lifeagent.BuildStructuredFactsForAI(facts)
		topicsForAI := lifeagent.BuildTopicSummariesForAI(topics)

		// Hybrid RAG: 把 DB 上已有的 embedding 注入 ForAI 视图；没有就留空（走词法）
		lifeagent.HydrateEntryEmbeddings(entries, entriesForAI)
		lifeagent.HydrateLiveEmbeddings(liveUpdateRows, liveUpdatesForAI)

		// Feedback-Aware Retrieval: 加载该 Agent 的聚合反馈信号
		feedbackSignals := buildFeedbackSignals(id)

		// ─── CoALA 四层记忆：感知 + 情景 + 异步回填 ───
		embedder := lifeagent.NewEmbedderFromConfig(cfg)
		// 本轮是会话内第几个用户回合（0-based）
		userTurns := 0
		for _, m := range msgs {
			if m.Role == "user" {
				userTurns++
			}
		}
		// 感知轨迹：取本会话最近 20 条历史（不含本轮），用于算 EmotionArc 和粘性长度诉求
		traces := lifeagent.LoadRecentPerceptualTraces(db.DB, sessionID, 20)
		perception := lifeagent.BuildPerceptionSnapshot(body.Message, hist, traces)
		// 情景回忆候选：严格 buyer-only，跨会话但同一 profile × buyer
		episodes := lifeagent.LoadEpisodeCandidates(db.DB, id, user.ID, 40)
		// 工作记忆：handler 先把元信息和感知填好，二阶段管道里再接着填 Retrieved/Strategy
		ws := lifeagent.NewWorkingState(id, sessionID, user.ID, userTurns)
		ws.Perception = perception
		ws.AntiRepeat.EntryIDs = recentlyUsedEntryIDs

		// 向量懒回填：异步把缺 embedding 的 entry/topic/live 写回库，不阻塞本轮回复
		lifeagent.BackfillEmbeddingsAsync(
			context.Background(), db.DB, embedder, id,
			entries, topics, liveUpdateRows,
		)

		profileForAI := lifeagent.ProfileForAI{
			DisplayName:      p.DisplayName,
			Headline:         p.Headline,
			ShortBio:         p.ShortBio,
			LongBio:          p.LongBio,
			Audience:         p.Audience,
			WelcomeMessage:   p.WelcomeMessage,
			ExpertiseTags:    []string(p.ExpertiseTags),
			MBTI:             ptrStr(p.MBTI),
			PersonaArchetype: ptrStr(p.PersonaArchetype),
			ToneStyle:        ptrStr(p.ToneStyle),
			ResponseStyle:    ptrStr(p.ResponseStyle),
			ForbiddenPhrases: []string(p.ForbiddenPhrases),
			ExampleReplies:   []string(p.ExampleReplies),
			NotSuitableFor:   ptrStr(p.NotSuitableFor),
		}
		log.Printf("[chat-timing] DB+prep done in %dms", time.Since(chatStartTime).Milliseconds())

		chatOpts := &lifeagent.ChatOptions{
			SessionSummary:       sessionSummary,
			CrossSessionMemory:   crossMemory,
			AgentSelfConsistency: agentSelfAnchor,
			LiveUpdates:          liveUpdatesForAI,
			TimelineEvents:       timelineForAI,
			RecentlyUsedEntryIDs: recentlyUsedEntryIDs,
			FeedbackSignals:      feedbackSignals,
			WorkingState:         ws,
			Embedder:             embedder,
			Episodes:             episodes,
			TurnIndex:            userTurns,
		}

		var content string
		var refs []map[string]string
		if isMiniAppClient(c) {
			if reply, replyRefs, ok := lifeagent.ResolveGroundedFactReply(profileForAI, factsForAI, body.Message); ok {
				content = reply
				refs = replyRefs
			} else if lifeagent.ClassifyQuestionIntent(body.Message) {
				content = lifeagent.BuildIdentityReply(profileForAI)
			} else {
				content, refs, _ = lifeagent.BuildReplyWithLLM(
					c.Request.Context(),
					cfg.OpenAIApiKey, cfg.OpenAIModel, cfg.OpenAIBaseURL,
					cfg.LLMEnableWebSearch,
					profileForAI,
					factsForAI, topicsForAI, entriesForAI, hist, body.Message,
					chatOpts,
				)
			}
		} else {
			// --- SSE streaming ---
			c.Header("Content-Type", "text/event-stream")
			c.Header("Cache-Control", "no-cache")
			c.Header("Connection", "keep-alive")
			c.Header("X-Accel-Buffering", "no")
			c.Status(http.StatusOK)
			c.Writer.Flush()

			writeSSE := func(eventType string, payload interface{}) {
				data, _ := json.Marshal(payload)
				fmt.Fprintf(c.Writer, "event: %s\ndata: %s\n\n", eventType, data)
				c.Writer.Flush()
			}

			if reply, replyRefs, ok := lifeagent.ResolveGroundedFactReply(profileForAI, factsForAI, body.Message); ok {
				content = reply
				refs = replyRefs
				lifeagent.EmitReplyChunks(content, func(chunk string) {
					writeSSE("content", gin.H{"content": chunk})
				})
			} else if lifeagent.ClassifyQuestionIntent(body.Message) {
				content = lifeagent.BuildIdentityReply(profileForAI)
				lifeagent.EmitReplyChunks(content, func(chunk string) {
					writeSSE("content", gin.H{"content": chunk})
				})
			} else {
				content, refs, _ = lifeagent.BuildReplyWithLLMStream(
					c.Request.Context(),
					cfg.OpenAIApiKey, cfg.OpenAIModel, cfg.OpenAIBaseURL,
					cfg.LLMEnableWebSearch,
					profileForAI,
					factsForAI, topicsForAI, entriesForAI, hist, body.Message,
					func(chunk string) {
						writeSSE("content", gin.H{"content": chunk})
					},
					chatOpts,
				)
			}
		}
		refsMap := make([]map[string]interface{}, len(refs))
		for i, r := range refs {
			refsMap[i] = make(map[string]interface{})
			for k, v := range r {
				refsMap[i][k] = v
			}
		}
		var refsAny models.JSONAny
		for _, m := range refsMap {
			refsAny = append(refsAny, m)
		}
		db.DB.Create(&models.LifeAgentChatMessage{ID: models.GenID(), SessionID: sessionID, Role: "user", Content: body.Message})
		assistantMsgID := models.GenID()

		// 先保存消息（无音频）、发 done 事件，让前端立即拿到完整文本
		db.DB.Create(&models.LifeAgentChatMessage{
			ID:        assistantMsgID,
			SessionID: sessionID,
			Role:      "assistant",
			Content:   content,
			Refs:      refsAny,
		})
		if !cfg.LifeAgentUnlimitedChat && packToConsume != nil {
			db.DB.Model(packToConsume).Update("questions_used", packToConsume.QuestionsUsed+1)
		}
		db.DB.Model(&models.LifeAgentChatSession{}).Where("id = ?", sessionID).Update("updated_at", db.DB.NowFunc())

		// 感知轨迹异步落库：让下次回合能感知到 EmotionArc/长度粘性
		go func(sid string, turn int, snap lifeagent.PerceptionSnapshot) {
			if err := lifeagent.WritePerceptualTrace(context.Background(), db.DB, sid, turn, snap); err != nil {
				log.Printf("[perceptual-trace] write failed: %v", err)
			}
		}(sessionID, userTurns, perception)

		// 情景记忆巩固：够厚的会话才反思抽取；阈值取在"消息数 > 6"，避免每轮都 call LLM
		if len(msgs)+2 >= 6 {
			consolidationHist := make([]lifeagent.ChatMessageForAI, len(hist), len(hist)+2)
			copy(consolidationHist, hist)
			consolidationHist = append(consolidationHist, lifeagent.ChatMessageForAI{Role: "user", Content: body.Message})
			consolidationHist = append(consolidationHist, lifeagent.ChatMessageForAI{Role: "assistant", Content: content})
			lifeagent.ConsolidateEpisodesAsync(
				context.Background(), db.DB, embedder,
				cfg.OpenAIApiKey, cfg.OpenAIModel, cfg.OpenAIBaseURL,
				id, sessionID, user.ID, consolidationHist,
			)
		}

		// 检测低置信回答，记录为 Agent 盲区
		go func(profileID, sid, question string, factsSnap []lifeagent.StructuredFactForAI, topicsSnap []lifeagent.TopicSummaryForAI, entriesSnap []lifeagent.KnowledgeEntryForAI, histSnap []lifeagent.ChatMessageForAI) {
			plan := lifeagent.BuildRetrievalPlan(question, histSnap, factsSnap, topicsSnap, entriesSnap)
			if plan.Confidence == "low" {
				reasonsJSON, _ := json.Marshal(plan.Reasons)
				db.DB.Create(&models.LifeAgentBlindSpot{
					ID:           models.GenID(),
					ProfileID:    profileID,
					SessionID:    sid,
					UserQuestion: question,
					Confidence:   plan.Confidence,
					Route:        string(plan.Route),
					Reasons:      models.JSONAny{map[string]interface{}{"reasons": json.RawMessage(reasonsJSON)}},
				})
			}
		}(id, sessionID, body.Message, factsForAI, topicsForAI, entriesForAI, hist)

		// 异步生成会话摘要：消息数 > 6 时触发，不阻塞响应（短会话也能沉淀跨会话记忆）
		totalMsgCount := len(msgs) + 2
		if totalMsgCount > 6 {
			allHist := make([]lifeagent.ChatMessageForAI, len(hist), len(hist)+2)
			copy(allHist, hist)
			allHist = append(allHist, lifeagent.ChatMessageForAI{Role: "user", Content: body.Message})
			allHist = append(allHist, lifeagent.ChatMessageForAI{Role: "assistant", Content: content})
			go func(sid string, messages []lifeagent.ChatMessageForAI) {
				memory := lifeagent.SummarizeConversationMemory(
					context.Background(),
					cfg.OpenAIApiKey, cfg.OpenAIModel, cfg.OpenAIBaseURL,
					messages,
				)
				if memory.SummaryText != "" {
					reviewStatus := "auto"
					if len(memory.UserStatedFacts) > 0 {
						reviewStatus = "pending"
					}
					db.DB.Model(&models.LifeAgentChatSession{}).Where("id = ?", sid).Updates(map[string]interface{}{
						"summary":              memory.SummaryText,
						"memory_json":          conversationMemoryJSON(memory),
						"memory_review_status": reviewStatus,
					})
					upsertTopicCandidatesFromConversationMemory(id, sid, memory)
				}
			}(sessionID, allHist)
		}

		ratingState := buildLifeAgentRatingState(id, user.ID)
		remainingOut := remaining - 1
		if cfg.LifeAgentUnlimitedChat {
			remainingOut = lifeAgentUnlimitedRemainingSentinel
		}
		donePayload := gin.H{
			"sessionId":          sessionID,
			"sessionTitle":       buildLifeAgentSessionTitle(body.Message),
			"messageId":          assistantMsgID,
			"reply":              content,
			"references":         refsMap,
			"remainingQuestions": remainingOut,
			"rating":             ratingState,
		}
		if isMiniAppClient(c) {
			c.JSON(http.StatusOK, donePayload)
			return
		}
		writeSSE(c, "done", donePayload)

		// TTS 在 done 之后执行，不阻塞文本展示；完成后发 audio_ready 事件
		resolvedTTS := cfg.ResolveTTSProvider()
		voiceCloneID := ptrStr(p.VoiceCloneID)
		if body.UseVoiceReply && content != "" && (voiceCloneID != "" || resolvedTTS != "") {
			ttsProvider := tts.NewProviderFromConfig(cfg)
			audioB64, dur, err := ttsProvider.Synthesize(voiceCloneID, content)
			if err != nil {
				log.Printf("life-agents chat: TTS failed (provider=%q): %v", resolvedTTS, err)
			}
			if err == nil && audioB64 != "" {
				decoded, decodeErr := base64.StdEncoding.DecodeString(audioB64)
				if decodeErr != nil {
					log.Printf("life-agents chat: decode TTS audio: %v", decodeErr)
				} else if len(decoded) > 0 {
					format := strings.TrimSpace(ttsProvider.MediaFormat())
					if format == "" {
						format = "mp3"
					}
					url := "/api/audio/" + assistantMsgID + "." + format
					db.DB.Model(&models.LifeAgentChatMessage{}).Where("id = ?", assistantMsgID).Updates(map[string]interface{}{
						"audio_url":          url,
						"audio_format":       format,
						"audio_data":         decoded,
						"audio_duration_sec": dur,
					})
					writeSSE(c, "audio_ready", gin.H{
						"audioUrl":         url,
						"audioDurationSec": dur,
					})
				}
			}
		}
	}
}

func truncateStr(s string, max int) string {
	s = strings.TrimSpace(s)
	if max <= 0 || len(s) <= max {
		return s
	}
	return s[:max] + "…"
}

func LifeAgentsChatFeedback(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		var body struct {
			MessageID    string  `json:"messageId" binding:"required"`
			SessionID    string  `json:"sessionId" binding:"required"`
			FeedbackType string  `json:"feedbackType" binding:"required,oneof=helpful not_specific not_suitable factual_error contradiction too_confident"`
			Comment      *string `json:"comment"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ?", id).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "PROFILE_NOT_FOUND"})
			return
		}
		var msg models.LifeAgentChatMessage
		if err := db.DB.Select("id", "session_id", "role", "content", "refs", "created_at").
			Where("id = ? AND session_id = ?", body.MessageID, body.SessionID).
			First(&msg).Error; err != nil || msg.Role != "assistant" {
			c.JSON(http.StatusNotFound, gin.H{"error": "MESSAGE_NOT_FOUND"})
			return
		}
		var sess models.LifeAgentChatSession
		if err := db.DB.Where("id = ? AND profile_id = ? AND buyer_id = ?", body.SessionID, id, user.ID).First(&sess).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "FORBIDDEN"})
			return
		}
		var prev models.LifeAgentFeedback
		if db.DB.Where("message_id = ? AND buyer_id = ?", body.MessageID, user.ID).First(&prev).Error == nil {
			db.DB.Model(&prev).Updates(map[string]interface{}{
				"feedback_type": body.FeedbackType,
				"comment":       body.Comment,
				"source_refs":   msg.Refs,
			})
			c.JSON(http.StatusOK, gin.H{"ok": true, "updated": true})
			return
		}
		excerpt := lifeagent.TruncateToRunes(msg.Content, 400)
		var userQ string
		var prevMsg models.LifeAgentChatMessage
		if db.DB.Select("content", "created_at").
			Where("session_id = ? AND role = ? AND created_at < ?", body.SessionID, "user", msg.CreatedAt).
			Order("created_at DESC").
			First(&prevMsg).Error == nil {
			userQ = prevMsg.Content
		}
		fb := models.LifeAgentFeedback{
			ID:               models.GenID(),
			ProfileID:        id,
			MessageID:        body.MessageID,
			SessionID:        body.SessionID,
			BuyerID:          user.ID,
			FeedbackType:     body.FeedbackType,
			UserQuestion:     strOpt(userQ),
			AssistantExcerpt: strOpt(excerpt),
			Comment:          body.Comment,
			SourceRefs:       msg.Refs,
		}
		db.DB.Create(&fb)
		c.JSON(http.StatusOK, gin.H{"ok": true})
	}
}

func LifeAgentsRate(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		var body struct {
			Score   int     `json:"score" binding:"required,min=1,max=5"`
			Comment *string `json:"comment"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ?", id).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "PROFILE_NOT_FOUND"})
			return
		}

		state := buildLifeAgentRatingState(id, user.ID)
		currentMilestone, _ := state["currentMilestone"].(int)
		eligible, _ := state["eligible"].(bool)
		if !eligible || currentMilestone < 10 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "RATING_NOT_ELIGIBLE"})
			return
		}

		var existing models.LifeAgentRating
		if db.DB.Where("profile_id = ? AND buyer_id = ?", id, user.ID).First(&existing).Error == nil {
			db.DB.Model(&existing).Updates(map[string]interface{}{
				"score":                body.Score,
				"comment":              body.Comment,
				"last_rated_milestone": currentMilestone,
			})
		} else {
			db.DB.Create(&models.LifeAgentRating{
				ID:                 models.GenID(),
				ProfileID:          id,
				BuyerID:            user.ID,
				Score:              body.Score,
				Comment:            body.Comment,
				LastRatedMilestone: currentMilestone,
			})
		}

		c.JSON(http.StatusOK, gin.H{
			"ok":     true,
			"rating": buildLifeAgentRatingState(id, user.ID),
		})
	}
}

func LifeAgentsFeedbackSummary(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ? AND user_id = ?", id, user.ID).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "PROFILE_NOT_FOUND"})
			return
		}
		var helpful, notSpecific, notSuitable, factualError, contradiction, tooConfident int64
		db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id = ? AND feedback_type = ?", id, "helpful").Count(&helpful)
		db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id = ? AND feedback_type = ?", id, "not_specific").Count(&notSpecific)
		db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id = ? AND feedback_type = ?", id, "not_suitable").Count(&notSuitable)
		db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id = ? AND feedback_type = ?", id, "factual_error").Count(&factualError)
		db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id = ? AND feedback_type = ?", id, "contradiction").Count(&contradiction)
		db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id = ? AND feedback_type = ?", id, "too_confident").Count(&tooConfident)
		var recent []models.LifeAgentFeedback
		db.DB.Where("profile_id = ?", id).Order("created_at DESC").Limit(30).Find(&recent)
		type fbResp struct {
			ID               string  `json:"id"`
			FeedbackType     string  `json:"feedbackType"`
			AssistantExcerpt *string `json:"assistantExcerpt"`
			Comment          *string `json:"comment"`
			CreatedAt        string  `json:"createdAt"`
		}
		var list []fbResp
		for _, f := range recent {
			list = append(list, fbResp{
				ID: f.ID, FeedbackType: f.FeedbackType,
				AssistantExcerpt: f.AssistantExcerpt, Comment: f.Comment,
				CreatedAt: f.CreatedAt.Format("2006-01-02 15:04"),
			})
		}
		ratingsSummary := buildLifeAgentRatingsSummary(id, 20)
		c.JSON(http.StatusOK, gin.H{
			"counts": gin.H{
				"helpful":       helpful,
				"notSpecific":   notSpecific,
				"notSuitable":   notSuitable,
				"factualError":  factualError,
				"contradiction": contradiction,
				"tooConfident":  tooConfident,
			},
			"ratings": ratingsSummary,
			"recent":  list,
		})
	}
}

// LifeAgentsParseChatPreview parses an uploaded chat file and returns the list
// of senders so the user can pick which talker they are before full analysis.
func LifeAgentsParseChatPreview(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ?", id).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "NOT_FOUND"})
			return
		}
		if p.UserID != user.ID {
			c.JSON(http.StatusForbidden, gin.H{"error": "FORBIDDEN"})
			return
		}

		file, header, err := c.Request.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "FILE_REQUIRED", "detail": "请上传聊天记录文件"})
			return
		}
		defer file.Close()

		content, err := io.ReadAll(file)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "FILE_READ_ERROR", "detail": err.Error()})
			return
		}

		format := lifeagent.DetectChatFormat(header.Filename, content)
		maxMessages := cfg.MaxChatImportMessages
		if maxMessages <= 0 {
			maxMessages = 100
		}

		parseResult, err := lifeagent.ParseChatRecords(format, content, maxMessages)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "PARSE_ERROR", "detail": err.Error()})
			return
		}
		if parseResult.TotalMessages == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "NO_MESSAGES", "detail": "未从文件中解析到任何消息，请检查文件格式"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"format":        parseResult.Format,
			"totalMessages": parseResult.TotalMessages,
			"senders":       parseResult.Senders,
		})
	}
}

// LifeAgentsImportChat handles uploading and analyzing WeChat chat records
// to extract persona style and knowledge for the life agent.
func LifeAgentsImportChat(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ?", id).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "NOT_FOUND"})
			return
		}
		if p.UserID != user.ID {
			c.JSON(http.StatusForbidden, gin.H{"error": "FORBIDDEN"})
			return
		}

		// Read uploaded file
		file, header, err := c.Request.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "FILE_REQUIRED", "detail": "请上传聊天记录文件"})
			return
		}
		defer file.Close()

		targetName := strings.TrimSpace(c.PostForm("targetName"))
		if targetName == "" {
			targetName = "我"
		}

		// Read file content
		content, err := io.ReadAll(file)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "FILE_READ_ERROR", "detail": err.Error()})
			return
		}

		// Detect format and parse
		format := lifeagent.DetectChatFormat(header.Filename, content)
		maxMessages := cfg.MaxChatImportMessages
		if maxMessages <= 0 {
			maxMessages = 100
		}

		parseResult, err := lifeagent.ParseChatRecords(format, content, maxMessages)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "PARSE_ERROR", "detail": err.Error()})
			return
		}
		if parseResult.TotalMessages == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "NO_MESSAGES", "detail": "未从文件中解析到任何消息，请检查文件格式"})
			return
		}

		// Analyze for target
		lifeagent.AnalyzeForTarget(parseResult, targetName, 50)

		// Build current state string
		var entries []models.LifeAgentKnowledgeEntry
		db.DB.Where("profile_id = ?", id).Order("sort_order").Find(&entries)
		// 聊天记录导入场景没有单条用户消息，传空串走"仅列标题"模式即可。
		var timelineRows []models.LifeAgentTimelineEvent
		db.DB.Where("profile_id = ? AND status IN ?", id, []string{"confirmed", "needs_clarification"}).
			Order("sequence_order ASC, created_at ASC").Limit(20).Find(&timelineRows)
		state := buildModifyStateString(&p, entries, timelineRows, "", nil)

		// Build chat summary for LLM
		chatSummary := lifeagent.BuildChatSummaryForLLM(parseResult, targetName)

		// SSE response
		c.Header("Content-Type", "text/event-stream")
		c.Header("Cache-Control", "no-cache")
		c.Header("Connection", "keep-alive")
		c.Header("X-Accel-Buffering", "no")
		c.Status(http.StatusOK)

		writeSSE := func(eventType string, payload interface{}) {
			data, _ := json.Marshal(payload)
			fmt.Fprintf(c.Writer, "event: %s\ndata: %s\n\n", eventType, data)
			c.Writer.Flush()
		}

		// Send parse stats first
		writeSSE("progress", gin.H{
			"stage":          "parsed",
			"totalMessages":  parseResult.TotalMessages,
			"targetMessages": parseResult.TargetMessages,
			"senders":        parseResult.Senders,
			"format":         parseResult.Format,
		})

		// LLM analysis
		result, err := lifeagent.AnalyzeChatForAgentProfile(
			c.Request.Context(),
			cfg.OpenAIApiKey, cfg.OpenAIModel, cfg.OpenAIBaseURL,
			state, chatSummary,
		)
		if err != nil {
			writeSSE("error", gin.H{"detail": err.Error()})
			return
		}

		if result.Changes == nil {
			writeSSE("done", gin.H{
				"assistantMessage": result.Reply,
				"profile":          buildManageProfileResp(&p, entries),
			})
			return
		}

		// Apply changes (same logic as LifeAgentsModifyViaChat)
		ch := result.Changes
		upd := db.DB.Model(&p)
		if ch.PersonaArchetype != "" {
			upd.Update("persona_archetype", ch.PersonaArchetype)
		}
		if ch.ToneStyle != "" {
			upd.Update("tone_style", ch.ToneStyle)
		}
		if ch.ResponseStyle != "" {
			upd.Update("response_style", ch.ResponseStyle)
		}
		if len(ch.ExpertiseTags) > 0 {
			tags := ch.ExpertiseTags
			if len(tags) > 8 {
				tags = tags[:8]
			}
			upd.Update("expertise_tags", models.JSONArray(tags))
		}
		if len(ch.SampleQuestions) > 0 {
			qs := ch.SampleQuestions
			if len(qs) > 6 {
				qs = qs[:6]
			}
			upd.Update("sample_questions", models.JSONArray(qs))
		}
		if ch.WelcomeMessage != "" {
			upd.Update("welcome_message", ch.WelcomeMessage)
		}
		if len(ch.ForbiddenPhrases) > 0 {
			fp := ch.ForbiddenPhrases
			if len(fp) > 8 {
				fp = fp[:8]
			}
			upd.Update("forbidden_phrases", models.JSONArray(fp))
		}
		if len(ch.ExampleReplies) > 0 {
			er := ch.ExampleReplies
			if len(er) > 5 {
				er = er[:5]
			}
			upd.Update("example_replies", models.JSONArray(er))
		}
		for i, add := range ch.KnowledgeAdd {
			if add.Content == "" {
				continue
			}
			tags := add.Tags
			if len(tags) == 0 {
				tags = []string{add.Category}
			}
			cat, title := add.Category, add.Title
			if cat == "" {
				cat = "聊天记录"
			}
			if title == "" {
				title = add.Content
				if len(title) > 50 {
					title = title[:50] + "..."
				}
			}
			k := models.LifeAgentKnowledgeEntry{
				ID:        models.GenID(),
				ProfileID: id,
				Category:  cat,
				Title:     title,
				Content:   add.Content,
				Tags:      models.JSONArray(tags),
				SortOrder: len(entries) + i,
			}
			analysis := prepareLifeAgentKnowledgeEntry(&k, "chat_import", nil, nil, nil, "chat_import")
			db.DB.Create(&k)
			if err := createTimelineEventForKnowledge(db.DB, k, analysis); err != nil {
				log.Printf("life-agents import chat: create timeline event failed entry=%s: %v", k.ID, err)
			}
			entries = append(entries, k)
		}

		refreshLifeAgentStructuredFacts(id)
		refreshLifeAgentTopicSummaries(id)
		db.DB.Where("id = ?", id).First(&p)
		db.DB.Where("profile_id = ?", id).Order("sort_order").Find(&entries)
		profileResp := buildManageProfileResp(&p, entries)
		writeSSE("done", gin.H{
			"assistantMessage": result.Reply,
			"profile":          profileResp,
		})
	}
}

func LifeAgentsBlindSpots(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			return
		}
		id := c.Param("id")
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ? AND user_id = ?", id, user.ID).First(&p).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		var spots []models.LifeAgentBlindSpot
		db.DB.Where("profile_id = ? AND resolved = ?", id, false).Order("created_at DESC").Limit(50).Find(&spots)

		type blindSpotResp struct {
			ID           string `json:"id"`
			UserQuestion string `json:"userQuestion"`
			Confidence   string `json:"confidence"`
			Route        string `json:"route"`
			CreatedAt    string `json:"createdAt"`
		}
		items := make([]blindSpotResp, len(spots))
		for i, s := range spots {
			items[i] = blindSpotResp{
				ID:           s.ID,
				UserQuestion: s.UserQuestion,
				Confidence:   s.Confidence,
				Route:        s.Route,
				CreatedAt:    s.CreatedAt.Format(time.RFC3339),
			}
		}
		c.JSON(http.StatusOK, gin.H{"blindSpots": items, "total": len(items)})
	}
}

func LifeAgentsBlindSpotResolve(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			return
		}
		id := c.Param("id")
		spotID := c.Param("spotId")
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ? AND user_id = ?", id, user.ID).First(&p).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		var spot models.LifeAgentBlindSpot
		db.DB.Where("id = ? AND profile_id = ?", spotID, id).First(&spot)
		db.DB.Model(&models.LifeAgentBlindSpot{}).Where("id = ? AND profile_id = ?", spotID, id).Update("resolved", true)
		if strings.TrimSpace(spot.ID) != "" {
			createLifeAgentGrowthEvent(
				id,
				"feedback_fixed",
				"owner",
				growthEventTitle("feedback_fixed", ""),
				spot.UserQuestion,
				models.JSONMap{"route": spot.Route, "confidence": spot.Confidence},
				&spotID,
			)
		}
		c.JSON(http.StatusOK, gin.H{"ok": true})
	}
}

// LifeAgentsFollowUpQuestions 基于盲区和负面反馈，为创建者生成针对性的追问。
// 闭合 用户反馈 → 创建者补充 → Agent 变好 的飞轮。
func LifeAgentsFollowUpQuestions(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			return
		}
		id := c.Param("id")
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ? AND user_id = ?", id, user.ID).First(&p).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}

		// 收集盲区
		var spots []models.LifeAgentBlindSpot
		db.DB.Where("profile_id = ? AND resolved = ?", id, false).Order("created_at DESC").Limit(10).Find(&spots)
		blindSpots := make([]lifeagent.BlindSpotForFollowUp, len(spots))
		for i, s := range spots {
			blindSpots[i] = lifeagent.BlindSpotForFollowUp{
				UserQuestion: s.UserQuestion,
				Route:        s.Route,
			}
		}

		// 收集负面反馈按 Topic 聚合
		fbSignals := buildFeedbackSignals(id)
		var weakTopics []lifeagent.WeakTopicForFollowUp
		if fbSignals != nil {
			var topics []models.LifeAgentTopicSummary
			db.DB.Where("profile_id = ? AND status = ?", id, "active").Find(&topics)
			topicLabels := make(map[string]string)
			for _, t := range topics {
				topicLabels[t.ID] = t.TopicLabel
			}
			for topicID, stat := range fbSignals.TopicStats {
				if !stat.HasNegativeSignals() {
					continue
				}
				label := topicLabels[topicID]
				if label == "" {
					continue
				}
				total := stat.NotSpecific + stat.FactualError + stat.Contradiction + stat.TooConfident
				weakTopics = append(weakTopics, lifeagent.WeakTopicForFollowUp{
					TopicLabel:    label,
					DominantIssue: stat.DominantIssue(),
					FeedbackCount: total,
				})
			}
		}

		// 构建告警列表（始终返回，即使没有追问）
		var topicLabels map[string]string
		if fbSignals != nil {
			var allTopics []models.LifeAgentTopicSummary
			db.DB.Where("profile_id = ? AND status = ?", id, "active").Find(&allTopics)
			topicLabels = make(map[string]string, len(allTopics))
			for _, t := range allTopics {
				topicLabels[t.ID] = t.TopicLabel
			}
		} else {
			topicLabels = make(map[string]string)
		}
		alerts := lifeagent.BuildFeedbackAlerts(fbSignals, topicLabels, blindSpots)

		if len(blindSpots) == 0 && len(weakTopics) == 0 {
			c.JSON(http.StatusOK, gin.H{
				"questions": []interface{}{},
				"alerts":    alerts,
				"message":   "目前没有需要补充的内容，你的 Agent 表现不错！",
			})
			return
		}

		input := &lifeagent.FeedbackFollowUpInput{
			DisplayName: p.DisplayName,
			Headline:    p.Headline,
			BlindSpots:  blindSpots,
			WeakTopics:  weakTopics,
		}
		result := lifeagent.GenerateFollowUpFromFeedback(
			c.Request.Context(),
			cfg.OpenAIApiKey, cfg.OpenAIModel, cfg.OpenAIBaseURL,
			input,
		)

		c.JSON(http.StatusOK, gin.H{
			"questions":      result.Questions,
			"alerts":         alerts,
			"blindSpotCount": len(blindSpots),
			"weakTopicCount": len(weakTopics),
		})
	}
}

func growthEventTitle(eventType, category string) string {
	switch eventType {
	case "live_update":
		switch category {
		case "job":
			return "更新了求职近况"
		case "study":
			return "更新了升学近况"
		case "market":
			return "更新了行业行情"
		case "housing":
			return "更新了居住信息"
		case "policy":
			return "更新了政策变化"
		case "resource":
			return "更新了可用资源"
		case "life":
			return "更新了生活近况"
		default:
			return "更新了一条近况"
		}
	case "co_edit_applied":
		return "补充了 Agent 记忆"
	case "feedback_fixed":
		return "处理了一条用户反馈"
	case "profile_polished":
		return "完善了展示资料"
	default:
		return "更新了 Agent"
	}
}

func growthEventToResp(e models.LifeAgentGrowthEvent, now time.Time) gin.H {
	freshDays := int(now.Sub(e.CreatedAt).Hours() / 24)
	if freshDays < 0 {
		freshDays = 0
	}
	return gin.H{
		"id":         e.ID,
		"type":       e.Type,
		"visibility": e.Visibility,
		"title":      e.Title,
		"summary":    e.Summary,
		"payload":    e.Payload,
		"sourceId":   e.SourceID,
		"createdAt":  e.CreatedAt.Format(time.RFC3339),
		"freshDays":  freshDays,
	}
}

func listLifeAgentGrowthEvents(profileID string, ownerView bool, limit int) []models.LifeAgentGrowthEvent {
	if limit <= 0 || limit > 100 {
		limit = 30
	}
	q := db.DB.Where("profile_id = ?", profileID)
	if !ownerView {
		q = q.Where("visibility = ?", "public")
	}
	var events []models.LifeAgentGrowthEvent
	q.Order("created_at DESC").Limit(limit).Find(&events)
	return events
}

func buildGrowthLogPayload(profileID, userID string, ownerView bool, limit int) gin.H {
	events := listLifeAgentGrowthEvents(profileID, ownerView, limit)
	now := time.Now()
	items := make([]gin.H, 0, len(events))
	publicCount := 0
	for _, event := range events {
		if event.Visibility == "public" {
			publicCount++
		}
		items = append(items, growthEventToResp(event, now))
	}

	var total, weekCount, publicTotal, followerCount, unread int64
	db.DB.Model(&models.LifeAgentGrowthEvent{}).Where("profile_id = ?", profileID).Count(&total)
	db.DB.Model(&models.LifeAgentGrowthEvent{}).Where("profile_id = ? AND visibility = ?", profileID, "public").Count(&publicTotal)
	db.DB.Model(&models.LifeAgentGrowthEvent{}).Where("profile_id = ? AND created_at >= ?", profileID, now.AddDate(0, 0, -7)).Count(&weekCount)
	db.DB.Model(&models.LifeAgentFavorite{}).Where("profile_id = ?", profileID).Count(&followerCount)

	following := false
	var lastSeen *time.Time
	if strings.TrimSpace(userID) != "" {
		var fav models.LifeAgentFavorite
		if err := db.DB.Where("user_id = ? AND profile_id = ?", userID, profileID).First(&fav).Error; err == nil {
			following = true
			lastSeen = fav.LastSeenGrowthAt
			q := db.DB.Model(&models.LifeAgentGrowthEvent{}).
				Where("profile_id = ? AND visibility = ?", profileID, "public")
			if lastSeen != nil {
				q = q.Where("created_at > ?", *lastSeen)
			}
			q.Count(&unread)
		}
	}

	latestTitle := ""
	if len(events) > 0 {
		latestTitle = events[0].Title
	}
	return gin.H{
		"events": items,
		"summary": gin.H{
			"total":         total,
			"publicTotal":   publicTotal,
			"publicLoaded":  publicCount,
			"weekCount":     weekCount,
			"followerCount": followerCount,
			"unread":        unread,
			"following":     following,
			"latestTitle":   latestTitle,
			"lastSeenAt": func() interface{} {
				if lastSeen == nil {
					return nil
				}
				return lastSeen.Format(time.RFC3339)
			}(),
		},
	}
}

func createLifeAgentGrowthEvent(profileID, eventType, visibility, title, summary string, payload models.JSONMap, sourceID *string) {
	profileID = strings.TrimSpace(profileID)
	summary = strings.TrimSpace(summary)
	if profileID == "" || summary == "" {
		return
	}
	if visibility == "" {
		visibility = "owner"
	}
	if title == "" {
		title = growthEventTitle(eventType, "")
	}
	if payload == nil {
		payload = models.JSONMap{}
	}
	if sourceID != nil && *sourceID != "" {
		var existing models.LifeAgentGrowthEvent
		if err := db.DB.Where("profile_id = ? AND type = ? AND source_id = ?", profileID, eventType, *sourceID).First(&existing).Error; err == nil {
			return
		}
	}
	event := models.LifeAgentGrowthEvent{
		ID:         models.GenID(),
		ProfileID:  profileID,
		Type:       eventType,
		Visibility: visibility,
		Title:      strings.TrimSpace(title),
		Summary:    summary,
		Payload:    payload,
		SourceID:   sourceID,
		CreatedAt:  time.Now().UTC(),
	}
	if err := db.DB.Create(&event).Error; err != nil {
		log.Printf("life-agent growth: create event failed profile=%s type=%s: %v", profileID, eventType, err)
	}
}

func LifeAgentsGrowthLog(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var p models.LifeAgentProfile
		if err := db.DB.Select("id").Where("id = ? AND published = ?", id, true).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "NOT_FOUND"})
			return
		}
		user := middleware.MustGetUser(c)
		userID := ""
		if user != nil {
			userID = user.ID
		}
		c.JSON(http.StatusOK, buildGrowthLogPayload(id, userID, false, 30))
	}
}

func LifeAgentsManageGrowthLog(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		var p models.LifeAgentProfile
		if err := db.DB.Select("id,user_id").Where("id = ?", id).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "NOT_FOUND"})
			return
		}
		if p.UserID != user.ID {
			c.JSON(http.StatusForbidden, gin.H{"error": "FORBIDDEN"})
			return
		}
		c.JSON(http.StatusOK, buildGrowthLogPayload(id, user.ID, true, 50))
	}
}

func LifeAgentsGrowthLogMarkSeen(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		now := time.Now().UTC()
		var fav models.LifeAgentFavorite
		if err := db.DB.Where("user_id = ? AND profile_id = ?", user.ID, id).First(&fav).Error; err != nil {
			c.JSON(http.StatusOK, gin.H{"ok": true, "following": false})
			return
		}
		db.DB.Model(&fav).Update("last_seen_growth_at", now)
		c.JSON(http.StatusOK, gin.H{"ok": true, "following": true, "lastSeenAt": now.Format(time.RFC3339)})
	}
}

func LifeAgentsLiveUpdateCreate(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			return
		}
		id := c.Param("id")
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ? AND user_id = ?", id, user.ID).First(&p).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		var body struct {
			Content   string  `json:"content"`
			Category  string  `json:"category"`
			Location  *string `json:"location"`
			ExpiresIn *int    `json:"expiresIn"` // hours; nil = no expiry
			Pinned    bool    `json:"pinned"`
		}
		if err := c.ShouldBindJSON(&body); err != nil || strings.TrimSpace(body.Content) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "content is required"})
			return
		}
		if body.Category == "" {
			body.Category = "general"
		}
		location := body.Location
		if location != nil {
			trimmed := strings.TrimSpace(*location)
			if trimmed == "" {
				location = nil
			} else {
				location = &trimmed
			}
		}
		var expiresAt *time.Time
		if body.ExpiresIn != nil && *body.ExpiresIn > 0 {
			t := time.Now().Add(time.Duration(*body.ExpiresIn) * time.Hour)
			expiresAt = &t
		}
		update := models.LifeAgentLiveUpdate{
			ID:        models.GenID(),
			ProfileID: id,
			Content:   strings.TrimSpace(body.Content),
			Category:  body.Category,
			Location:  location,
			ExpiresAt: expiresAt,
			Pinned:    body.Pinned,
		}
		db.DB.Create(&update)
		createLifeAgentGrowthEvent(
			id,
			"live_update",
			"public",
			growthEventTitle("live_update", update.Category),
			update.Content,
			models.JSONMap{"category": update.Category, "location": ptrStr(update.Location)},
			&update.ID,
		)
		c.JSON(http.StatusOK, gin.H{
			"id":        update.ID,
			"content":   update.Content,
			"category":  update.Category,
			"location":  update.Location,
			"expiresAt": expiresAt,
			"pinned":    update.Pinned,
			"createdAt": update.CreatedAt.Format(time.RFC3339),
		})
	}
}

func LifeAgentsLiveUpdatesList(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var updates []models.LifeAgentLiveUpdate
		db.DB.Where("profile_id = ? AND (expires_at IS NULL OR expires_at > ?)", id, time.Now()).
			Order("pinned DESC, created_at DESC").Limit(30).Find(&updates)

		type updateResp struct {
			ID        string  `json:"id"`
			Content   string  `json:"content"`
			Category  string  `json:"category"`
			Location  *string `json:"location"`
			Pinned    bool    `json:"pinned"`
			CreatedAt string  `json:"createdAt"`
			FreshDays int     `json:"freshDays"`
		}
		items := make([]updateResp, len(updates))
		now := time.Now()
		for i, u := range updates {
			items[i] = updateResp{
				ID:        u.ID,
				Content:   u.Content,
				Category:  u.Category,
				Location:  u.Location,
				Pinned:    u.Pinned,
				CreatedAt: u.CreatedAt.Format(time.RFC3339),
				FreshDays: int(now.Sub(u.CreatedAt).Hours() / 24),
			}
		}
		c.JSON(http.StatusOK, gin.H{"updates": items, "total": len(items)})
	}
}

func LifeAgentsLiveUpdateDelete(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			return
		}
		id := c.Param("id")
		updateID := c.Param("updateId")
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ? AND user_id = ?", id, user.ID).First(&p).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			return
		}
		db.DB.Where("id = ? AND profile_id = ?", updateID, id).Delete(&models.LifeAgentLiveUpdate{})
		db.DB.Where("profile_id = ? AND type = ? AND source_id = ?", id, "live_update", updateID).Delete(&models.LifeAgentGrowthEvent{})
		c.JSON(http.StatusOK, gin.H{"ok": true})
	}
}
