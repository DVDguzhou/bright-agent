package db

import (
	"fmt"
	"net/url"
	"os"
	"regexp"
	"strings"
)

// normalizeGoMySQLDSN 修正 .env / docker --env-file 常见的引号残留，以及 parseTime=True 大小写。
func normalizeGoMySQLDSN(dsn string) string {
	dsn = strings.TrimSpace(dsn)
	dsn = strings.Trim(dsn, `"'`)
	// go-sql-driver/mysql 只接受 true/false 小写；docker --env-file 偶发会把 " 带进 query 值
	re := regexp.MustCompile(`(?i)parseTime=[^&\s"]+`)
	if re.MatchString(dsn) {
		val := strings.ToLower(strings.Trim(re.FindString(dsn), `"'`))
		val = strings.TrimPrefix(val, "parsetime=")
		if val != "false" && val != "0" && val != "no" {
			val = "true"
		} else {
			val = "false"
		}
		dsn = re.ReplaceAllString(dsn, "parseTime="+val)
	}
	return dsn
}

// mysqlURLToGoDSN 将 Prisma 风格 mysql://user:pass@host:port/db 转为 go-sql-driver/mysql DSN。
func mysqlURLToGoDSN(mysqlURL string) (string, error) {
	u, err := url.Parse(strings.TrimSpace(mysqlURL))
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
	return normalizeGoMySQLDSN(fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=true",
		escUser, escPass, host, port, dbName)), nil
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
		return normalizeGoMySQLDSN(v), nil
	}
	if v := strings.TrimSpace(os.Getenv("DATABASE_PRISMA_URL")); v != "" {
		return mysqlURLToGoDSN(v)
	}
	return normalizeGoMySQLDSN("guzhoudvd:Hu957843!@tcp(rm-bp176012tca6793kcoo.mysql.rds.aliyuncs.com:3306)/agent_marketplace?charset=utf8mb4&parseTime=true"), nil
}
