package main

import (
	"archive/zip"
	"bytes"
	"flag"
	"fmt"
	"log"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
)

type exportRow struct {
	AgentID         string
	DisplayName     string
	Headline        string
	ExpertiseTags   string
	School          string
	Job             string
	City            string
	Published       string
	QuestionIndex   string
	CurrentQuestion string
	RevisedQuestion string
	Notes           string
}

func main() {
	out := flag.String("out", "", "输出 xlsx 路径")
	flag.Parse()

	dsn := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	if dsn == "" {
		dsn = strings.TrimSpace(os.Getenv("DATABASE_PRISMA_URL"))
	}
	if dsn == "" {
		dsn = "root:password@tcp(localhost:3306)/agent_marketplace?charset=utf8mb4&parseTime=True"
	}
	if converted, ok := prismaURLToGoDSN(dsn); ok {
		dsn = converted
	}
	if *out == "" {
		*out = filepath.Join("exports", fmt.Sprintf("life-agent-sample-questions-%s.xlsx", time.Now().Format("20060102-150405")))
	}

	if err := db.Connect(dsn); err != nil {
		log.Fatalf("connect db: %v", err)
	}

	var profiles []models.LifeAgentProfile
	if err := db.DB.Order("display_name ASC, id ASC").Find(&profiles).Error; err != nil {
		log.Fatalf("query profiles: %v", err)
	}

	rows := make([]exportRow, 0, len(profiles)*3)
	for _, p := range profiles {
		questions := []string(p.SampleQuestions)
		if len(questions) == 0 {
			rows = append(rows, rowForProfile(p, 0, ""))
			continue
		}
		for idx, q := range questions {
			rows = append(rows, rowForProfile(p, idx+1, q))
		}
	}

	if err := os.MkdirAll(filepath.Dir(*out), 0755); err != nil {
		log.Fatalf("create output dir: %v", err)
	}
	if err := writeXLSX(*out, rows); err != nil {
		log.Fatalf("write xlsx: %v", err)
	}
	log.Printf("exported profiles=%d rows=%d file=%s", len(profiles), len(rows), *out)
}

func rowForProfile(p models.LifeAgentProfile, questionIndex int, question string) exportRow {
	return exportRow{
		AgentID:         p.ID,
		DisplayName:     p.DisplayName,
		Headline:        p.Headline,
		ExpertiseTags:   strings.Join([]string(p.ExpertiseTags), "、"),
		School:          ptrString(p.School),
		Job:             ptrString(p.Job),
		City:            compactLocation(ptrString(p.Province), ptrString(p.City), ptrString(p.County)),
		Published:       boolLabel(p.Published),
		QuestionIndex:   fmt.Sprintf("%d", questionIndex),
		CurrentQuestion: question,
	}
}

func ptrString(s *string) string {
	if s == nil {
		return ""
	}
	return strings.TrimSpace(*s)
}

func compactLocation(parts ...string) string {
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		if len(out) == 0 || out[len(out)-1] != part {
			out = append(out, part)
		}
	}
	return strings.Join(out, " · ")
}

func boolLabel(v bool) string {
	if v {
		return "已发布"
	}
	return "未发布"
}

func prismaURLToGoDSN(raw string) (string, bool) {
	if !strings.HasPrefix(raw, "mysql://") {
		return raw, false
	}
	u, err := url.Parse(raw)
	if err != nil {
		return raw, false
	}
	user := u.User.Username()
	pass, _ := u.User.Password()
	host := u.Host
	dbName := strings.TrimPrefix(u.Path, "/")
	if user == "" || host == "" || dbName == "" {
		return raw, false
	}
	query := u.Query()
	if query.Get("charset") == "" {
		query.Set("charset", "utf8mb4")
	}
	if query.Get("parseTime") == "" {
		query.Set("parseTime", "True")
	}
	return fmt.Sprintf("%s:%s@tcp(%s)/%s?%s", user, pass, host, dbName, query.Encode()), true
}

func writeXLSX(path string, rows []exportRow) error {
	file, err := os.Create(path)
	if err != nil {
		return err
	}
	defer file.Close()

	zw := zip.NewWriter(file)
	defer zw.Close()

	files := map[string]string{
		"[Content_Types].xml":        contentTypesXML,
		"_rels/.rels":                relsXML,
		"xl/workbook.xml":            workbookXML,
		"xl/_rels/workbook.xml.rels": workbookRelsXML,
		"xl/styles.xml":              stylesXML,
		"xl/worksheets/sheet1.xml":   sheetXML(rows),
		"docProps/core.xml":          coreXML(),
		"docProps/app.xml":           appXML,
	}
	order := []string{
		"[Content_Types].xml",
		"_rels/.rels",
		"docProps/core.xml",
		"docProps/app.xml",
		"xl/workbook.xml",
		"xl/_rels/workbook.xml.rels",
		"xl/styles.xml",
		"xl/worksheets/sheet1.xml",
	}
	for _, name := range order {
		w, err := zw.Create(name)
		if err != nil {
			return err
		}
		if _, err := w.Write([]byte(files[name])); err != nil {
			return err
		}
	}
	return nil
}

func sheetXML(rows []exportRow) string {
	var b bytes.Buffer
	b.WriteString(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`)
	b.WriteString(`<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">`)
	b.WriteString(`<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`)
	b.WriteString(`<cols>`)
	widths := []float64{38, 18, 36, 24, 18, 20, 18, 10, 10, 42, 42, 28}
	for i, w := range widths {
		fmt.Fprintf(&b, `<col min="%d" max="%d" width="%.1f" customWidth="1"/>`, i+1, i+1, w)
	}
	b.WriteString(`</cols><sheetData>`)
	writeRow(&b, 1, []string{"agent_id（不要改）", "Agent名称", "简介", "擅长标签", "学校", "工作/身份", "地区", "发布状态", "问题序号（不要改）", "当前示例问题", "修改后示例问题（填这里）", "备注"}, 1)
	for i, r := range rows {
		writeRow(&b, i+2, []string{
			r.AgentID,
			r.DisplayName,
			r.Headline,
			r.ExpertiseTags,
			r.School,
			r.Job,
			r.City,
			r.Published,
			r.QuestionIndex,
			r.CurrentQuestion,
			r.RevisedQuestion,
			r.Notes,
		}, 0)
	}
	b.WriteString(`</sheetData></worksheet>`)
	return b.String()
}

func writeRow(b *bytes.Buffer, rowNum int, values []string, style int) {
	fmt.Fprintf(b, `<row r="%d">`, rowNum)
	for idx, value := range values {
		cellRef := fmt.Sprintf("%s%d", columnName(idx+1), rowNum)
		writeCell(b, cellRef, value, style)
	}
	b.WriteString(`</row>`)
}

func writeCell(b *bytes.Buffer, ref, value string, style int) {
	value = cleanXMLString(value)
	if style > 0 {
		fmt.Fprintf(b, `<c r="%s" s="%d" t="inlineStr"><is><t>%s</t></is></c>`, ref, style, xmlEscape(value))
		return
	}
	fmt.Fprintf(b, `<c r="%s" t="inlineStr"><is><t>%s</t></is></c>`, ref, xmlEscape(value))
}

func columnName(n int) string {
	name := ""
	for n > 0 {
		n--
		name = string(rune('A'+n%26)) + name
		n /= 26
	}
	return name
}

func cleanXMLString(s string) string {
	if !utf8.ValidString(s) {
		s = strings.ToValidUTF8(s, "")
	}
	return strings.Map(func(r rune) rune {
		if r == '\t' || r == '\n' || r == '\r' {
			return r
		}
		if r < 0x20 {
			return -1
		}
		return r
	}, s)
}

func xmlEscape(s string) string {
	replacer := strings.NewReplacer(
		"&", "&amp;",
		"<", "&lt;",
		">", "&gt;",
		`"`, "&quot;",
		"'", "&apos;",
	)
	return replacer.Replace(s)
}

func coreXML() string {
	now := time.Now().UTC().Format(time.RFC3339)
	return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
		`<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">` +
		`<dc:creator>regr export</dc:creator><cp:lastModifiedBy>regr export</cp:lastModifiedBy>` +
		`<dcterms:created xsi:type="dcterms:W3CDTF">` + now + `</dcterms:created>` +
		`<dcterms:modified xsi:type="dcterms:W3CDTF">` + now + `</dcterms:modified>` +
		`</cp:coreProperties>`
}

const contentTypesXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`

const relsXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`

const workbookXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="示例问题" sheetId="1" r:id="rId1"/></sheets>
</workbook>`

const workbookRelsXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`

const stylesXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`

const appXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>regr export</Application>
</Properties>`
