# Fetch buffer chunks via Cursor Read API is not available from shell.
# This script merges pre-written .part files.
$chunkDir = "d:\regr\docs\agent-interview\.tmp\dounai_parts"
$dest = "d:\regr\docs\agent-interview\豆奶_红豆-extract.md"
python "d:\regr\docs\agent-interview\.tmp\persist_dounai.py" $chunkDir $dest
$lines = (Get-Content $dest -Encoding UTF8 | Measure-Object -Line).Lines
$entries = (Select-String -Path $dest -Pattern '^## \d+\.' -Encoding UTF8).Count
Write-Output "豆奶_红豆-extract.md | $lines | $entries | merged"
