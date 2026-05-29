package db

import (
	"database/sql"
	"log"
	"os"
	"regexp"
	"time"

	"github.com/agent-marketplace/backend/internal/models"
	_ "github.com/go-sql-driver/mysql"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// ensureDB 在连接前确保数据库存在
func ensureDB(dsn string) error {
	re := regexp.MustCompile(`/([^/?]+)(\?|$)`)
	matches := re.FindStringSubmatch(dsn)
	if len(matches) < 2 {
		return nil // 无法解析则跳过
	}
	dbName := matches[1]
	// 连接时不指定库：把 /dbname 换成 /
	dsnNoDB := regexp.MustCompile(`/[^/?]+(\?|$)`).ReplaceAllString(dsn, "/$1")
	if dsnNoDB == dsn {
		return nil
	}
	// 去掉末尾 ? 前的空位
	if len(dsnNoDB) > 1 && dsnNoDB[len(dsnNoDB)-1] == '?' {
		dsnNoDB = dsnNoDB[:len(dsnNoDB)-1]
	}
	conn, err := sql.Open("mysql", dsnNoDB)
	if err != nil {
		return err
	}
	defer conn.Close()
	_, err = conn.Exec("CREATE DATABASE IF NOT EXISTS `" + dbName + "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
	return err
}

// dropAllForeignKeys 在 AutoMigrate 前移除当前库所有外键，
// 否则 MySQL 会拒绝修改被引用表的列（Error 1833）。
func dropAllForeignKeys(db *gorm.DB) {
	type fkRow struct {
		TableName      string `gorm:"column:TABLE_NAME"`
		ConstraintName string `gorm:"column:CONSTRAINT_NAME"`
	}
	var rows []fkRow
	if err := db.Raw(`
		SELECT TABLE_NAME, CONSTRAINT_NAME
		FROM information_schema.KEY_COLUMN_USAGE
		WHERE TABLE_SCHEMA = DATABASE()
		  AND REFERENCED_TABLE_NAME IS NOT NULL
		GROUP BY TABLE_NAME, CONSTRAINT_NAME
	`).Scan(&rows).Error; err != nil {
		return
	}
	for _, r := range rows {
		_ = db.Exec("ALTER TABLE `" + r.TableName + "` DROP FOREIGN KEY `" + r.ConstraintName + "`").Error
	}
}

func trimRunes(s string, max int) string {
	r := []rune(s)
	if len(r) <= max {
		return s
	}
	return string(r[:max])
}

// sanitizeLifeAgentProfileColumnsBeforeMigrate 截断超出模型长度限制的存量数据，
// 否则 MySQL 在 AutoMigrate 收紧 varchar 时会报 Error 1406。
func sanitizeLifeAgentProfileColumnsBeforeMigrate(db *gorm.DB) {
	type row struct {
		ID       string
		ShortBio string
		Headline string
	}
	var rows []row
	if err := db.Raw(`
		SELECT id, short_bio, headline FROM life_agent_profiles
		WHERE CHAR_LENGTH(short_bio) > 500 OR CHAR_LENGTH(headline) > 512
	`).Scan(&rows).Error; err != nil || len(rows) == 0 {
		return
	}
	for _, r := range rows {
		updates := map[string]interface{}{}
		if len([]rune(r.ShortBio)) > 500 {
			updates["short_bio"] = trimRunes(r.ShortBio, 500)
		}
		if len([]rune(r.Headline)) > 512 {
			updates["headline"] = trimRunes(r.Headline, 512)
		}
		if len(updates) == 0 {
			continue
		}
		_ = db.Model(&models.LifeAgentProfile{}).Where("id = ?", r.ID).Updates(updates).Error
	}
}

// scrubHiddenExpertiseTags 移除存量 life_agent_profiles.expertise_tags 中不希望
// 对外展示的标签（如「飞跃手册」）。幂等：未命中时无写入。
func scrubHiddenExpertiseTags(db *gorm.DB) {
	hidden := []string{"飞跃手册"}
	for _, tag := range hidden {
		// 仅扫描包含该值的行，避免全表写。
		_ = db.Exec(`
			UPDATE life_agent_profiles
			SET expertise_tags = JSON_REMOVE(
				expertise_tags,
				REPLACE(JSON_UNQUOTE(JSON_SEARCH(expertise_tags, 'one', ?)), '"', '')
			)
			WHERE JSON_SEARCH(expertise_tags, 'one', ?) IS NOT NULL
		`, tag, tag).Error
	}
}

func Init(dsn string) error {
	if err := ensureDB(dsn); err != nil {
		return err
	}
	newLogger := logger.New(log.New(os.Stdout, "\r\n", log.LstdFlags), logger.Config{
		SlowThreshold: 500 * time.Millisecond,
		LogLevel:      logger.Info,
	})
	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{Logger: newLogger})
	if err != nil {
		return err
	}
	dropAllForeignKeys(DB)
	sanitizeLifeAgentProfileColumnsBeforeMigrate(DB)
	if err := DB.AutoMigrate(
		&models.User{},
		&models.UserApiKey{},
		&models.Agent{},
		&models.License{},
		&models.InvocationToken{},
		&models.InvocationRequest{},
		&models.ExecutionReceipt{},
		&models.Dispute{},
		&models.LifeAgentProfile{},
		&models.LifeAgentFavorite{},
		&models.LifeAgentKnowledgeEntry{},
		&models.LifeAgentStructuredFact{},
		&models.LifeAgentTopicSummary{},
		&models.LifeAgentChatSession{},
		&models.LifeAgentChatMessage{},
		&models.LifeAgentCoEditState{},
		&models.LifeAgentCoEditEvent{},
		&models.LifeAgentQuestionPack{},
		&models.WechatPayOrder{},
		&models.LifeAgentFeedback{},
		&models.LifeAgentRating{},
		&models.LifeAgentInvokeKey{},
		&models.LifeAgentBlindSpot{},
		&models.LifeAgentLiveUpdate{},
		&models.LifeAgentEpisode{},
		&models.LifeAgentPerceptualTrace{},
		&models.Post{},
		&models.PostLike{},
		&models.PostComment{},
		&models.PostAgentReply{},
	); err != nil {
		return err
	}
	scrubHiddenExpertiseTags(DB)
	return ensureLifeAgentAPICallerUser(DB)
}

// Connect opens MySQL without AutoMigrate (for one-off CLI tools).
func Connect(dsn string) error {
	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.New(log.New(os.Stdout, "\r\n", log.LstdFlags), logger.Config{
			SlowThreshold: time.Second,
			LogLevel:      logger.Warn,
		}),
	})
	return err
}

func ensureLifeAgentAPICallerUser(db *gorm.DB) error {
	var n int64
	db.Model(&models.User{}).Where("id = ?", models.LifeAgentAPICallerUserID).Count(&n)
	if n > 0 {
		return nil
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(models.GenID()), 12)
	if err != nil {
		return err
	}
	u := models.User{
		ID:       models.LifeAgentAPICallerUserID,
		Email:    "life-agent-api@system.internal",
		Password: string(hash),
	}
	return db.Create(&u).Error
}
