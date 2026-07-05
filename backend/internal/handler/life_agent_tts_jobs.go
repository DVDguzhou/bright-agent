package handler

import (
	"encoding/base64"
	"errors"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/agent-marketplace/backend/internal/tts"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const (
	ttsJobMaxAttempts   = 3
	ttsJobPollInterval  = 3 * time.Second
	ttsJobStaleAfter    = 5 * time.Minute
	ttsJobDispatchLimit = 4
)

var ttsWorkerOnce sync.Once
var ttsWorkerSlots = make(chan struct{}, 2)

// EnqueueLifeAgentTTSJob stores the work before the chat request returns. The
// unique message_id makes enqueueing idempotent across retries.
func EnqueueLifeAgentTTSJob(profileID, messageID, text string) error {
	profileID = strings.TrimSpace(profileID)
	messageID = strings.TrimSpace(messageID)
	text = strings.TrimSpace(text)
	if profileID == "" || messageID == "" || text == "" {
		return errors.New("invalid TTS job payload")
	}
	now := time.Now().UTC()
	job := models.LifeAgentTTSJob{
		ID:        models.GenID(),
		MessageID: messageID,
		ProfileID: profileID,
		Text:      text,
		Status:    "pending",
		CreatedAt: now,
		UpdatedAt: now,
	}
	return db.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "message_id"}},
		DoNothing: true,
	}).Create(&job).Error
}

// StartLifeAgentTTSWorker runs a DB-backed worker. Pending work survives client
// disconnects and is recovered after a process restart.
func StartLifeAgentTTSWorker(cfg *config.Config) {
	ttsWorkerOnce.Do(func() {
		recoverStaleTTSJobs()
		go func() {
			dispatchPendingTTSJobs(cfg)
			ticker := time.NewTicker(ttsJobPollInterval)
			defer ticker.Stop()
			ticks := 0
			for range ticker.C {
				ticks++
				if ticks%20 == 0 {
					recoverStaleTTSJobs()
				}
				dispatchPendingTTSJobs(cfg)
			}
		}()
	})
}

func recoverStaleTTSJobs() {
	cutoff := time.Now().UTC().Add(-ttsJobStaleAfter)
	now := time.Now().UTC()
	if err := db.DB.Model(&models.LifeAgentTTSJob{}).
		Where("status = ? AND locked_at < ? AND attempts < ?", "processing", cutoff, ttsJobMaxAttempts).
		Updates(map[string]interface{}{
			"status":          "pending",
			"locked_at":       nil,
			"next_attempt_at": now,
		}).Error; err != nil {
		log.Printf("tts worker: recover stale jobs: %v", err)
	}
	if err := db.DB.Model(&models.LifeAgentTTSJob{}).
		Where("status = ? AND locked_at < ? AND attempts >= ?", "processing", cutoff, ttsJobMaxAttempts).
		Updates(map[string]interface{}{
			"status":       "failed",
			"locked_at":    nil,
			"completed_at": now,
		}).Error; err != nil {
		log.Printf("tts worker: fail exhausted stale jobs: %v", err)
	}
}

func dispatchPendingTTSJobs(cfg *config.Config) {
	now := time.Now().UTC()
	var jobs []models.LifeAgentTTSJob
	if err := db.DB.
		Where("status = ? AND attempts < ? AND (next_attempt_at IS NULL OR next_attempt_at <= ?)", "pending", ttsJobMaxAttempts, now).
		Order("created_at ASC").
		Limit(ttsJobDispatchLimit).
		Find(&jobs).Error; err != nil {
		log.Printf("tts worker: list pending jobs: %v", err)
		return
	}
	for i := range jobs {
		jobID := jobs[i].ID
		select {
		case ttsWorkerSlots <- struct{}{}:
			go func() {
				defer func() { <-ttsWorkerSlots }()
				processLifeAgentTTSJob(cfg, jobID)
			}()
		default:
			return
		}
	}
}

func processLifeAgentTTSJob(cfg *config.Config, jobID string) {
	now := time.Now().UTC()
	claim := db.DB.Model(&models.LifeAgentTTSJob{}).
		Where("id = ? AND status = ? AND attempts < ? AND (next_attempt_at IS NULL OR next_attempt_at <= ?)", jobID, "pending", ttsJobMaxAttempts, now).
		Updates(map[string]interface{}{
			"status":     "processing",
			"locked_at":  now,
			"attempts":   gorm.Expr("attempts + 1"),
			"last_error": nil,
		})
	if claim.Error != nil || claim.RowsAffected != 1 {
		return
	}

	var job models.LifeAgentTTSJob
	if err := db.DB.First(&job, "id = ?", jobID).Error; err != nil {
		return
	}
	var existing models.LifeAgentChatMessage
	if err := db.DB.Select("id", "audio_data").First(&existing, "id = ?", job.MessageID).Error; err == nil && len(existing.AudioData) > 0 {
		markTTSJobReady(job.ID)
		return
	}

	var profile models.LifeAgentProfile
	if err := db.DB.Select("id", "voice_clone_id").First(&profile, "id = ?", job.ProfileID).Error; err != nil {
		failOrRetryTTSJob(job, err)
		return
	}
	provider := tts.NewProviderFromConfig(cfg)
	audioB64, duration, err := provider.Synthesize(ptrStr(profile.VoiceCloneID), job.Text)
	if err != nil {
		failOrRetryTTSJob(job, err)
		return
	}
	decoded, err := base64.StdEncoding.DecodeString(audioB64)
	if err != nil || len(decoded) == 0 {
		if err == nil {
			err = errors.New("TTS returned empty audio")
		}
		failOrRetryTTSJob(job, err)
		return
	}
	format := strings.TrimSpace(provider.MediaFormat())
	if format == "" {
		format = "mp3"
	}
	audioURL := "/api/audio/" + job.MessageID + "." + format
	completedAt := time.Now().UTC()
	if err := db.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.LifeAgentChatMessage{}).Where("id = ?", job.MessageID).Updates(map[string]interface{}{
			"audio_url":          audioURL,
			"audio_format":       format,
			"audio_data":         decoded,
			"audio_duration_sec": duration,
		}).Error; err != nil {
			return err
		}
		return tx.Model(&models.LifeAgentTTSJob{}).Where("id = ?", job.ID).Updates(map[string]interface{}{
			"status":          "ready",
			"locked_at":       nil,
			"next_attempt_at": nil,
			"last_error":      nil,
			"completed_at":    completedAt,
		}).Error
	}); err != nil {
		failOrRetryTTSJob(job, err)
		return
	}
	log.Printf("tts worker: completed job=%s message=%s attempt=%d", job.ID, job.MessageID, job.Attempts)
}

func markTTSJobReady(jobID string) {
	now := time.Now().UTC()
	_ = db.DB.Model(&models.LifeAgentTTSJob{}).Where("id = ?", jobID).Updates(map[string]interface{}{
		"status":       "ready",
		"locked_at":    nil,
		"last_error":   nil,
		"completed_at": now,
	}).Error
}

func failOrRetryTTSJob(job models.LifeAgentTTSJob, cause error) {
	now := time.Now().UTC()
	errText := "unknown TTS error"
	if cause != nil {
		errText = cause.Error()
	}
	if len([]rune(errText)) > 1000 {
		errText = string([]rune(errText)[:1000])
	}
	updates := map[string]interface{}{
		"locked_at":  nil,
		"last_error": errText,
	}
	if job.Attempts >= ttsJobMaxAttempts {
		updates["status"] = "failed"
		updates["completed_at"] = now
		log.Printf("tts worker: failed job=%s message=%s after %d attempt(s): %v", job.ID, job.MessageID, job.Attempts, cause)
	} else {
		delay := 10 * time.Second
		if job.Attempts >= 2 {
			delay = 30 * time.Second
		}
		updates["status"] = "pending"
		updates["next_attempt_at"] = now.Add(delay)
		log.Printf("tts worker: retry job=%s message=%s attempt=%d in %s: %v", job.ID, job.MessageID, job.Attempts, delay, cause)
	}
	if err := db.DB.Model(&models.LifeAgentTTSJob{}).Where("id = ?", job.ID).Updates(updates).Error; err != nil {
		log.Printf("tts worker: update failed job=%s: %v", job.ID, err)
	}
}
