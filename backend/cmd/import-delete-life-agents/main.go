// import-delete-life-agents：从 Agent 目录 Excel 批量删除 Life Agent。
//
// Excel 列（与 export-life-agents 导出格式一致）：
//
//	A agent_id、B Agent名称、I 备注（填「删除」表示删除该行 Agent）
//
// 用法（在 backend 目录执行）：
//
//	go run ./cmd/import-delete-life-agents -file ../exports/life-agent-catalog.xlsx
//	go run ./cmd/import-delete-life-agents -file ../exports/life-agent-catalog.xlsx -apply
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
	"github.com/agent-marketplace/backend/internal/yantuseed"
)

type sheetRow struct {
	AgentID     string
	DisplayName string
	Notes       string
	ExcelRow    int
}

type deleteTarget struct {
	Row     sheetRow
	Profile models.LifeAgentProfile
}

func main() {
	file := flag.String("file", "../exports/life-agent-catalog.xlsx", "Agent 目录 xlsx")
	apply := flag.Bool("apply", false, "实际删除；默认 dry-run")
	includeFeatured := flag.Bool("include-featured", false, "允许删除精选 Agent（默认跳过）")
	flag.Parse()

	rows, err := readWorkbookRows(*file)
	if err != nil {
		log.Fatalf("read workbook: %v", err)
	}

	toDelete := make([]sheetRow, 0)
	seen := map[string]bool{}
	for _, row := range rows {
		if row.AgentID == "" || !shouldDelete(row.Notes) {
			continue
		}
		if seen[row.AgentID] {
			continue
		}
		seen[row.AgentID] = true
		toDelete = append(toDelete, row)
	}
	if len(toDelete) == 0 {
		log.Printf("no rows marked for delete in %s", *file)
		return
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

	ids := make([]string, 0, len(toDelete))
	for _, row := range toDelete {
		ids = append(ids, row.AgentID)
	}
	var profiles []models.LifeAgentProfile
	if err := db.DB.Where("id IN ?", ids).Find(&profiles).Error; err != nil {
		log.Fatalf("query profiles: %v", err)
	}
	byID := make(map[string]models.LifeAgentProfile, len(profiles))
	for _, p := range profiles {
		byID[p.ID] = p
	}

	targets := make([]deleteTarget, 0, len(toDelete))
	skippedFeatured := 0
	skippedUnknown := 0
	for _, row := range toDelete {
		p, ok := byID[row.AgentID]
		if !ok {
			log.Printf("skip unknown agent row=%d id=%s name=%s", row.ExcelRow, row.AgentID, row.DisplayName)
			skippedUnknown++
			continue
		}
		if isFeatured(p) && !*includeFeatured {
			log.Printf("skip featured row=%d %s (%s)", row.ExcelRow, p.DisplayName, shortID(p.ID))
			skippedFeatured++
			continue
		}
		targets = append(targets, deleteTarget{Row: row, Profile: p})
	}

	if !*apply {
		log.Printf("[dry-run] marked_delete=%d will_delete=%d skip_featured=%d skip_unknown=%d",
			len(toDelete), len(targets), skippedFeatured, skippedUnknown)
		printPreview(targets, 30)
		log.Printf("dry-run only. Re-run with -apply to delete.")
		return
	}

	deleted := 0
	failed := 0
	for _, t := range targets {
		if err := yantuseed.DeleteLifeAgentProfileCascade(db.DB, t.Profile.ID); err != nil {
			log.Printf("delete failed %s (%s): %v", t.Profile.DisplayName, t.Profile.ID, err)
			failed++
			continue
		}
		log.Printf("deleted %s (%s)", t.Profile.DisplayName, shortID(t.Profile.ID))
		deleted++
	}
	log.Printf("[applied] deleted=%d failed=%d skip_featured=%d skip_unknown=%d", deleted, failed, skippedFeatured, skippedUnknown)
}

func shouldDelete(notes string) bool {
	notes = strings.TrimSpace(strings.ToLower(notes))
	return strings.Contains(notes, "删除") || strings.Contains(notes, "delete") || strings.Contains(notes, "remove")
}

func isFeatured(p models.LifeAgentProfile) bool {
	if p.FeaturedRank != nil && *p.FeaturedRank > 0 {
		return true
	}
	if p.FeaturedCollection != nil && strings.TrimSpace(*p.FeaturedCollection) != "" {
		return true
	}
	return false
}

func shortID(id string) string {
	if len(id) <= 8 {
		return id
	}
	return id[:8]
}

func printPreview(targets []deleteTarget, limit int) {
	for i, t := range targets {
		if i >= limit {
			log.Printf("... and %d more", len(targets)-limit)
			return
		}
		feat := ""
		if isFeatured(t.Profile) {
			feat = " [精选]"
		}
		log.Printf("  %s (%s)%s row=%d", t.Profile.DisplayName, shortID(t.Profile.ID), feat, t.Row.ExcelRow)
	}
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
		out = append(out, sheetRow{
			AgentID:     strings.TrimSpace(cols["A"]),
			DisplayName: strings.TrimSpace(cols["B"]),
			Notes:       strings.TrimSpace(cols["I"]),
			ExcelRow:    rowNum,
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
