// One-off: go run ./scripts/count_recent_users/
package main

import (
	"fmt"
	"os"
	"time"

	"github.com/agent-marketplace/backend/internal/db"
)

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		fmt.Fprintln(os.Stderr, "DATABASE_URL required")
		os.Exit(1)
	}
	if err := db.Connect(dsn); err != nil {
		fmt.Fprintln(os.Stderr, "connect:", err)
		os.Exit(1)
	}
	since := time.Now().UTC().Add(-7 * 24 * time.Hour)
	var total, recent int64
	db.DB.Table("users").Count(&total)
	db.DB.Table("users").Where("created_at >= ?", since).Count(&recent)

	type row struct {
		Email     string
		Name      *string
		CreatedAt time.Time
	}
	var latest []row
	db.DB.Table("users").Select("email, name, created_at").
		Where("created_at >= ?", since).
		Order("created_at DESC").
		Limit(20).
		Scan(&latest)

	fmt.Printf("近7天注册用户: %d\n", recent)
	fmt.Printf("用户总数: %d\n", total)
	fmt.Printf("统计起点(UTC): %s\n", since.Format("2006-01-02 15:04:05"))
	if len(latest) > 0 {
		fmt.Println("\n最近注册:")
		for _, u := range latest {
			name := ""
			if u.Name != nil {
				name = *u.Name
			}
			fmt.Printf("  %s  %s  %s\n", u.CreatedAt.Format("2006-01-02 15:04"), u.Email, name)
		}
	}
}
