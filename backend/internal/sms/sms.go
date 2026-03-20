package sms

import (
	"crypto/rand"
	"fmt"
	"io"
	"log"
	"sync"
	"time"
)

// Store 验证码存储（生产环境建议用 Redis）
type Store interface {
	Set(phone, code string, ttl time.Duration) error
	Get(phone string) (string, bool)
	Delete(phone string) error
}

type memoryStore struct {
	mu    sync.RWMutex
	codes map[string]struct {
		code     string
		expireAt time.Time
	}
}

func NewMemoryStore() *memoryStore {
	s := &memoryStore{codes: make(map[string]struct {
		code     string
		expireAt time.Time
	})}
	go s.cleanup()
	return s
}

func (s *memoryStore) Set(phone, code string, ttl time.Duration) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.codes[phone] = struct {
		code     string
		expireAt time.Time
	}{code: code, expireAt: time.Now().Add(ttl)}
	return nil
}

func (s *memoryStore) Get(phone string) (string, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	v, ok := s.codes[phone]
	if !ok || time.Now().After(v.expireAt) {
		return "", false
	}
	return v.code, true
}

func (s *memoryStore) Delete(phone string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.codes, phone)
	return nil
}

func (s *memoryStore) cleanup() {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		s.mu.Lock()
		now := time.Now()
		for k, v := range s.codes {
			if now.After(v.expireAt) {
				delete(s.codes, k)
			}
		}
		s.mu.Unlock()
	}
}

// Sender 短信发送接口
type Sender interface {
	Send(phone, code string) error
}

// AliyunSender 阿里云短信（需配置 AccessKey、签名、模板，生产环境请用官方 SDK github.com/alibabacloud-go/dysmsapi-20170525）
type AliyunSender struct {
	AccessKeyID     string
	AccessKeySecret string
	SignName        string
	TemplateCode    string
}

func (a *AliyunSender) Send(phone, code string) error {
	if a.AccessKeyID == "" || a.AccessKeySecret == "" {
		return fmt.Errorf("sms: aliyun not configured")
	}
	// 生产环境请使用官方 SDK 调用 SendSms
	log.Printf("[SMS] aliyun configured but using mock for phone=%s code=%s", phone, code)
	return nil
}

// MockSender 开发环境模拟发送（打印到日志）
type MockSender struct{}

func (MockSender) Send(phone, code string) error {
	log.Printf("[SMS Mock] phone=%s code=%s (开发环境，未真实发送)", phone, code)
	return nil
}

func GenCode() string {
	b := make([]byte, 6)
	if _, err := io.ReadFull(rand.Reader, b); err != nil {
		return "123456"
	}
	for i := range b {
		b[i] = '0' + (b[i] % 10)
	}
	return string(b)
}
