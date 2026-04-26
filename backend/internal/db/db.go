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
	return ensureLifeAgentAPICallerUser(DB)
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
