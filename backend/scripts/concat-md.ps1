# Concatenate markdown part files into one output (UTF-8)
param(
    [Parameter(Mandatory = $true)][string[]]$Parts,
    [Parameter(Mandatory = $true)][string]$Out
)
$utf8 = New-Object System.Text.UTF8Encoding $false
$sb = New-Object System.Text.StringBuilder
foreach ($p in $Parts) {
    if (-not (Test-Path $p)) { throw "Missing part: $p" }
    $sb.Append([IO.File]::ReadAllText($p, $utf8)) | Out-Null
}
[IO.File]::WriteAllText($Out, $sb.ToString(), $utf8)
Write-Host "Wrote $Out ($((Get-Content $Out -Encoding UTF8 | Measure-Object -Line).Lines) lines)"
