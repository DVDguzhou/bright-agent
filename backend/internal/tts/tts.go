package tts

// Provider 语音合成与音色克隆接口
type Provider interface {
	// CreateVoice 从音频样本创建克隆音色，返回 voiceID
	// audioBase64: base64 编码的音频（webm/mp3 等）
	// profileID: 用于存储和标识
	CreateVoice(profileID string, audioBase64 string) (voiceID string, err error)

	// Synthesize 将文本合成为语音
	// voiceID: 音色 ID，空则使用默认音色
	// text: 待合成文本
	// 返回: 音频 base64 或 URL，时长（秒）
	Synthesize(voiceID string, text string) (audioBase64 string, durationSec int, err error)

	// MediaFormat 保存到磁盘时使用的扩展名（不含点），如 mp3、wav
	MediaFormat() string
}
