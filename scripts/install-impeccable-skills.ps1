# Windows 安装 impeccable skills（官方 CLI 依赖 unzip，Windows 默认没有）
# 用法: npm run impeccable:install-skills
#       npm run impeccable:install-skills -- -Force

param(
    [switch]$Force,
    [string[]]$Providers = @(".claude", ".github")
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$zip = Join-Path $env:TEMP "impeccable-bundle-$(Get-Date -Format 'yyyyMMddHHmmss').zip"
$extract = Join-Path $env:TEMP "impeccable-bundle-extract-$(Get-Date -Format 'yyyyMMddHHmmss')"
$url = "https://impeccable.style/api/download/bundle/universal"

function Copy-Tree([string]$Src, [string]$Dest) {
    New-Item -ItemType Directory -Path $Dest -Force | Out-Null
    Get-ChildItem $Src -Force | ForEach-Object {
        if ($_.PSIsContainer) {
            Copy-Tree $_.FullName (Join-Path $Dest $_.Name)
        } else {
            Copy-Item $_.FullName (Join-Path $Dest $_.Name) -Force
        }
    }
}

if (-not $Force) {
    $existing = @()
    foreach ($provider in $Providers) {
        $skillsDir = Join-Path $root "$provider\skills\impeccable"
        if (Test-Path $skillsDir) { $existing += $provider }
    }
    if ($existing.Count -gt 0) {
        Write-Host "Impeccable skills already installed in: $($existing -join ', ')"
        Write-Host "Re-run with -Force to reinstall, or: npm run impeccable:install-skills -- -Force"
        exit 0
    }
}

Write-Host "Downloading impeccable skills..."
Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
New-Item -ItemType Directory -Path $extract -Force | Out-Null
Expand-Archive -Path $zip -DestinationPath $extract -Force

$written = 0
foreach ($provider in $Providers) {
    $srcDir = Join-Path $extract "$provider\skills"
    if (-not (Test-Path $srcDir)) {
        Write-Host "Skip $provider (not in bundle)"
        continue
    }
    $destDir = Join-Path $root "$provider\skills"
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    Get-ChildItem $srcDir -Directory | ForEach-Object {
        $dest = Join-Path $destDir $_.Name
        if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
        Copy-Tree $_.FullName $dest
        $written++
        Write-Host "Installed: $provider/skills/$($_.Name)"
    }
}

Remove-Item $zip -Force -ErrorAction SilentlyContinue
Remove-Item $extract -Recurse -Force -ErrorAction SilentlyContinue

if ($written -eq 0) {
    Write-Error "Nothing installed. Check providers: $($Providers -join ', ')"
}

Write-Host "Done. $written skill(s) installed into $($Providers -join ', ')."
