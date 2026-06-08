# 批量合并 agent-interview/*-extract.md → *-merged.md
# 用法（在 backend 目录）： .\scripts\merge-persona-extracts.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$interview = Join-Path $root "docs\agent-interview"

$personas = @(
    "慵懒的锦鲤7",
    "猫头鹰x去爬山",
    "芒果学画画",
    "蚂蚁做饭中",
    "西瓜oo喝绿茶",
    "豆奶_红豆",
    "鲸鱼ya在跑步"
)

Push-Location $root
try {
    foreach ($name in $personas) {
        $extract = Join-Path $interview "$name-extract.md"
        $merged = Join-Path $interview "$name-merged.md"
        if (-not (Test-Path $extract)) {
            Write-Warning "跳过（文件不存在）: $extract"
            continue
        }
        Write-Host "=== 合并 $name ===" -ForegroundColor Cyan
        go run ./cmd/import-persona `
            -file $extract `
            -name $name `
            -merge-out $merged
    }
} finally {
    Pop-Location
}
