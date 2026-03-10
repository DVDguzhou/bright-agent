// 检查数据库是否可连接，数据库是否存在
// 运行: go run ./cmd/check-db
package main

import (
	"database/sql"
	"fmt"
	"os"
	"regexp"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load("../../.env")
	_ = godotenv.Load("../.env")
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "root:password@tcp(localhost:3306)/agent_marketplace?charset=utf8mb4&parseTime=True"
	}
	base := regexp.MustCompile(`/[^/?]+(\?|$)`).ReplaceAllString(dsn, "/$1")
	if base == dsn {
		base = dsn + "?"
	}
	conn, err := sql.Open("mysql", base)
	if err != nil {
		fmt.Println("❌ 连接失败:", err)
		os.Exit(1)
	}
	defer conn.Close()
	if err := conn.Ping(); err != nil {
		fmt.Println("❌ MySQL 连接失败:", err)
		fmt.Println("   请确认: 1) MySQL 已启动  2) DATABASE_URL 正确")
		os.Exit(1)
	}
	fmt.Println("✓ MySQL 连接成功")

	var name string
	err = conn.QueryRow("SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = 'agent_marketplace'").Scan(&name)
	if err == sql.ErrNoRows || (err == nil && name == "") {
		fmt.Println("❌ 数据库 agent_marketplace 尚未创建")
		fmt.Println("   请在 MySQL 中执行:")
		fmt.Println("   CREATE DATABASE agent_marketplace CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
		os.Exit(1)
	}
	if err != nil {
		fmt.Println("❌ 查询失败:", err)
		os.Exit(1)
	}
	fmt.Println("✓ 数据库 agent_marketplace 已存在")
}
