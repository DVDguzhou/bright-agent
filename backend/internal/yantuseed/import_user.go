package yantuseed

import (
	"fmt"
	"log"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"golang.org/x/crypto/bcrypt"
)

const ImportUserEmail = "yantu-import@demo.com"

// EnsureImportUser 创建或返回用于导入研途榜样的人生 Agent 所属用户。
func EnsureImportUser() *models.User {
	var u models.User
	if db.DB.Where("email = ?", ImportUserEmail).First(&u).Error == nil {
		return &u
	}
	hash, err := bcrypt.GenerateFromPassword([]byte("password123"), 12)
	if err != nil {
		log.Fatal("bcrypt:", err)
	}
	u = models.User{
		ID:        models.GenID(),
		Email:     ImportUserEmail,
		Password:  string(hash),
		Name:      strPtr("研途榜样导入"),
		RoleFlags: models.JSONMap{"is_buyer": true, "is_seller": false},
	}
	if err := db.DB.Create(&u).Error; err != nil {
		log.Fatal("create import user:", err)
	}
	fmt.Println("created user", ImportUserEmail, "password: password123")
	return &u
}
