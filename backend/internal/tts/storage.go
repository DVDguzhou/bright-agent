package tts

import (
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
)

const dataDir = "./data"
const audioDir = "audio"
const voiceSamplesDir = "voice_samples"

// SaveAudio 保存 base64 音频到文件，返回相对路径
func SaveAudio(messageID string, audioBase64 string, format string) (string, error) {
	if audioBase64 == "" {
		return "", nil
	}
	data, err := base64.StdEncoding.DecodeString(audioBase64)
	if err != nil {
		return "", err
	}
	dir := filepath.Join(dataDir, audioDir)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", err
	}
	ext := format
	if ext == "" {
		ext = "mp3"
	}
	fpath := filepath.Join(dir, messageID+"."+ext)
	if err := os.WriteFile(fpath, data, 0644); err != nil {
		return "", err
	}
	return messageID + "." + ext, nil
}

// LoadAudio 加载音频文件，返回 base64
func LoadAudio(filename string) (string, error) {
	fpath := filepath.Join(dataDir, audioDir, filename)
	data, err := os.ReadFile(fpath)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(data), nil
}

// SaveVoiceSample 保存音色采集的原始音频
func SaveVoiceSample(profileID string, audioBase64 string) (string, error) {
	if audioBase64 == "" {
		return "", nil
	}
	data, err := base64.StdEncoding.DecodeString(audioBase64)
	if err != nil {
		return "", err
	}
	dir := filepath.Join(dataDir, voiceSamplesDir)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", err
	}
	fpath := filepath.Join(dir, profileID+".webm")
	if err := os.WriteFile(fpath, data, 0644); err != nil {
		return "", err
	}
	return fpath, nil
}

// GetVoiceSamplePath 获取音色样本文件路径
func GetVoiceSamplePath(profileID string) string {
	return filepath.Join(dataDir, voiceSamplesDir, profileID+".webm")
}

// VoiceSampleExists 检查音色样本是否存在
func VoiceSampleExists(profileID string) bool {
	_, err := os.Stat(GetVoiceSamplePath(profileID))
	return err == nil
}

// AudioFilePath 获取音频文件路径
func AudioFilePath(filename string) (string, error) {
	fpath := filepath.Join(dataDir, audioDir, filename)
	if _, err := os.Stat(fpath); err != nil {
		return "", fmt.Errorf("audio not found")
	}
	return fpath, nil
}
