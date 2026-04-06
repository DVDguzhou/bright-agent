package db

import (
	"fmt"
	"net/url"
	"os"
	"strings"
)

// mysqlURLToGoDSN 将 Prisma 风格 mysql://user:pass@host:port/db 转为 go-sql-driver/mysql DSN。
func mysqlURLToGoDSN(mysqlURL string) (string, error) {
	u, err := url.Parse(mysqlURL)
	if err != nil {
		return "", err
	}
	if u.Scheme != "mysql" {
		return "", fmt.Errorf("expected mysql URL scheme, got %q", u.Scheme)
	}
	user := u.User.Username()
	pass, _ := u.User.Password()
	host := u.Hostname()
	if host == "" {
		host = "127.0.0.1"
	}
	port := u.Port()
	if port == "" {
		port = "3306"
	}
	dbName := strings.TrimPrefix(u.Path, "/")
	if dbName == "" {
		return "", fmt.Errorf("missing database name in URL path")
	}
	// https://github.com/go-sql-driver/mysql#dsn-data-source-name
	escUser := url.QueryEscape(user)
	escPass := url.QueryEscape(pass)
	return fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True",
		escUser, escPass, host, port, dbName), nil
}

// DSNFromEnv 解析数据库连接串：
//   - DATABASE_URL：若为 mysql:// 开头则转换；否则视为已是 Go 驱动 DSN（含 @tcp(...) ）
//   - 否则使用 DATABASE_PRISMA_URL（Prisma 常用 mysql://...）
//   - 皆无则返回本地默认 DSN
func DSNFromEnv() (string, error) {
	if v := strings.TrimSpace(os.Getenv("DATABASE_URL")); v != "" {
		if strings.HasPrefix(v, "mysql://") {
			return mysqlURLToGoDSN(v)
		}
		return v, nil
	}
	if v := strings.TrimSpace(os.Getenv("DATABASE_PRISMA_URL")); v != "" {
		return mysqlURLToGoDSN(v)
	}
	return "root:password@tcp(127.0.0.1:3306)/agent_marketplace?charset=utf8mb4&parseTime=True", nil
}
