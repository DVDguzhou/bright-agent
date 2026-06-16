package main

import (
	"archive/zip"
	"encoding/xml"
	"flag"
	"fmt"
	"io"
	"log"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
)

type sheetRow struct {
	AgentID         string
	QuestionIndex   int
	CurrentQuestion string
	RevisedQuestion string
	Notes           string
	ExcelRow        int
}

type profileUpdate struct {
	Profile models.LifeAgentProfile
	Before  []string
	After   []string
	Rows    []sheetRow
}

func main() {
	file := flag.String("file", "../exports/life-agent-sample-questions.xlsx", "导入 xlsx 文件")
	apply := flag.Bool("apply", false, "实际写入数据库；默认 dry-run")
	flag.Parse()

	rows, err := readWorkbookRows(*file)
	if err != nil {
		log.Fatalf("read workbook: %v", err)
	}
	grouped := map[string][]sheetRow{}
	for _, row := range rows {
		if row.AgentID == "" || row.QuestionIndex <= 0 {
			continue
		}
		grouped[row.AgentID] = append(grouped[row.AgentID], row)
	}
	if len(grouped) == 0 {
		log.Fatalf("no editable rows found in %s", *file)
	}

	dsn := strings.TrimSpace(os.Getenv("DATABASE_URL"))
	if dsn == "" {
		dsn = strings.TrimSpace(os.Getenv("DATABASE_PRISMA_URL"))
	}
	if dsn == "" {
		dsn = defaultDSNFromProductionCompose()
	}
	if dsn == "" {
		dsn = "root:password@tcp(localhost:3306)/agent_marketplace?charset=utf8mb4&parseTime=True"
	}
	if converted, ok := prismaURLToGoDSN(dsn); ok {
		dsn = converted
	}
	if err := db.Connect(dsn); err != nil {
		log.Fatalf("connect db: %v", err)
	}

	agentIDs := make([]string, 0, len(grouped))
	for agentID := range grouped {
		agentIDs = append(agentIDs, agentID)
	}
	var profiles []models.LifeAgentProfile
	if err := db.DB.Where("id IN ?", agentIDs).Find(&profiles).Error; err != nil {
		log.Fatalf("query profiles: %v", err)
	}
	profileByID := make(map[string]models.LifeAgentProfile, len(profiles))
	for _, profile := range profiles {
		profileByID[profile.ID] = profile
	}

	updates := make([]profileUpdate, 0)
	revisedRows := 0
	deletedRows := 0
	for agentID, agentRows := range grouped {
		sort.SliceStable(agentRows, func(i, j int) bool {
			if agentRows[i].QuestionIndex == agentRows[j].QuestionIndex {
				return agentRows[i].ExcelRow < agentRows[j].ExcelRow
			}
			return agentRows[i].QuestionIndex < agentRows[j].QuestionIndex
		})
		profile, ok := profileByID[agentID]
		if !ok {
			log.Printf("skip unknown agent id=%s rows=%d", agentID, len(agentRows))
			continue
		}
		before := []string(profile.SampleQuestions)
		after := make([]string, 0, len(agentRows))
		for _, row := range agentRows {
			if shouldDelete(row.Notes) {
				deletedRows++
				continue
			}
			next := strings.TrimSpace(row.RevisedQuestion)
			if next != "" {
				revisedRows++
			} else {
				next = strings.TrimSpace(row.CurrentQuestion)
			}
			if next != "" {
				after = append(after, next)
			}
		}
		if !sameStringSlice(before, after) {
			updates = append(updates, profileUpdate{
				Profile: profile,
				Before:  before,
				After:   after,
				Rows:    agentRows,
			})
		}
	}

	if !*apply {
		log.Printf("[dry-run] workbook_rows=%d agents_in_sheet=%d profiles_to_update=%d revised_rows=%d deleted_rows=%d", len(rows), len(grouped), len(updates), revisedRows, deletedRows)
		printPreview(updates, 12)
		log.Printf("dry-run only. Re-run with -apply to write changes.")
		return
	}

	for _, upd := range updates {
		if err := db.DB.Model(&models.LifeAgentProfile{}).
			Where("id = ?", upd.Profile.ID).
			Update("sample_questions", models.JSONArray(upd.After)).Error; err != nil {
			log.Fatalf("update profile %s %s: %v", upd.Profile.DisplayName, upd.Profile.ID, err)
		}
	}
	log.Printf("[applied] profiles_updated=%d revised_rows=%d deleted_rows=%d", len(updates), revisedRows, deletedRows)
}

func shouldDelete(notes string) bool {
	notes = strings.TrimSpace(strings.ToLower(notes))
	return strings.Contains(notes, "删除") || strings.Contains(notes, "delete") || strings.Contains(notes, "remove")
}

func defaultDSNFromProductionCompose() string {
	candidates := []string{
		filepath.Join("..", "docker-compose.production.yml"),
		"docker-compose.production.yml",
	}
	re := regexp.MustCompile(`DATABASE_URL:\s*\$\{DATABASE_URL:-([^}]+)\}`)
	for _, candidate := range candidates {
		b, err := os.ReadFile(candidate)
		if err != nil {
			continue
		}
		match := re.FindStringSubmatch(string(b))
		if len(match) == 2 {
			return strings.TrimSpace(match[1])
		}
	}
	return ""
}

func printPreview(updates []profileUpdate, limit int) {
	for i, upd := range updates {
		if i >= limit {
			log.Printf("... and %d more profiles", len(updates)-limit)
			return
		}
		log.Printf("profile=%s id=%s before=%d after=%d", upd.Profile.DisplayName, upd.Profile.ID, len(upd.Before), len(upd.After))
		for idx, q := range upd.After {
			log.Printf("  %d. %s", idx+1, q)
		}
	}
}

func sameStringSlice(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if strings.TrimSpace(a[i]) != strings.TrimSpace(b[i]) {
			return false
		}
	}
	return true
}

func readWorkbookRows(path string) ([]sheetRow, error) {
	zr, err := zip.OpenReader(path)
	if err != nil {
		return nil, err
	}
	defer zr.Close()

	files := map[string]*zip.File{}
	for _, f := range zr.File {
		files[f.Name] = f
	}
	shared, err := readSharedStrings(files["xl/sharedStrings.xml"])
	if err != nil {
		return nil, err
	}
	sheet := files["xl/worksheets/sheet1.xml"]
	if sheet == nil {
		return nil, fmt.Errorf("xl/worksheets/sheet1.xml not found")
	}
	rc, err := sheet.Open()
	if err != nil {
		return nil, err
	}
	defer rc.Close()

	matrix, err := parseSheet(rc, shared)
	if err != nil {
		return nil, err
	}
	out := make([]sheetRow, 0, len(matrix))
	for rowNum, cols := range matrix {
		if rowNum == 1 {
			continue
		}
		idx, _ := strconv.Atoi(strings.TrimSpace(cols["I"]))
		out = append(out, sheetRow{
			AgentID:         strings.TrimSpace(cols["A"]),
			QuestionIndex:   idx,
			CurrentQuestion: strings.TrimSpace(cols["J"]),
			RevisedQuestion: strings.TrimSpace(cols["K"]),
			Notes:           strings.TrimSpace(cols["L"]),
			ExcelRow:        rowNum,
		})
	}
	sort.SliceStable(out, func(i, j int) bool {
		return out[i].ExcelRow < out[j].ExcelRow
	})
	return out, nil
}

func readSharedStrings(f *zip.File) ([]string, error) {
	if f == nil {
		return nil, nil
	}
	rc, err := f.Open()
	if err != nil {
		return nil, err
	}
	defer rc.Close()
	dec := xml.NewDecoder(rc)
	var values []string
	var inSI bool
	var current strings.Builder
	for {
		tok, err := dec.Token()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}
		switch t := tok.(type) {
		case xml.StartElement:
			if t.Name.Local == "si" {
				inSI = true
				current.Reset()
			}
		case xml.EndElement:
			if t.Name.Local == "si" && inSI {
				values = append(values, current.String())
				inSI = false
			}
		case xml.CharData:
			if inSI {
				current.Write([]byte(t))
			}
		}
	}
	return values, nil
}

func parseSheet(r io.Reader, shared []string) (map[int]map[string]string, error) {
	dec := xml.NewDecoder(r)
	rows := map[int]map[string]string{}
	var currentCell string
	var currentType string
	var currentValue strings.Builder
	var inCell bool
	var inValue bool
	var inInlineText bool
	for {
		tok, err := dec.Token()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}
		switch t := tok.(type) {
		case xml.StartElement:
			switch t.Name.Local {
			case "c":
				inCell = true
				currentCell = ""
				currentType = ""
				currentValue.Reset()
				for _, attr := range t.Attr {
					switch attr.Name.Local {
					case "r":
						currentCell = attr.Value
					case "t":
						currentType = attr.Value
					}
				}
			case "v":
				if inCell {
					inValue = true
					currentValue.Reset()
				}
			case "t":
				if inCell && currentType == "inlineStr" {
					inInlineText = true
				}
			}
		case xml.EndElement:
			switch t.Name.Local {
			case "v":
				inValue = false
			case "t":
				inInlineText = false
			case "c":
				if currentCell != "" {
					col, row := splitCellRef(currentCell)
					if row > 0 {
						if rows[row] == nil {
							rows[row] = map[string]string{}
						}
						value := currentValue.String()
						if currentType == "s" {
							idx, err := strconv.Atoi(strings.TrimSpace(value))
							if err == nil && idx >= 0 && idx < len(shared) {
								value = shared[idx]
							}
						}
						rows[row][col] = value
					}
				}
				inCell = false
			}
		case xml.CharData:
			if inValue || inInlineText {
				currentValue.Write([]byte(t))
			}
		}
	}
	return rows, nil
}

func splitCellRef(ref string) (string, int) {
	i := 0
	for i < len(ref) && ((ref[i] >= 'A' && ref[i] <= 'Z') || (ref[i] >= 'a' && ref[i] <= 'z')) {
		i++
	}
	row, _ := strconv.Atoi(ref[i:])
	return strings.ToUpper(ref[:i]), row
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
