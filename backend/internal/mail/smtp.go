package mail

import (
	"crypto/tls"
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
	if port == 465 || port == 994 {
		return sendMailTLS(addr, host, auth, from, []string{to}, msg)
	}
	return smtp.SendMail(addr, auth, from, []string{to}, msg)
}

func sendMailTLS(addr, host string, auth smtp.Auth, from string, to []string, msg []byte) error {
	conn, err := tls.Dial("tcp", addr, &tls.Config{ServerName: host, MinVersion: tls.VersionTLS12})
	if err != nil {
		return err
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, host)
	if err != nil {
		return err
	}
	defer client.Close()

	if auth != nil {
		if err := client.Auth(auth); err != nil {
			return err
		}
	}
	if err := client.Mail(from); err != nil {
		return err
	}
	for _, rcpt := range to {
		if err := client.Rcpt(rcpt); err != nil {
			return err
		}
	}

	writer, err := client.Data()
	if err != nil {
		return err
	}
	if _, err := writer.Write(msg); err != nil {
		_ = writer.Close()
		return err
	}
	if err := writer.Close(); err != nil {
		return err
	}
	return client.Quit()
}
