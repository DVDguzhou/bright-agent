# 下载 LLM 幻觉与 grounding 相关论文到 docs/papers/
$baseDir = Join-Path $PSScriptRoot ".."
$outDir = Join-Path $baseDir "docs\papers"
if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }

$papers = @(
    @{ id = "2601.18753"; name = "HalluGuard-Data-Reasoning-Driven-Hallucinations" },
    @{ id = "2509.21557"; name = "Generation-Time-vs-Post-hoc-Citation" },
    @{ id = "2407.01796"; name = "Ground-Every-Sentence-ReClaim" },
    @{ id = "2510.17853"; name = "CiteGuard-Faithful-Citation-Attribution" },
    @{ id = "2408.04568"; name = "FRONT-Fine-grained-Grounded-Citations" },
    @{ id = "2510.06265"; name = "Survey-Hallucination-in-LLMs" },
    @{ id = "2510.02388"; name = "Learning-to-Route-Rule-Driven-Hybrid-Source-RAG" },
    @{ id = "2201.11903"; name = "Chain-of-Thought-Prompting" },
    @{ id = "2210.03629"; name = "ReAct-Reasoning-Acting" }
)

foreach ($p in $papers) {
    $url = "https://arxiv.org/pdf/$($p.id).pdf"
    $outFile = Join-Path $outDir "$($p.name).pdf"
    Write-Host "Downloading $($p.name)..."
    try {
        Invoke-WebRequest -Uri $url -OutFile $outFile -UseBasicParsing -ErrorAction Stop
        Write-Host "  OK: $outFile"
    } catch {
        Write-Host "  Failed: $_"
    }
}
Write-Host "Done."
