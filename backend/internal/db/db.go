package db

import (
	"database/sql"
	"regexp"

	"github.com/agent-marketplace/backend/internal/models"
	_ "github.com/go-sql-driver/mysql"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
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

func Init(dsn string) error {
	if err := ensureDB(dsn); err != nil {
		return err
	}
	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		return err
	}
	return DB.AutoMigrate(
		&models.User{},
		&models.UserApiKey{},
		&models.Agent{},
		&models.License{},
		&models.InvocationToken{},
		&models.InvocationRequest{},
		&models.ExecutionReceipt{},
		&models.Dispute{},
		&models.LifeAgentProfile{},
		&models.LifeAgentKnowledgeEntry{},
		&models.LifeAgentChatSession{},
		&models.LifeAgentChatMessage{},
		&models.LifeAgentQuestionPack{},
		&models.LifeAgentFeedback{},
		&models.LifeAgentRating{},
	)
}
