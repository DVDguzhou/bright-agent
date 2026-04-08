package yantuseed

import (
	"github.com/agent-marketplace/backend/internal/models"
	"gorm.io/gorm"
)

// DeleteLifeAgentProfileCascade 删除单个人生 Agent 及其关联行（与 handler.LifeAgentsDelete 顺序对齐，并含共编状态等）。
func DeleteLifeAgentProfileCascade(db *gorm.DB, profileID string) error {
	db.Where("profile_id = ?", profileID).Delete(&models.LifeAgentFeedback{})
	var sessionIDs []string
	db.Model(&models.LifeAgentChatSession{}).Where("profile_id = ?", profileID).Pluck("id", &sessionIDs)
	if len(sessionIDs) > 0 {
		db.Where("session_id IN ?", sessionIDs).Delete(&models.LifeAgentChatMessage{})
	}
	db.Where("profile_id = ?", profileID).Delete(&models.LifeAgentChatSession{})
	db.Where("profile_id = ?", profileID).Delete(&models.LifeAgentKnowledgeEntry{})
	db.Where("profile_id = ?", profileID).Delete(&models.LifeAgentStructuredFact{})
	db.Where("profile_id = ?", profileID).Delete(&models.LifeAgentTopicSummary{})
	db.Where("profile_id = ?", profileID).Delete(&models.LifeAgentQuestionPack{})
	db.Where("profile_id = ?", profileID).Delete(&models.LifeAgentRating{})
	db.Where("profile_id = ?", profileID).Delete(&models.LifeAgentInvokeKey{})
	db.Where("profile_id = ?", profileID).Delete(&models.LifeAgentCoEditState{})
	_ = db.Exec("DELETE FROM life_agent_favorites WHERE profile_id = ?", profileID)
	return db.Where("id = ?", profileID).Delete(&models.LifeAgentProfile{}).Error
}
