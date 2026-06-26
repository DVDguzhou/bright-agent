package lifeagent

import (
	"sort"
	"strings"

	"github.com/agent-marketplace/backend/internal/models"
	"gorm.io/gorm"
)

func BuildKnowledgeChunksForAI(rows []models.LifeAgentKnowledgeChunk) []KnowledgeChunkForAI {
	out := make([]KnowledgeChunkForAI, 0, len(rows))
	for _, row := range rows {
		content := strings.TrimSpace(row.Content)
		if content == "" {
			continue
		}
		out = append(out, KnowledgeChunkForAI{
			ID:            row.ID,
			EntryID:       row.EntryID,
			EntryRevision: row.EntryRevision,
			ChunkIndex:    row.ChunkIndex,
			Content:       content,
			CharStart:     row.CharStart,
			CharEnd:       row.CharEnd,
			Embedding:     DecodeVector(row.Embedding),
		})
	}
	sort.SliceStable(out, func(i, j int) bool {
		return out[i].ChunkIndex < out[j].ChunkIndex
	})
	return out
}

func AttachKnowledgeChunksForAI(entries []KnowledgeEntryForAI, rows []models.LifeAgentKnowledgeChunk) {
	if len(entries) == 0 || len(rows) == 0 {
		return
	}
	byEntry := make(map[string][]models.LifeAgentKnowledgeChunk)
	for _, row := range rows {
		byEntry[row.EntryID] = append(byEntry[row.EntryID], row)
	}
	for i := range entries {
		entries[i].CitationChunks = BuildKnowledgeChunksForAI(byEntry[entries[i].ID])
	}
}

func LoadAndAttachKnowledgeChunksForAI(gdb *gorm.DB, entries []KnowledgeEntryForAI) {
	if gdb == nil || len(entries) == 0 {
		return
	}
	ids := make([]string, 0, len(entries))
	for _, entry := range entries {
		if strings.TrimSpace(entry.ID) != "" {
			ids = append(ids, entry.ID)
		}
	}
	if len(ids) == 0 {
		return
	}
	var rows []models.LifeAgentKnowledgeChunk
	if err := gdb.Where("entry_id IN ?", ids).Order("entry_id ASC, chunk_index ASC").Find(&rows).Error; err != nil {
		return
	}
	AttachKnowledgeChunksForAI(entries, rows)
}

func SyncKnowledgeEntryChunks(gdb *gorm.DB, entry models.LifeAgentKnowledgeEntry) error {
	if gdb == nil || strings.TrimSpace(entry.ID) == "" {
		return nil
	}
	return gdb.Transaction(func(tx *gorm.DB) error {
		return SyncKnowledgeEntryChunksTx(tx, entry)
	})
}

func SyncKnowledgeEntryChunksTx(tx *gorm.DB, entry models.LifeAgentKnowledgeEntry) error {
	if tx == nil || strings.TrimSpace(entry.ID) == "" {
		return nil
	}
	if err := tx.Where("entry_id = ?", entry.ID).Delete(&models.LifeAgentKnowledgeChunk{}).Error; err != nil {
		return err
	}
	aiEntries := BuildKnowledgeEntriesForAI([]models.LifeAgentKnowledgeEntry{entry})
	if len(aiEntries) == 0 {
		return nil
	}
	chunks := splitKnowledgeEntryForCitations(aiEntries[0])
	if len(chunks) == 0 {
		fallback := strings.TrimSpace(firstNonEmpty(entry.Content, entry.Title, entry.Category))
		if fallback != "" {
			chunks = []citationTextChunk{{Index: 1, Text: fallback}}
		}
	}
	for _, chunk := range chunks {
		content := strings.TrimSpace(chunk.Text)
		if content == "" {
			continue
		}
		row := models.LifeAgentKnowledgeChunk{
			ID:            models.GenID(),
			ProfileID:     entry.ProfileID,
			EntryID:       entry.ID,
			EntryRevision: entry.Revision,
			ChunkIndex:    chunk.Index,
			Content:       content,
			CharStart:     chunk.CharStart,
			CharEnd:       chunk.CharEnd,
		}
		if err := tx.Create(&row).Error; err != nil {
			return err
		}
	}
	return nil
}

func DeleteKnowledgeEntryChunks(gdb *gorm.DB, entryID string) error {
	if gdb == nil || strings.TrimSpace(entryID) == "" {
		return nil
	}
	return gdb.Where("entry_id = ?", entryID).Delete(&models.LifeAgentKnowledgeChunk{}).Error
}
