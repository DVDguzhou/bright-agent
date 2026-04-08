package mail

import (
	"fmt"
	"net/smtp"
	"strings"

	"github.com/agent-marketplace/backend/internal/config"
)

// SendPlain 发送纯文本邮件；需 config.SMTPEnabled() 为 true。
func SendPlain(cfg *config.Config, to, subject, body string) error {
	if !cfg.SMTPEnabled() {
		return fmt.Errorf("smtp not configured")
	}
	to = strings.TrimSpace(to)
	if to == "" {
		return fmt.Errorf("empty recipient")
	}
	from := strings.TrimSpace(cfg.SMTPFrom)
	host := strings.TrimSpace(cfg.SMTPHost)
	port := cfg.SMTPPort
	if port <= 0 {
		port = 587
	}
	addr := fmt.Sprintf("%s:%d", host, port)
	headers := fmt.Sprintf(
		"From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n",
		from, to, subject,
	)
	msg := []byte(headers + body)

	var auth smtp.Auth
	if strings.TrimSpace(cfg.SMTPUser) != "" {
		auth = smtp.PlainAuth("", cfg.SMTPUser, cfg.SMTPPassword, host)
	}
	return smtp.SendMail(addr, auth, from, []string{to}, msg)
}
