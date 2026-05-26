package handler

import (
	"strings"
	"unicode/utf8"
)

const (
	minPasswordRunes = 8
	maxPasswordBytes = 72 // bcrypt effective limit
)

func validatePassword(password string) string {
	if utf8.RuneCountInString(password) < minPasswordRunes {
		return "PASSWORD_TOO_SHORT"
	}
	if len(password) > maxPasswordBytes {
		return "PASSWORD_TOO_LONG"
	}
	if strings.TrimSpace(password) == "" {
		return "PASSWORD_TOO_SHORT"
	}
	return ""
}
