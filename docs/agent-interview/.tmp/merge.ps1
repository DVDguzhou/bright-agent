function Strip-And-Merge {
  param([string]$BaseName, [int]$ChunkCount, [string]$OutPath)
  $all = @()
  for ($i = 1; $i -le $ChunkCount; $i++) {
    $p = "d:\regr\docs\agent-interview\.tmp\$BaseName.raw$i.txt"
    if (-not (Test-Path $p)) { throw "Missing $p" }
    $lines = Get-Content $p -Encoding UTF8
    $clean = foreach ($line in $lines) { if ($line -match '^\s*\d+\|(.*)$') { $matches[1] } else { $line } }
    if ($i -eq 1) {
      $clean = $clean | Where-Object { $_ -notmatch '只基于下列真实材料加工，勿编造' }
    }
    $all += $clean
  }
  $all | Set-Content $OutPath -Encoding UTF8
  $lines = (Get-Content $OutPath -Encoding UTF8 | Measure-Object -Line).Lines
  $entries = (Select-String -Path $OutPath -Pattern '^## \d+\.' -Encoding UTF8).Count
  Write-Output "MERGED $BaseName lines=$lines entries=$entries"
}
