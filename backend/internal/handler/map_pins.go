package handler

import (
	"encoding/json"
	"net/http"
	"strings"
	"sync"
	"time"
	"unicode/utf8"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/middleware"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/gin-gonic/gin"
)

const (
	mapPinsCacheTTL        = 5 * time.Minute
	mapPinHeadlineMaxRunes = 80
)

type mapPinResp struct {
	ID             string   `json:"id"`
	DisplayName    string   `json:"displayName"`
	Headline       string   `json:"headline,omitempty"`
	School         string   `json:"school,omitempty"`
	City           string   `json:"city,omitempty"`
	Province       string   `json:"province,omitempty"`
	County         string   `json:"county,omitempty"`
	Regions        []string `json:"regions,omitempty"`
	CoverImageURL  string   `json:"coverImageUrl,omitempty"`
	CoverPresetKey string   `json:"coverPresetKey,omitempty"`
}

type mapPinRow struct {
	ID             string           `gorm:"column:id"`
	DisplayName    string           `gorm:"column:display_name"`
	Headline       string           `gorm:"column:headline"`
	School         string           `gorm:"column:school"`
	City           string           `gorm:"column:city"`
	Province       string           `gorm:"column:province"`
	County         string           `gorm:"column:county"`
	Regions        models.JSONArray `gorm:"column:regions"`
	CoverImageURL  *string          `gorm:"column:cover_image_url"`
	CoverPresetKey *string          `gorm:"column:cover_preset_key"`
}

type mapPinsCache struct {
	mu        sync.RWMutex
	body      []byte
	expiresAt time.Time
}

var mapPinsCached mapPinsCache

func truncateRunes(s string, maxRunes int) string {
	if maxRunes <= 0 || s == "" {
		return ""
	}
	if utf8.RuneCountInString(s) <= maxRunes {
		return s
	}
	runes := []rune(s)
	return string(runes[:maxRunes])
}

func jsonRegions(regions models.JSONArray) []string {
	if len(regions) == 0 {
		return nil
	}
	out := make([]string, 0, len(regions))
	for _, s := range regions {
		if strings.TrimSpace(s) != "" {
			out = append(out, s)
		}
	}
	if len(out) == 0 {
		return nil
	}
	return out
}

func buildMapPinsJSON() ([]byte, error) {
	var rows []mapPinRow
	if err := db.DB.Table("life_agent_profiles").
		Select("id, display_name, headline, school, city, province, county, regions, cover_image_url, cover_preset_key").
		Where("published = ?", true).
		Find(&rows).Error; err != nil {
		return nil, err
	}

	resp := make([]mapPinResp, 0, len(rows))
	for _, row := range rows {
		pin := mapPinResp{
			ID:          row.ID,
			DisplayName: row.DisplayName,
		}
		if h := strings.TrimSpace(row.Headline); h != "" {
			pin.Headline = truncateRunes(h, mapPinHeadlineMaxRunes)
		}
		if s := strings.TrimSpace(row.School); s != "" {
			pin.School = s
		}
		if s := strings.TrimSpace(row.City); s != "" {
			pin.City = s
		}
		if s := strings.TrimSpace(row.Province); s != "" {
			pin.Province = s
		}
		if s := strings.TrimSpace(row.County); s != "" {
			pin.County = s
		}
		if regions := jsonRegions(row.Regions); regions != nil {
			pin.Regions = regions
		}
		if row.CoverImageURL != nil {
			if s := strings.TrimSpace(*row.CoverImageURL); s != "" {
				pin.CoverImageURL = s
			}
		}
		if row.CoverPresetKey != nil {
			if s := strings.TrimSpace(*row.CoverPresetKey); s != "" {
				pin.CoverPresetKey = s
			}
		}
		resp = append(resp, pin)
	}
	return json.Marshal(resp)
}

func loadMapPinsJSON() ([]byte, error) {
	now := time.Now()

	mapPinsCached.mu.RLock()
	if len(mapPinsCached.body) > 0 && now.Before(mapPinsCached.expiresAt) {
		body := mapPinsCached.body
		mapPinsCached.mu.RUnlock()
		return body, nil
	}
	mapPinsCached.mu.RUnlock()

	body, err := buildMapPinsJSON()
	if err != nil {
		return nil, err
	}

	mapPinsCached.mu.Lock()
	mapPinsCached.body = body
	mapPinsCached.expiresAt = now.Add(mapPinsCacheTTL)
	mapPinsCached.mu.Unlock()
	return body, nil
}

// InvalidateMapPinsCache clears the in-memory map-pins cache (e.g. after publish/unpublish).
func InvalidateMapPinsCache() {
	mapPinsCached.mu.Lock()
	mapPinsCached.body = nil
	mapPinsCached.expiresAt = time.Time{}
	mapPinsCached.mu.Unlock()
}

func LifeAgentsMapPins() gin.HandlerFunc {
	return func(c *gin.Context) {
		body, err := loadMapPinsJSON()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}
		middleware.WriteGzipJSON(c, http.StatusOK, body, "public, max-age=300, stale-while-revalidate=60")
	}
}
