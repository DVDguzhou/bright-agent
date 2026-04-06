package wechathtml

import (
	"html"
	"regexp"
	"strings"
	"unicode/utf8"
)

var (
	reTitle = regexp.MustCompile(`<span class="js_title_inner">([^<]+)</span>`)
	reLeaf  = regexp.MustCompile(`<span leaf[^>]*>([^<]*)</span>`)
	reSlash = regexp.MustCompile(`^/\s*(.+?)\s*/$`)
)

func ExtractArticleTitle(htmlStr string) string {
	m := reTitle.FindStringSubmatch(htmlStr)
	if len(m) < 2 {
		return ""
	}
	return strings.TrimSpace(html.UnescapeString(m[1]))
}

func ExtractLeafLines(htmlStr string) []string {
	ms := reLeaf.FindAllStringSubmatch(htmlStr, -1)
	var out []string
	for _, m := range ms {
		s := strings.TrimSpace(html.UnescapeString(m[1]))
		s = strings.ReplaceAll(s, "\u00a0", " ")
		if s == "" || s == "Image" {
			continue
		}
		out = append(out, s)
	}
	return out
}

// YantuParsed holds one 研途榜样 student extracted from a saved WeChat HTML page.
type YantuParsed struct {
	DisplayName   string
	School        string
	ScoreLine     string
	MajorLine     string
	ArticleTitle  string
	KnowledgeBody string
}

// TrimRunes truncates s to max runes, adding an ellipsis if truncated.
func TrimRunes(s string, max int) string {
	if max <= 0 || s == "" {
		return s
	}
	if utf8.RuneCountInString(s) <= max {
		return s
	}
	r := []rune(s)
	if len(r) > max {
		return string(r[:max-1]) + "…"
	}
	return s
}

// ParseYantuArticle parses leaf-line text from one WeChat article (one student per file).
func ParseYantuArticle(articleTitle string, lines []string) YantuParsed {
	var name string
	for i, ln := range lines {
		ln = strings.TrimSpace(ln)
		if sm := reSlash.FindStringSubmatch(ln); sm != nil {
			name = strings.TrimSpace(sm[1])
			break
		}
		if ln == "本期榜样" && i+1 < len(lines) {
			cand := strings.TrimSpace(lines[i+1])
			if cand != "" && !strings.ContainsAny(cand, "：:") && utf8.RuneCountInString(cand) <= 8 {
				name = cand
				break
			}
		}
	}
	if name == "" {
		name = "研途榜样"
	}

	var school, scoreLine, majorLine string
	for i := 0; i < len(lines)-1; i++ {
		l := strings.TrimSpace(lines[i])
		n := strings.TrimSpace(lines[i+1])
		switch {
		case strings.HasPrefix(l, "考研学校") || strings.HasPrefix(l, "报考院校"):
			if school == "" {
				school = n
			}
		case strings.HasPrefix(l, "考研专业"):
			majorLine = n
		case strings.HasPrefix(l, "考研成绩"):
			if strings.Contains(n, "总分") {
				scoreLine = n
			}
		case l == "总分" || strings.HasPrefix(l, "总分："):
			if scoreLine == "" {
				scoreLine = n
			}
		}
		if strings.Contains(l, "总分") && scoreLine == "" && !strings.Contains(l, "：") {
			scoreLine = l
		}
	}

	end := len(lines)
	for i, ln := range lines {
		t := strings.TrimSpace(ln)
		if strings.HasPrefix(t, "编辑") || strings.HasPrefix(t, "编辑 |") ||
			strings.HasPrefix(t, "初审") || strings.HasPrefix(t, "终审") {
			end = i
			break
		}
	}
	if end < 1 {
		end = len(lines)
	}
	bodyLines := lines[:end]
	var b strings.Builder
	for _, ln := range bodyLines {
		t := strings.TrimSpace(ln)
		if t == "" {
			continue
		}
		if b.Len() > 0 {
			b.WriteByte('\n')
		}
		b.WriteString(t)
	}
	return YantuParsed{
		DisplayName:   name,
		School:        school,
		ScoreLine:     scoreLine,
		MajorLine:     majorLine,
		ArticleTitle:  articleTitle,
		KnowledgeBody: b.String(),
	}
}
