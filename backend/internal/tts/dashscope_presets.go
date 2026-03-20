package tts

import "strings"

// qwen3-tts-flash 系统音色 voice 参数（与百炼文档一致；含空格须完全匹配）
var dashScopeFlashPresetVoices = map[string]struct{}{
	"Cherry": {}, "Serena": {}, "Ethan": {}, "Chelsie": {}, "Momo": {}, "Vivian": {},
	"Moon": {}, "Maia": {}, "Kai": {}, "Nofish": {}, "Bella": {}, "Jennifer": {},
	"Ryan": {}, "Katerina": {}, "Aiden": {}, "Eldric Sage": {}, "Mia": {}, "Mochi": {},
	"Bellona": {}, "Vincent": {}, "Bunny": {}, "Neil": {}, "Elias": {}, "Arthur": {},
	"Nini": {}, "Ebona": {}, "Seren": {}, "Pip": {}, "Stella": {}, "Bodega": {}, "Sonrisa": {},
	"Alek": {}, "Dolce": {}, "Sohee": {}, "Ono Anna": {}, "Lenn": {}, "Emilien": {}, "Andre": {},
	"Radio Gol": {}, "Jada": {}, "Dylan": {}, "Li": {}, "Marcus": {}, "Roy": {}, "Peter": {},
	"Sunny": {}, "Eric": {}, "Rocky": {}, "Kiki": {},
}

// IsDashScopeFlashPresetVoice 为 true 时用 qwen3-tts-flash；否则视为声音复刻 ID，用 VC 模型
func IsDashScopeFlashPresetVoice(v string) bool {
	_, ok := dashScopeFlashPresetVoices[strings.TrimSpace(v)]
	return ok
}
