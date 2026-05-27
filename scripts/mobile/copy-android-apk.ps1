$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "../..")
$src = Join-Path $root "android/app/build/outputs/apk/release/app-release.apk"
$destDir = Join-Path $root "public/downloads"
$dest = Join-Path $destDir "brightagent.apk"

if (-not (Test-Path $src)) {
    Write-Host "Release APK not found. Run first:" -ForegroundColor Red
    Write-Host "  npm run mobile:android:release"
    exit 1
}

New-Item -ItemType Directory -Force -Path $destDir | Out-Null
Copy-Item -Force $src $dest

Write-Host "Copied to:" -ForegroundColor Green
Write-Host $dest
Write-Host ""
Write-Host "Local URL:  http://localhost:3000/downloads/brightagent.apk"
Write-Host "Landing:    http://localhost:3000/download"
Write-Host ""
Write-Host "Deploy: upload public/downloads/brightagent.apk to your server, then share:"
Write-Host "  https://brightagent.cn/download"
