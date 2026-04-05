package handler

import (
	"net/http"
	"sort"
	"strings"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/middleware"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/gin-gonic/gin"
)

type topicFeedbackCounts struct {
	Total         int `json:"total"`
	Helpful       int `json:"helpful"`
	NotSpecific   int `json:"notSpecific"`
	NotSuitable   int `json:"notSuitable"`
	FactualError  int `json:"factualError"`
	Contradiction int `json:"contradiction"`
	TooConfident  int `json:"tooConfident"`
}

func LifeAgentsTopicsList(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		var profile models.LifeAgentProfile
		if err := db.DB.Where("id = ? AND user_id = ?", id, user.ID).First(&profile).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "PROFILE_NOT_FOUND"})
			return
		}
		var topics []models.LifeAgentTopicSummary
		db.DB.Where("profile_id = ?", id).Order("status ASC, topic_group ASC, topic_key ASC").Find(&topics)
		c.JSON(http.StatusOK, gin.H{
			"topics": buildTopicManagementResponses(id, topics),
		})
	}
}

func LifeAgentsTopicUpdate(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		topicID := c.Param("topicId")
		var profile models.LifeAgentProfile
		if err := db.DB.Where("id = ? AND user_id = ?", id, user.ID).First(&profile).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "PROFILE_NOT_FOUND"})
			return
		}
		var topic models.LifeAgentTopicSummary
		if err := db.DB.Where("id = ? AND profile_id = ?", topicID, id).First(&topic).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "TOPIC_NOT_FOUND"})
			return
		}
		var body struct {
			TopicLabel       *string  `json:"topicLabel"`
			Summary          *string  `json:"summary"`
			Aliases          []string `json:"aliases"`
			QuestionPatterns []string `json:"questionPatterns"`
			Confidence       *string  `json:"confidence"`
			Status           *string  `json:"status"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}
		manualEdited := false
		if body.TopicLabel != nil {
			topic.TopicLabel = strings.TrimSpace(*body.TopicLabel)
			manualEdited = true
		}
		if body.Summary != nil {
			topic.Summary = strings.TrimSpace(*body.Summary)
			manualEdited = true
		}
		if body.Aliases != nil {
			topic.Aliases = models.JSONArray(cleanStringList(body.Aliases, 8))
			manualEdited = true
		}
		if body.QuestionPatterns != nil {
			topic.QuestionPatterns = models.JSONArray(cleanStringList(body.QuestionPatterns, 8))
			manualEdited = true
		}
		if body.Confidence != nil {
			confidence := strings.TrimSpace(*body.Confidence)
			if confidence != "low" && confidence != "medium" && confidence != "high" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR", "detail": "invalid confidence"})
				return
			}
			topic.Confidence = confidence
			manualEdited = true
		}
		if body.Status != nil {
			status := strings.TrimSpace(*body.Status)
			if status != "candidate" && status != "active" && status != "archived" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR", "detail": "invalid status"})
				return
			}
			topic.Status = status
			if status != "archived" {
				topic.MergedIntoTopicID = nil
			}
		}
		if manualEdited {
			topic.ManualEdited = true
		}
		if err := db.DB.Save(&topic).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}
		var topics []models.LifeAgentTopicSummary
		db.DB.Where("profile_id = ?", id).Order("status ASC, topic_group ASC, topic_key ASC").Find(&topics)
		c.JSON(http.StatusOK, gin.H{"topic": buildTopicManagementResponses(id, []models.LifeAgentTopicSummary{topic})[0], "topics": buildTopicManagementResponses(id, topics)})
	}
}

func LifeAgentsTopicsMerge(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		var profile models.LifeAgentProfile
		if err := db.DB.Where("id = ? AND user_id = ?", id, user.ID).First(&profile).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "PROFILE_NOT_FOUND"})
			return
		}
		var body struct {
			SourceTopicID string `json:"sourceTopicId" binding:"required"`
			TargetTopicID string `json:"targetTopicId" binding:"required"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}
		if body.SourceTopicID == body.TargetTopicID {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR", "detail": "source and target must differ"})
			return
		}
		var source, target models.LifeAgentTopicSummary
		if err := db.DB.Where("id = ? AND profile_id = ?", body.SourceTopicID, id).First(&source).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "SOURCE_TOPIC_NOT_FOUND"})
			return
		}
		if err := db.DB.Where("id = ? AND profile_id = ?", body.TargetTopicID, id).First(&target).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "TARGET_TOPIC_NOT_FOUND"})
			return
		}
		target.Aliases = mergeTopicStringArrays(target.Aliases, append([]string{source.TopicLabel}, source.Aliases...), 8)
		target.QuestionPatterns = mergeTopicStringArrays(target.QuestionPatterns, source.QuestionPatterns, 8)
		target.SourceEntryIDs = mergeTopicStringArrays(target.SourceEntryIDs, source.SourceEntryIDs, 0)
		target.Summary = mergeTopicSummaries(target.Summary, source.Summary)
		target.ManualEdited = target.ManualEdited || source.ManualEdited
		target.Status = "active"
		target.Confidence = higherTopicConfidence(target.Confidence, source.Confidence)
		if err := db.DB.Save(&target).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}
		source.Status = "archived"
		source.MergedIntoTopicID = &target.ID
		if err := db.DB.Save(&source).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}
		var topics []models.LifeAgentTopicSummary
		db.DB.Where("profile_id = ?", id).Order("status ASC, topic_group ASC, topic_key ASC").Find(&topics)
		c.JSON(http.StatusOK, gin.H{"ok": true, "topics": buildTopicManagementResponses(id, topics)})
	}
}

func buildTopicManagementResponses(profileID string, topics []models.LifeAgentTopicSummary) []gin.H {
	feedbackStats := buildTopicFeedbackStats(profileID, topics)
	topicByID := make(map[string]models.LifeAgentTopicSummary, len(topics))
	for _, topic := range topics {
		topicByID[topic.ID] = topic
	}
	list := make([]gin.H, 0, len(topics))
	for _, topic := range topics {
		item := gin.H{
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
			"feedback":          feedbackStats[topic.ID],
		}
		if topic.MergedIntoTopicID != nil {
			if merged, ok := topicByID[*topic.MergedIntoTopicID]; ok {
				item["mergedIntoTopicLabel"] = merged.TopicLabel
			}
		}
		list = append(list, item)
	}
	sort.SliceStable(list, func(i, j int) bool {
		leftStatus, _ := list[i]["status"].(string)
		rightStatus, _ := list[j]["status"].(string)
		if leftStatus != rightStatus {
			return topicStatusOrder(leftStatus) < topicStatusOrder(rightStatus)
		}
		leftGroup, _ := list[i]["topicGroup"].(string)
		rightGroup, _ := list[j]["topicGroup"].(string)
		if leftGroup != rightGroup {
			return leftGroup < rightGroup
		}
		leftLabel, _ := list[i]["topicLabel"].(string)
		rightLabel, _ := list[j]["topicLabel"].(string)
		return leftLabel < rightLabel
	})
	return list
}

func buildTopicFeedbackStats(profileID string, topics []models.LifeAgentTopicSummary) map[string]topicFeedbackCounts {
	stats := map[string]topicFeedbackCounts{}
	if profileID == "" || len(topics) == 0 {
		return stats
	}
	topicByID := make(map[string]models.LifeAgentTopicSummary, len(topics))
	for _, topic := range topics {
		topicByID[topic.ID] = topic
		stats[topic.ID] = topicFeedbackCounts{}
	}
	var feedbacks []models.LifeAgentFeedback
	db.DB.Where("profile_id = ?", profileID).Find(&feedbacks)
	for _, fb := range feedbacks {
		seenTopicIDs := map[string]bool{}
		for _, raw := range fb.SourceRefs {
			refMap, ok := raw.(map[string]interface{})
			if !ok {
				continue
			}
			sourceType, _ := refMap["sourceType"].(string)
			if sourceType != "topic" {
				continue
			}
			topicID, _ := refMap["id"].(string)
			topicID = resolveMergedTopicID(topicID, topicByID)
			if topicID == "" || seenTopicIDs[topicID] {
				continue
			}
			seenTopicIDs[topicID] = true
			current := stats[topicID]
			current.Total++
			switch fb.FeedbackType {
			case "helpful":
				current.Helpful++
			case "not_specific":
				current.NotSpecific++
			case "not_suitable":
				current.NotSuitable++
			case "factual_error":
				current.FactualError++
			case "contradiction":
				current.Contradiction++
			case "too_confident":
				current.TooConfident++
			}
			stats[topicID] = current
		}
	}
	return stats
}

func resolveMergedTopicID(topicID string, topics map[string]models.LifeAgentTopicSummary) string {
	current := strings.TrimSpace(topicID)
	for i := 0; i < 8 && current != ""; i++ {
		topic, ok := topics[current]
		if !ok || topic.MergedIntoTopicID == nil || strings.TrimSpace(*topic.MergedIntoTopicID) == "" {
			return current
		}
		current = strings.TrimSpace(*topic.MergedIntoTopicID)
	}
	return current
}

func cleanStringList(items []string, max int) []string {
	out := make([]string, 0, len(items))
	seen := map[string]bool{}
	for _, item := range items {
		item = strings.TrimSpace(item)
		if item == "" || seen[item] {
			continue
		}
		seen[item] = true
		out = append(out, item)
		if max > 0 && len(out) >= max {
			break
		}
	}
	return out
}

func mergeTopicStringArrays(existing models.JSONArray, add []string, max int) models.JSONArray {
	return models.JSONArray(cleanStringList(append([]string(existing), add...), max))
}

func higherTopicConfidence(left, right string) string {
	rank := map[string]int{"low": 1, "medium": 2, "high": 3}
	if rank[right] > rank[left] {
		return right
	}
	if left == "" {
		return right
	}
	return left
}

func topicStatusOrder(status string) int {
	switch status {
	case "active":
		return 0
	case "candidate":
		return 1
	case "archived":
		return 2
	default:
		return 9
	}
}
