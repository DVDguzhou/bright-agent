package db

import "testing"

func TestNormalizeGoMySQLDSN(t *testing.T) {
	cases := map[string]string{
		`user:pass@tcp(h:3306)/db?charset=utf8mb4&parseTime=True"`:  `user:pass@tcp(h:3306)/db?charset=utf8mb4&parseTime=true`,
		`"user:pass@tcp(h:3306)/db?charset=utf8mb4&parseTime=True"`: `user:pass@tcp(h:3306)/db?charset=utf8mb4&parseTime=true`,
		`user:pass@tcp(h:3306)/db?parseTime=false`:                   `user:pass@tcp(h:3306)/db?parseTime=false`,
	}
	for in, want := range cases {
		if got := normalizeGoMySQLDSN(in); got != want {
			t.Fatalf("normalizeGoMySQLDSN(%q) = %q, want %q", in, got, want)
		}
	}
}
