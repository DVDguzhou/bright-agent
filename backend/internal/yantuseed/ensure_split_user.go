package yantuseed

import (
	"fmt"
	"strings"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"golang.org/x/crypto/bcrypt"
)

// EnsureSplitUserForIndex 确保 Profiles()[i] 对应的 @163.com 登录用户存在；不存在则按 password 创建。
// 已存在的用户不会修改密码或覆盖资料。
func EnsureSplitUserForIndex(i int, password string) (*models.User, error) {
	profiles := Profiles()
	if len(SplitAccountEmails) != len(profiles) {
		return nil, fmt.Errorf("SplitAccountEmails 长度 %d 与 Profiles() %d 不一致", len(SplitAccountEmails), len(profiles))
	}
	if i < 0 || i >= len(profiles) {
		return nil, fmt.Errorf("profile 下标 %d 越界（共 %d 条）", i, len(profiles))
	}
	email := SplitAccountEmails[i]
	displayName := profiles[i].DisplayName

	return EnsureAgentUser(email, displayName, password)
}

// EnsureAgentUser creates one isolated Agent owner without depending on the
// bulk yantuseed profile/account index.
func EnsureAgentUser(email, displayName, password string) (*models.User, error) {
	var u models.User
	if db.DB.Where("email = ?", email).First(&u).Error == nil {
		return &u, nil
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return nil, err
	}
	u = models.User{
		ID: models.GenID(), Email: email, Password: string(hash), Name: strPtr(displayName),
		RoleFlags: models.JSONMap{"is_buyer": true, "is_seller": false},
	}
	if err := db.DB.Create(&u).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

// SetAgentUserPassword updates the bcrypt hash for an existing Agent owner account.
func SetAgentUserPassword(email, password string) error {
	email = strings.TrimSpace(email)
	if email == "" || password == "" {
		return fmt.Errorf("email and password required")
	}
	var u models.User
	if err := db.DB.Where("email = ?", email).First(&u).Error; err != nil {
		return fmt.Errorf("user %q not found: %w", email, err)
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return err
	}
	return db.DB.Model(&u).Update("password", string(hash)).Error
}
