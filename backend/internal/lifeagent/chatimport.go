package lifeagent

import (
	"encoding/csv"
	"fmt"
	"regexp"
	"sort"
	"strings"

	"golang.org/x/net/html"
)

// ChatMessage represents a single parsed chat message.
type ChatMessage struct {
	Timestamp string `json:"timestamp"`
	Sender    string `json:"sender"`
	Content   string `json:"content"`
	IsSender  bool   `json:"isSender,omitempty"` // true = message from the account owner (WeChatMsg is_sender=1)
}

// ChatParseResult holds the parsed and analyzed result from a chat export.
type ChatParseResult struct {
	Format         string        `json:"format"`
	TotalMessages  int           `json:"totalMessages"`
	TargetMessages int           `json:"targetMessages"`
	Senders        []string      `json:"senders"`
	Messages       []ChatMessage `json:"messages"`
	Analysis       ChatAnalysis  `json:"analysis"`
}

// ChatAnalysis contains statistical analysis of the target's messages.
type ChatAnalysis struct {
	TopParticles     []FreqItem `json:"topParticles"`
	TopEmojis        []FreqItem `json:"topEmojis"`
	AvgMessageLength float64    `json:"avgMessageLength"`
	MessageStyle     string     `json:"messageStyle"` // short_burst | long_form
	PunctuationHabits map[string]int `json:"punctuationHabits"`
	SampleMessages   []string   `json:"sampleMessages"`
}

// FreqItem is a word/emoji + count pair.
type FreqItem struct {
	Item  string `json:"item"`
	Count int    `json:"count"`
}

// DetectChatFormat guesses the format from filename extension and content.
func DetectChatFormat(filename string, content []byte) string {
	lower := strings.ToLower(filename)
	if strings.HasSuffix(lower, ".html") || strings.HasSuffix(lower, ".htm") {
		return "html"
	}
	if strings.HasSuffix(lower, ".csv") {
		return "csv"
	}
	return "txt"
}

// ParseChatRecords dispatches to the right parser based on format.
func ParseChatRecords(format string, content []byte, maxMessages int) (*ChatParseResult, error) {
	var messages []ChatMessage
	var err error

	switch format {
	case "html":
		messages, err = parseChatHTML(content)
	case "csv":
		messages, err = parseChatCSV(content)
	default:
		messages, err = parseChatTXT(content)
	}
	if err != nil {
		return nil, err
	}

	// Collect unique senders
	senderSet := map[string]bool{}
	for _, m := range messages {
		if m.Sender != "" {
			senderSet[m.Sender] = true
		}
	}
	var senders []string
	for s := range senderSet {
		senders = append(senders, s)
	}
	sort.Strings(senders)

	// Truncate to maxMessages
	if maxMessages > 0 && len(messages) > maxMessages {
		messages = messages[:maxMessages]
	}

	return &ChatParseResult{
		Format:        format,
		TotalMessages: len(messages),
		Senders:       senders,
		Messages:      messages,
	}, nil
}

// AnalyzeForTarget computes statistics for a specific sender.
// When targetName is "我", it matches messages with IsSender=true (WeChatMsg is_sender=1).
func AnalyzeForTarget(result *ChatParseResult, targetName string, maxSamples int) {
	// If targetName is "我" and any message has IsSender flag, use that for matching
	useIsSender := false
	if targetName == "我" {
		for _, m := range result.Messages {
			if m.IsSender {
				useIsSender = true
				break
			}
		}
	}

	var targetMsgs []ChatMessage
	for _, m := range result.Messages {
		if useIsSender {
			if m.IsSender {
				targetMsgs = append(targetMsgs, m)
			}
		} else if m.Sender == targetName {
			targetMsgs = append(targetMsgs, m)
		}
	}
	result.TargetMessages = len(targetMsgs)

	allText := ""
	var lengths []int
	for _, m := range targetMsgs {
		allText += m.Content + " "
		lengths = append(lengths, len([]rune(m.Content)))
	}

	// Particles
	particleRe := regexp.MustCompile(`[哈嗯哦噢嘿唉呜啊呀吧嘛呢吗么]+`)
	particles := particleRe.FindAllString(allText, -1)
	particleFreq := map[string]int{}
	for _, p := range particles {
		particleFreq[p]++
	}
	topParticles := topN(particleFreq, 10)

	// Emojis
	emojiRe := regexp.MustCompile(`[\x{1F600}-\x{1F64F}\x{1F300}-\x{1F5FF}\x{1F680}-\x{1F6FF}\x{1F1E0}-\x{1F1FF}\x{2702}-\x{27B0}\x{1F900}-\x{1F9FF}]+`)
	emojis := emojiRe.FindAllString(allText, -1)
	emojiFreq := map[string]int{}
	for _, e := range emojis {
		emojiFreq[e]++
	}
	topEmojis := topN(emojiFreq, 10)

	// Avg message length
	var avgLen float64
	if len(lengths) > 0 {
		total := 0
		for _, l := range lengths {
			total += l
		}
		avgLen = float64(total) / float64(len(lengths))
	}

	style := "long_form"
	if avgLen < 20 {
		style = "short_burst"
	}

	// Punctuation habits
	punctuation := map[string]int{
		"句号":  strings.Count(allText, "。"),
		"感叹号": strings.Count(allText, "！") + strings.Count(allText, "!"),
		"问号":  strings.Count(allText, "？") + strings.Count(allText, "?"),
		"省略号": strings.Count(allText, "...") + strings.Count(allText, "…"),
		"波浪号": strings.Count(allText, "～") + strings.Count(allText, "~"),
	}

	// Sample messages
	sampleCount := maxSamples
	if sampleCount <= 0 {
		sampleCount = 50
	}
	var samples []string
	for i, m := range targetMsgs {
		if i >= sampleCount {
			break
		}
		if m.Content != "" {
			samples = append(samples, m.Content)
		}
	}

	result.Analysis = ChatAnalysis{
		TopParticles:      topParticles,
		TopEmojis:         topEmojis,
		AvgMessageLength:  avgLen,
		MessageStyle:      style,
		PunctuationHabits: punctuation,
		SampleMessages:    samples,
	}
}

func topN(freq map[string]int, n int) []FreqItem {
	var items []FreqItem
	for k, v := range freq {
		items = append(items, FreqItem{Item: k, Count: v})
	}
	sort.Slice(items, func(i, j int) bool { return items[i].Count > items[j].Count })
	if len(items) > n {
		items = items[:n]
	}
	return items
}

// ── TXT Parser ──────────────────────────────────────────────────────────────
// WeChatMsg format: "2024-01-15 20:30:45 张三\n今天好累啊"
var txtMsgPattern = regexp.MustCompile(`^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(?::\d{2})?)\s+(.+)$`)

func parseChatTXT(content []byte) ([]ChatMessage, error) {
	lines := strings.Split(string(content), "\n")
	var messages []ChatMessage
	var current *ChatMessage

	for _, line := range lines {
		line = strings.TrimRight(line, "\r")
		m := txtMsgPattern.FindStringSubmatch(line)
		if m != nil {
			if current != nil && strings.TrimSpace(current.Content) != "" {
				messages = append(messages, *current)
			}
			current = &ChatMessage{
				Timestamp: m[1],
				Sender:    strings.TrimSpace(m[2]),
			}
		} else if current != nil && strings.TrimSpace(line) != "" {
			if current.Content != "" {
				current.Content += "\n"
			}
			current.Content += line
		}
	}
	if current != nil && strings.TrimSpace(current.Content) != "" {
		messages = append(messages, *current)
	}
	return messages, nil
}

// ── CSV Parser ──────────────────────────────────────────────────────────────
// WeChatMsg CSV typically: timestamp, sender, content (or similar column order)
func parseChatCSV(content []byte) ([]ChatMessage, error) {
	reader := csv.NewReader(strings.NewReader(string(content)))
	reader.LazyQuotes = true
	reader.FieldsPerRecord = -1

	records, err := reader.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("CSV parse error: %w", err)
	}
	if len(records) == 0 {
		return nil, nil
	}

	// Try to detect columns from header
	header := records[0]
	tsCol, senderCol, contentCol, isSenderCol := -1, -1, -1, -1
	for i, h := range header {
		hl := strings.ToLower(strings.TrimSpace(h))
		switch {
		case hl == "is_sender" || hl == "issender":
			isSenderCol = i
		case strings.Contains(hl, "time") || strings.Contains(hl, "时间") || strings.Contains(hl, "date"):
			tsCol = i
		case strings.Contains(hl, "sender") || strings.Contains(hl, "发送") || strings.Contains(hl, "昵称") || strings.Contains(hl, "nickname") || strings.Contains(hl, "talker"):
			senderCol = i
		case strings.Contains(hl, "content") || strings.Contains(hl, "内容") || strings.Contains(hl, "message") || strings.Contains(hl, "消息") || hl == "msg":
			contentCol = i
		}
	}

	// Fallback: assume columns are timestamp, sender, content
	startRow := 0
	if tsCol >= 0 || senderCol >= 0 || contentCol >= 0 {
		startRow = 1 // skip header
	}
	if tsCol < 0 {
		tsCol = 0
	}
	if senderCol < 0 {
		senderCol = 1
	}
	if contentCol < 0 {
		contentCol = 2
	}

	var messages []ChatMessage
	for _, row := range records[startRow:] {
		ts, sender, cont := "", "", ""
		isSender := false
		if tsCol < len(row) {
			ts = strings.TrimSpace(row[tsCol])
		}
		if senderCol < len(row) {
			sender = strings.TrimSpace(row[senderCol])
		}
		if contentCol < len(row) {
			cont = strings.TrimSpace(row[contentCol])
		}
		if isSenderCol >= 0 && isSenderCol < len(row) {
			v := strings.TrimSpace(row[isSenderCol])
			isSender = v == "1" || strings.EqualFold(v, "true")
		}
		if cont == "" {
			continue
		}
		messages = append(messages, ChatMessage{
			Timestamp: ts,
			Sender:    sender,
			Content:   cont,
			IsSender:  isSender,
		})
	}
	return messages, nil
}

// ── HTML Parser ─────────────────────────────────────────────────────────────
// WeChatMsg HTML export typically has structured divs with sender/time/content.
func parseChatHTML(content []byte) ([]ChatMessage, error) {
	doc, err := html.Parse(strings.NewReader(string(content)))
	if err != nil {
		return nil, fmt.Errorf("HTML parse error: %w", err)
	}

	var messages []ChatMessage

	// Strategy 1: look for table rows (common WeChatMsg HTML export)
	messages = parseHTMLTable(doc)
	if len(messages) > 0 {
		return messages, nil
	}

	// Strategy 2: look for div-based layout with class patterns
	messages = parseHTMLDivs(doc)
	if len(messages) > 0 {
		return messages, nil
	}

	// Strategy 3: fallback – extract all text and try TXT parsing
	text := extractAllText(doc)
	return parseChatTXT([]byte(text))
}

func parseHTMLTable(n *html.Node) []ChatMessage {
	var messages []ChatMessage
	var rows []*html.Node
	findNodes(n, "tr", &rows)

	for _, tr := range rows {
		var cells []*html.Node
		findNodes(tr, "td", &cells)
		if len(cells) < 2 {
			continue
		}
		// Typically: time | sender | content  or  sender | content
		var ts, sender, content string
		if len(cells) >= 3 {
			ts = textContent(cells[0])
			sender = textContent(cells[1])
			content = textContent(cells[2])
		} else {
			sender = textContent(cells[0])
			content = textContent(cells[1])
		}
		content = strings.TrimSpace(content)
		if content == "" {
			continue
		}
		messages = append(messages, ChatMessage{
			Timestamp: strings.TrimSpace(ts),
			Sender:    strings.TrimSpace(sender),
			Content:   content,
		})
	}
	return messages
}

func parseHTMLDivs(n *html.Node) []ChatMessage {
	var messages []ChatMessage

	// Common WeChatMsg HTML patterns: div with class containing "msg" or "message"
	var msgDivs []*html.Node
	findNodesByClass(n, []string{"msg", "message", "chat-msg", "record"}, &msgDivs)

	for _, div := range msgDivs {
		sender := ""
		content := ""
		ts := ""

		// Look for nested elements with sender/content classes
		var senderNodes []*html.Node
		findNodesByClass(div, []string{"sender", "nickname", "name", "talker"}, &senderNodes)
		if len(senderNodes) > 0 {
			sender = textContent(senderNodes[0])
		}

		var contentNodes []*html.Node
		findNodesByClass(div, []string{"content", "text", "msg-text", "message-text"}, &contentNodes)
		if len(contentNodes) > 0 {
			content = textContent(contentNodes[0])
		}

		var timeNodes []*html.Node
		findNodesByClass(div, []string{"time", "timestamp", "date"}, &timeNodes)
		if len(timeNodes) > 0 {
			ts = textContent(timeNodes[0])
		}

		content = strings.TrimSpace(content)
		if content == "" {
			continue
		}
		messages = append(messages, ChatMessage{
			Timestamp: strings.TrimSpace(ts),
			Sender:    strings.TrimSpace(sender),
			Content:   content,
		})
	}
	return messages
}

func findNodes(n *html.Node, tag string, result *[]*html.Node) {
	if n.Type == html.ElementNode && n.Data == tag {
		*result = append(*result, n)
	}
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		findNodes(c, tag, result)
	}
}

func findNodesByClass(n *html.Node, classPatterns []string, result *[]*html.Node) {
	if n.Type == html.ElementNode {
		for _, attr := range n.Attr {
			if attr.Key == "class" {
				lower := strings.ToLower(attr.Val)
				for _, pattern := range classPatterns {
					if strings.Contains(lower, pattern) {
						*result = append(*result, n)
						goto next
					}
				}
			}
		}
	}
next:
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		findNodesByClass(c, classPatterns, result)
	}
}

func textContent(n *html.Node) string {
	if n == nil {
		return ""
	}
	if n.Type == html.TextNode {
		return n.Data
	}
	var sb strings.Builder
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		sb.WriteString(textContent(c))
	}
	return sb.String()
}

func extractAllText(n *html.Node) string {
	var sb strings.Builder
	var walk func(*html.Node)
	walk = func(node *html.Node) {
		if node.Type == html.TextNode {
			sb.WriteString(node.Data)
		}
		if node.Type == html.ElementNode && (node.Data == "br" || node.Data == "p" || node.Data == "div") {
			sb.WriteString("\n")
		}
		for c := node.FirstChild; c != nil; c = c.NextSibling {
			walk(c)
		}
	}
	walk(n)
	return sb.String()
}

// BuildChatSummaryForLLM creates a text summary of the parsed chat for LLM analysis.
func BuildChatSummaryForLLM(result *ChatParseResult, targetName string) string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("## 聊天记录统计\n"))
	sb.WriteString(fmt.Sprintf("- 总消息数：%d\n", result.TotalMessages))
	sb.WriteString(fmt.Sprintf("- %s 的消息数：%d\n", targetName, result.TargetMessages))
	sb.WriteString(fmt.Sprintf("- 平均消息长度：%.1f 字\n", result.Analysis.AvgMessageLength))
	if result.Analysis.MessageStyle == "short_burst" {
		sb.WriteString("- 消息风格：短句连发型\n")
	} else {
		sb.WriteString("- 消息风格：长段落型\n")
	}

	if len(result.Analysis.TopParticles) > 0 {
		sb.WriteString("\n## 高频语气词\n")
		for _, p := range result.Analysis.TopParticles {
			sb.WriteString(fmt.Sprintf("- %s: %d次\n", p.Item, p.Count))
		}
	}

	if len(result.Analysis.TopEmojis) > 0 {
		sb.WriteString("\n## 高频 Emoji\n")
		for _, e := range result.Analysis.TopEmojis {
			sb.WriteString(fmt.Sprintf("- %s: %d次\n", e.Item, e.Count))
		}
	}

	if result.Analysis.PunctuationHabits != nil {
		sb.WriteString("\n## 标点习惯\n")
		for k, v := range result.Analysis.PunctuationHabits {
			if v > 0 {
				sb.WriteString(fmt.Sprintf("- %s: %d次\n", k, v))
			}
		}
	}

	if len(result.Analysis.SampleMessages) > 0 {
		sb.WriteString(fmt.Sprintf("\n## %s 的消息样本\n", targetName))
		for i, msg := range result.Analysis.SampleMessages {
			sb.WriteString(fmt.Sprintf("%d. %s\n", i+1, TruncateToRunes(msg, 200)))
		}
	}

	return sb.String()
}
